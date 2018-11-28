/*
 * NOTA BENE:
 * 
 * This is the quick-and-dirty version which is easy to code
 * and suitable for demonstration but runs into rate-limiting
 * barriers very quickly when it scales up. 
 * 
 */

require('dotenv').config();
const axios = require('axios');

const DEV_TOKEN = process.env.DEV_TOKEN;
const IS_DEV = process.env.IS_DEV === 'true';

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
}

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io, initData) => {
  //console.log('new spotify socket. init data: ', initData);
  socket.join(hostName);
  if(initData.env === 'dev' && IS_DEV && !socket.spotifyAuthToken) {
    //console.log('setting token for spotify socket');
    socket.spotifyAuthToken = DEV_TOKEN;
    socket.emit('giveAuthToken', socket.spotifyAuthToken);
  } else {
    //get auth token from frontend server
  }
  socket.on('spotifyPlayerDetails', ({playerId}) => {
    socket.spotifyPlayerId = playerId;
  })
  socket.on('getPlayerInit', () => {
    if(activeSessions[hostName] && activeSessions[hostName].host) {
      activeSessions[hostName].host.emit('getPlayerInit', socket.id);
    }
  })
  //console.log('general spotify socket actions added');
}