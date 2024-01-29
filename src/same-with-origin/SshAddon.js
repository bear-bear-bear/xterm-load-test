const converter = {
  serialize: (data) => {
    return JSON.stringify(data);
  },
  deserialize: (data) => {
    return JSON.parse(data);
  },
}

class TerminalNotMountedError extends Error {
  constructor() {
    super('Terminal does not mounted');
  }
}

export default class SshAddon {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(socket, options = {}) {
    this._disposableEvents = [];
    this._eventListeners = new Map();
    this._resizeEventListeners = [];
    this._dataListeners = [];
    this._socket = socket;
    // if (options.terminalType) {
    //   this._terminalType = options.terminalType;
    // }
    if (options.onMessage) {
      this._eventListeners.set('message', [options.onMessage]);
    }
    if (options.onError) {
      this._eventListeners.set('error', [options.onError]);
    }
    if (options.onClose) {
      this._eventListeners.set('close', [options.onClose]);
    }
    if (options.onResize) {
      this._resizeEventListeners.push(options.onResize);
    }
    if (options.onData) {
      this._dataListeners.push(options.onData);
    }
  }
  static _getSize(terminal) {
    if (!terminal.element) {
      throw new TerminalNotMountedError();
    }
    return {
      cols: terminal.cols,
      rows: terminal.rows,
      pixelWidth: terminal.element.clientWidth,
      pixelHeight: terminal.element.clientHeight,
    };
  }
  activate(terminal) {
    /* Execute when xterm mount */
    this._terminal = terminal;
    this._disposableEvents.push(
      terminal.onResize(this._onResize.bind(this)),
      addSocketListener(this._socket, 'message', this._onMessage.bind(this)),
      addSocketListener(this._socket, 'error', this._onError.bind(this)),
      addSocketListener(this._socket, 'close', this.dispose.bind(this)),
    );
  }
  dispose() {
    /* Execute when xterm unmount */
    this.removeAllListeners();
    if (this._socket.readyState !== WebSocket.CLOSED || this._socket.readyState !== WebSocket.CLOSING) {
      this._notifyListeners('close', new Event('close'));
    }
    for (const d of this._disposableEvents) {
      d.dispose();
    }
  }
  /*
   * # NOTE
   * vi, vim 등을 실행 시 xtermjs 자체적으로 특정 ANSI 코드를 onData 리스너에 트리거 하며,
   * 이는 서버 측에서 echo 시키지 않아 (socket 응답으로 되돌려 보내지 않아) 화면에 쓰여지지 않고 messageStore 에도 저장되지 않음.
   * 헌데 vi 또는 vim 의 실행 이력이 messageStore 에 있을 경우, 이를 터미널에 초기화(write) 시키는 과정에서 마치 해당 명령어를 실행한 것과 같이 ANSI 코드를 onData 에 트리거 하는 문제가 있음.
   * 이때는 서버 측에서 이를 평문 입력으로 취급하여 echo 시켜버리며 (socket 응답으로 되돌려줌), 화면에 쓰여지고 스토어에도 누적되어버림.
   * 해서 sshAddon 의 socket send 를 담당하는 리스너를 messageStore 의 내용을 터미널에 모두 반영 시킨 후에야 수동 바인딩하도록 해서
   * 위와 같은 문제 발생을 원천 차단시킴
   *
   * 관련 이슈 - https://chequer.atlassian.net/browse/QP-4713
   */
  readyToInput(terminal) {
    this._disposableEvents.push(terminal.onData(this._onData.bind(this)));
  }
  addEventListener(event, callback) {
    if (event === 'data') {
      this._dataListeners.push(callback);
    } else {
      if (this._eventListeners.has(event)) {
        const listeners = this._eventListeners.get(event);
        this._eventListeners.set(event, listeners.concat(callback));
      } else {
        this._eventListeners.set(event, [callback]);
      }
    }
  }
  removeEventListener(event, callback) {
    if (event === 'data') {
      this._dataListeners = this._dataListeners.filter(listener => listener !== callback);
    } else {
      const listeners = this._eventListeners.get(event);
      if (!listeners) {
        return;
      }
      this._eventListeners.set(
        event,
        listeners.filter(listener => listener !== callback),
      );
    }
  }
  removeAllListeners() {
    this._eventListeners = new Map();
  }
  _onError(error) {
    this._notifyListeners('error', error);
    // this.dispose();
  }
  _onData(data) {
    this._notifyListeners('data', data);
    this._send(
      converter.serialize({
        type: 'normal',
        content: data,
      }),
    );
  }
  _onMessage(event) {
    this._notifyListeners('message', event);
    const { content, type } = converter.deserialize(event.data);
    switch (type) {
      case 'normal':
        this._terminal?.write(content);
        break;
      default:
        break;
    }
  }
  _onResize(event) {
    if (!this._terminal) {
      throw new TerminalNotMountedError();
    }
    this._notifyListeners('resize', event);
    this._send(
      converter.serialize({
        type: 'resize',
        content: SshAddon._getSize(this._terminal),
      }),
    );
  }
  _send(message) {
    if (this._socket.readyState === WebSocket.OPEN) {
      this._socket.send(message);
    } else {
      this._socket.addEventListener('open', () => this._send(message), {
        once: true,
      });
    }
  }
  _notifyListeners(event, data) {
    switch (event) {
      case 'data':
        this._dataListeners.forEach(listener => {
          listener(data);
        });
        break;
      case 'resize':
        this._resizeEventListeners.forEach(listener => {
          listener(data);
        });
        break;
      default:
        const listeners = this._eventListeners.get(event);
        if (listeners) {
          listeners.forEach(listener => {
            listener(data);
          });
        }
    }
  }
}
function addSocketListener(socket, type, handler) {
  socket.addEventListener(type, handler);
  return {
    dispose: () => {
      if (!handler) {
        return;
      }
      socket.removeEventListener(type, handler);
    },
  };
}
