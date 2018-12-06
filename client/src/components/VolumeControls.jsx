import React from 'react';


const VolumeControls = (props) => {
  return ( <div className='volume-control'>
  {/* <div className="ui icon buttons">
    <button 
      onClick={props.toggleMute} 
      className="ui toggle button">
      <i className={props.isMuted ? 'volume off icon' : 'volume up icon'}></i>
      {props.isMuted ? 'Unmute' : 'Mute'}
    </button>
  </div> */}
  <div>
    <input 
      className='volume-slider'
      type='range' 
      name='volume' 
      min='0' 
      max='100' 
      value={props.currentVolume}  
      onChange={props.setVolume}
    />
    <div>

    <span className={'volume-display'}>  <span className={'volume-dsplay-current'}>{props.currentVolume}</span>/100</span>
    </div>
    <div className="ui icon buttons">
    <button 
      onClick={props.toggleMute} 
      className="ui toggle button">
      <i className={props.isMuted ? 'volume off icon' : 'volume up icon'}></i>
      {props.isMuted ? 'Unmute' : 'Mute'}
    </button>
  </div>
  </div>
  </div>)
}

//props:
// toggleMute
// isMuted
// setVolume
// currentVolume

export default VolumeControls;