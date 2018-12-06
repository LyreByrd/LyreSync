import React from 'react';

const SpotifyPlayingData = (props) => {
  let imgSrc = 'http://www.scdn.co/i/_global/twitter_card-default.jpg';
  if(props.currentPlayingInfo.album) {
    imgSrc = props.currentPlayingInfo.album.images[0].url;
  }
  let currentPlayingName = props.currentPlayingInfo.name;
  let trackInfo;
  if (currentPlayingName) {
    let currentPlayingArtist = 'unknown';
    if (props.currentPlayingInfo.artists && props.currentPlayingInfo.artists.length) {
      let artistList = props.currentPlayingInfo.artists[0].name;
      artistList = props.currentPlayingInfo.artists.reduce((list, artist, index) => index ? list + ', ' + artist.name : list, artistList);
      currentPlayingArtist = artistList;
    }
    trackInfo = (<div className={'playing-track-info'}>
        <div className={'playing-track-title'}>{currentPlayingName}</div>
        <div className={'playing-track-artist'}>{currentPlayingArtist}</div>
      </div>)
  } else {
    trackInfo = (<div className={'playing-track-info inactive-track-info'}>
      No track playing.
    </div>)
  }
  return (
    <div className='spotify-playing-info playing-info'>
      <img className='spotify-playing-img playing-img' src={imgSrc} width={200} height={200} />
      {trackInfo}
    </div>
  )
}

export default SpotifyPlayingData;

//let img = <img className='track-image' width={200} height={200} src='http://www.scdn.co/i/_global/twitter_card-default.jpg'/>
//if (props.currentPlayingInfo.album) {
//  img = <img className='track-image' width={200} height={200} src={props.currentPlayingInfo.album.images[0].url}/>
//}