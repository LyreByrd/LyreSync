import React from 'react';

const ActiveSpotifyPlaylist = (props) => {
  let title = <div className='playlist-title' >No playlist selected</div>
  let tracks = [];
  // let img = <img className='track-image' width={200} height={220} src='http://www.scdn.co/i/_global/twitter_card-default.jpg'/>
  if (props.currentPlaylist.name) {
    // img = <img className='track-image' width={200} height={220} src={props.currentPlaylist.images[0].url}/>
    title = <div className='playlist-title'>Currently Playing: {props.currentPlaylist.name}</div>;
    let toMap = [];
    if(props.currentPlaylist.type === 'track') {
      toMap = [props.currentPlaylist];
    } else {
      toMap = props.currentPlaylist.tracks.items
    }
    tracks = toMap.map((item, trackIndex) => {
      let track = item;
      if (item.track) {
        track = item.track;
      }
      let artistList = 'unknown';
      if (track.artists.length) {
        artistList = track.artists[0].name;
        artistList = track.artists.reduce((list, artist, index) => index ? list + ', ' + artist.name : list, artistList);
      }
      let playing = '';
      if(trackIndex === props.playlistPosition) {
        playing = 'active-playlist-entry';
      }
      return (<div className='playlist-entry' key={track.id} id={playing}>

          <div className='track-name ' >{playing ? <span className='dev dev-playlist-location'>{'->'}</span> : null}{track.name}</div> 
          <div className='track-artist'>{playing ? <span className='dev dev-playlist-location'>{'->'}</span> : null} by {artistList}</div>
        </div>)
    })
  }
  return <span className='active-playlist spotify-active-playlist'>{title}{tracks}</span>
}

export default ActiveSpotifyPlaylist;