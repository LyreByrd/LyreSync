import React from 'react';
import YTPlayer from './YTPlayer.jsx';
import YTHost from './YTHost.jsx';

const Lobby = (props) => {
  if (props.inSession) {
    return <div>{props.isHost ? <YTHost /> : <YTPlayer />}</div>
  }
  let sessionButtons = <div>No known sessions.</div>;
  if (props.knownSessions.length) {
    sessionButtons = props.knownSessions.map(session => {
        return (
          <button onClick={() => props.joinSession(session.sessionId)}>Join session with {session.sessionId}</button>
        )
      })
  }
  return (
    <div>
      <button onClick={props.tryClaimHost}>Claim host if available</button>
      {sessionButtons}
    </div> 
  )
}

export default Lobby;