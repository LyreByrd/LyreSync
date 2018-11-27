const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const url = require('url');
const ytSocketActions = require('./youtubeSocketActions.js');
// const React = require('react');
// const { renderToString } = require('react-dom/server');
// const ClientWindow = require('./../client/ranspiled/clientwindow.js').default;
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

const services = ['youtube'];
const validServices = {};
const activeSessions = {};

services.forEach(service => { 
  validServices[service] = true;
})

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
      let target = activeSessions[data.host];
      if (!target) {
        throw new Error('no such session');
      }
      if (target.service !== data.service) {
        throw new Error('service type mismatch');
      }
      activeSessions[data.host].host = socket;
      if (data.service === 'youtube'){
        ytSocketActions.setYTSocketHost(socket, data.host, activeSessions, io, deleteClosedSession);
      }
      //console.log('starts session in object');
      //console.log('gets host actions');
    } catch (err) {
      socket.emit('hostingError', err);
      socket.disconnect();
    }
  })
  socket.on('getClientStart', ({sessionHost, service}) => {
    let target = activeSessions[sessionHost];
    if(target && target.service === service) {
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
    let targetSession = activeSessions[socket.hostName];
    if(targetSession) {
      delete targetSession.activeSockets[socket.id];
    }
  })
});

//no-params route uses youtube, for backwards compatibility
app.post('/host', (req, res) => {
  //console.log('requested host name: ', req.body.hostingName);

  // default service is youtube for backwards compatibility
  let service = req.body.service || 'youtube';

  console.log(`${req.body.hostingName} attempting to host with ${service}`);

  if(validServices[service] !== true) {
    console.log('invalid service');
    res.status(400).send(`Service "${service}" not supported`);
  } else if (!req.body.hostingName || isInvalidName(req.body.hostingName) || activeSessions[req.body.hostingName]) {
    res.sendStatus(403);
  } else {
    try {
      let hostName = req.body.hostingName;
      makeNewSession(hostName, service);
      setTimeout(() => {
        if(activeSessions[hostName] && activeSessions[hostName].host === null) {
          deleteClosedSession(hostName);
        }
      }, 5000);
      res.status(201).send({hostName});
    } catch (err) {
      res.status(500).send();
    }
  }
})


app.get('/api/sessions', (req, res) => {
  let hostedSessions = [];
  let hosts = Object.keys(activeSessions);
  hosts.forEach(sessionHost => {
    hostedSessions.push({sessionHost, service: activeSessions[sessionHost].service})
  });
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

const makeNewSession = (hostName, service) => {
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
    service,
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
  if (!string) {
    return true;
  }
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
  let session = activeSessions.youtube[hostName];
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
        activeSessions.youtube[hostingName].host = socket;
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