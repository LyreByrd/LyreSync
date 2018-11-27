import React from 'react'
import io from 'socket.io-client';
import getVideoId from 'get-video-id';

let HOME_URL, SOCKET_PORT;
try {
  let config = require('../../../config.js');
  HOME_URL = config.HOME_URL;
  SOCKET_PORT = config.SOCKET_PORT;
} catch (err) {
  HOME_URL = 'localhost';
  SOCKET_PORT = 9001;
}

class SpotifyHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    this.loadDefaultMusic = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onIdValChange = this.onIdValChange.bind(this);
  }

  componentDidMount () {
    let props = this.props
    //console.log(this.props)

    //this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    //this.socket.on('initPing', () => {
    //  //console.log('claiming host, name: ' + props.hostingName);
    //  this.socket.emit('claimHost', {host: props.hostingName, service:'spotify'});
    //})
    //this.socket.on('findInitStatus', (socketId) => {
    //  //return current state for newly joining audience
    //})
    //this.socket.on('hostingError', (err) => {
    //  //console.log('got host error');
    //  this.setState({hasErrored: true}, () => {
    //    setTimeout(() => this.props.resetToLobby(err), 5000);
    //  });
    //})

    if (!loadSpotify) {
      loadSpotify = new Promise((resolve) => {
        //console.log('Host trying to add a script')
        const tag = document.createElement('script')
        tag.src = 'https://sdk.scdn.co/spotify-player.js';
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        this.SpotifyScript = tag;
        window.onSpotifyWebPlaybackSDKReady = () => undefined;
      })
    }

    loadSpotify.then(() => {
      //console.log('loadYT\'s .then fired in host')
      console.log('loadSpotify\'s .then fired in host');
      this.token = ''; //will need frequent updating
      this.player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(this.token); }
      })

      player.addListener('initialization_error', ({ message }) => { console.error(message); });
      player.addListener('authentication_error', ({ message }) => { console.error(message); });
      player.addListener('account_error', ({ message }) => { console.error(message); });
      player.addListener('playback_error', ({ message }) => { console.error(message); });
    
      // Playback status updates
      player.addListener('player_state_changed', state => { console.log(state); });
    
      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
      });
    
      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });
    
      // Connect to the player!
      player.connect();
    })
  }

  onPlayerReady() {

  }

  onPlaybackRateChange() {

  }

  onPlayerStateChange(e) {

  }

  componentWillUnmount() {
    if(this.socket) {
      this.socket.close();
    }
  }


  loadVideo(event) {
    
  }


  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  onIdValChange(e) {
    
  }

  render () {
    return (
      <div>
        Spotify Component
        <button onClick={this.logPlayer}>Log Player</button>
      </div>
    )
  }
}
//
//YTPlayer.propTypes = {
//  YTid: PropTypes.string.required,
//  width: PropTypes.number,
//  height: PropTypes.number,
//  onStateChange: PropTypes.func
//}

export default SpotifyHost;