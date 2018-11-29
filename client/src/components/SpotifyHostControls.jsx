import React from 'react';

const SpotifyHostControls = (props) => {
  let shouldShowPause = props.playerState === 'playing';
  let plauseButton = (<button 
    onClick={props.togglePause} 
    className={shouldShowPause ? 'pause-btn' : 'play-btn'}>
      {shouldShowPause ? 'Pause' : 'Play'}
    </button>)
  return (<div className='spotify host-controls'>

    {plauseButton}
    <button className={'prevTrack'} onClick={() => props.skipTo({mode: 'rel', target: -1})}>Previous Track</button>
    <button className={'nextTrack'} onClick={() => props.skipTo({mode: 'rel', target: 1})}>Next Track</button>
  </div>)
}

export default SpotifyHostControls;