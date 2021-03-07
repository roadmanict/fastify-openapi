import {OpenAPIV3} from 'openapi-types';

export const openAPIMock: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'mock spec',
    version: '1.0.0',
  },
  paths: {
    '/query-string-test': {
      get: {
        operationId: 'queryStringTest',
        parameters: [
          {
            in: 'query',
            name: 'foo',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
  },
};
