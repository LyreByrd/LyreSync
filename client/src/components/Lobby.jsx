import React from 'react';
import YTPlayer from './YTPlayer.jsx';
import YTHost from './YTHost.jsx';
import HostNameTextBox from './HostNameTextBox.jsx';

const Lobby = (props) => {
  if (props.inSession) {
    return <div>{props.isHost ? <YTHost sessionHost={props.sessionHost} hostingName={props.hostingName}/> : <YTPlayer sessionHost={props.sessionHost}/>}</div>
  }
  let sessionButtons = <div>No known sessions.</div>;
  if (props.knownSessions.length) {
    sessionButtons = props.knownSessions.map(session => {
        return (
          <button onClick={() => props.joinSession(session.sessionHost)}>Join session with {session.sessionHost}</button>
        )
      })
  }
  return (
    <div>
      <HostNameTextBox 
        hostingName={props.hostingName} 
        hostNameTextChange={props.hostNameTextChange} 
        tryClaimHost={props.tryClaimHost}
      />
      
      {sessionButtons}
    </div> 
  )
}

export default Lobby;