import React from 'react';
import YTPlayer from './YTPlayer.jsx';
import YTHost from './YTHost.jsx';
import HostNameTextBox from './HostNameTextBox.jsx';
import SpotifyHost from './SpotifyHost.jsx';

const Lobby = (props) => {
  if (props.inSession && props.service === 'youtube') {
    return <div>{props.isHost ? <YTHost resetToLobby={props.resetToLobby} hostingName={props.hostingName}/> : <YTPlayer resetToLobby={props.resetToLobby} sessionHost={props.sessionHost}/>}</div>
  }
  if (props.inSession && props.service === 'spotify') {
    return <SpotifyHost {...props}/>
  }
  let sessionButtons = <div>No known sessions.</div>;
  if (props.knownSessions.length) {
    sessionButtons = props.knownSessions.map(session => {
        return (
          <button onClick={() => props.joinSession(session)}>Join session with {session.sessionHost} ({session.service})</button>
        )
      })
  }
  return (
    <div>
      <button onClick={() => props.joinSession({sessionHost: 'LNB', service: 'spotify'})}>Spotify</button>
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