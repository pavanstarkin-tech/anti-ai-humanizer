export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Domain-Aware Multi-Expert Humanization Platform API',
    version: '1.0.0',
    description:
      'Production-grade REST API for page-by-page document humanization with domain-aware routing, multi-expert generation, independent 10-property evaluation, hard preservation gates, and human-in-the-loop review.',
  },
  servers: [
    {
      url: 'http://localhost:4000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service Health Check',
        responses: {
          200: { description: 'API is healthy and operational' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User registered successfully' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Authentication successful' } },
      },
    },
    '/documents': {
      get: {
        summary: 'List user documents',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of documents' } },
      },
      post: {
        summary: 'Upload and parse a document',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Document uploaded and parsing enqueued' } },
      },
    },
    '/documents/{documentId}': {
      get: {
        summary: 'Get document details and pages overview',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Document details' } },
      },
    },
    '/pages/{pageId}/humanize': {
      post: {
        summary: 'Initiate multi-expert humanization and iterative refinement for a single page',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'pageId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  forceRegenerate: { type: 'boolean' },
                  customInstructions: { type: 'string' },
                  targetNaturalness: { type: 'number' },
                  maxIterations: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Humanization job queued' } },
      },
    },
    '/pages/{pageId}/review': {
      get: {
        summary: 'Fetch review comparison, evaluation properties, and diff for a page',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'pageId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Review data retrieved' } },
      },
    },
    '/pages/{pageId}/approve': {
      post: {
        summary: 'Approve current page version and unlock processing for subsequent page',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'pageId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Page approved and locked' } },
      },
    },
    '/documents/{documentId}/reconstruct': {
      post: {
        summary: 'Reconstruct final document with protected elements and integrity checks',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Reconstruction job queued' } },
      },
    },
  },
};
