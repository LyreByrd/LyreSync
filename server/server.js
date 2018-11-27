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
const socketPort = config.SOCKET_PORT || 9001;
const apiPort = config.PORT_NUM || 1234;

let activeYTSessions = {};

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
  socket.on('claimHost', data => {
    //console.log('New host claimed: ' + hostingName);
    try {
      socket.join(data.host);
      //console.log('joins room')
      if (data.service !== 'youtube') {
        throw new Error('no such service')
      }
      activeYTSessions[data.host].host = socket;
      //console.log('starts session in object');
      setHostActions(socket, data.host);
      //console.log('gets host actions');
    } catch (err) {
      socket.emit('hostingError', err);
      socket.disconnect();
    }
  })
  socket.on('getClientStart', ({sessionHost, service}) => {
    let target 
    if (service === 'youtube') {
      target = activeYTSessions[sessionHost];
    }
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
    } else {
      socket.emit('clientError');
    }
  })
  socket.on('disconnect', () => {
    let targetSession = activeYTSessions[socket.hostName];
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
    let target = activeYTSessions[hostName].activeSockets[data.socketId];
    if (target) {
      target.emit('initState', data);
    }
  })
}

app.post('/host', (req, res) => {
  //console.log('requested host name: ', req.body.hostingName);
  if(isInvalidName(req.body.hostingName) || activeYTSessions[req.body.hostingName] || !req.body.hostingName) {
    res.sendStatus(403);
  } else {
    let hostName = req.body.hostingName;
    makeNewSession(hostName);
    setTimeout(() => {
      if(activeYTSessions[hostName] && activeYTSessions[hostName].host === null) {
        deleteClosedSession(hostName);
      }
    }, 5000);
    res.status(201).send({hostName});
  }
})

app.get('/api/sessions', (req, res) => {
  let hostedSessions = Object.keys(activeYTSessions);
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
  activeYTSessions[hostName] = sessionInfo;
}

const deleteClosedSession = (hostName) => {
  let closingSession = activeYTSessions[hostName];
  if (closingSession) {
    Object.keys(closingSession.activeSockets).forEach(socketId => {
      let socket = closingSession.activeSockets[socketId];
      socket.emit('sessionDeleting');
      socket.disconnect();
    });
    delete activeYTSessions[hostName];
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
  let session = activeYTSessions[hostName];
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
        activeYTSessions[hostingName].host = socket;
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