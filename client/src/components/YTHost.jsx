import React from 'react'
import io from 'socket.io-client';

let loadYT

class YTHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoQueue: [],
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
  }
  componentDidMount () {
    this.socket = io();
    this.socket.on('initPing', () => {
      this.socket.emit('claimHost');
    })
    this.socket.on('findInitStatus', (socketId) => {
      console.log('client attempting to initialize, id: ' + socketId)
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
    if (!loadYT) {
      window.YT = {};
      loadYT = new Promise((resolve) => {
        console.log('Host trying to add a script')
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        this.YTScript = tag;
        window.onYouTubeIframeAPIReady = () => resolve(window.YT)
      })
    }
    loadYT.then((YT) => {
      console.log('loadYT\'s .then fired in host')
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
    console.log(this.player.getPlaybackRate());
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
    this.socket.close();
  }


  loadVideo() {
    this.player.loadVideoById('QLOpdWMbebI')
  }

  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  render () {
    return (
      <div>
        <section className='youtubeComponent-wrapper'>
          <div style={{width:'640px', height:'390px', display:'inline-block'}} ref={(r) => { this.youtubePlayerAnchorHost = r }}></div>
          <br />
        </section>
        <input type='text'></input>
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