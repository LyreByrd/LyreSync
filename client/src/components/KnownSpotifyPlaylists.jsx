import React from 'react';
import GenericTextInputForm from './GenericTextInputForm.jsx';
import { Dropdown, Icon, Menu, Input } from 'semantic-ui-react';

const entryStyle ={
  display: 'flex',
  flexDirection: 'column',
  flexBasis: 'auto',
  justifyContent: 'space-around',
  alignItems: 'left',
  'flexWrap': 'wrap',
  'marginTop': '2em',
  'maxWidth': '40%'
};

const titleStyle = {
  'fontWeight': 'bold'
}

const KnownSpotifyPlaylists = (props) => {
  let playlists = [];
  if(props.hostPlaylists && props.hostPlaylists.length) {
    playlists = props.hostPlaylists.map(entry => {
      if (entry.album_type) {
          return (
            <div className='known-playlist spotify-known-playlist' key={entry.id}>
            <div>
              <span className='known-playlist-name' style={titleStyle}>
              {entry.album_type ===  "album" ? 'Album' : 'Single'} : {entry.name}
              </span>
              <div>
                By {entry.artists[0].name}
              </div>
            </div>
              <img height={130} width={125} src={entry.images[0].url}/>
              <div>
                <button className='load-playlist-btn' onClick={() => props.loadPlaylistFromKnown(entry)}>
                  Load
                </button>
              </div>
            </div>
          )
      } else {
        return (
          <div className='known-playlist spotify-known-playlist' key={entry.id}>
          <div>
            <span className='known-playlist-name'>{entry.name}</span>
          </div>
            <img height={130} width={125} src={entry.images[0].url}/>
            <div>
              <button className='load-playlist-btn' onClick={() => props.loadPlaylistFromKnown(entry)}>
                Load
              </button>
            </div>
          </div>
        )
      }
    })
  }
  return <div className='known-playlists spotify-known-playlists'>
    <button onClick={props.loadCurrentUserPlaylists}>Load Your Playlists</button>
    <GenericTextInputForm className={'spotify-search-form'}
      onSubmit={ (term) => {props.searchSpotify(term, ['album'])} }
      // buttonText={'Search for an album'}
    />
    {playlists}
    </div>
}

export default KnownSpotifyPlaylists;