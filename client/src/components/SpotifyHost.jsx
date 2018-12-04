
import React from 'react'
import io from 'socket.io-client';
import axios from 'axios';
import { debounce } from 'debounce';

import SpotifyGUI from './SpotifyGUI.jsx';
import KnownSpotifyPlaylists from './KnownSpotifyPlaylists.jsx';
import ActiveSpotifyPlaylist from './ActiveSpotifyPlaylist.jsx';

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
      volume: 50,
      isMuted: false,
      currentPlayingDuration: null,
      specialMessage: null,
    }
    this.loadDefaultMusic = this.loadDefaultMusic.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onSpotifyReady = this.onSpotifyReady.bind(this);
    this.loadDefaultFromClient = this.loadDefaultFromClient.bind(this);
    this.spoofHostAction = this.spoofHostAction.bind(this);
    this.spoofTimedSync.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.skipTo = this.skipTo.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.setVolume = this.setVolume.bind(this);
    this.sendVolumeRequest = debounce(this.sendVolumeRequest.bind(this), 100);
    this.handlePlayerStateChange = debounce(this.handlePlayerStateChange.bind(this), 50);
    this.setTime = debounce(this.setTime.bind(this), 100);
    this.startTimer = this.startTimer.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.loadKnownTracks = this.loadKnownTracks.bind(this);
    this.loadCurrentUserPlaylists = this.loadCurrentUserPlaylists.bind(this);
    this.loadPlaylistFromKnown = this.loadPlaylistFromKnown.bind(this);
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
      })
    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('claimHost', {host: this.props.hostingName, service: 'spotify', env: this.props.env, hostTimestamp: this.state.hostTimestamp});
    });
    this.socket.on('findInitStatus', (socketId) => {
      //return current state for newly joining audience
      if(this.player) {
        this.player.getCurrentState()
          .then(hostState => {
            this.socket.emit('sendInitStatus', {
              hostState,
              socketId,
            })
          })
          .catch(err => console.error(err))
      } else {
        this.socket.emit('sendInitStatus', {
          hostState: null,
          socketId,
        })
      }
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
      getOAuthToken: cb => { cb(this.state.authToken); },
      volume: this.state.isMuted ? 0 : (this.state.volume / 100),
    })
    this.player.addListener('initialization_error', ({ message }) => { 
      console.error('initialization: ', message); 
      this.setState({specialMessage: 'Unable to initalize player - browser may not be supported'})
    });
    this.player.addListener('authentication_error', ({ message }) => { 
      console.error('authentication: ', message); 
      this.setState({specialMessage: 'Invalid authorization token - refresh or regenerate'})
    });
    this.player.addListener('account_error', ({ message }) => { 
      console.error('account: ', message); 
      this.setState({specialMessage: 'Invalid user account - must have Spotify Premium'})
    });
    this.player.addListener('playback_error', ({ message }) => { 
      console.error('playback: ', message); 
      this.setState({specialMessage: 'This track is unavailable in your region.'})
    });
  
    // Playback status updates
    this.player.addListener('player_state_changed', playerState => {
       //console.log(state); 
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
    if(this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadDefaultMusic() {
    console.log('checking player status');
    let soundshockDefault = {
      href: 'https://api.spotify.com/v1/albums/6jg4LbYcSeB9r6bj2p1CKf',
      uri: 'spotify:album:6jg4LbYcSeB9r6bj2p1CKf',
    }
    let doteDefault = {
      uri: 'spotify:album:5frKFvB263lUvjSrrJ1sQ8'
    }
    if(this.state.playerReady) {
      console.log('attempting to get music');
      this.loadPlaylistFromKnown(soundshockDefault);
    }
  }
  
  loadDefaultFromClient() {
    //spotify:album:6jg4LbYcSeB9r6bj2p1CKf
    let soundshockDefault = {
      href: 'https://api.spotify.com/v1/albums/6jg4LbYcSeB9r6bj2p1CKf',
      uri: 'spotify:album:6jg4LbYcSeB9r6bj2p1CKf',
      type: 'album'
    }
    let trackDefault = {
      uri: 'spotify:track:0qEuvRbJzqFrqURfD2zfxj',
      href: 'https://api.spotify.com/v1/tracks/0qEuvRbJzqFrqURfD2zfxj',
      type: 'track',
    }
    if(this.state.playerReady) {
      this.loadPlaylistFromKnown(trackDefault);
    }

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

  togglePause() {
    console.log('Should pause/resume');
    if(this.state.playerReady && this.state.playerState !== 'inactive') {
      this.player.togglePlay()
        .then(() => {
          this.setState({
            playerState: (this.state.playerState === 'playing' ? 'paused' : 'playing')
          })
        });
    }
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

  handlePlayerStateChange(playerState) {
    this.socket.emit('hostStateUpdate', playerState);
    let edited = false;
    let neededUpdates = {};
    if (playerState) {
      console.log('playerState is not null');
      if (this.state.currentPlayingInfo.uri !== playerState.track_window.current_track.uri) {
        neededUpdates.currentPlayingDuration = playerState.duration;
        neededUpdates.currentPlayingInfo = playerState.track_window.current_track;
        neededUpdates.playlistPosition = this.findNewPlaylistPosition(playerState.track_window.current_track.id)
        edited = true;
      }
      if (Math.abs(this.state.playerTime - playerState.position) > 1000) {
        neededUpdates.playerTime = playerState.position;
        edited = true;
      }
      if (playerState.paused && this.state.playerState !== 'paused') {
        edited = true;
        neededUpdates.playerState = 'paused';
      }
      if (playerState.paused === false && this.state.playerState !== 'playing') {
        edited = true;
        neededUpdates.playerState = 'playing';
      }
    } else {
      if (this.state.playerState !== 'inactive') {
        edited = true;
        neededUpdates = {
          playerState: 'inactive',
          currentPlayingDuration: null,
          playerTime: 0,
          currentPlayingInfo: {},
        }
      }
    }
    if(edited) {
      console.log('New information: ', neededUpdates)
      this.setState(neededUpdates);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if(this.state.playerState === 'playing') {
        this.setState({playerTime: this.state.playerTime + 250})
      }
    }, 250);
  }

  setTime(newTime) {
    console.log('plan to set time to ' + newTime + 's');
    if (0 <= newTime && newTime * 1000 <= this.state.currentPlayingDuration) {
      this.player.seek(newTime * 1000);
    }
  }

  loadKnownTracks(uri, type) {
    let body;
    console.log('loadKnownTracks');
    if (type === 'track') {
      body = JSON.stringify({uris: [uri]});
    } else {
      body = JSON.stringify({context_uri: uri});
    }
    console.log('sending axios call from client');
    console.log(body)
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.playerId}`,
      body,
      {headers: {
        'Content-Type': 'application.json',
        'Authorization': 'Bearer ' + this.state.authToken,
      }}
    )
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      //console.log('||||||||||||||||||||||||||||||||||||||||||||||||||||||||\nERROR:\n', error.response)
      console.log('spotifyResponse', error.response);
    })
  }

  loadCurrentUserPlaylists() {
    axios.get('/user/getspotify')
      .then(response => {
        this.setState({hostPlaylists: response.data.items})
      })
      .catch(error => {
        console.error(error);
      })
  }

  loadPlaylistFromKnown(playlist) {

    console.log(playlist.href)
    axios.get(playlist.href,
      {headers: {
        'Content-Type': 'application.json',
        'Authorization': 'Bearer ' + this.state.authToken,
      }
    })
    .then(response => {
      console.log('Got playlist: ', response.data);
      this.setState({currentPlaylist: response.data, playlistPosition: 0}, () => {
        this.loadKnownTracks(playlist.uri, playlist.type);
      })
    })
    .catch(err => {
      console.error('ERROR LOADING PLAYLIST:', err);
    })
  }

  findNewPlaylistPosition(trackId) {

    let itemToTrackId = (spotifyItem) => {
      //console.log('examining item: ', spotifyItem)
      if(spotifyItem.type === 'track') {
        return spotifyItem.id;
      } else if (spotifyItem.track) {
        return spotifyItem.track.id
      }
      return undefined;
    }
    try {
      console.log('finding position');
      let position = this.state.playlistPosition;
      let tracklist = this.state.currentPlaylist.tracks.items;
      if(trackId === itemToTrackId(tracklist[position])) {
        return position;
      } else if (trackId === itemToTrackId(tracklist[position+1])) {
        return position + 1;
      } else {
        for(let i = 0; i < tracklist.length; i++) {
          if(itemToTrackId(tracklist[i]) === trackId) {
            return i;
          }
        }
      } 
    } catch(err) {
      //no tracklist, just return null
    }

    return null;
  }

  searchSpotify(term, domain) {
    axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: term,
        type: domain,
      },
      headers: {
        'Content-Type': 'application.json',
        'Authorization': 'Bearer ' + this.state.authToken
      }
    })
    .then(response => {
      console.log('Search results: ', response.data);
    })
    .catch(response => {
      console.log('Search failed');
    })
  }

  render () {
    let spoofButtons = this.props.env === 'dev' ?
      (<div>
        Spoof Buttons:
        <br />
        <button onClick={() => this.spoofHostAction('wreckingBad', 30)}>Wrecking Bad 0:30</button>
        <button onClick={() => this.spoofHostAction('wreckingBad', 60)}>Wrecking Bad 1:00</button>
        <br />
        <button onClick={() => this.spoofHostAction('cygnus', 30)}>Cygnus 0:30</button>
        <button onClick={() => this.spoofHostAction('cygnus', 60)}>Cygnus 1:00</button>
        <br />
        <button onClick={() => this.spoofTimedSync('cygnus', 30)}>Check long-term sync</button>
      </div>)
      : '';
    return (
      <div className='spotify-window spotify-window-host'>
        Spotify Component
        <SpotifyGUI 
          isHost={true} 
          togglePause={this.togglePause} 
          skipTo={this.skipTo} 
          playerState={this.state.playerState} 
          isMuted={this.state.isMuted}
          currentVolume={this.state.volume}
          toggleMute={this.toggleMute}
          setVolume={this.setVolume}
          currentPlayingDuration={this.state.currentPlayingDuration}
          currentPlayingInfo={this.state.currentPlayingInfo}
          playerTime={this.state.playerTime}
          setTime={this.setTime}
        />
        <button onClick={this.loadDefaultMusic}>Load Default Album</button>
        <br />
        <button onClick={this.loadDefaultFromClient}>Load default single track</button>
        <button onClick={this.logPlayer}>Log Player</button>
        <button onClick={this.loadCurrentUserPlaylists}>Load Playlists</button>
        <br />
        <div className={'spotify-playlist-handlers'}>
          <ActiveSpotifyPlaylist 
            className='active-playlist spotify-active-playlist'
            currentPlaylist={this.state.currentPlaylist}
            playlistPosition={this.state.playlistPosition}
          />
          <KnownSpotifyPlaylists 
            className='spotify-known-playlists known-playlists'
            hostPlaylists={this.state.hostPlaylists} 
            loadPlaylistFromKnown={this.loadPlaylistFromKnown}
          />
        </div>
        {spoofButtons}
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
//required props: 
//  env ('dev' required for certain testing things)
//  resetToLobby
//  hostingName
//  

export default SpotifyHost;