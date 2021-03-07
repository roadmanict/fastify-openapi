import {FastifyOpenAPI} from './index';
import {openAPIMock} from './__files__/openapi.mock';
import fastify from 'fastify';
import {Response as LightMyRequestResponse} from 'light-my-request';

describe('A FastifyOpenAPI', () => {
  let response: LightMyRequestResponse;

  const loggerMock = {
    error: () => undefined,
  };
  const server = fastify();
  const testHandlers = new Map();
  const queryStringResponse = {
    statusCode: 200,
    headers: {},
    body: {
      something: 'to return',
    },
  };
  testHandlers.set('queryStringTest', () =>
    Promise.resolve(queryStringResponse)
  );

  new FastifyOpenAPI(loggerMock, server, testHandlers, openAPIMock);

  describe('404 test', () => {
    beforeEach(async () => {
      response = await server.inject({
        method: 'GET',
        url: '/does-not-exist',
      });
    });

    it('returns 404 status', () => {
      expect(response.statusCode).toEqual(404);
    });
  });

  describe('queryStringTest', () => {
    beforeEach(async () => {
      response = await server.inject({
        method: 'GET',
        url: '/query-string-test',
        query: {
          foo: 'bar',
        },
      });
    });

    it('returns 200 status', () => {
      expect(response.statusCode).toEqual(queryStringResponse.statusCode);
    });

    it('returns body', () => {
      expect(response.body).toEqual(JSON.stringify(queryStringResponse.body));
    });
  });
});
