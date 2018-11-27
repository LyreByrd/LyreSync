module.exports.setYTSocketHost = (socket, hostName, ytSessions, io, deleteClosedSession) => {
  socket.on('hostAction', event => {
    io.to(hostName).emit('hostAction', event);
  });
  socket.on('disconnect', () => {
    setTimeout(() => {
      if(socket.disconnected) {
        deleteClosedSession(hostName, 'youtube');
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
