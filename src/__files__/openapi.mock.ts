import {OpenAPIV3} from 'openapi-types';

export const openAPIMock: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'mock spec',
    version: '1.0.0',
  },
  paths: {
    '/status-code-test': {
      get: {
        operationId: 'statusCodeTest',
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
    '/query-string-optional-test': {
      get: {
        operationId: 'queryStringOptionalTest',
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
    '/query-string-required-test': {
      get: {
        operationId: 'queryStringRequiredTest',
        parameters: [
          {
            in: 'query',
            name: 'foo',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
  },
};
