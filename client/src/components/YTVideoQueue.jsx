import React from 'react';

const YTVideoQueue = (props) => {
  let queue = props.videoQueue.map((queueEntry, index) => {
    return <div key={queueEntry.queueTimestamp} id={index === 0 ? 'active-playlist-entry' : ''}>{queueEntry.videoId}</div>
  })
  return (<div className={'youtube-queue'}>
      Queued Videos:
      {queue}
    </div>)
}

export default YTVideoQueue;