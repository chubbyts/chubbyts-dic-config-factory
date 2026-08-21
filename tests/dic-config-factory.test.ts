import { createContainer } from '@chubbyts/chubbyts-dic/dist/container';
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { describe, expect, test } from 'vitest';
import { createAbstractFactory } from '../src/dic-config-factory';
import type { Config } from './assets';
import { ServiceA, ServiceB, serviceAFactory, serviceBFactory } from './assets';

const createResolveValueFactory = (value: unknown) =>
  createAbstractFactory((container, { resolveValue }) => resolveValue(container, value));

describe('createAbstractFactory', () => {
  describe('name', () => {
    test('without name', () => {
      const abstractFactory = createAbstractFactory((_, { name }) => name);

      expect(abstractFactory()(createContainer())).toBe('');
    });

    test('with name', () => {
      const abstractFactory = createAbstractFactory((_, { name }) => name);

      expect(abstractFactory('read')(createContainer())).toBe('read');
    });
  });

  describe('resolveConfig', () => {
    test('without name', () => {
      const config: Config = { serviceB: { key: 'value' } };

      const container = createContainer();
      container.set('config', () => config);

      const serviceB = serviceBFactory()(container);

      expect(serviceB).toBeInstanceOf(ServiceB);
      expect(serviceB.config).toBe(config.serviceB);
    });

    test('with name', () => {
      const config: Config = { serviceB: { read: { key: 'valueRead' }, write: { key: 'valueWrite' } } };

      const container = createContainer();
      container.set('config', () => config);

      const serviceB = serviceBFactory('read')(container);

      expect(serviceB).toBeInstanceOf(ServiceB);
      expect(serviceB.config).toEqual({ key: 'valueRead' });
    });

    test('with name, but missing related config', () => {
      const config: Config = { serviceB: { read: { key: 'valueRead' } } };

      const container = createContainer();
      container.set('config', () => config);

      const serviceB = serviceBFactory('write')(container);

      expect(serviceB).toBeInstanceOf(ServiceB);
      expect(serviceB.config).toEqual({});
    });

    test('with name, but missing config', () => {
      const config: Config = {};

      const container = createContainer();
      container.set('config', () => config);

      const serviceB = serviceBFactory('read')(container);

      expect(serviceB).toBeInstanceOf(ServiceB);
      expect(serviceB.config).toEqual({});
    });
  });

  describe('resolveDependency', () => {
    test('with existing service', () => {
      const config: Config = { serviceA: { key: 'value' } };
      const existingServiceB = new ServiceB({});

      const container = createContainer();
      container.set('config', () => config);
      container.set('serviceB', () => existingServiceB);

      const serviceA = serviceAFactory()(container);

      expect(serviceA).toBeInstanceOf(ServiceA);
      expect(serviceA.serviceB).toBe(existingServiceB);
    });

    test('with existing named service', () => {
      const config: Config = { serviceA: { read: { key: 'valueRead' } } };
      const existingServiceB = new ServiceB({});

      const container = createContainer();
      container.set('config', () => config);
      container.set('serviceBread', () => existingServiceB);

      const serviceA = serviceAFactory('read')(container);

      expect(serviceA).toBeInstanceOf(ServiceA);
      expect(serviceA.config).toEqual({ key: 'valueRead' });
      expect(serviceA.serviceB).toBe(existingServiceB);
    });

    test('without existing service', () => {
      const config: Config = { serviceA: { key: 'value' }, serviceB: { key2: 'value2' } };

      const container = createContainer();
      container.set('config', () => config);

      const serviceA = serviceAFactory()(container);

      expect(serviceA).toBeInstanceOf(ServiceA);
      expect(serviceA.serviceB).toBeInstanceOf(ServiceB);
      expect(serviceA.serviceB.config).toBe(config.serviceB);
    });

    test('without existing named service', () => {
      const config: Config = {
        serviceA: { read: { key: 'valueRead' } },
        serviceB: { read: { key2: 'value2Read' } },
      };

      const container = createContainer();
      container.set('config', () => config);

      const serviceA = serviceAFactory('read')(container);

      expect(serviceA).toBeInstanceOf(ServiceA);
      expect(serviceA.serviceB).toBeInstanceOf(ServiceB);
      expect(serviceA.serviceB.config).toEqual({ key2: 'value2Read' });
    });
  });

  describe('resolveValue', () => {
    test('with string matching a service', () => {
      const service = new ServiceB({});

      const container = createContainer();
      container.set('someService', () => service);

      expect(createResolveValueFactory('someService')()(container)).toBe(service);
    });

    test('with string not matching a service', () => {
      expect(createResolveValueFactory('someString')()(createContainer())).toBe('someString');
    });

    test('with array', () => {
      const service = new ServiceB({});

      const container = createContainer();
      container.set('someService', () => service);

      expect(createResolveValueFactory(['someService', 'someString', 1])()(container)).toEqual([
        service,
        'someString',
        1,
      ]);
    });

    test('with object', () => {
      const service = new ServiceB({});

      const container = createContainer();
      container.set('someService', () => service);

      expect(createResolveValueFactory({ key1: 'someService', key2: { key3: ['someService'] } })()(container)).toEqual({
        key1: service,
        key2: { key3: [service] },
      });
    });

    test('with object without prototype', () => {
      const service = new ServiceB({});

      const container = createContainer();
      container.set('someService', () => service);

      const value: Record<string, unknown> = Object.create(null);
      // oxlint-disable-next-line functional/immutable-data
      value['key'] = 'someService';

      expect(createResolveValueFactory(value)()(container)).toEqual({ key: service });
    });

    test('with class instance', () => {
      const value = new ServiceB({ key: 'someService' });

      const container = createContainer();
      container.set('someService', () => new ServiceB({}));

      expect(createResolveValueFactory(value)()(container)).toBe(value);
      expect(value.config).toEqual({ key: 'someService' });
    });

    test.each([[1], [1.5], [true], [null], [undefined]])('with scalar %s', (value) => {
      expect(createResolveValueFactory(value)()(createContainer())).toBe(value);
    });
  });

  describe('integration with createContainerByConfigFactory', () => {
    test('without name', () => {
      const containerByConfigFactory = createContainerByConfigFactory({
        serviceA: { key: 'value' },
        serviceB: { key2: 'value2' },
        dependencies: {
          factories: new Map<string, ConfigFactory>([
            ['serviceA', serviceAFactory()],
            ['serviceB', serviceBFactory()],
          ]),
        },
      });

      const container = containerByConfigFactory();

      const serviceA = container.get<ServiceA>('serviceA');

      expect(serviceA).toBeInstanceOf(ServiceA);
      expect(serviceA.config).toEqual({ key: 'value' });
      expect(serviceA.serviceB).toBe(container.get<ServiceB>('serviceB'));
    });

    test('with names', () => {
      const containerByConfigFactory = createContainerByConfigFactory({
        serviceA: { read: { key: 'valueRead' }, write: { key: 'valueWrite' } },
        serviceB: { read: { key2: 'value2Read' }, write: { key2: 'value2Write' } },
        dependencies: {
          factories: new Map<string, ConfigFactory>([
            ['serviceAread', serviceAFactory('read')],
            ['serviceAwrite', serviceAFactory('write')],
            ['serviceBread', serviceBFactory('read')],
          ]),
        },
      });

      const container = containerByConfigFactory();

      const serviceARead = container.get<ServiceA>('serviceAread');

      expect(serviceARead.config).toEqual({ key: 'valueRead' });
      expect(serviceARead.serviceB).toBe(container.get<ServiceB>('serviceBread'));
      expect(serviceARead.serviceB.config).toEqual({ key2: 'value2Read' });

      const serviceAWrite = container.get<ServiceA>('serviceAwrite');

      expect(serviceAWrite.config).toEqual({ key: 'valueWrite' });
      expect(serviceAWrite.serviceB).toBeInstanceOf(ServiceB);
      expect(serviceAWrite.serviceB.config).toEqual({ key2: 'value2Write' });
    });
  });
});
