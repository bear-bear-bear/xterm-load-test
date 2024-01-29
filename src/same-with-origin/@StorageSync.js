// import CryptoJS from 'crypto-js';
import LZUTF8 from 'lzutf8';
import { onSnapshot } from 'mobx-state-tree';

export default class StorageSync {
  stores = new Map();

  constructor(stores, checkSyncOn) {
    stores.forEach(({ name, store }) => {
    if (!store) throw new Error(`${name} has not been initialized`);

    const dispose = onSnapshot(store, snapshot => {
      if (!checkSyncOn || checkSyncOn()) {
        sessionStorage.setItem(
          `${name}`,
          LZUTF8.compress(JSON.stringify(snapshot), {
            outputEncoding: 'StorageBinaryString',
          }),
        );
      }
    });

    this.stores.set(name, {
      name,
      store,
      dispose,
    });
  });
  }

  static getSnapshot(name) {
    const snapshot = sessionStorage.getItem(`${name}`);
    if (snapshot) {
      try {
        return JSON.parse(
          LZUTF8.decompress(snapshot, {
            inputEncoding: 'StorageBinaryString',
          }),
        );
      } catch (e) {}
    }
    return undefined;
  }

  static setSnapshot(name, snapshot){
    sessionStorage.setItem(
      `${name}`,
      LZUTF8.compress(JSON.stringify(snapshot), {
        outputEncoding: 'StorageBinaryString',
      }),
    );
  }

  term = () => {
    this.stores.forEach(({ dispose }) => {
      dispose();
    });
  };
}
