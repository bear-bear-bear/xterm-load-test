import { makeAutoObservable, toJS } from 'mobx';
import { types } from 'mobx-state-tree';

class ObjectClass {
  value = {}

  constructor(value) {
    makeAutoObservable(this);
    this.setValue(value);
  }

  setValue(value) {
    this.value = value || {};
  }

  toValue() {
    return toJS(this.value);
  }
}

export function createObjectModel() {
  return types.custom({
    name: 'ObjectModel',
    fromSnapshot(value) {
      return new ObjectClass(value);
    },
    toSnapshot(value) {
      return value.toValue();
    },
    isTargetType(value) {
      return value instanceof ObjectClass;
    },
    getValidationMessage(value) {
      return value && '';
    },
  });
}
