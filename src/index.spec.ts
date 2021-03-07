import {FastifyOpenAPI, Handler} from './index';
import {openAPIMock} from './__files__/openapi.mock';
import fastify from 'fastify';
import {Response as LightMyRequestResponse} from 'light-my-request';

describe('A FastifyOpenAPI', () => {
  let response: LightMyRequestResponse;

  const loggerMock = {
    error: () => undefined,
  };
  const server = fastify();
  const testHandlers = new Map<string, Handler>();
  testHandlers.set('statusCodeTest', () =>
    Promise.resolve({
      statusCode: 404,
      headers: {},
      body: undefined,
    })
  );
  const testRoute = (request: unknown) =>
    Promise.resolve({
      statusCode: 200,
      headers: {},
      body: request,
    });
  testHandlers.set('queryStringOptionalTest', testRoute);
  testHandlers.set('queryStringRequiredTest', testRoute);
  testHandlers.set('queryStringNumberTest', testRoute);
  testHandlers.set('queryStringArrayTest', testRoute);
  testHandlers.set('paramTest', testRoute);
  testHandlers.set('paramsTest', testRoute);

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

  describe('statusCodeTest', () => {
    beforeEach(async () => {
      response = await server.inject({
        method: 'GET',
        url: '/status-code-test',
      });
    });

    it('returns 404 status', () => {
      expect(response.statusCode).toEqual(404);
    });
  });

  describe('queryString', () => {
    describe('queryStringOptionalTest', () => {
      describe('with valid query param', () => {
        beforeEach(async () => {
          response = await server.inject({
            method: 'GET',
            url: '/query-string-optional-test',
            query: {
              foo: 'bar',
            },
          });
        });

        it('returns 200 status', () => {
          expect(response.statusCode).toEqual(200);
        });

        it('returns body', () => {
          expect(response.body).toEqual(
            JSON.stringify({
              query: {
                foo: 'bar',
              },
              params: {},
            })
          );
        });
      });
    });

    describe('queryStringRequiredTest', () => {
      describe('with valid query param', () => {
        beforeEach(async () => {
          response = await server.inject({
            method: 'GET',
            url: '/query-string-required-test',
          });
        });

        it('returns 400 status', () => {
          expect(response.statusCode).toEqual(400);
        });

        it('returns body', () => {
          expect(response.body).toEqual(
            JSON.stringify({
              statusCode: 400,
              error: 'Bad Request',
              message: "querystring should have required property 'foo'",
            })
          );
        });
      });
    });

    describe('queryStringNumberTest', () => {
      describe('with valid query param', () => {
        beforeEach(async () => {
          response = await server.inject({
            method: 'GET',
            url: '/query-string-number-test',
            query: {
              foo: '500',
            },
          });
        });

        it('returns 200 status', () => {
          expect(response.statusCode).toEqual(200);
        });

        it('returns body', () => {
          expect(response.body).toEqual(
            JSON.stringify({
              query: {
                foo: 500,
              },
              params: {},
            })
          );
        });
      });

      describe('with invalid query param', () => {
        beforeEach(async () => {
          response = await server.inject({
            method: 'GET',
            url: '/query-string-number-test',
            query: {
              foo: 'string',
            },
          });
        });

        it('returns 400 status', () => {
          expect(response.statusCode).toEqual(400);
        });

        it('returns error body', () => {
          expect(response.body).toEqual(
            JSON.stringify({
              statusCode: 400,
              error: 'Bad Request',
              message: 'querystring.foo should be number',
            })
          );
        });
      });
    });

    describe.skip('queryStringArrayTest', () => {
      describe('with valid query param', () => {
        beforeEach(async () => {
          response = await server.inject({
            method: 'GET',
            url: '/query-string-array-test?foo=500,400',
          });
        });

        it('returns 200 status', () => {
          expect(response.statusCode).toEqual(200);
        });

        it('returns body', () => {
          expect(response.body).toEqual(
            JSON.stringify({
              foo: [500, 400],
            })
          );
        });
      });
    });
  });

  describe('params', () => {
    describe('single', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/param-test/12345',
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(response.body).toEqual(
          JSON.stringify({
            query: {},
            params: {
              foo: 12345,
            },
          })
        );
      });
    });

    describe('double', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/params-test/12345/product',
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(response.body).toEqual(
          JSON.stringify({
            query: {},
            params: {
              foo: 12345,
              foo2: 'product',
            },
          })
        );
      });
    });
  });
});
