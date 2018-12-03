import React from 'react';

const YTSearchEntry = (props) => {
  let infoBox = <div className='search-info-box'>{props.searchResult.name}</div>;
  return (<div className='search-result-entry'>
    {infoBox}
    <button onClick={() => props.addResultToQueue(result)} className='add-to-queue-btn yt-add-to-queue-btn'>
      Add
    </button>
  </div>)
}

export default YTSearchEntry;