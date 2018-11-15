const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT_NUM || 3000;

let host = null;
let hostAttempt = false;
let activeSockets = {};

let activeSessions = {};

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(express.static(__dirname + '/../client/dist'));

app.get('/test*', (req, res) => {
  res.sendFile(path.join(__dirname + '/../client/dist/devclient.html'));
})


io.on('connection', socket => {
  console.log('New socket connection');
  activeSockets[socket.id] = socket;
  socket.emit('initPing');
  socket.on('claimHost', () => {
    if (host) {
      socket.emit('hostConflict');
    } else {
      console.log('New host claimed')
      host = socket;
      setHostActions(host);
    }
  })
  socket.on('getClientStart', () => {
    console.log('Client attempting to initialize');
    if (host) {
      host.emit('findInitStatus', socket.id);
    }
  })
  socket.on('disconnect', () => {
    delete activeSockets[socket.id];
  })
});


const setHostActions = (newHost) => {
  newHost.on('hostAction', event => {
    io.emit('hostAction', event);
  });
  newHost.on('disconnect', () => {
    host = null;
    console.log('Host disconnected');
  })
  host.on('sendInitStatus', data => {
    let target = activeSockets[data.socketId];
    if (target) {
      target.emit('initState', data);
    }
  })
}

app.post('/host', (req, res) => {
  if(host || hostAttempt) {
    res.sendStatus(403);
  } else {
    hostAttempt = true;
    setTimeout(() => {hostAttempt = false}, 2000);
    res.sendStatus(200);
  }
})

app.get('/api/sessions', (req, res) => {
  if (host) {
    res.json([{sessionId: 'host'}]);
  } else {
    res.json([]);
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '../client/dist/index.html'));
});

http.listen(port, function() {
  console.log(`Listening on port ${port}`);
})

const makeNewSession = (host, hostName) => {
  let sessionInfo = {
    sessionHostId: host.id,
    host,
    hostName,
  }
  activeSession[host.id] = sessionInfo;
}