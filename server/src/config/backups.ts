import fs from 'fs';
import path from 'path';
import logger from './logger';

export const createBackupMarker = (): void => {
  const dir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const markerPath = path.join(dir, `backup-${Date.now()}.txt`);
  fs.writeFileSync(markerPath, 'Backup marker created\n', 'utf8');
  logger.info('Backup marker created', { markerPath });
};
