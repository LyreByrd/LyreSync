import React from 'react';
import SpotifyHostControls from './SpotifyHostControls.jsx';
import VolumeControls from './VolumeControls.jsx';

const SpotifyGUI = (props) => {
  const controls = props.isHost ? <SpotifyHostControls {...props} /> : 'Forthcoming';
  return <div className='spotify-player'>{controls}</div>
}

export default SpotifyGUI;