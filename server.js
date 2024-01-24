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

wss.on('connection', (ws) => {
  const ptyProcess = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on('data', (data) => {
    ws.send(data);
  });

  const sendNotice = (notice) => {
    ws.send(`notice:${notice}`);
  };
  ws.on('message', (msg) => {
    switch (msg.toString()) {
      case 'action:push': {
        const pushText = () => {
          ws.send(getLongText());
          ws.send('\r');
        };

        pushText();
        const id = setInterval(pushText, 2);
        intervalIds.push(id);
        sendNotice(`Push Count: ${intervalIds.length}`);
        break;
      }
      case 'action:clear': {
        clearIntervals();
        ptyProcess.write('clear\r');
        break;
      }
      default: {
        ptyProcess.write(msg);
      }
    }
  });

  ws.on('close', () => {
    clearIntervals();
    ptyProcess.kill();
  });
});
