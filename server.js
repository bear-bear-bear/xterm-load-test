const express = require('express');
const { Server } = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - http://localhost:${PORT}`);
});
const wss = new Server({ server });

let intervalIds = [];
const clearIntervals = () => {
  intervalIds.forEach(clearInterval);
  intervalIds = [];
}

const getLongText = () => Array.from({ length: 1000 }, () => Math.random() * 100).join(' ');

const converter = {
  serialize: (data) => {
    return JSON.stringify(data);
  },
  deserialize: (data) => {
    return JSON.parse(data);
  },
}

wss.on('connection', (ws) => {
  const send = (content, type = 'normal') => {
    // type - 'normal' | 'notice'
    ws.send(converter.serialize({
      content,
      type,
    }));
  };

  const ptyProcess = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on('data', (data) => {
    send(data);
  });

  ws.on('message', (message) => {
    // type - 'normal' | 'action'
    const { content, type } = converter.deserialize(message);

    if (type === 'action') {
      switch (content.toString()) {
        case 'push': {
          const pushText = () => {
            send(getLongText());
            send('\r');
          };

          pushText();
          const id = setInterval(pushText, 2);
          intervalIds.push(id);

          const noticeMsg = `Push Count: ${intervalIds.length}`;
          console.log(noticeMsg);
          send(noticeMsg, 'notice');
          return;
        }
        case 'clear': {
          clearIntervals();
          ptyProcess.write('clear\r');
          return;
        }
        default: {
          throw new Error(`Unknown action: ${content.toString()}`);
        }
      }
    }

    ptyProcess.write(content);
  });

  ws.on('close', () => {
    clearIntervals();
    ptyProcess.kill();
  });
});
