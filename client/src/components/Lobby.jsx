import React from 'react';

const Lobby = (props) => {
  if (props.inSession) {
    return <div>{props.isHost ? <YTHost /> : <YTPlayer />}</div>
  }
  return (
    <div>
      
    </div> 
  )
}

export default Lobby;