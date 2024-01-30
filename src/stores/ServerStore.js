import {Session} from './models/Session';
import {types} from 'mobx-state-tree';

export const ServerStore = types
  .model('ServerStore', {
    session: types.optional(Session, {}),
  })
  .actions(self => {
    const _setSession = (session) => {
      self.session = session;
    };

    return {
      _setSession,
    };
  })
  .actions(self => {
    const init = () => {
        const session = Session.create();
        self._setSession(session);

        window.addEventListener('beforeunload', () => {
          session.socket?.close();
        })
    };

    return {
      init,
    };
  });

export default function createServerStore() {
  return ServerStore.create({});
}
