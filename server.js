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
const LONG_TEXT = Array.from({ length: 200000 }, () => 'PUSH PULL 두비두바').join(' ');

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

  ws.on('message', (msg) => {
    switch (msg.toString()) {
      case 'action:push': {
        const pushText = () => {
          ws.send(LONG_TEXT);
          ws.send('\r');
        };

        pushText();
        const id = setInterval(pushText, 100);
        intervalIds.push(id);

        const notice = `Push Count: ${intervalIds.length}`;
        ws.send(`notice:${notice}`);
        break;
      }
      case 'action:clear': {
        clearIntervals();
        ptyProcess.write('clear\r');

        ws.send(`notice:`);
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
