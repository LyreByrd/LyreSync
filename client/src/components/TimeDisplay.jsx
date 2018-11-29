import React from 'react';

const TimeDisplay = (props) => {
  if (isNaN(props.currentPlayingDuration)) {
    return <br />;
  }
  let playingLength = Math.round(props.currentPlayingDuration / 1000);
  return <div>Current position: {Math.round(props.playerTime / 1000)} seconds, of {playingLength}</div>;
}

export default TimeDisplay;