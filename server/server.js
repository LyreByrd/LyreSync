const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const url = require('url');
// const React = require('react');
// const { renderToString } = require('react-dom/server');
// const ClientWindow = require('./../client/transpiled/clientwindow.js').default;
// const HostWindow = require('./../client/transpiled/hostwindow.js').default;
require('dotenv').config();
let config;
try {
  config = require('../config.js');
} catch (err) {
  config = {};
}


const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const socketPort = config.SOCKET_PORT || 3000;
const apiPort = config.PORT_NUM || 3000;

let activeSessions = {};

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(express.static(__dirname + '/../client/dist'));

// app.use((req, res, next) => {
//   console.log(req.url);
//   next();
// })

app.get('/test*', (req, res) => {
  if (process.env.ALLOW_TEST) {
    res.sendFile(path.join(__dirname + '/../client/dist/devclient.html'));
  } else {
    res.sendFile(path.join(__dirname + '/../client/dist/index.html'));
  }
})

app.get('/secret', (req, res) => {
  res.send(process.env.SECRET_ENV_VAR);
});

app.get('/duplex', (req, res) => {
  if (process.env.ALLOW_DUPLEX) {
    res.sendFile(path.join(__dirname + '/../client/dist/fakeplayerwindow.html'))
  } else {
    res.sendFile(path.join(__dirname + '/../client/dist/index.html'));
  }
})
app.get('/api/player/host/', (req, res) => {
  //console.log('host player request to ' + req.url);
  const scriptPath = path.resolve(__dirname, '..', 'client', 'dist', 'hostwindow-bundle.js');

  fs.readFile(scriptPath, 'utf8', (err, js) => {
    res.send(js);
  });
});

app.get('/api/player/client/', (req, res) => {
  //console.log('client player request to ' + req.url);
  const scriptPath = path.resolve(__dirname, '..', 'client', 'dist', 'clientwindow-bundle.js');
  //console.log('client script path: ' + scriptPath);
  fs.readFile(scriptPath, 'utf8', (err, js) => {
    if (err) {
      res.send(err)
    } else {
      res.send(js);
    }
  });
});

//app.get('/api/player/host/:hostName', (req, res) => {
//  const htmlPath = path.resolve(__dirname, '..', 'client', 'dist', 'fakeplayerwindow.html');
//
//  fs.readFile(htmlPath, 'utf8', (err, html) => {
//    const rootElem = '<div id="player-window">';
//    const renderedApp = renderToString(
//      React.createElement(HostWindow, {
//        resetToLobby: () => {console.log('would boot from lobby')},
//        hostingName: req.params.hostName,
//      }));
//    //res.send(html)
//    res.send(html.replace(rootElem, rootElem + renderedApp));
//  });
//})

io.on('connection', socket => {
  //console.log('New socket connection');
  
  socket.emit('initPing');
  socket.on('claimHost', (hostingName) => {
    //console.log('New host claimed: ' + hostingName);
    try {
      socket.join(hostingName);
      //console.log('joins room')
      activeSessions[hostingName].host = socket;
      //console.log('starts session in object');
      setHostActions(socket, hostingName);
      //console.log('gets host actions');
    } catch (err) {
      socket.emit('hostingError', err);
      socket.disconnect();
    }
  })
  socket.on('getClientStart', (sessionHost) => {
    let target = activeSessions[sessionHost];
    if(target) {
      socket.hostName = sessionHost;
      socket.join(sessionHost);
      target.activeSockets[socket.id] = socket;
      //console.log('Client attempting to initialize');
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
<<<<<<< HEAD
  //console.log('requested host name: ', req.body.hostingName);
=======
  //req.body.hostingName
>>>>>>> 5feab37a83078abee72db78b50b25a38b847dacd
  if(isInvalidName(req.body.hostingName) || activeSessions[req.body.hostingName] || !req.body.hostingName) {
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
  res.sendFile(path.join(__dirname + '/../client/dist/index.html'));
});

app.listen(apiPort, function() {
  console.log(`Listening for http on port ${apiPort}`);
})

http.listen(socketPort, function() {
  console.log(`Listening on port ${socketPort}`);
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
    //console.log('Deleting session hosted by ' + hostName);
  }
}

const isInvalidName = (string) => {
  //console.log('checking name');
  for(let i = 0; i < string.length; i++) {
    let asciiNum = string.charCodeAt(i);
    //console.log(typeof asciiNum, asciiNum);
    if(isNiceAscii(asciiNum) === false) {
      return true;
    }
  }
  return false;
}
const isNiceAscii = (ascii) => {
  if (48 <= ascii && ascii <= 90) {
    return true;
  } 
  if (97 <= ascii && ascii <= 122){
    return true;
  }
  return false;
}

/* may switch 
to this implementation later
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