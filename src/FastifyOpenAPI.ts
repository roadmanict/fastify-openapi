import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from 'fastify';
import {RestFramework, RestFrameworkRouteOptions} from './index';

const fastifyMethods = {
  get: 'GET',
  put: 'PUT',
  post: 'POST',
  delete: 'DELETE',
  options: 'OPTIONS',
  head: 'HEAD',
  patch: 'PATCH',
} as const;

export interface Handler {
  (
    request: {
      query: unknown;
      params: unknown;
      headers: unknown;
      body: unknown;
    },
    fastify: {
      request: FastifyRequest;
      reply: FastifyReply;
    }
  ): Promise<{
    statusCode: number;
    headers: Record<string, unknown>;
    body: unknown;
  }>;
}

export class FastifyOpenAPI implements RestFramework {
  public constructor(
    private readonly fastify: FastifyInstance,
    private readonly handlers: Map<string, Handler>
  ) {}

  public registerRoute({
    operationID,
    method,
    path,
    schema,
  }: RestFrameworkRouteOptions): void {
    const handler = this.handlers.get(operationID);
    if (!handler) {
      throw new Error(`Handler for operationID ${operationID} not found`);
    }

    if (method === 'trace' || method === 'head') {
      throw new Error(`Unsupported request method: ${method}`);
    }

    this.fastify.route({
      method: fastifyMethods[method],
      url: this.openAPIToFastifyPath(path),
      handler: this.createHandler(handler),
      schema: schema,
    });
  }

  private openAPIToFastifyPath(openAPIPath: string): string {
    return openAPIPath.replace(/{([^}]+)}/g, ':$1');
  }

  private createHandler(handler: Handler): RouteHandlerMethod {
    return async (request, reply) => {
      const response = await handler(
        {
          query: request.query,
          params: request.params,
          headers: request.headers,
          body: request.body,
        },
        {request, reply}
      );

      reply
        .code(response.statusCode)
        .headers(response.headers)
        .send(response.body);
    };
  }
}
