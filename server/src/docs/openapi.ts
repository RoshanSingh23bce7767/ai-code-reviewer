export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Code Review API',
    version: '1.0.0',
    description:
      'Production API for AI-powered code reviews, authentication, dashboards, and user profiles.',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [{ url: '/api/v1', description: 'Version 1' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, and session management' },
    { name: 'Reviews', description: 'AI code review operations' },
    { name: 'Dashboard', description: 'Analytics and statistics' },
    { name: 'Users', description: 'Profile and notifications' },
    { name: 'System', description: 'Health and metadata' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errorCode: { type: 'string' },
          errors: { type: 'array', items: { type: 'object' } },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 12 }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      CreateReviewRequest: {
        type: 'object',
        required: ['language', 'sourceCode'],
        properties: {
          language: {
            type: 'string',
            enum: ['Java', 'JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'SQL', 'Go', 'Rust']
          },
          sourceCode: { type: 'string' }
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          avatar: { type: 'string', format: 'uri' }
        }
      },
      UpdateReviewTitleRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
        },
        responses: {
          '201': { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive auth cookies',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          '200': { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        responses: { '200': { description: 'Token refreshed' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and revoke session',
        responses: { '200': { description: 'Logged out' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } }
            }
          }
        },
        responses: { '200': { description: 'Email verified' }, '400': { description: 'Invalid token' } }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }
            }
          }
        },
        responses: { '200': { description: 'Reset email sent if account exists' } }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: { token: { type: 'string' }, password: { type: 'string', minLength: 12 } }
              }
            }
          }
        },
        responses: { '200': { description: 'Password reset' }, '400': { description: 'Invalid token' } }
      }
    },
    '/auth/sessions/revoke': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke all sessions for current user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Sessions revoked' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/csrf-token': {
      get: {
        tags: ['System'],
        summary: 'Fetch CSRF token for state-changing requests',
        responses: { '200': { description: 'CSRF token returned' } }
      }
    },
    '/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: { '200': { description: 'Review list' }, '401': { description: 'Unauthorized' } }
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create AI code review',
        security: [{ bearerAuth: [] }, { csrfToken: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReviewRequest' } } }
        },
        responses: { '201': { description: 'Review created' }, '400': { description: 'Validation error' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/reviews/{reviewId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get review by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reviewId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Review details' }, '404': { description: 'Not found' } }
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete review',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reviewId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Review deleted' }, '404': { description: 'Not found' } }
      }
    },
    '/reviews/{reviewId}/title': {
      patch: {
        tags: ['Reviews'],
        summary: 'Update review title',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reviewId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReviewTitleRequest' } } }
        },
        responses: { '200': { description: 'Title updated' }, '400': { description: 'Validation error' } }
      }
    },
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dashboard stats' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/dashboard/languages': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get language distribution',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Language analytics' } }
      }
    },
    '/dashboard/monthly': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get monthly review trends',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Monthly stats' } }
      }
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Profile data' }, '401': { description: 'Unauthorized' } }
      },
      patch: {
        tags: ['Users'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } } }
        },
        responses: { '200': { description: 'Profile updated' }, '400': { description: 'Validation error' } }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete account',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Account deleted' } }
      }
    },
    '/users/notifications': {
      get: {
        tags: ['Users'],
        summary: 'List notifications',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Notifications list' } }
      }
    }
  }
};
