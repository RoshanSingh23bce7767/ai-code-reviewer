import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import AuthController from './controllers/auth.controller';
import ReviewController from './controllers/review.controller';
import DashboardController from './controllers/dashboard.controller';
import UserController from './controllers/user.controller';
import { errorHandler } from './middlewares/errorHandler';
import { validate } from './middlewares/validate';
import { csrfProtection, setCsrfToken } from './middlewares/csrf';
import { protect, restrictTo } from './middlewares/auth';
import { rejectUnsafeRequestKeys } from './middlewares/requestGuards';
import { requestIdMiddleware } from './middlewares/requestId';
import { securityHeaders } from './middlewares/security';
import { mountApiDocs } from './docs/swagger';
import {
  authRouteLimiter,
  globalApiLimiter,
  loginLimiter,
  reviewApiLimiter,
  reviewCreateLimiter
} from './middlewares/rateLimit';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from './validators/auth.validator';
import {
  createReviewSchema,
  listReviewsSchema,
  reviewIdParamSchema,
  updateReviewTitleSchema
} from './validators/review.validator';
import { dashboardQuerySchema } from './validators/dashboard.validator';
import { emptyBodySchema } from './validators/common.validator';
import {
  deleteAccountSchema,
  listNotificationsSchema,
  notificationIdParamSchema,
  updateProfileSchema
} from './validators/user.validator';
import logger from './config/logger';
import {
  getAllowedOrigins,
  getRequestBodyLimit,
  isProduction,
  validateStartupConfig
} from './config/env';
import { checkDependencies } from './config/health';
import { getRuntimeMetrics } from './config/monitoring';
import { createBackupMarker } from './config/backups';
import { emitAlert } from './config/alerts';
import connectDB from './config/db';
import { connectRedis } from './config/redis';

export const app: Application = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(requestIdMiddleware);
app.use(securityHeaders);
mountApiDocs(app);

const allowedOrigins = getAllowedOrigins();
const requestBodyLimit = getRequestBodyLimit();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (!isProduction && origin) {
        try {
          const url = new URL(origin);
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            callback(null, true);
            return;
          }
        } catch (e) {
          // Ignore URL parsing errors for malformed origins
        }
      }

      logger.warn(`CORS policy rejected origin: ${origin}`);
      callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
    exposedHeaders: ['X-CSRF-Token', 'X-Request-ID']
  })
);
app.use(cookieParser());
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: requestBodyLimit, parameterLimit: 100 }));
app.use(rejectUnsafeRequestKeys);
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(setCsrfToken);
app.use('/api/v1', globalApiLimiter);

app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AI Code Review API',
    version: 'v1',
    docs: '/api/docs',
    endpoints: {
      v1: '/api/v1'
    }
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AI Code Review API is running'
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  const dependencyCheck = await checkDependencies();
  res.status(dependencyCheck.ok ? 200 : 503).json({
    success: dependencyCheck.ok,
    message: dependencyCheck.ok ? 'Service healthy' : 'Service unavailable',
    checks: dependencyCheck.checks,
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const dependencyCheck = await checkDependencies();
  res.status(dependencyCheck.ok ? 200 : 503).json({
    success: dependencyCheck.ok,
    checks: dependencyCheck.checks,
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    metrics: getRuntimeMetrics()
  });
});

const backupHandler = (_req: Request, res: Response) => {
  createBackupMarker();
  emitAlert('Manual backup requested', { endpoint: '/admin/backup' });
  res.status(200).json({ success: true, message: 'Backup marker created' });
};

app.get('/api/v1/csrf-token', (req: Request, res: Response) => {
  const csrfRequest = req as Request & { csrfToken?: string };
  res.status(200).json({
    success: true,
    csrfToken: csrfRequest.csrfToken
  });
});

app.use('/api/v1', csrfProtection);

const authRouter = express.Router();
authRouter.use(authRouteLimiter);
authRouter.post('/register', loginLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/refresh', loginLimiter, validate(refreshTokenSchema), AuthController.refresh);
authRouter.post('/logout', loginLimiter, validate(refreshTokenSchema), AuthController.logout);
authRouter.post('/verify-email', loginLimiter, validate(verifyEmailSchema), AuthController.verifyEmail);
authRouter.post('/forgot-password', loginLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', loginLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
authRouter.post('/sessions/revoke', protect, validate(emptyBodySchema), AuthController.revokeSessions);
app.use('/api/v1/auth', authRouter);

const reviewRouter = express.Router();
reviewRouter.use(protect);
reviewRouter.use(reviewApiLimiter);
reviewRouter.post('/', reviewCreateLimiter, validate(createReviewSchema), ReviewController.create);
reviewRouter.get('/', validate(listReviewsSchema), ReviewController.listReviews);
reviewRouter.get('/:reviewId', validate(reviewIdParamSchema), ReviewController.getReview);
reviewRouter.delete('/:reviewId', validate(reviewIdParamSchema), ReviewController.deleteReview);
reviewRouter.patch('/:reviewId/favorite', validate(reviewIdParamSchema), ReviewController.toggleFavorite);
reviewRouter.patch('/:reviewId/title', validate(updateReviewTitleSchema), ReviewController.updateTitle);
app.use('/api/v1/reviews', reviewRouter);

const dashboardRouter = express.Router();
dashboardRouter.use(protect);
dashboardRouter.get('/stats', validate(dashboardQuerySchema), DashboardController.getStats);
dashboardRouter.get('/languages', validate(dashboardQuerySchema), DashboardController.getLanguageDistribution);
dashboardRouter.get('/monthly', validate(dashboardQuerySchema), DashboardController.getMonthlyStats);
app.use('/api/v1/dashboard', dashboardRouter);

const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/me', validate(dashboardQuerySchema), UserController.getProfile);
userRouter.patch('/me', validate(updateProfileSchema), UserController.updateProfile);
userRouter.delete('/me', validate(deleteAccountSchema), UserController.deleteAccount);
userRouter.get('/notifications', validate(listNotificationsSchema), UserController.getNotifications);
userRouter.patch('/notifications/:notificationId/read', validate(notificationIdParamSchema), UserController.markNotificationRead);
userRouter.delete('/notifications/:notificationId', validate(notificationIdParamSchema), UserController.deleteNotification);
app.use('/api/v1/users', userRouter);

app.post('/api/v1/admin/backup', protect, restrictTo('admin'), backupHandler);
app.post('/admin/backup', csrfProtection, protect, restrictTo('admin'), backupHandler);

app.use(errorHandler);

const startServer = async (port: number, attempts = 10): Promise<void> => {
  const server = app.listen(port, async () => {
    const dependencyCheck = await checkDependencies();
    if (!dependencyCheck.ok) {
      logger.error('Startup dependency check failed', dependencyCheck);
    }
    logger.info(`Server listening on port ${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && attempts > 0) {
      logger.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      server.close();
      void startServer(port + 1, attempts - 1);
      return;
    }

    logger.error('Failed to start server', error);
    process.exit(1);
  });
};

if (require.main === module) {
  const bootstrap = async (): Promise<void> => {
    validateStartupConfig();
    await connectDB();
    await connectRedis();
    await startServer(Number(process.env.PORT) || 5000);
  };

  bootstrap().catch((error) => {
    logger.error('Startup validation failed', error);
    process.exit(1);
  });
}
