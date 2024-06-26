export class EntityNotFoundError extends Error {
  constructor(collection: string) {
    super(`Entity not found in collection "${collection}".`);
  }
}

export class UnsupportedOperatorError extends Error {
  constructor(operator: string) {
    super(`Unsupported operator "${operator}".`);
  }
}

export class RepositoryMethodError extends Error {
  constructor(message: string) {
    super(`Repository Method Error: "${message}".`);
  }
}
