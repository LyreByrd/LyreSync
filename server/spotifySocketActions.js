
require('dotenv').config();
const axios = require('axios');

let dev_playlists; 
const DEV_TOKEN = process.env.DEV_TOKEN;
const IS_DEV = process.env.IS_DEV === 'true';
const PROXY_URL = process.env.PROXY_URL || 'localhost';
const PROXY_PORT = process.env.PROXY_PORT || 3000;

module.exports.setSpotifyHostSocket = (socket, hostName, activeSessions, io, deleteClosedSession, initData) => {
  //console.log('socket hosting Spotify at ' + hostName);
  socket.on('disconnect', () => {
    setTimeout(() => {
      if(socket.disconnected) {
        deleteClosedSession(hostName);
      }
    }, 10000);
  })
  socket.on('loadFromSpotify', loadData => {
    console.log('load from spotify ready');
    if(socket.spotifyPlayerId && socket.spotifyAuthToken) {
      let body;
      if(loadData.mode === 'context') {
        body = JSON.stringify({context_uri: loadData.target});
      }
      console.log('past first hurdle');
      axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${socket.spotifyPlayerId}`,
        body,
        {headers: {
          'Content-Type': 'application.json',
          'Authorization': 'Bearer ' + socket.spotifyAuthToken,
        }}
      )
      .then(response => {
        socket.emit('spotifyResponse', response.data)
      })
      .catch(error => {
        //console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
        socket.emit('spotifyResponse', error.response.data);
      })
    }
  })
  socket.on('hostStateUpdate', state => {
    //console.log('passing host state');
    io.to(hostName).emit('hostStateUpdate', state);
  })
  socket.on('sendInitStatus', ({socketId, hostState}) => {
    //console.log('spotify status init for ' + socketId)
    let target;
    try {
      
      target = activeSessions[hostName].activeSockets[socketId];
      //console.log('socket found, id: ', target.id);
      target.emit('hostStateUpdate', hostState)
    } catch(err) {
      //console.log('error finding init socket')
      //do nothing
    }
    //io.to(socketId).emit('hostStateUpdate', hostState);
  })
}

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io, initData, User) => {
  //console.log('new spotify socket. init data: ', initData);
  try {
    activeSessions[hostName].activeSockets[socket.id] = socket;
    socket.join(hostName);

    socket.on('spotifyPlayerDetails', ({playerId, playerAuthToken}) => {
      socket.spotifyPlayerId = playerId;
      socket.spotifyAuthToken = playerAuthToken;
    })
    socket.on('getPlayerInit', () => {
      //console.log('spotify getPlayerInit for ' + hostName + ', socket ' + socket.id);
      if(activeSessions[hostName] && activeSessions[hostName].host) {
        activeSessions[hostName].host.emit('getPlayerInit', socket.id);
      }
    })
  } catch(err) {
    socket.emit('clientError');
    socket.disconnect();
  }
  //console.log('general spotify socket actions added');
}
