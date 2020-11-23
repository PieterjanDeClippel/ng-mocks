// tslint:disable variable-name

import { EventEmitter, Injector, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { AnyType } from 'ng-mocks/dist/lib/common/core.types';

import { IMockBuilderConfig } from '../mock-builder/types';
import mockServiceHelper from '../mock-service/helper';

import ngMocksUniverse from './ng-mocks-universe';

const applyNgValueAccessor = (instance: Mock, injector?: Injector) => {
  if (injector && instance.__ngMocksConfig && instance.__ngMocksConfig.setNgValueAccessor) {
    try {
      const ngControl = (injector.get as any)(/* A5 */ NgControl, undefined, 0b1010);
      if (ngControl && !ngControl.valueAccessor) {
        ngControl.valueAccessor = instance;
      }
    } catch (e) {
      // nothing to do.
    }
  }
};

const applyOutputs = (instance: Mock & Record<keyof any, any>) => {
  const mockOutputs = [];
  for (const output of instance.__ngMocksConfig?.outputs || []) {
    mockOutputs.push(output.split(':')[0]);
  }

  for (const output of mockOutputs) {
    if (instance[output] || Object.getOwnPropertyDescriptor(instance, output)) {
      continue;
    }
    instance[output] = new EventEmitter<any>();
  }
};

const applyPrototype = (instance: Mock, prototype: AnyType<any>) => {
  for (const prop of [
    ...mockServiceHelper.extractMethodsFromPrototype(prototype),
    ...mockServiceHelper.extractPropertiesFromPrototype(prototype),
  ]) {
    const descriptor = mockServiceHelper.extractPropertyDescriptor(prototype, prop);
    /* istanbul ignore next */
    if (!descriptor) {
      continue;
    }
    Object.defineProperty(instance, prop, descriptor);
  }
};

const applyMethods = (instance: Mock, prototype: AnyType<any>) => {
  for (const method of mockServiceHelper.extractMethodsFromPrototype(prototype)) {
    if ((this as any)[method] || Object.getOwnPropertyDescriptor(this, method)) {
      continue;
    }
    mockServiceHelper.mock(instance, method);
  }
};

const applyProps = (instance: Mock, prototype: AnyType<any>) => {
  for (const prop of mockServiceHelper.extractPropertiesFromPrototype(prototype)) {
    if ((this as any)[prop] || Object.getOwnPropertyDescriptor(this, prop)) {
      continue;
    }
    mockServiceHelper.mock(instance, prop, 'get');
    mockServiceHelper.mock(instance, prop, 'set');
  }
};

export type ngMocksMockConfig = {
  config?: IMockBuilderConfig;
  outputs?: string[];
  setNgValueAccessor?: boolean;
  viewChildRefs?: Map<string, string>;
};

export class Mock {
  public readonly __ngMocksConfig?: ngMocksMockConfig;
  public readonly __ngMocksMock: true = true;

  public constructor(@Optional() injector?: Injector) {
    const mockOf = (this.constructor as any).mockOf;

    applyNgValueAccessor(this, injector);
    applyOutputs(this);
    applyPrototype(this, Object.getPrototypeOf(this));
    applyMethods(this, mockOf.prototype);
    applyProps(this, mockOf.prototype);

    // and faking prototype
    Object.setPrototypeOf(this, mockOf.prototype);

    const config = ngMocksUniverse.config.get(mockOf);
    if (config && config.init && config.init) {
      config.init(this, injector);
    }
  }
}
