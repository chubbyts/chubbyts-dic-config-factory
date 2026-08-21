# chubbyts-dic-config-factory

[![CI](https://github.com/chubbyts/chubbyts-dic-config-factory/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-dic-config-factory/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-dic-config-factory/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-dic-config-factory?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-dic-config-factory%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-dic-config-factory/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-dic-config-factory.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic-config-factory&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic-config-factory)

## Description

An abstract service factory for the dependency injection container, usable with [@chubbyts/chubbyts-dic-config][2],
inspired by [chubbyphp-laminas-config-factory][5].

It reduces the boilerplate within config based service factories:

 * `resolveConfig`: resolves the (named) config of the current service
 * `resolveDependency`: resolves a dependency via the container if present, or creates it via the given abstract factory
 * `resolveValue`: resolves a value, replacing strings (recursively within arrays / objects) by matching services

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-dic-types][4]: ^2.3.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-dic-config-factory][1].

```ts
npm i @chubbyts/chubbyts-dic-config-factory@^1.0.0
```

## Usage

### Factory

```ts
import { createAbstractFactory } from '@chubbyts/chubbyts-dic-config-factory/dist/dic-config-factory';
import { ServiceA } from '../service/service-a';
import type { Config } from '../config';
import { serviceBFactory } from './service-b-factory';

export const serviceAFactory = createAbstractFactory((container, { resolveConfig, resolveDependency }): ServiceA => {
  return new ServiceA(
    resolveConfig(container.get<Config>('config').serviceA ?? {}),
    resolveDependency(container, 'serviceB', serviceBFactory),
  );
});
```

### With [@chubbyts/chubbyts-dic-config][2]

```ts
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { ServiceA } from './service/service-a';
import { serviceAFactory } from './factory/service-a-factory';
import { serviceBFactory } from './factory/service-b-factory';

const containerByConfigFactory = createContainerByConfigFactory({
  serviceA: { key: 'value' },
  serviceB: { key2: 'value2' },
  dependencies: {
    factories: new Map([
      ['serviceA', serviceAFactory()],
      ['serviceB', serviceBFactory()],
    ]),
  },
});

const container = containerByConfigFactory();

const serviceA = container.get<ServiceA>('serviceA');
```

### With names

The same abstract factory can be reused for multiple services of the same kind, for example a `read` and a `write`
database connection. The given name resolves the related sub config (`resolveConfig`) and gets appended to the id of
each dependency (`resolveDependency`).

```ts
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { ServiceA } from './service/service-a';
import { serviceAFactory } from './factory/service-a-factory';
import { serviceBFactory } from './factory/service-b-factory';

const containerByConfigFactory = createContainerByConfigFactory({
  serviceA: { read: { key: 'valueRead' }, write: { key: 'valueWrite' } },
  serviceB: { read: { key2: 'value2Read' }, write: { key2: 'value2Write' } },
  dependencies: {
    factories: new Map([
      ['serviceAread', serviceAFactory('read')],
      ['serviceAwrite', serviceAFactory('write')],
      ['serviceBread', serviceBFactory('read')],
      ['serviceBwrite', serviceBFactory('write')],
    ]),
  },
});

const container = containerByConfigFactory();

const serviceARead = container.get<ServiceA>('serviceAread');
const serviceAWrite = container.get<ServiceA>('serviceAwrite');
```

## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
[5]: https://github.com/chubbyphp/chubbyphp-laminas-config-factory
