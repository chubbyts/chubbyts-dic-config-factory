import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';

export type Factory<T = unknown> = (container: Container) => T;

export type AbstractFactory<T = unknown> = (name?: string) => Factory<T>;

export type ResolveDependency = <T>(container: Container, id: string, abstractFactory: AbstractFactory<T>) => T;

export type ResolveConfig = <C extends Record<string, unknown>>(config: C | Record<string, C>) => C;

export type ResolveValue = <T = unknown>(container: Container, value: unknown) => T;

export type Helpers = {
  name: string;
  resolveDependency: ResolveDependency;
  resolveConfig: ResolveConfig;
  resolveValue: ResolveValue;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (null === value || 'object' !== typeof value) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return null === prototype || Object.prototype === prototype;
};

const resolveValue: ResolveValue = <T>(container: Container, value: unknown): T => {
  if ('string' === typeof value) {
    return (container.has(value) ? container.get<T>(value) : value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((subValue: unknown) => resolveValue(container, subValue)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([subKey, subValue]: [string, unknown]) => [subKey, resolveValue(container, subValue)]),
    ) as T;
  }

  return value as T;
};

const createResolveDependency = (name: string): ResolveDependency => {
  return <T>(container: Container, id: string, abstractFactory: AbstractFactory<T>): T => {
    if (container.has(id + name)) {
      return container.get<T>(id + name);
    }

    return abstractFactory(name)(container);
  };
};

const createResolveConfig = (name: string): ResolveConfig => {
  return <C extends Record<string, unknown>>(config: C | Record<string, C>): C => {
    if ('' === name) {
      return config as C;
    }

    return ((config as Record<string, C>)[name] ?? {}) as C;
  };
};

export const createAbstractFactory = <T>(
  handler: (container: Container, helpers: Helpers) => T,
): AbstractFactory<T> => {
  return (name = ''): Factory<T> => {
    const helpers: Helpers = {
      name,
      resolveDependency: createResolveDependency(name),
      resolveConfig: createResolveConfig(name),
      resolveValue,
    };

    return (container: Container): T => handler(container, helpers);
  };
};
