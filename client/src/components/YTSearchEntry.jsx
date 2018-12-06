import React from 'react';

const YTSearchEntry = (props) => {
  let infoBox = <div className='search-info-box'>{props.searchResult.snippet.title}</div>;
  return (
  <div className='search-result-entry'>
    {infoBox}
    <button className='ui button' onClick={() => props.addSearchResultToQueue(props.searchResult)}>
      Add
    </button>
  </div>)
}

export default YTSearchEntry;