const express = require('express');
const sockjs = require('sockjs');
const http = require('http');
const pty = require('node-pty');
const cors = require('cors');

const app = express();
const PORT = 8000;

// SockJS 서버 설정
const echo = sockjs.createServer({ prefix: '/echo' });

app.use(cors({ origin: true, credentials: true })); // 모든 요청에 대해 CORS를 활성화합니다.

const server = http.createServer(app);
echo.installHandlers(server, { prefix: '/echo' });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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

echo.on('connection', (conn) => {
  console.log('[Message] sockjs connected');

  const send = (content, type = 'normal') => {
    conn.write(converter.serialize({
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

  conn.on('data', (message) => {
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
          send('', 'notice');
          return;
        }
        default: {
          throw new Error(`Unknown action: ${content.toString()}`);
        }
      }
    }

    if (type === 'resize') {
      const { cols, rows } = content;
      ptyProcess.resize(cols, rows);
      return;
    }

    ptyProcess.write(content);
  });

  conn.on('close', () => {
    console.log('[Message] connection closed');
    clearIntervals();
    ptyProcess.kill();
  });
});
