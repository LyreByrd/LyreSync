import React from 'react';

const YTVideoQueue = (props) => {
  let queue = props.videoQueue.map((queueEntry, index) => {
    let htmlId = '';
    if (index === 0) {
      htmlId = 'active-playlist-entry'
    }
    let text = queueEntry.videoId;
    if(queueEntry.title) {
      text = queueEntry.title;
    }
    return <div className={'yt-queue-entry'} key={queueEntry.queueTimestamp} id={htmlId}>{text}</div>
  })
  return (<div className={'youtube-queue'}>
      Queued Videos:
      {queue}
    </div>)
}

export default YTVideoQueue;