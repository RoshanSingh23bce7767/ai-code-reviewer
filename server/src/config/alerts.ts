import logger from './logger';

export const emitAlert = (title: string, details: Record<string, unknown>): void => {
  logger.error('Alert emitted', { title, details });
};
