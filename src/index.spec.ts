import {FastifyOpenAPI, Handler} from './index';
import {openAPIMock} from './__files__/openapi.mock';
import fastify from 'fastify';
// eslint-disable-next-line node/no-extraneous-import
import {Response as LightMyRequestResponse} from 'light-my-request';

const defaultHeaders = {
  'user-agent': 'lightMyRequest',
  host: 'localhost:80',
};

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
  testHandlers.set('headerTest', testRoute);
  testHandlers.set('headerRequiredTest', testRoute);
  testHandlers.set('headerArrayTest', testRoute);
  testHandlers.set('bodyTest', testRoute);
  testHandlers.set('bodyOneOfTest', testRoute);

  new FastifyOpenAPI(
    loggerMock,
    server,
    testHandlers,
    openAPIMock
  ).registerRoutes();

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
              headers: defaultHeaders,
              body: null,
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
              headers: defaultHeaders,
              body: null,
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
            headers: defaultHeaders,
            body: null,
          })
        );
      });
    });

    describe('invalid', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/param-test/asdf',
        });
      });

      it('returns 400 status', () => {
        expect(response.statusCode).toEqual(400);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          error: 'Bad Request',
          message: 'params.foo should be number',
          statusCode: 400,
        });
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
            headers: defaultHeaders,
            body: null,
          })
        );
      });
    });
  });

  describe('headers', () => {
    describe('valid headers', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/header-test',
          headers: {
            requestid: 'requestID',
            storeid: 12345,
          },
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(response.body).toEqual(
          JSON.stringify({
            query: {},
            params: {},
            headers: {
              requestid: 'requestID',
              storeid: 12345,
              ...defaultHeaders,
            },
            body: null,
          })
        );
      });
    });

    describe('invalid headers', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/header-test',
          headers: {
            requestid: 'requestID',
            storeid: 'asdf',
          },
        });
      });

      it('returns 400 status', () => {
        expect(response.statusCode).toEqual(400);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          error: 'Bad Request',
          message: 'headers.storeid should be number',
          statusCode: 400,
        });
      });
    });

    describe('required headers', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/header-required-test',
        });
      });

      it('returns 400 status', () => {
        expect(response.statusCode).toEqual(400);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          error: 'Bad Request',
          message: "headers should have required property 'requestid'",
          statusCode: 400,
        });
      });
    });

    describe.skip('array headers', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'GET',
          url: '/header-array-test',
          headers: {
            'array-header': ['value1', 'value2'],
          },
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({});
      });
    });
  });

  describe('body', () => {
    describe('valid body', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'POST',
          url: '/body-test',
          headers: {
            'content-type': 'application/json',
          },
          payload: {
            something: 'asdf',
          },
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          query: {},
          params: {},
          headers: {
            ...defaultHeaders,
            'content-length': '20',
            'content-type': 'application/json',
          },
          body: {
            something: 'asdf',
          },
        });
      });
    });
    describe('valid oneof body option 1', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'POST',
          url: '/body-test',
          headers: {
            'content-type': 'application/json',
          },
          payload: {
            something: 'this is a string',
          },
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          query: {},
          params: {},
          headers: {
            ...defaultHeaders,
            'content-length': '32',
            'content-type': 'application/json',
          },
          body: {
            something: 'this is a string',
          },
        });
      });
    });

    describe('valid oneof body option 2', () => {
      beforeEach(async () => {
        response = await server.inject({
          method: 'POST',
          url: '/body-test',
          headers: {
            'content-type': 'application/json',
          },
          payload: {
            something2: 12345,
          },
        });
      });

      it('returns 200 status', () => {
        expect(response.statusCode).toEqual(200);
      });

      it('returns body', () => {
        expect(JSON.parse(response.body)).toEqual({
          query: {},
          params: {},
          headers: {
            ...defaultHeaders,
            'content-length': '20',
            'content-type': 'application/json',
          },
          body: {
            something2: 12345,
          },
        });
      });
    });
  });
});
