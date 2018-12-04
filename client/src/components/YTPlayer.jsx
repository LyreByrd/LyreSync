import React from 'react'
import io from 'socket.io-client';
import VolumeControls from './VolumeControls.jsx';

let HOME_URL, SOCKET_PORT;
try {
  let config = require('../../../config.js');
  HOME_URL = config.HOME_URL;
  SOCKET_PORT = config.SOCKET_PORT;
} catch (err) {
  HOME_URL = 'localhost';
  SOCKET_PORT = 9001;
}

let loadYT

class YTPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasErrored: false,
      volume: 100,
      isMuted: false,
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onPlayerReady = this.onPlayerReady.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.setVolume = this.setVolume.bind(this);
  }
  componentDidMount () {
    if (!loadYT) {
      window.YT = {};
      loadYT = new Promise((resolve) => {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = () => resolve(window.YT)
      })
    }
    loadYT.then((YT) => {
      this.player = new YT.Player(this.youtubePlayerAnchor, {
        videoId: this.props.YTid,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          disablekb: 1,
        },
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange
        }
      })
    })
  }

  onPlayerReady() {
    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`);
    this.socket.on('initPing', () => {
      this.socket.emit('getClientActions', {host: this.props.sessionHost, service: 'youtube'});
    })
    this.socket.on('initState', ({status, socketId}) => {
      if(status.state === 1) {
        this.player.loadVideoById(status.videoId, status.time);
      } else {
        this.player.cueVideoById(status.videoId, status.time);
        this.player.cuedTime = status.time;
      }
      // if(status.state !== 1) {
      //   this.player.pauseVideo();
      // }
      this.player.setPlaybackRate(status.rate);
    });
    this.socket.on('clientError', () => {
      this.setState({hasErrored: true}, () => {
        setTimeout(() => this.props.resetToLobby(), 5000);
      });
    });
    this.socket.on('sessionDeleting', () => {
      //console.log('session deleted from server');
      this.setState({hasErrored: true}, () => {
        setTimeout(() => this.props.resetToLobby(), 5000);
      });
    });
    this.socket.on('hostAction', event => {
      if(event.type === 'stateChange') {
        let newVideo = event.newVideo;
        let currVideo = this.player.getVideoData().video_id
        //console.log(`Playing id ${currVideo}, directive to look for ${newVideo}`);
        if(newVideo !== currVideo) {
          this.player.loadVideoById({videoId: event.newVideo, startSeconds: event.newTime});
        } else if (Math.abs(event.newTime - this.player.getCurrentTime()) > 1) {
          //console.log('time is wrong');
          if(this.player.getPlayerState() === 5 && this.player.cuedTime && (Math.abs(event.newTime - this.player.cuedTime) <= 1)) {
           this.player.playVideo();
          } else {
            if(event.newState === 1 && this.player.getPlayerState() !== 5) {
              //console.log('ensuring player is playing');
              this.player.playVideo();
            }
            //console.log('seeking, time: ' + event.newTime);
            this.player.seekTo(event.newTime, true);
          }
        }
        if(event.newState === 2) {
          this.player.pauseVideo();
        } else if (event.newState === 1) {
          this.player.playVideo();
        }
      } else if (event.type === 'rateChange') {
        this.player.setPlaybackRate(event.newSpeed);
      }
      //console.log(event);
    })
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  }

  onPlayerStateChange(e) {
    if (typeof this.props.onStateChange === 'function') {
      this.props.onStateChange(e)
    }
  }

  loadVideo() {
    if(this.socket) {
      this.socket.emit('getClientStart', this.props.sessionHost);
    }
    //this.player.loadVideoById('QLOpdWMbebI')
  }

  logPlayer() {
    //console.log(this.player)
    //window.player = this.player;
  }

  toggleMute() {
    this.setState({isMuted: !this.state.isMuted},
      ()=> {
        if(this.state.isMuted) {
          this.player.mute();
        } else {
          this.player.unMute();
        }
      }
    );
  }

  setVolume(event) {
    this.setState({volume: event.target.value}, 
      () => {
        this.player.setVolume(this.state.volume);
      }
    );
  }

  render () {
    return (
      <div className='youtube-window youtube-window-client'>
        <section className='youtubeComponent-wrapper'>
          <div ref={(r) => { this.youtubePlayerAnchor = r }}></div>
        </section>
        <br />
        <VolumeControls 
          toggleMute={this.toggleMute} 
          isMuted={this.state.isMuted} 
          currentVolume={this.state.volume} 
          setVolume={this.setVolume}
        />
        {/* <button onClick={this.toggleMute}>{this.state.isMuted ? 'Unmute' : 'Mute'}</button>
        <input type='range' name='volume' min='0' max='100' defaultValue='100' onChange={this.setVolume}/>
        <span>  {this.state.volume}/100</span> */}
        <br />
        <button onClick={this.loadVideo}>Re-Sync To Host</button>
        {this.state.hasErrored ? 'No such session. Returning to lobby...' : ''}
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

export default YTPlayer;