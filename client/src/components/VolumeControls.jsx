import React from 'react';

const VolumeControls = (props) => {
  return ( <div className='volume-control'>
    <button 
      onClick={props.toggleMute} 
      className={'mute-unmute-btn ' + (props.isMuted ? 'unmute-btn' : 'mute-btn')}>{props.isMuted ? 'Unmute' : 'Mute'}</button>
    <input 
      className='volume-slider'
      type='range' 
      name='volume' 
      min='0' 
      max='100' 
      value={props.currentVolume}  
      onChange={props.setVolume}
    />
    <span className={'volume-display'}>  {props.currentVolume}/100</span>
  </div>)
}

//props:
// toggleMute
// isMuted
// setVolume
// currentVolume

export default VolumeControls;