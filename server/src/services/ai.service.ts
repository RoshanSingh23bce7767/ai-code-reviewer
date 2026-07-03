import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import logger from '../config/logger';
import { redisClient } from '../config/redis';
import { SYSTEM_PROMPT, DEVELOPER_INSTRUCTIONS, getReviewPrompt } from '../ai/prompts/review.prompt';
import AppError from '../utils/AppError';
import { extractJSON } from '../utils/jsonParser';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Initialize the Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  logger.warn('GEMINI_API_KEY is not defined in environment variables. AI Reviews will fail unless mock modes are active.');
}

// Track the last model that succeeded so we try it first next time
let lastSuccessfulModel: string | null = null;

// Per-attempt timeout (45 seconds) — generous enough for complex reviews
const REQUEST_TIMEOUT_MS = 45_000;

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve in time.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label} did not respond within ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export class AIService {
  /**
   * Generates a code review using Google Gemini API with fast fallback rotation.
   */
  public static async reviewCode(language: string, sourceCode: string): Promise<any> {
    const codeHash = crypto.createHash('md5').update(sourceCode).digest('hex');
    const promptVersion = '1.1.0';
    const cacheKey = `review:hash:${codeHash}:${language}:${promptVersion}`;

    // 1. Check Redis Cache (instant return)
    try {
      if (redisClient.isOpen) {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          logger.info(`Cache hit for review: ${cacheKey}`);
          return JSON.parse(cachedResult);
        }
      }
    } catch (cacheError) {
      // Silently continue — cache miss is not fatal
    }

    if (!genAI) {
      throw new AppError('AI Service Unavailable: Gemini API key is missing.', 503, 'AI_001');
    }

    const promptText = `${DEVELOPER_INSTRUCTIONS}\n${getReviewPrompt(language, sourceCode)}`;

    // Build ordered model list — put last successful model first for speed
    const baseModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const allModels = [
      'gemini-2.5-flash-lite',   // Fastest (~4s responses)
      'gemini-2.5-flash',        // Reliable (~20s responses)
      'gemini-3.5-flash',        // Newest model
      'gemini-2.0-flash',        // May have exhausted quota
      'gemini-2.0-flash-lite'    // May have exhausted quota
    ];

    // Deduplicate and prioritize: lastSuccessful → baseModel → rest
    const prioritized: string[] = [];
    if (lastSuccessfulModel) prioritized.push(lastSuccessfulModel);
    prioritized.push(baseModel);
    allModels.forEach(m => prioritized.push(m));
    const modelsToTry = Array.from(new Set(prioritized));

    let lastError: any = null;
    let reviewData: any = null;

    for (const modelName of modelsToTry) {
      try {
        logger.info(`⚡ Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT
        });

        const startTime = Date.now();
        const result = await withTimeout(
          model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,          // Deterministic = faster inference
              maxOutputTokens: 8192    // Enough room for full review output
            }
          }),
          REQUEST_TIMEOUT_MS,
          modelName
        );
        const duration = Date.now() - startTime;
        logger.info(`✅ Response from ${modelName} in ${duration}ms`);

        const responseText = result.response.text();
        if (!responseText) {
          throw new Error('Empty response from AI engine');
        }

        reviewData = extractJSON(responseText);
        this.normalizeReviewData(reviewData);

        reviewData.reviewTime = duration;
        lastSuccessfulModel = modelName; // Remember for next request
        break;
      } catch (error: any) {
        lastError = error;
        const msg = error?.message || '';

        // Auth errors — don't bother trying other models
        if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
          throw new AppError('AI Service Authentication Failed: Invalid API Key.', 401, 'AI_001');
        }

        // 429 / quota / rate limit — skip immediately to next model (no retry)
        if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED')) {
          logger.warn(`⏭️  ${modelName} quota exhausted — skipping to next model`);
          continue;
        }

        // 503 / overloaded — skip immediately
        if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand')) {
          logger.warn(`⏭️  ${modelName} overloaded — skipping to next model`);
          continue;
        }

        // Timeout — skip immediately
        if (msg.includes('Timeout')) {
          logger.warn(`⏭️  ${modelName} timed out — skipping to next model`);
          continue;
        }

        // JSON parse / schema error — try once more with same model, then skip
        logger.warn(`⚠️  ${modelName} failed: ${error.message || error}. Retrying once...`);
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT
          });
          const startTime = Date.now();
          const result = await withTimeout(
            model.generateContent({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0,
                maxOutputTokens: 8192
              }
            }),
            REQUEST_TIMEOUT_MS,
            modelName
          );
          const duration = Date.now() - startTime;
          const responseText = result.response.text();
          if (responseText) {
            reviewData = extractJSON(responseText);
            this.normalizeReviewData(reviewData);
            reviewData.reviewTime = duration;
            lastSuccessfulModel = modelName;
            logger.info(`✅ Retry succeeded for ${modelName} in ${duration}ms`);
            break;
          }
        } catch (retryErr: any) {
          lastError = retryErr;
          logger.warn(`⏭️  ${modelName} retry also failed: ${retryErr.message || retryErr} — moving on`);
          continue;
        }
      }
    }

    if (!reviewData) {
      throw new AppError(
        `AI Service failed on all models. Last error: ${lastError?.message || 'Unknown error'}`,
        502,
        'AI_002'
      );
    }

    // 2. Cache successful review in Redis for 24 Hours
    try {
      if (redisClient.isOpen && reviewData) {
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(reviewData));
        logger.info(`Cached successful review: ${cacheKey}`);
      }
    } catch (cacheError) {
      // Cache failure is non-fatal
    }

    return reviewData;
  }

  /**
   * Normalizes and fills in missing fields from the AI response so the frontend never crashes.
   */
  private static normalizeReviewData(data: any): void {
    // Arrays
    if (!Array.isArray(data.bugs)) data.bugs = [];
    if (!Array.isArray(data.securityIssues)) data.securityIssues = [];
    if (!Array.isArray(data.performanceIssues)) data.performanceIssues = [];
    if (!Array.isArray(data.codeSmells)) data.codeSmells = [];
    if (!Array.isArray(data.bestPractices)) data.bestPractices = [];

    // Summary
    if (!data.summary && data.aiSummary) data.summary = data.aiSummary;
    if (typeof data.summary !== 'string' || !data.summary) data.summary = 'Code review generated successfully.';

    // Score
    if (typeof data.score !== 'number') {
      const parsed = parseInt(data.score);
      data.score = isNaN(parsed) ? 80 : Math.max(0, Math.min(100, parsed));
    } else {
      data.score = Math.max(0, Math.min(100, data.score));
    }

    // Complexity
    if (!data.complexity) {
      data.complexity = { time: 'O(N)', space: 'O(N)' };
    } else if (typeof data.complexity === 'string') {
      data.complexity = { time: data.complexity, space: 'O(N)' };
    } else {
      if (typeof data.complexity.time !== 'string') data.complexity.time = data.complexity.timeComplexity || 'O(N)';
      if (typeof data.complexity.space !== 'string') data.complexity.space = data.complexity.spaceComplexity || 'O(N)';
    }

    // String fields
    if (typeof data.optimizedCode !== 'string') data.optimizedCode = '';
    if (typeof data.documentation !== 'string') data.documentation = '';
    if (typeof data.unitTests !== 'string') data.unitTests = '';

    // Normalize array elements
    data.bugs.forEach((bug: any) => {
      if (typeof bug.title !== 'string') bug.title = 'Potential Bug';
      if (typeof bug.severity !== 'string') bug.severity = 'medium';
      if (typeof bug.line !== 'number') { const p = parseInt(bug.line); bug.line = isNaN(p) ? 1 : p; }
      if (typeof bug.description !== 'string') bug.description = '';
      if (typeof bug.recommendation !== 'string') bug.recommendation = '';
    });

    data.securityIssues.forEach((issue: any) => {
      if (typeof issue.title !== 'string') issue.title = 'Security Issue';
      if (typeof issue.severity !== 'string') issue.severity = 'high';
      if (typeof issue.description !== 'string') issue.description = '';
      if (typeof issue.recommendation !== 'string') issue.recommendation = '';
    });

    data.performanceIssues.forEach((issue: any) => {
      if (typeof issue.title !== 'string') issue.title = 'Performance Issue';
      if (typeof issue.impact !== 'string') issue.impact = 'medium';
      if (typeof issue.description !== 'string') issue.description = '';
      if (typeof issue.recommendation !== 'string') issue.recommendation = '';
    });
  }
}

export default AIService;
