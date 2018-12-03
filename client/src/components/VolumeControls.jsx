import React from 'react';

const VolumeControls = (props) => {
  return ( <div className='volume'>
    <button onClick={props.toggleMute}>{props.isMuted ? 'Unmute' : 'Mute'}</button>
    <input type='range' name='volume' min='0' max='100' value={props.currentVolume}  onChange={props.setVolume}/>
    <span>  {props.currentVolume}/100</span>
  </div>)
}

//props:
// toggleMute
// isMuted
// setVolume
// currentVolume

export default VolumeControls;