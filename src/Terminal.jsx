import {useStore} from './stores';
import {useEffect, useState} from 'react';
import {Terminal as XTerminal} from 'xterm';
import {WebLinksAddon} from 'xterm-addon-web-links';
import {observer} from 'mobx-react';
import 'xterm/css/xterm.css';
import './Terminal.css';

const webLinksAddon = new WebLinksAddon();

const Terminal = observer(() => {
  const { serverStore: { session } } = useStore();
  const [terminalNode, setTerminalNode] = useState(null);
  const [terminal, setTerminal] = useState(null);

  const initTerminal = (onDone) => {
    if (!terminalNode) return;
    if (terminal) terminal.dispose();

    const newTerminal = new XTerminal({
      cursorBlink: true,
      cols: 80,
      rows: 30,
    });
    newTerminal.open(terminalNode);
    newTerminal.loadAddon(webLinksAddon);

    setTerminal(newTerminal);
    onDone?.(newTerminal);
  };

  const init = async () => {
    await session.connect();

    initTerminal((newTerminal) => {
      attachWS(newTerminal, session.socket, session.send);
    });
  }

  useEffect(() => {
    if (terminalNode) {
      init();
    }
  }, [terminalNode]);

  return (
    <>
      <p>Connected: {session.connected.toString()}</p>

      <div className="toolbar">
        <div>
          <button onClick={() => session.send('push', 'action')}>Push(appendable)</button>
          <button onClick={() => session.send('clear', 'action')}>Clear</button>

          <span id="notice">{session.notice}</span>
        </div>
        <div>
          <button onClick={async () => {
            initTerminal(async (terminal) => {
              await session.reconnect();
              attachWS(terminal, session.socket, session.send);
              terminal.writeln('** Reconnected **');
            });
          }}>
            Reconnect
          </button>
        </div>
      </div>

      <div ref={setTerminalNode} />
    </>
  );
})

export default Terminal;

function attachWS(terminal, ws, handleData) {
  if (ws.readyState !== WebSocket.OPEN) {
    ws.onopen = () => {
      terminal.onData(handleData);
    };
  } else {
    terminal.onData(handleData);
  }
  ws.onmessage = ({ data }) => {
    // type - 'normal' | 'notice'
    const { type, content } = JSON.parse(data);

    if (type === 'notice') {
      return;
    }

    terminal.write(content);
  };
  ws.onclose = () => {
    terminal.writeln('\r** Connection closed **');
  };
}
