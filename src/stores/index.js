import React, {useContext} from 'react';
import {MobXProviderContext, Observer} from 'mobx-react';

import createServerStore from './ServerStore';
import StorageSync from './@StorageSync';

export const serverStore = createServerStore();

export async function storeInit() {
  await serverStore.init();

  new StorageSync([
    { name: 'serverStore', store: serverStore },
  ]);
}

export const ServerStoreContext = React.createContext(serverStore);
export const StoreProvider = ({ children }) => {
  const serverStore = useContext(ServerStoreContext);

  return (
    <Observer>
      {() => (
        <MobXProviderContext.Provider
          value={{
            serverStore,
          }}
        >
          {children}
        </MobXProviderContext.Provider>
      )}
    </Observer>
  );
};

export const useStore = () => {
  const store = React.useContext(MobXProviderContext);
  if (!store) {
    throw new Error('Not found StoreProvider');
  }
  return store;
};
