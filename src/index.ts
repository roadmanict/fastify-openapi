import type {OpenAPIV3} from 'openapi-types';

enum OpenAPIMethod {
  Get = 'get',
  Put = 'put',
  Post = 'post',
  Delete = 'delete',
  Options = 'options',
  Head = 'head',
  Patch = 'patch',
  Trace = 'trace',
}

export interface RestFrameworkRouteOptions {
  operationID: string;
  method: OpenAPIMethod;
  path: string;
  schema: {
    body?: unknown;
    querystring?: unknown;
    params?: unknown;
    headers?: unknown;
  };
}

export interface RestFramework {
  registerRoute(options: RestFrameworkRouteOptions): void;
}

export class OpenAPIRestFramework {
  public constructor(
    private readonly spec: OpenAPIV3.Document,
    private readonly restFramework: RestFramework
  ) {}

  public registerRoutes(): void {
    for (const [path, pathItemObject] of Object.entries(this.spec.paths)) {
      if (!pathItemObject) {
        continue;
      }

      this.isNotReferenceObject(pathItemObject);

      for (const openAPIMethod of Object.values(OpenAPIMethod)) {
        const operation: OpenAPIV3.OperationObject | undefined =
          pathItemObject[openAPIMethod];
        if (!operation) {
          continue;
        }

        if (!operation.operationId) {
          throw new Error(
            `Operation without operationId: ${path} ${openAPIMethod}`
          );
        }

        const parameters: (
          | OpenAPIV3.ReferenceObject
          | OpenAPIV3.ParameterObject
        )[] = [
          ...(pathItemObject.parameters ?? []),
          ...(operation.parameters ?? []),
        ];

        this.doesNotContainReferenceObjects(parameters);
        if (operation.requestBody) {
          this.isNotReferenceObject(operation.requestBody);
        }

        this.restFramework.registerRoute({
          operationID: operation.operationId,
          method: openAPIMethod,
          path: path,
          schema: {
            body: this.createBodySchema(operation.requestBody),
            querystring: this.createQuerystringSchema(parameters),
            params: this.createParamsSchema(parameters),
            headers: this.createHeadersSchema(parameters),
          },
        });
      }
    }
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

      this.isNotReferenceObject(mediaTypeObject.schema);

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
    for (const parameter of parameters) {
      if (parameter.in !== 'query') {
        continue;
      }
      if (parameter.explode === false) {
        throw new Error(
          'Query parameters config explode=false is not supported'
        );
      }
      if (parameter.style && parameter.style !== 'form') {
        throw new Error('Query parameters config style=form is only supported');
      }
    }

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

  private isNotReferenceObject<T>(
    obj: T | OpenAPIV3.ReferenceObject
  ): asserts obj is T {
    if (this.isReferenceObject(obj)) {
      throw new Error(`Reference found: ${obj.$ref}, dereference to fix`);
    }
  }

  private doesNotContainReferenceObjects<T>(
    objects: (T | OpenAPIV3.ReferenceObject)[]
  ): asserts objects is T[] {
    for (const obj of objects) {
      this.isNotReferenceObject(obj);
    }
  }
}
