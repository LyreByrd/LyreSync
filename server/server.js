const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT_NUM || 3000;

let activeSessions = {};

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(express.static(__dirname + '/../client/dist'));

app.get('/test*', (req, res) => {
  res.sendFile(path.join(__dirname + '/../client/dist/devclient.html'));
})


io.on('connection', socket => {
  console.log('New socket connection');
  
  socket.emit('initPing');
  socket.on('claimHost', (hostingName) => {
    console.log('New host claimed: ' + hostingName);
    try {
      socket.join(hostingName);
      activeSessions[hostingName].host = socket;
      setHostActions(socket, hostingName);
    } catch (err) {
      socket.emit('hostingError');
      socket.disconnect();
    }
  })
  socket.on('getClientStart', (sessionHost) => {
    let target = activeSessions[sessionHost];
    if(target) {
      socket.hostName = sessionHost;
      socket.join(sessionHost);
      target.activeSockets[socket.id] = socket;
      console.log('Client attempting to initialize');
      try {
        target.host.emit('findInitStatus', socket.id);
      } catch(err) {
        socket.emit('clientError');
      }
    }
  })
  socket.on('disconnect', () => {
    let targetSession = activeSessions[socket.hostName];
    if(targetSession) {
      delete targetSession.activeSockets[socket.id]
    }
  })
});


const setHostActions = (newHost, hostName) => {
  newHost.on('hostAction', event => {
    io.to(hostName).emit('hostAction', event);
  });
  newHost.on('disconnect', () => {
    setTimeout(() => {
      if(newHost.disconnected) {
        deleteClosedSession(hostName);
      }
    }, 10000);
  })
  newHost.on('sendInitStatus', data => {
    let target = activeSessions[hostName].activeSockets[data.socketId];
    if (target) {
      target.emit('initState', data);
    }
  })
}

app.post('/host', (req, res) => {
  //req.body.hostingName
  if(activeSessions[req.body.hostingName] || !req.body.hostingName) {
    res.sendStatus(403);
  } else {
    let hostName = req.body.hostingName;
    makeNewSession(hostName);
    setTimeout(() => {
      if(activeSessions[hostName] && activeSessions[hostName].host === null) {
        deleteClosedSession(hostName);
      }
    }, 5000);
    res.status(201).send({hostName});
  }
})

app.get('/api/sessions', (req, res) => {
  let hostedSessions = Object.keys(activeSessions);
  if(hostedSessions) {
    hostedSessions = hostedSessions.map(key => ({sessionHost: key}));
  } else {
    hostedSessions = [];
  }
  res.json(hostedSessions);
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '../client/dist/index.html'));
});

http.listen(port, function() {
  console.log(`Listening on port ${port}`);
})

const makeNewSession = (hostName) => {
  //let nsp = io.of(`/${hostName}`);
  //nsp.on('connection', socket => {
  //  console.log(`namespace ${hostName} being connected`);
  //  setNamespaceActions(socket, hostName, nsp);
  //})
  let sessionInfo = {
    //sessionSpace: nsp, 
    activeSockets: {},
    host: null,
    hostName,
  }
  activeSessions[hostName] = sessionInfo;
}

const deleteClosedSession = (hostName) => {
  let closingSession = activeSessions[hostName];
  if (closingSession) {
    Object.keys(closingSession.activeSockets).forEach(socketId => {
      let socket = closingSession.activeSockets[socketId];
      socket.emit('sessionDeleting');
      socket.disconnect();
    });
    delete activeSessions[hostName];
    console.log('Deleting session hosted by ' + hostName);
  }
}

/* may switch to this implementation later
const setNamespaceActions = (socket, hostName, nsp) => {
  console.log('namespace actions being set for ' + hostName)
  let session = activeSessions[hostName];
  if(!session) {
    socket.emit('invalidSession');
    socket.close();
  } else {
    session.activeSockets[socket.id] = socket;
    socket.emit('initPing');
    socket.on('claimHost', (event) => {
      console.log('claimHost fired. Event: ',event)
      let hostingName = event;
      console.log('New host claimed');
      try {
        activeSessions[hostingName].host = socket;
        setHostActions(socket, hostingName, nsp);
      } catch (err) {
        console.log('host error', err)
        socket.emit('hostingError');
      }
    })
    socket.on('getClientStart', () => {
      console.log('Client attempting to initialize');
      if (host) {
        host.emit('findInitStatus', socket.id);
      }
    })
    socket.on('disconnect', () => {
      delete session.activeSockets[socket.id];
    })
  }
}
*/