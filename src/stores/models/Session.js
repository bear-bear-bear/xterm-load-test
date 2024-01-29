import {flow, types} from 'mobx-state-tree';
import {MessageStoreModel} from './MessageStore';
import {createObjectModel} from './Object';

const converter = {
  serialize: (data) => {
    return JSON.stringify(data);
  },
  deserialize: (data) => {
    return JSON.parse(data);
  },
}

export const Session = types
  .model('Session', {
    messageStore: types.optional(MessageStoreModel, {}),
    socketWrapper: types.optional(createObjectModel(), {}),
    notice: types.optional(types.string, ''),
    connected: types.optional(types.boolean, false),
  })
  .views(self => ({
    get socket() {
      return self.socketWrapper.value.socket;
    },
  }))
  .actions(self => {
    const setNotice = (str) => {
      self.notice = str;
    };
    const setConnected = (bool) => {
      self.connected = bool;
    };
    const send = (content, type = 'normal') => {
      if (!self.socket) return;

      const data = converter.serialize({
        content,
        type,
      });

      if (self.socket.readyState === WebSocket.OPEN) {
        self.socket.send(data);
      } else {
        self.socket.addEventListener('open', () => send(data), {
          once: true,
        });
      }
    };

    return {
      setNotice,
      setConnected,
      send,
    };
  })
  .actions(self => {
    const push = () => {
      self.send('push', 'action');
    }
    const clear = () => {
      self.send('clear', 'action');
      self.setNotice('');
    }

    return {
      push,
      clear
    };
  })
  .actions(self => {
    const connect = flow(function* () {
      yield new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:8000`);

        self.socketWrapper.setValue({
          socket: ws,
        });

        ws.addEventListener(
          'open',
          () => {
            self.setConnected(true);
            resolve();
          },
          { once: true },
        );

        ws.addEventListener(
          'close',
          () => {
            self.setConnected(false);
            console.debug('SSH closed');
          },
          { once: true },
        );

        ws.addEventListener('message', ({ data }) => {
          // type - 'normal' | 'notice'
          const { type, content } = converter.deserialize(data);

          if (type === 'notice') {
            self.setNotice(content);
            return;
          }

          self.messageStore.addMessage(content);
        });
      });
    });

    const close = () => {
      if (!self.socket) return;
      if ([WebSocket.CLOSING, WebSocket.CLOSED].includes(self.socket.readyState)) {
        return;
      }
      self.setNotice('');
      self.socket.close();
    };

    return {
      connect,
      close,
    };
  })
  .actions(self => {
    const reconnect = flow(function* () {
      yield new Promise((resolve) => {
        self.setNotice('');
        self.close();
        self.connect().then(resolve);
      });
    });

    return {
      reconnect,
    };
  });