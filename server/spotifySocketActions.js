require('dotenv').config();
const axios = require('axios');

const DEV_TOKEN = process.env.DEV_TOKEN;
const IS_DEV = process.env.IS_DEV;

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
        console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
        socket.emit('spotifyResponse', error.response.data);
      })
    }
  })
}

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io, initData) => {
  if(initData.env === 'dev' && IS_DEV && !socket.spotifyAuthToken) {
    socket.spotifyAuthToken = DEV_TOKEN;
    socket.emit('giveAuthToken', socket.spotifyAuthToken);
  } else {
    //get auth token from frontend server
  }
  socket.on('spotifyPlayerDetails', ({playerId}) => {
    socket.spotifyPlayerId = playerId;
  })
  //console.log('general spotify socket actions added');
}