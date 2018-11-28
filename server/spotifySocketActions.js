require('dotenv').config();
const axios = require('axios');

const SPOTIFY_API_KEY = process.env.SPOTIFY_API_KEY;
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
  socket.on('loadFromSpotify', uri => {
    console.log('load from spotify ready');
    if(socket.spotifyPlayerId && socket.spotifyAuthToken) {
      console.log('past first hurdle');
      axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${socket.spotifyPlayerId}`,
        JSON.stringify({uris: [uri]}),
        {headers: {
          'Content-Type': 'application.json',
          'Authorization': 'Bearer ' + socket.spotifyAuthToken,
        }}
      )
      .then(data => {
        socket.emit('spotifyResponse', {data})
      })
      .catch(error => {
        socket.emit('spotifyResponse', {error});
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
  socket.on('spotifyPlayerDetails', ({playerId, playerAuthToken}) => {
    socket.spotifyPlayerId = playerId;
    socket.spotifyAuthToken = playerAuthToken;
    socket.emit('playerConfirm', {playerId, playerAuthToken});
  })
  //console.log('general spotify socket actions added');
}