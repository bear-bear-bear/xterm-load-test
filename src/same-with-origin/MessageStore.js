import {makeAutoObservable} from 'mobx';
import {types} from 'mobx-state-tree';

class MessageStore {
  maxMessages = 1000;
  _messages = [];
  start = 0;
  end = 0;
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  toValue() {
    return {};
  }

  addMessage(message) {
    this._messages[this.end] = message; // 메시지를 원형 버퍼의 끝 인덱스에 저장
    this.end = (this.end + 1) % this.maxMessages; // 끝 인덱스 순환

    if (this.count < this.maxMessages) {
      this.count++;
    } else {
      this.start = (this.start + 1) % this.maxMessages; // 시작 인덱스 순환
    }
  }

  get messages() {
    const result = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      result[i] = this._messages[(this.start + i) % this.maxMessages]; // 메시지를 순서대로 결과 배열에 저장
    }
    return result;
  }
}

export const MessageStoreModel = types.custom({
  name: 'MessageStoreModel',
  fromSnapshot() {
    return new MessageStore();
  },
  toSnapshot(value) {
    return value.toValue();
  },
  isTargetType(value) {
    return value instanceof MessageStore;
  },
  getValidationMessage(value) {
    return value && ''; // OK
  },
});
