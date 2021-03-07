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
    '/query-string-number-test': {
      get: {
        operationId: 'queryStringNumberTest',
        parameters: [
          {
            in: 'query',
            name: 'foo',
            schema: {
              type: 'number',
            },
          },
        ],
      },
    },
    '/query-string-array-test': {
      get: {
        operationId: 'queryStringArrayTest',
        parameters: [
          {
            in: 'query',
            name: 'foo',
            schema: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
          },
        ],
      },
    },
    '/param-test/{foo}': {
      get: {
        operationId: 'paramTest',
        parameters: [
          {
            in: 'path',
            name: 'foo',
            schema: {
              type: 'number',
            },
          },
        ],
      },
    },
    '/params-test/{foo}/{foo2}': {
      get: {
        operationId: 'paramsTest',
        parameters: [
          {
            in: 'path',
            name: 'foo',
            schema: {
              type: 'number',
            },
          },
          {
            in: 'path',
            name: 'foo2',
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
    '/header-test': {
      get: {
        operationId: 'headerTest',
        parameters: [
          {
            in: 'header',
            name: 'requestid',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'header',
            name: 'storeid',
            schema: {
              type: 'number',
            },
          },
        ],
      },
    },
    '/header-required-test': {
      get: {
        operationId: 'headerRequiredTest',
        parameters: [
          {
            in: 'header',
            name: 'requestid',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
    '/header-array-test': {
      get: {
        operationId: 'headerArrayTest',
        parameters: [
          {
            in: 'header',
            name: 'array-header',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        ],
      },
    },
  },
};
