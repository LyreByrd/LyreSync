module.exports.setYTSocketHost = (socket, hostName, ytSessions, io) => {
  socket.on('hostAction', event => {
    io.to(hostName).emit('hostAction', event);
  });
  socket.on('disconnect', () => {
    setTimeout(() => {
      if(socket.disconnected) {
        deleteClosedYTSession(hostName, ytSessions, io);
      }
    }, 10000);
  })
  socket.on('sendInitStatus', data => {
    let target = ytSessions[hostName].activeSockets[data.socketId];
    if (target) {
      target.emit('initState', data);
    }
  })
}

module.exports.setYTSocketClient = (socket, hostName, sessionStorage) => {

}

const deleteClosedYTSession = (hostName, activeYTSessions, io) => {
  let closingSession = activeYTSessions[hostName];
  if (closingSession) {
    Object.keys(closingSession.activeSockets).forEach(socketId => {
      try {
        let socket = closingSession.activeSockets[socketId];
        socket.emit('sessionDeleting');
        socket.disconnect();
      } catch (err) {
        //socket never got cleaned up, probably not a problem
      }
    });
    delete activeYTSessions[hostName];
    //console.log('Deleting session hosted by ' + hostName);
  }
}

