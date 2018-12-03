import React from 'react';

const YTVideoQueue = (props) => {
  let queue = props.videoQueue.map((id, index) => {
    return <div key={id}>{id}</div>
  })
  return (<div>
      Queued Videos:
      {queue}
    </div>)
}

export default YTVideoQueue;