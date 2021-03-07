// eslint-disable-next-line node/no-unpublished-import
import type {OpenAPIV3} from 'openapi-types';
import {FastifyInstance} from 'fastify';
import {RouteHandlerMethod} from 'fastify/types/route';

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
  (request: {
    query: unknown;
    params: unknown;
    headers: unknown;
    body: unknown;
  }): Promise<{
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

      if (this.isReferenceObject(pathItemObject)) {
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
          (parameter): parameter is OpenAPIV3.ParameterObject => {
            return !this.isReferenceObject(parameter);
          }
        );

        if (
          operation.requestBody &&
          this.isReferenceObject(operation.requestBody)
        ) {
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
    return openAPIPath.replace(/\{([^}]+)\}/g, ':$1');
  }

  private createHandler(
    operationId: string,
    handler: Handler
  ): RouteHandlerMethod {
    return async (request, reply) => {
      const response = await handler({
        query: request.query,
        params: request.params,
        headers: request.headers,
        body: request.body,
      });

      reply
        .code(response.statusCode)
        .headers(response.headers)
        .send(response.body);
    };
  }

  private createBodySchema(requestBody?: OpenAPIV3.RequestBodyObject): unknown {
    if (!requestBody) {
      return;
    }

    const requestBodySchemas: OpenAPIV3.SchemaObject[] = [];

    for (const mediaTypeObject of Object.values(requestBody.content)) {
      if (!mediaTypeObject.schema) {
        continue;
      }

      if (this.isReferenceObject(mediaTypeObject.schema)) {
        throw new Error('Undereferenced schema object in request body');
      }

      requestBodySchemas.push(mediaTypeObject.schema);
    }

    if (requestBodySchemas.length === 0) {
      return;
    }

    if (requestBodySchemas.length === 1) {
      return requestBodySchemas[0];
    }

    return {
      oneOf: requestBodySchemas,
    };
  }

  private createQuerystringSchema(
    parameters: OpenAPIV3.ParameterObject[] = []
  ): unknown {
    return this.createParameterSchemaObject('query', parameters);
  }

  private createParamsSchema(
    parameters: OpenAPIV3.ParameterObject[] = []
  ): unknown {
    return this.createParameterSchemaObject('path', parameters);
  }

  private createHeadersSchema(
    parameters: OpenAPIV3.ParameterObject[] = []
  ): unknown {
    return this.createParameterSchemaObject('header', parameters);
  }

  private createParameterSchemaObject(
    type: 'query' | 'path' | 'header',
    parameters: OpenAPIV3.ParameterObject[]
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

  private isReferenceObject<T>(
    object: T | OpenAPIV3.ReferenceObject
  ): object is OpenAPIV3.ReferenceObject {
    return '$ref' in object;
  }
}
