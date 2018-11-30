import React from 'react';
import SpotifyHostControls from './SpotifyHostControls.jsx';
import VolumeControls from './VolumeControls.jsx';
import TimeDisplay from './TimeDisplay.jsx';

const SpotifyGUI = (props) => {
  const controls = props.isHost ? <SpotifyHostControls {...props} /> : '';
  let currentPlayingName = props.currentPlayingInfo.name;
  return (
    <div className='spotify-player'>
      {currentPlayingName ? `Currently playing ${currentPlayingName}` : 'No music loaded'}
      <TimeDisplay 
        playerTime={props.playerTime} 
        setTime={props.setTime} 
        currentPlayingDuration={props.currentPlayingDuration}
        isHost={props.isHost}
      />
      {controls}
      <VolumeControls 
        currentVolume={props.currentVolume} 
        isMuted={props.isMuted} 
        toggleMute={props.toggleMute}
        setVolume={props.setVolume}
      />
    </div>
  )
}

export default SpotifyGUI;