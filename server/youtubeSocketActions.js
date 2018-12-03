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
  socket.on('sendSearchRequest', term => {
    console.log('search YouTube for ' + term);
    if(YT_API_KEY) {
      //do in a bit
    } else {
      socket.emit('gotSearchResults', {status: 'forbidden'});
    }
  })
}

module.exports.setYTSocketClient = (socket, hostName, targetSession, io, data) => {
  //nothing special yet
  console.log('new youtube ')
  socket.hostName = hostName;
  socket.join(hostName);
  targetSession.activeSockets[socket.id] = socket;
  //console.log('Client attempting to initialize');
  try {
    targetSession.host.emit('findInitStatus', socket.id);
  } catch(err) {
    socket.emit('clientError');
  }
}
