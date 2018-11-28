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

class SpotifyClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerId: null,
      authToken: null,
      playerReady: false,
      currentPlaylist: [],
      playlistPosition: null,
    }
    this.logPlayer = this.logPlayer.bind(this);
    this.onSpotifyReady = this.onSpotifyReady.bind(this);
    this.syncIfNeeded = this.syncIfNeeded.bind(this);
  }

  componentDidMount () {
    //let props = this.props
    //console.log(this.props)
    //console.log('props: ', this.props);

    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('getClientActions', {host: this.props.sessionHost, service: 'spotify', env: this.props.env});
    });
    this.socket.on('giveAuthToken', (token) => {
      console.log('auth token recieved');
      this.setState({authToken: token}, () => {
        this.onSpotifyReady();
      });
    });
    this.socket.on('clientError', () => {
      this.setState({hasErrored: true}, () => {
        setTimeout(() => this.props.resetToLobby(), 5000);
      });
    });
    this.socket.on('playerConfirm', (confirmData) => {
      this.socket.emit('getPlayerInit');
    })
    this.socket.on('spotifyResponse', object => {
      console.log('Spotify response: ', object);
    })
    this.socket.on('hostStateUpdate', hostState => {
      console.log('Host has a state update!');
      if(hostState && this.player && this.state.playerId) {
        this.player.getCurrentState().then(audienceState => {
          this.syncIfNeeded(hostState, audienceState);
        })
      }
    })

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
      name: `LyreByrd Spotify Audience Player with ${this.props.hostingName}`,
      getOAuthToken: cb => { cb(this.state.authToken); }
    })
    this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
    this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
    this.player.addListener('account_error', ({ message }) => { console.error(message); });
    this.player.addListener('playback_error', ({ message }) => { console.error(message); });
  
    // Playback status updates
    this.player.addListener('player_state_changed', state => { console.log(state); });
  
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

  componentWillUnmount() {
    if(this.socket) {
      this.socket.close();
    }
    if(this.player) {
      this.player.disconnect();
    }
  }

  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  syncIfNeeded(hostState, playerState) {
    let lateness = Date.now() - hostState.timestamp;
    console.log('time diff: ', lateness);
    let projectedTime = hostState.position + lateness;
    if(!playerState) {
      this.loadTrack({uri: hostState.track_window.uri, time: projectedTime});
    } else {
      if(playerState.paused !== hostState.paused) {
        if(hostState.paused) {
          this.player.pause();
        } else {
          this.player.resume();
        }
      }
      if(playerState.track_window.uri !== hostState.track_window.uri) {
        this.loadTrack({uri: hostState.track_window.uri, time:projectedTime})
      } else if (Math.abs(playerState.position - projectedTime) > 1000) {
        this.player.seek(projectedTime);
      }
    }
    // if(event.type === 'stateChange') {
    //   let newVideo = event.newVideo;
    //   let currVideo = this.player.getVideoData().video_id
    //   //console.log(`Playing id ${currVideo}, directive to look for ${newVideo}`);
    //   if(newVideo !== currVideo) {
    //     this.player.loadVideoById({videoId: event.newVideo, startSeconds: event.newTime});
    //   } else if (Math.abs(event.newTime - this.player.getCurrentTime()) > 1) {
    //     //console.log('time is wrong');
    //     if(this.player.getPlayerState() === 5 && this.player.cuedTime && (Math.abs(event.newTime - this.player.cuedTime) <= 1)) {
    //      this.player.playVideo();
    //     } else {
    //       if(event.newState === 1 && this.player.getPlayerState() !== 5) {
    //         //console.log('ensuring player is playing');
    //         this.player.playVideo();
    //       }
    //       //console.log('seeking, time: ' + event.newTime);
    //       this.player.seekTo(event.newTime, true);
    //     }
    //   }
    //   if(event.newState === 2) {
    //     this.player.pauseVideo();
    //   } else if (event.newState === 1) {
    //     this.player.playVideo();
    //   }
    // } else if (event.type === 'rateChange') {
    //   this.player.setPlaybackRate(event.newSpeed);
    // }
  }

  loadTrack(loadInfo) {
    let body = {uris: [loadInfo.uri]};
    if(loadInfo.time) {
      body.position_ms = loadInfo.time;
    }
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.playerId}`,
        body,
        {headers: {
          'Content-Type': 'application.json',
          'Authorization': 'Bearer ' + this.state.authToken,
        }}
      )
      .then(response => {
        console.log(response.data)
      })
      .catch(error => {
        //console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
        console.log('spotifyResponse', error.response);
      })
  }

  onIdValChange(e) {
    
  }

  render () {
    return (
      <div>
        Spotify Audience Component
        <button onClick={this.loadDefaultMusic}>Start Default Music</button>
        <button onClick={this.logPlayer}>Log Player</button>
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

export default SpotifyClient;