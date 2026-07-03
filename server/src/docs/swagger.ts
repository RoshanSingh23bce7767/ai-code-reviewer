import { Application, Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

const relaxDocsCsp = (_req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('Content-Security-Policy');
  next();
};

export const mountApiDocs = (app: Application): void => {
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  app.use('/api/docs', relaxDocsCsp, swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'AI Code Review API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));
};
