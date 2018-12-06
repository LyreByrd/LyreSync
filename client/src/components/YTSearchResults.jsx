import React from 'react';
import YTSearchEntry from './YTSearchEntry.jsx';

class YTSearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: '',
    }
    this.onTextboxChange = this.onTextboxChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onTextboxChange(event) {
    this.setState({searchTerm: event.target.value})
  }
  onSubmit(event) {
    event.preventDefault();
    this.props.sendSearchRequest(this.state.searchTerm);
  }

  render() {
    if(this.props.searchResults === null) {
      return <div className={'yt-search-forbid'}>YouTube search not available at this time</div>
    }
    let formattedResults = this.props.searchResults.map((searchResult, index) => {
      return <YTSearchEntry 
        key={index}
        searchResult={searchResult} 
        addSearchResultToQueue={this.props.addSearchResultToQueue}
        />
    });
    return (<div className='yt-search-results'>
      <form onSubmit={this.onSubmit}>
      <div className='ui action input'>
        <input type='text' placeholder='Search YouTube'name='search' value={this.state.searchTerm} onChange={this.onTextboxChange}/>
        <button className='ui button' type='input'>Search</button>
      </div>
      </form>
      {formattedResults}
    </div>)
  }
}

export default YTSearchResults;