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
  testHandlers.set('queryStringOptionalTest', query =>
    Promise.resolve({
      statusCode: 200,
      headers: {},
      body: query,
    })
  );
  testHandlers.set('queryStringNumberTest', query =>
    Promise.resolve({
      statusCode: 200,
      headers: {},
      body: query,
    })
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
            foo: 'bar',
          })
        );
      });
    });

    // describe('with invalid query param', () => {
    //   beforeEach(async () => {
    //     response = await server.inject({
    //       method: 'GET',
    //       url: '/query-string-test',
    //       query: {
    //         foo: '15',
    //       },
    //     });
    //   });
    //
    //   it('returns 400 status', () => {
    //     expect(response.statusCode).toEqual(400);
    //   });
    //
    //   it('returns error body', () => {
    //     expect(response.body).toEqual('');
    //   });
    // });
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
            foo: 500,
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
});
