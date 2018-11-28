require('dotenv').config();
const axios = require('axios');

const SPOTIFY_API_KEY = process.env.SPOTIFY_API_KEY;
const DEV_TOKEN = process.env.DEV_TOKEN;

module.exports.setSpotifyHostSocket = (socket, hostName, activeSessions, io, deleteClosedSession) => {
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

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io) => {
  socket.on('spotifyPlayerDetails', ({playerId, playerAuthToken}) => {
    socket.spotifyPlayerId = playerId;
    socket.spotifyAuthToken = playerAuthToken;
    socket.emit('playerConfirm', {playerId, playerAuthToken});
  })
  //console.log('general spotify socket actions added');
}