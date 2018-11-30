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

let dev_playlists; 
const DEV_TOKEN = process.env.DEV_TOKEN;
const IS_DEV = process.env.IS_DEV === 'true';
const PROXY_URL = process.env.PROXY_URL;
const PROXY_PORT = process.env.PROXY_PORT;

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

module.exports.setSpotifySocket = (socket, hostName, activeSessions, io, initData, User) => {
  //console.log('new spotify socket. init data: ', initData);
  socket.join(hostName);
  if(initData.env === 'dev' && IS_DEV && !socket.spotifyAuthToken) {
    //console.log('setting token for spotify socket');
    socket.spotifyAuthToken = DEV_TOKEN;
    socket.emit('giveAuthToken', socket.spotifyAuthToken);
  } else {
    try {
      let cookie = socket.handshake.headers.cookie;
      if (cookie) {
        axios.get(`http://${PROXY_URL}:${PROXY_PORT}/api/player/usertoken/spotify`, {
          headers: {
            'Cookie': cookie,
          },
        })
          .then(response => {
            //console.log('Token: ', response.data.userToken)
            socket.spotifyAuthToken = response.data.userToken;
            socket.emit('giveAuthToken', socket.spotifyAuthToken);
          })
          .catch(err => {
            console.log('Errored in proxy get');
          })
      }
    } catch (err) {
      console.log('Error in cookie stuff');
      socket.emit('hostError');
      socket.emit('clientError');
      socket.disconnect();
    }
    //get auth token from frontend server
    //get playlists from spotify
    //send both
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
