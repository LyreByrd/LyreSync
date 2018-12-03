import React from 'react';
import YTPlayer from './YTPlayer.jsx';
import YTHost from './YTHost.jsx';
import HostNameTextBox from './HostNameTextBox.jsx';
import SpotifyHost from './SpotifyHost.jsx';
import SpotifyClient from './SpotifyClient.jsx';

const Lobby = (props) => {
  if (props.inSession && props.service === 'youtube') {
    return <div>{props.isHost ? <YTHost hostTimestamp={props.hostTimestamp} resetToLobby={props.resetToLobby} hostingName={props.hostingName}/> : <YTPlayer resetToLobby={props.resetToLobby} sessionHost={props.sessionHost}/>}</div>
  }
  if (props.inSession && props.service === 'spotify') {
    return <div>{props.isHost ? <SpotifyHost {...props}/> : <SpotifyClient {...props}/>}</div>
  }
  let sessionButtons = <div>No known sessions.</div>;
  if (props.knownSessions.length) {
    sessionButtons = props.knownSessions.map(session => {
        return (
          <button onClick={() => props.joinSession(session)} key={session.sessionHost}>Join session with {session.sessionHost} ({session.service})</button>
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