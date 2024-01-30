import {Session} from './models/Session';
import {types} from 'mobx-state-tree';

export const ServerStore = types
  .model('ServerStore', {
    sessions: types.optional(types.array(Session), []),
    activatedSessionId: types.maybe(types.string),
  })
  .views(self => ({
    get activatedSession() {
      return self.sessions.find((session) => session.id === self.activatedSessionId);
    },
  }))
  .actions(self => {
    const setActivatedSession = (id) => {
      self.activatedSessionId = id;
    };
    const _pushSession = (v) => {
      self.sessions.push(v);
    };

    return {
      setActivatedSession,
      _pushSession,
    };
  })
  .actions(self => {
    const addSession = async () => {
      const session = Session.create({ id: Date.now().toString() });
      await session.connect();

      self._pushSession(session);
      self.setActivatedSession(session.id);
    };

    return {
      addSession,
    }
  })
  .actions(self => {
    const init = async () => {
        await self.addSession();

        window.onbeforeunload = () => {
          self.sessions.forEach((session) => {
            session.socket?.close();
          });
        };
    };

    return {
      init,
    };
  });

export default function createServerStore() {
  return ServerStore.create({});
}
