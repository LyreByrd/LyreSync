require('dotenv').config();

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
}

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io) => {
  socket.on('spotifyPlayerDetails', ({playerId, playerAuthToken}) => {
    socket.spotifyPlayerId = playerId;
    socket.spotifyAuthToken = playerAuthToken;
    socket.emit('playerConfirm', {playerId, playerAuthToken});
  })
  //console.log('general spotify socket actions added');
}