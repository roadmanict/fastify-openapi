import {OpenAPIV3} from 'openapi-types';
import {FastifyInstance} from 'fastify';
import {RouteHandlerMethod} from 'fastify/types/route';
import ParameterObject = OpenAPIV3.ParameterObject;
import RequestBodyObject = OpenAPIV3.RequestBodyObject;

interface Logger {
  error: (object: Record<string, unknown>, message: string) => void;
}

const openAPIMethods = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

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
  (request: {query: unknown; params: unknown}): Promise<{
    statusCode: number;
    headers: Record<string, unknown>;
    body: unknown;
  }>;
}

export class FastifyOpenAPI {
  public constructor(
    private readonly logger: Logger,
    private readonly fastify: FastifyInstance,
    private readonly handlers: Map<string, Handler>,
    private readonly spec: OpenAPIV3.Document
  ) {
    for (const [path, pathItemObject] of Object.entries(this.spec.paths)) {
      const fastifyPath = this.openAPIToFastifyPath(path);
      if (!pathItemObject) {
        continue;
      }

      if (pathItemObject.$ref) {
        throw new Error('Undereferenced PathItemObject');
      }

      for (const openAPIMethod of openAPIMethods) {
        const operation = pathItemObject[openAPIMethod];
        if (!operation) {
          continue;
        }

        if (openAPIMethod === 'trace' || openAPIMethod === 'head') {
          throw new Error('Unsupported request method');
        }

        if (!operation.operationId) {
          this.logger.error(
            {
              operation: operation,
            },
            'Operation without operationId'
          );

          continue;
        }

        const handler = this.handlers.get(operation.operationId);
        if (!handler) {
          throw new Error(
            `Handler missing for operationId: ${operation.operationId}`
          );
        }

        const dereferencedParameters = operation.parameters?.filter(
          (parameter): parameter is ParameterObject => {
            return !('$ref' in parameter);
          }
        );

        if (operation.requestBody && '$ref' in operation.requestBody) {
          throw new Error('Undereferenced Request Body Object');
        }

        this.fastify.route({
          method: fastifyMethods[openAPIMethod],
          url: fastifyPath,
          handler: this.createHandler(operation.operationId, handler),
          schema: {
            body: this.createBodySchema(operation.requestBody),
            querystring: this.createQuerystringSchema(dereferencedParameters),
            params: this.createParamsSchema(dereferencedParameters),
            headers: this.createHeadersSchema(dereferencedParameters),
          },
        });
      }
    }
  }

  private openAPIToFastifyPath(openAPIPath: string): string {
    return openAPIPath;
  }

  private createHandler(
    operationId: string,
    handler: Handler
  ): RouteHandlerMethod {
    return async (request, reply) => {
      const response = await handler({
        query: request.query,
        params: request.params,
      });

      reply
        .code(response.statusCode)
        .headers(response.headers)
        .send(response.body);
    };
  }

  private createBodySchema(requestBody?: RequestBodyObject): unknown {
    if (!requestBody) {
      return;
    }
    return;
  }

  private createQuerystringSchema(parameters: ParameterObject[] = []): unknown {
    return this.createParameterSchemaObject('query', parameters);
  }

  private createParamsSchema(parameters: ParameterObject[] = []): unknown {
    return this.createParameterSchemaObject('path', parameters);
  }

  private createHeadersSchema(parameters: ParameterObject[] = []): unknown {
    return this.createParameterSchemaObject('header', parameters);
  }

  private createParameterSchemaObject(
    type: 'query' | 'path' | 'header',
    parameters: ParameterObject[]
  ): unknown {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    parameters
      .filter(parameter => parameter.in === type)
      .forEach(parameter => {
        properties[parameter.name] = parameter.schema;
        if (parameter.required) {
          required.push(parameter.name);
        }
      });

    return {
      type: 'object',
      required: required,
      properties: properties,
    };
  }
}
