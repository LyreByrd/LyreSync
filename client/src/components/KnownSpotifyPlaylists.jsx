import React from 'react';
import GenericTextInputForm from './GenericTextInputForm.jsx';

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
  return <div className='known-playlists spotify-known-playlists'>
    <button onClick={props.loadCurrentUserPlaylists}>Load Your Playlists</button>
    <GenericTextInputForm 
      onSubmit={ (term) => {props.searchSpotify(term, ['album'])} }
      buttonText={'Search for an album'}
    />
    {playlists}
    </div>
}

export default KnownSpotifyPlaylists;