//possible rate-limiting problems as it scales - should ideally load a whole playlist

import React from 'react'
import io from 'socket.io-client';
import axios from 'axios';
import debounce from 'debounce';
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

class SpotifyClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerId: null,
      authToken: null,
      playerReady: false,
      currentPlaylist: [],
      playlistPosition: null,
      playerState: 'inactive',
      playerTime: 0,
      currentPlayingInfo: {},
      currentPlayingDuration: 0,
      isMuted: false,
      volume: 50,
    } 
    this.logPlayer = this.logPlayer.bind(this);
    this.onSpotifyReady = this.onSpotifyReady.bind(this);
    this.syncIfNeeded = this.syncIfNeeded.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.setVolume = this.setVolume.bind(this);
    this.sendVolumeRequest = debounce(this.sendVolumeRequest.bind(this), 100);
    this.handlePlayerStateChange = debounce(this.handlePlayerStateChange.bind(this), 50);
  }

  componentDidMount () {
    //let props = this.props
    //console.log(this.props)
    //console.log('props: ', this.props);
    axios.get('/api/player/usertoken/spotify')
    .then(response => {
      this.setState({authToken: response.data.userToken}, () => {
        this.onSpotifyReady();
      })
    });

    this.socket = io(`https://${HOME_URL}:${SOCKET_PORT}`, {secure:true}); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('getClientActions', {host: this.props.sessionHost, service: 'spotify', env: this.props.env});
    });
    //this.socket.on('giveAuthToken', (token) => {
    //  console.log('auth token recieved');
    //  this.setState({authToken: token}, () => {
    //    this.onSpotifyReady();
    //  });
    //});
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
      name: `LyreByrd Spotify Audience Player with ${this.props.sessionHost}`,
      getOAuthToken: cb => { cb(this.state.authToken); }
    })
    this.player.addListener('initialization_error', ({ message }) => { console.error(message); });
    this.player.addListener('authentication_error', ({ message }) => { console.error(message); });
    this.player.addListener('account_error', ({ message }) => { console.error(message); });
    this.player.addListener('playback_error', ({ message }) => { console.error(message); });
  
    // Playback status updates
    this.player.addListener('player_state_changed', playerState => { 
      this.handlePlayerStateChange(playerState);
    });
  
    // Ready
    this.player.addListener('ready', ({ device_id }) => {
      this.setState({playerId: device_id}, () => {
        console.log('player id state set');
        if (this.socket) {
          console.log('informing server of player info');
          this.setState({playerReady: true}, () => {
            this.startTimer();
          });
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
    if (!hostState && this.state.playerState !== 'inactive') {
      this.player.pause()
        .then(() => {
          this.setState({
            playerState: 'inactive', 
            currentPlayingInfo: {},
            playerTime: 0,
            currentPlayingDuration: 0,
          })
        })
    }
    let lateness = Date.now() - hostState.timestamp;
    //console.log('lag: ', lateness);
    let projectedTime = hostState.position + lateness;
    //console.log('host state:', hostState, 'player state:', playerState);
    if(!playerState) {
      this.loadTrack({uri: hostState.track_window.current_track.uri, time: projectedTime});
    } else {
      if(playerState.paused !== hostState.paused) {
        if(hostState.paused) {
          this.player.pause()
            .then(() => {
              this.setState({playerState: 'paused'});
            });
        } else {
          this.player.resume()
            .then(() => {
              this.setState({playerState: 'playing'})
            });
        }
      }
      if(playerState.track_window.current_track.uri !== hostState.track_window.current_track.uri) {
        this.loadTrack({uri: hostState.track_window.current_track.uri, time:projectedTime})
      } else if (Math.abs(playerState.position - projectedTime) > 1000) {
        this.player.seek(projectedTime);
      }
    }
  }

  loadTrack(loadInfo) {
    console.log('new track load');
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
        //do nothing atm
      })
      .catch(error => {
        //console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
        console.log('spotifyResponse', error.response);
      })
  }

  handlePlayerStateChange(playerState) {
    let edited = false;
    let neededUpdates = {};
    if (this.state.currentPlayingInfo.uri !== playerState.track_window.current_track.uri) {
      neededUpdates.currentPlayingDuration = playerState.duration;
      neededUpdates.currentPlayingInfo = playerState.track_window.current_track;
      edited = true;
    }
    if (Math.abs(this.state.playerTime - playerState.position) > 500) {
      neededUpdates.playerTime = playerState.position;
      edited = true;
    }
    let playerMode = playerState.paused ? 'paused' : 'playing';
    if (playerMode !== this.state.playerState) {
      neededUpdates.playerState = playerMode;
    }
    if(edited) {
      console.log('New information: ', neededUpdates)
      this.setState(neededUpdates);
    }
  }

  toggleMute() {
    if(this.state.isMuted) {
      let spotifyVol = this.state.volume/100;
      if(this.state.playerReady) {
        this.player.setVolume(spotifyVol)
          .then(() => {
            this.setState({isMuted: false});
          })
        } else {
          this.setState({isMuted: false});
        }
    } else {
      if(this.state.playerReady) {
        this.player.setVolume(0)
          .then(() => {
            this.setState({isMuted: true});
          })
      } else {
        this.setState({isMuted: true});
      }
    }
  }

  setVolume(event) {
    this.setState({volume: event.target.value}, () => {
        this.sendVolumeRequest();
      })
  }

  sendVolumeRequest() {
    console.log('send volume request');
    if(this.state.playerReady && this.state.isMuted === false) {
      this.player.setVolume(this.state.volume/100);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if(this.state.playerState === 'playing') {
        this.setState({playerTime: this.state.playerTime + 250})
      }
    }, 250);
  }

  render () {
    return (
      <div>
        Spotify Audience Component
        <br />
        <SpotifyGUI 
          isHost={false} 
          currentPlayingInfo={this.state.currentPlayingInfo} 
          currentPlayingDuration={this.state.currentPlayingDuration}
          playerTime={this.state.playerTime}
          setTime={() => undefined}
          toggleMute={this.toggleMute}
          setVolume={this.setVolume}
          currentVolume={this.state.volume}
          isMuted={this.state.isMuted}
        />
        <button onClick={this.loadDefaultMusic}>Start Default Music</button>
        <button onClick={this.logPlayer}>Log Player</button>
      </div>
    )
  }
}

//
//props:
//  env
//  sessionHost
//  resetToLobby

export default SpotifyClient;