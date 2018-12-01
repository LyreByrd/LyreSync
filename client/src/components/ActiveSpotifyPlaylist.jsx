import React from 'react';

const ActiveSpotifyPlaylist = (props) => {
  let title = <div>No playlist selected</div>
  let tracks = [];
  if (props.currentPlaylist.name) {
    //title = <div>Currently Playing: {props.currentPlaylist.name}</div>;
    tracks = props.currentPlaylist.tracks.items.map(item => {
      let track = item.track;
      let artistList = 'unknown';
      if (track.artists.length) {
        artistList = track.artists[0].name;
        artistList = track.artists.reduce((list, artist, index) => index ? list + ', ' + artist.name : list, artistList);
      }
      return (<div key={track.id}>
          <div className='track-name'>{track.name}</div>
          <div className='track-artist'> by {artistList}</div>
        </div>)
    })
  }
  return <span>{title}{tracks}</span>
}

export default ActiveSpotifyPlaylist;