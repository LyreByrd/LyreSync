import React from 'react';
import YTPlayer from './YTPlayer.jsx';
import YTHost from './YTHost.jsx';

const Lobby = (props) => {
  if (props.inSession) {
    return <div>{props.isHost ? <YTHost /> : <YTPlayer />}</div>
  }
  return (
    <div>
      <button onClick={props.tryClaimHost}>Claim host if available</button>
      <button onClick={props.joinSession}>Join session</button>
    </div> 
  )
}

export default Lobby;