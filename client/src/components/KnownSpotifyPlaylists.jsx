import React from 'react';

const KnownSpotifyPlaylists = (props) => {
  let playlists = [];
  if(props.hostPlaylists && props.hostPlaylists.length) {
    playlists = props.hostPlaylists.map(entry => {
      return (
        <div className='known-playlist spotify-known-playlist' key={entry.id}>
          <button className='load-playlist-btn' onClick={() => props.loadPlaylistFromKnown(entry)}>
            Load
          </button>
          <span className='known-playlist-name'>{entry.name}</span>
        </div>
      )
    })
  }
  return <div className='known-playlists spotify-known-playlists'>{playlists}</div>
}

export default KnownSpotifyPlaylists;