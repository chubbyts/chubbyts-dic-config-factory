import { createAbstractFactory } from '../src/dic-config-factory';

export type ServiceConfig = Record<string, unknown>;

export type Config = {
  serviceA?: ServiceConfig | Record<string, ServiceConfig>;
  serviceB?: ServiceConfig | Record<string, ServiceConfig>;
  [key: string]: unknown;
};

export class ServiceB {
  public readonly config: ServiceConfig;

  public constructor(config: ServiceConfig) {
    // oxlint-disable-next-line functional/immutable-data
    this.config = config;
  }
}

export class ServiceA {
  public readonly config: ServiceConfig;
  public readonly serviceB: ServiceB;

  public constructor(config: ServiceConfig, serviceB: ServiceB) {
    // oxlint-disable-next-line functional/immutable-data
    this.config = config;
    // oxlint-disable-next-line functional/immutable-data
    this.serviceB = serviceB;
  }
}

export const serviceBFactory = createAbstractFactory((container, { resolveConfig }): ServiceB => {
  return new ServiceB(resolveConfig(container.get<Config>('config').serviceB ?? {}));
});

export const serviceAFactory = createAbstractFactory((container, { resolveConfig, resolveDependency }): ServiceA => {
  return new ServiceA(
    resolveConfig(container.get<Config>('config').serviceA ?? {}),
    resolveDependency(container, 'serviceB', serviceBFactory),
  );
});
