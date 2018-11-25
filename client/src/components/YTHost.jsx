import React from 'react'
import io from 'socket.io-client';
import { HOME_URL, SOCKET_PORT } from '../../../config.js';

let loadYT

class YTHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoQueue: [],
      idVal: '',
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onIdValChange = this.onIdValChange.bind(this);
  }
  componentDidMount () {
    let props = this.props
    //console.log(this.props)
    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('claimHost', props.hostingName);
    })
    this.socket.on('findInitStatus', (socketId) => {
      //console.log('client attempting to initialize, id: ' + socketId)
      if(!this.player) {
        this.socket.emit('sendInitStatus', {status: 'loadingPlayer', socketId});
      } else {
        let currentState = {
          videoId: this.player.getVideoData().video_id,
          time: this.player.getCurrentTime(),
          state: this.player.getPlayerState(),
          rate: this.player.getPlaybackRate(),
        }
        this.socket.emit('sendInitStatus', {status: currentState, socketId});
      }
    })
    this.socket.on('hostingError', (err) => {
      //console.log('got host error');
      setTimeout(() => this.props.resetToLobby(err), 5000);
    })
    if (!loadYT) {
      window.YT = {};
      loadYT = new Promise((resolve) => {
        //console.log('Host trying to add a script')
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        this.YTScript = tag;
        window.onYouTubeIframeAPIReady = () => resolve(window.YT)
      })
    }
    loadYT.then((YT) => {
      //console.log('loadYT\'s .then fired in host')
      this.player = new YT.Player(this.youtubePlayerAnchorHost, {
        height: this.props.height || 390,
        width: this.props.width || 640,
        videoId: this.props.YTid,
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange,
          onPlaybackRateChange: this.onPlaybackRateChange,
        }
      })
    })
  }

  onPlayerReady() {

  }

  onPlaybackRateChange() {
    //console.log(this.player.getPlaybackRate());
    this.socket.emit('hostAction', {
      type: 'rateChange',
      newSpeed: this.player.getPlaybackRate(),
    });
  }

  onPlayerStateChange(e) {
    this.socket.emit('hostAction', {
        type:'stateChange', 
        newState: e.data, 
        newVideo: this.player.getVideoData().video_id, 
        newTime: this.player.getCurrentTime(),
      })
    if (typeof this.props.onStateChange === 'function') {
      this.props.onStateChange(e)
    }
  }

  componentWillUnmount() {
    if(this.socket) {
      this.socket.close();
    }
  }


  loadVideo() {
    if (this.state.idVal && this.player) {
      this.player.loadVideoById(this.state.idVal)
    } else if (this.player) {
      this.player.loadVideoById('QLOpdWMbebI')
    }
  }

  logPlayer() {
    //console.log(this.player)
    //window.player = this.player;
  }

  onIdValChange(e) {
    this.setState({idVal: e.target.value});
  }

  render () {
    return (
      <div>
        <section className='youtubeComponent-wrapper'>
          <div style={{width:'640px', height:'390px', display:'inline-block'}} ref={(r) => { this.youtubePlayerAnchorHost = r }}></div>
          <br />
        </section>
        <input type='text' value={this.state.idVal} onChange={this.onIdValChange}></input>
        <button onClick={this.loadVideo}>Load Video</button>
        <button onClick={this.logPlayer}>Log Player</button>
        <span> Now Hosting </span>
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

export default YTHost;