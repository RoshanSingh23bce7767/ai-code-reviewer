import mongoose from 'mongoose';
import logger from './logger';

export const checkDependencies = async (): Promise<{ ok: boolean; checks: Record<string, string> }> => {
  const checks: Record<string, string> = {};

  try {
    checks.database = mongoose.connection.readyState === 1 ? 'ok' : 'not-ready';
  } catch {
    checks.database = 'error';
  }

  const ok = checks.database === 'ok';
  if (!ok) {
    logger.error('Startup dependency check failed', { checks });
  }

  return { ok, checks };
};
