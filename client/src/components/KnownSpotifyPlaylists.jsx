import React from 'react';

const KnownSpotifyPlaylists = (props) => {
  let playlists = [];
  if(props.hostPlaylists && props.hostPlaylists.length) {
    playlists = props.hostPlaylists.map(entry => {
      return (
        <div key={entry.id}>
        <button onClick={() => props.loadPlaylistFromKnown(entry)}>
          Load
        </button>
        {entry.name}</div>
      )
    })
  }
  return <div>{playlists}</div>
}

export default KnownSpotifyPlaylists;