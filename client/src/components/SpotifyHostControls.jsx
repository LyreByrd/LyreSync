import React from 'react';
import { Button, Icon } from 'semantic-ui-react';

const SpotifyHostControls = (props) => {
  let shouldShowPause = props.playerState === 'playing';
  let plauseButton = (
  // <button 
  //   onClick={props.togglePause} 
  //   className={shouldShowPause ? 'pause-btn' : 'play-btn'}>
  //     {shouldShowPause ? 'Pause' : 'Play'}
  //   </button>
  <div className="ui icon buttons">
    <button className="ui toggle button" onClick={props.togglePause}>
      <i className={shouldShowPause ? 'pause icon' : 'play icon'}></i>
      {shouldShowPause ? 'Pause' : 'Play'}
    </button>
  </div>
    )
  return (<div className='spotify-player host-controls'>

    {plauseButton}
    <div className="ui icon buttons">
    <button className='ui button' onClick={() => props.skipTo({mode: 'rel', target: -1})}>
    <i className="step backward icon"></i>
    Prev
    </button>
    <button className='ui button' onClick={() => props.skipTo({mode: 'rel', target: 1})}>
    <i className="step forward icon"></i>
    Next
    </button>
    </div>
    <div className="ui icon buttons">
    <button 
      onClick={props.toggleMute} 
      className="ui toggle button">
      <i className={props.isMuted ? 'volume off icon' : 'volume up icon'}></i>
      {props.isMuted ? 'Unmute' : 'Mute'}
    </button>
  </div>
  </div>)
}

export default SpotifyHostControls;