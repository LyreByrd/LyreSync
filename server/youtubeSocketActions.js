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
    let target 
    if (data) {
      target = activeSessions.activeSockets[data.socketId];
    }
    if (target) {
      target.emit('initState', data);
    }
  })
}

module.exports.setYTSocketClient = (socket, hostName, sessionStorage) => {
  //nothing special yet
}
