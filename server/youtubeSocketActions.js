const axios = require('axios');
require('dotenv').config();

const YT_API_KEY = process.env.YT_API_KEY;

module.exports.setYTSocketHost = (socket, hostName, activeSessions, io, deleteClosedSession) => {
  socket.on('hostAction', event => {
    io.to(hostName).emit('hostAction', event);
  });
  socket.on('disconnect', () => {
    setTimeout(() => {
      if(socket.disconnected) {
        deleteClosedSession(hostName);
      }
    }, 10000);
  })
  socket.on('sendInitStatus', data => {
    let target;
    if (data) {
      target = activeSessions[hostName].activeSockets[data.socketId];
    }
    if (target) {
      target.emit('initState', data);
    }
  })

  socket.on('sendSearchRequest', data => {
    console.log('search YouTube for ' + data.term);
    if(YT_API_KEY && data.mode === 'search') {
      axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          type: 'video',
          part: 'snippet',
          q: data.term,
          key: YT_API_KEY,
        }
      })
      .then(response => {
        console.log('response');
        socket.emit('gotSearchResults', {mode: 'search', items: response.data.items});
      })
      .catch(response => {
        console.log('Error in youtube search: ', response);
      })
    } else if (data.mode === 'id' && YT_API_KEY) {
      axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,id', 
          key: YT_API_KEY,
          id: data.term,
        }
      })
        .then(response => {
          socket.emit('gotSearchResults', {mode: 'id', items: response.data.items, videoId: data.term});
        })
        .catch(err => {
          socket.emit('log', err.data);
        })
    } else {
      socket.emit('gotSearchResults', {status: 'forbidden'});
    }
  })
}

module.exports.setYTSocketClient = (socket, hostName, targetSession, io, data) => {
  //nothing special yet
  // console.log('new youtube ')
  socket.hostName = hostName;
  socket.join(hostName);
  targetSession.activeSockets[socket.id] = socket;
  //console.log('Client attempting to initialize');
  try {
    targetSession.host.emit('findInitStatus', socket.id);
  } catch(err) {
    socket.emit('clientError');
  }

  socket.on('getInitState', () => {
    if(targetSession && targetSession.host) {
      targetSession.host.emit('findInitStatus', socket.id);
    }
  });
}
