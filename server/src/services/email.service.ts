import nodemailer from 'nodemailer';
import logger from '../config/logger';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    return this.transporter;
  }

  async sendMail(options: MailOptions): Promise<void> {
    try {
      const info = await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM || 'no-reply@localhost',
        ...options
      });

      logger.info('Email dispatched', { messageId: info.messageId, to: options.to });

      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[DEV EMAIL] Sent to: ${options.to}\nSubject: ${options.subject}\nHTML body: ${options.html}`);
      }
    } catch (error) {
      logger.error('Failed to send email', error);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
