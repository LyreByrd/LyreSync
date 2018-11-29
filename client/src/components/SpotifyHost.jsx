/*
 * NOTA BENE:
 * 
 * This is the quick-and-dirty version which is easy to code
 * and suitable for demonstration but runs into rate-limiting
 * barriers very quickly when it scales up. 
 * 
 */

import React from 'react'
import io from 'socket.io-client';
import axios from 'axios';
import SpotifyGUI from './SpotifyGUI.jsx';

let HOME_URL, SOCKET_PORT;
try {
  let config = require('../../../config.js');
  HOME_URL = config.HOME_URL;
  SOCKET_PORT = config.SOCKET_PORT;
} catch (err) {
  HOME_URL = 'localhost';
  SOCKET_PORT = 9001;
}

let loadSpotify;

class SpotifyHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerId: null,
      authToken: null,
      playerReady: false,
      hostPlaylists: [],
      currentPlaylist: [],
      playlistPosition: null,
      playerState: 'inactive',
      playerTime: 0,
      currentPlayingInfo: {},
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    this.loadDefaultMusic = this.loadDefaultMusic.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onIdValChange = this.onIdValChange.bind(this);
    this.onSpotifyReady = this.onSpotifyReady.bind(this);
    this.loadDefaultFromClient = this.loadDefaultFromClient.bind(this);
    this.spoofHostAction = this.spoofHostAction.bind(this);
    this.spoofTimedSync.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.skipTo = this.skipTo.bind(this);
  }

  componentDidMount () {
    //let props = this.props
    //console.log(this.props)
    console.log('props: ', this.props);

    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('claimHost', {host: this.props.hostingName, service: 'spotify', env: this.props.env});
    });
    this.socket.on('giveAuthToken', (token) => {
      console.log('auth token recieved');
      this.setState({authToken: token}, () => {
        this.onSpotifyReady();
      });
    });
    this.socket.on('findInitStatus', (socketId) => {
      //return current state for newly joining audience
    })
    this.socket.on('hostingError', (err) => {
      //console.log('got host error');
      console.log('host error: ', err)
      this.setState({hasErrored: true}, () => {
        setTimeout(() => this.props.resetToLobby(err), 5000);
      });
    })
    this.socket.on('playerConfirm', (confirmData) => {
      console.log(this.state, confirmData);
    })
    this.socket.on('spotifyResponse', object => {
      console.log('Spotify response: ', object);
      this.player.getCurrentState()
        .then(state => {
          if(state) {
            this.setState({
              playerState: (state.paused ? 'paused' : 'playing'),
            });
          }
        });
    });

    if (!loadSpotify) {
      loadSpotify = new Promise((resolve) => {
        //console.log('Host trying to add a script')
        const tag = document.createElement('script')
        tag.src = 'https://sdk.scdn.co/spotify-player.js';
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        this.SpotifyScript = tag;
        window.onSpotifyWebPlaybackSDKReady = this.onSpotifyReady;
      })
    }
  }

  onSpotifyReady() {
    if (this.state.authToken === null || !window.Spotify) {
      console.log('tried to ready spotify too early');
      return;
    }

    console.log('onSpotifyReady fired');
    //console.log(Spotify);

    this.player = new Spotify.Player({
      name: `LyreByrd Spotify Host Player ${this.props.hostingName}`,
      getOAuthToken: cb => { cb(this.state.authToken); }
    })
    this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
    this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
    this.player.addListener('account_error', ({ message }) => { console.error(message); });
    this.player.addListener('playback_error', ({ message }) => { console.error(message); });
  
    // Playback status updates
    this.player.addListener('player_state_changed', state => {
       //console.log(state); 
       this.socket.emit('hostStateUpdate', state);
      });
  
    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      this.setState({playerId: device_id}, () => {
        console.log('player id state set');
        if (this.socket) {
          console.log('informing server of player info');
          this.setState({playerReady: true});
          this.socket.emit('spotifyPlayerDetails', {playerId: this.state.playerId, playerAuthToken: this.state.authToken});
        }
      });
      console.log('Ready with Device ID', device_id);
    });
  
    // Not Ready
    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });
  
    // Connect to the player!
    this.player.connect();
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
    if(this.player) {
      this.player.disconnect();
    }
  }


  loadVideo(event) {
    
  }

  loadDefaultMusic() {
    console.log('checking player status');
    if(this.state.playerReady) {
      console.log('attempting to get music');
      this.socket.emit('loadFromSpotify', {mode: 'context', target:'spotify:album:5frKFvB263lUvjSrrJ1sQ8'});
    }
  }
  
  //spotify:album:5frKFvB263lUvjSrrJ1sQ8

  loadDefaultFromClient() {
    let body = JSON.stringify({uris: ['spotify:track:4wGCusPRszIZYxbwtgISjD']});
    //spotify:track:4wGCusPRszIZYxbwtgISjD
    console.log('sending axios call from client');
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.playerId}`,
      body,
      {headers: {
        'Content-Type': 'application.json',
        'Authorization': 'Bearer ' + this.state.authToken,
      }}
    )
    .then(response => {
      console.log(response.data)
      this.setState({playerState: 'playing'})
    })
    .catch(error => {
      //console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
      console.log('spotifyResponse', error.response);
    })
  }

  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  spoofHostAction(track, time) {
    let spoofTracks = {
      wreckingBad: 'spotify:track:4wGCusPRszIZYxbwtgISjD',
      cygnus: 'spotify:track:2INatKLWUQJW3iItomRwZ4',
    }
    let spoofTime = time * 1000;
    let spoofState = {
      paused: false,
      timestamp: Date.now(),
      position: spoofTime,
      track_window: {current_track: {uri: spoofTracks[track]}},
    }
    console.log('Spoofing action with object:', spoofState);
    this.socket.emit('hostStateUpdate', spoofState);
  }

  spoofTimedSync(track, start) {
    let spoofTracks = {
      wreckingBad: 'spotify:track:4wGCusPRszIZYxbwtgISjD',
      cygnus: 'spotify:track:2INatKLWUQJW3iItomRwZ4',
    }
    let spoofTime = start * 1000;
    let spoofState = {
      paused: false,
      timestamp: Date.now(),
      position: spoofTime,
      track_window: {current_track: {uri: spoofTracks[track]}},
    }
    this.socket.emit('hostStateUpdate', spoofState);
    for(let i = 1; i < 20; i++) {
      setTimeout(() => {
        let diff = Date.now() - spoofState.timestamp;
        spoofState.timestamp += diff;
        spoofState.position += diff;
        this.socket.emit('hostStateUpdate', spoofState);
      }, i * 1000);
    }
  }

  onIdValChange(e) {
    
  }

  togglePause() {
    console.log('Should pause/resume');
    this.player.togglePlay()
      .then(() => {
        this.setState({
          playerState: (this.state.playerState === 'playing' ? 'paused' : 'playing')
        })
      });
  }

  skipTo(targetData) {
    if(targetData.mode === 'rel') {
      //relative movement through playlist
      if(targetData.target === 1) {
        this.player.nextTrack();
      } else if (targetData.target === -1) {
        this.player.previousTrack();
      }
    }
  }

  render () {
    return (
      <div>
        Spotify Component
        <SpotifyGUI isHost={true} togglePause={this.togglePause} skipTo={this.skipTo} playerState={this.state.playerState} />
        <button onClick={this.loadDefaultMusic}>Start Default Music</button>
        <br />
        <button onClick={this.loadDefaultFromClient}>Load-from-client test</button>
        <button onClick={this.logPlayer}>Log Player</button>
        <br />
        <button onClick={() => this.spoofHostAction('wreckingBad', 30)}>Wrecking Bad 0:30</button>
        <button onClick={() => this.spoofHostAction('wreckingBad', 60)}>Wrecking Bad 1:00</button>
        <br />
        <button onClick={() => this.spoofHostAction('cygnus', 30)}>Cygnus 0:30</button>
        <button onClick={() => this.spoofHostAction('cygnus', 60)}>Cygnus 1:00</button>
        <br />
        <button onClick={() => this.spoofTimedSync('cygnus', 30)}>Check long-term sync</button>
      </div>
    )
  }
}

//player:
//play/pause button
//click-and-drag seek bar
//skip-to-next, jump-to-previous
//playlist entries

//
//YTPlayer.propTypes = {
//  YTid: PropTypes.string.required,
//  width: PropTypes.number,
//  height: PropTypes.number,
//  onStateChange: PropTypes.func
//}

export default SpotifyHost;