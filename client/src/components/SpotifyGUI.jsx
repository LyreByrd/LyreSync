import React from 'react';
import SpotifyHostControls from './SpotifyHostControls.jsx';
import VolumeControls from './VolumeControls.jsx';
import TimeDisplay from './TimeDisplay.jsx';

const SpotifyGUI = (props) => {
  const controls = props.isHost ? <SpotifyHostControls {...props} /> : '';
  console.log(props.currentPlayingInfo)
  let currentPlayingName = props.currentPlayingInfo.name;
  let img = <img className='track-image' width={200} height={200} src='http://www.scdn.co/i/_global/twitter_card-default.jpg'/>
  if (props.currentPlayingInfo.album) {
    img = <img className='track-image' width={200} height={200} src={props.currentPlayingInfo.album.images[0].url}/>
  }
  return (
    <div className='spotify-player'>
      <div>
        {img}
      </div>
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