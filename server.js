const express = require('express');
const sockjs = require('sockjs');
const http = require('http');
const pty = require('node-pty');
const cors = require('cors');

const app = express();
const PORT = 8000;

// SockJS 서버 설정
const echo = sockjs.createServer();

app.use(cors({ origin: true, credentials: true }));

const server = http.createServer(app);
echo.installHandlers(server, { prefix: '/echo' });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 모든 연결을 추적하는 배열
const connections = [];
const chars = '                         abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const getRandomChar = () => chars[Math.floor(Math.random() * chars.length)];
const getLongText = () => Array.from({ length: 1000 }, getRandomChar).join('');
// push 액션 인터벌 목록
let intervalIds = [];
const clearIntervals = () => {
  intervalIds.forEach(clearInterval);
  intervalIds = [];
}

// 단일 pty 인스턴스 생성
const ptyProcess = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

const converter = {
  serialize: (data) => {
    return JSON.stringify(data);
  },
  deserialize: (data) => {
    return JSON.parse(data);
  },
}

const send = (content, type = 'normal') => {
  // 모든 연결에 데이터 브로드캐스트
  connections.forEach((conn) => {
    conn.write(converter.serialize({
      content,
      type,
    }));
  });
};

ptyProcess.on('data', (data) => {
  send(data);
});

echo.on('connection', (conn) => {
  connections.push(conn); // 새 연결을 배열에 추가
  console.log('[Message] some connection connected, current connections:', connections.length);

  conn.on('data', (message) => {
    const { content, type } = converter.deserialize(message);

    if (type === 'resize') {
      const { cols, rows } = content;
      ptyProcess.resize(cols, rows);
      return;
    }

    if (type === 'action') {
      if (content === 'push') {
        const pushText = () => {
          send(getLongText());
          send('\r');
        };

        pushText();
        const id = setInterval(pushText, 2);
        intervalIds.push(id);

        console.log('[Action] push');
        const noticeMsg = `Push Count: ${intervalIds.length}`;
        console.log(noticeMsg);
        send(noticeMsg, 'notice');
        return;
      }
      if (content === 'clear') {
        clearIntervals();
        ptyProcess.write('clear\r');
        console.log('[Action] clear')
        send('', 'notice');
        return;
      }
    }

    ptyProcess.write(content);
  });

  conn.on('close', () => {
    console.log('[Message] some connection closed, current connections:', connections.length - 1);
    // 연결이 닫힐 때 해당 연결 제거
    const index = connections.indexOf(conn);
    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
});
