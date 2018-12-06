import React from 'react';
import SpotifyHostControls from './SpotifyHostControls.jsx';
import VolumeControls from './VolumeControls.jsx';
//import TimeDisplay from './TimeDisplay.jsx';
import TimeDisplayBar from './TimeDisplayBar.jsx';
import SpotifyPlayingData from './SpotifyPlayingData.jsx';

const SpotifyGUI = (props) => {
  let currentPlayingName = props.currentPlayingInfo.name;
  const controls = props.isHost ? 
    <SpotifyHostControls 
      isMuted={props.isMuted} 
      toggleMute={props.toggleMute}
      {...props} /> 
    : '';
  let img = <img className='track-image' width={200} height={200} src='http://www.scdn.co/i/_global/twitter_card-default.jpg'/>
  if (props.currentPlayingInfo.album) {
    img = <img className='track-image' width={200} height={200} src={props.currentPlayingInfo.album.images[0].url}/>
  }
  return (
    <div className='spotify-player'>
      {/*<div>
        {img}
      </div>
      {currentPlayingName ? `Currently playing ${currentPlayingName}` : 'No music loaded'}*/}
      <SpotifyPlayingData currentPlayingInfo={props.currentPlayingInfo} />
      <TimeDisplayBar 
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