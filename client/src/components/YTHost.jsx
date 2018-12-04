import React from 'react'
import io from 'socket.io-client';
import getVideoId from 'get-video-id';
import YTVideoQueue from './YTVideoQueue.jsx';

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

class YTHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoQueue: [],
      idVal: '',
      hasErrored: false,
    }
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onIdValChange = this.onIdValChange.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
  }
  componentDidMount () {
    let props = this.props
    //console.log(this.props)
    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`, {secure: true}); //io(`/${this.props.hostingName}`); namespace implementation
    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('claimHost', {host: props.hostingName, service:'youtube'});
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
      this.setState({hasErrored: true}, () => {
        setTimeout(() => this.props.resetToLobby(err), 5000);
      });
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
    if(e.data === 0) {
      if (this.state.videoQueue[0]) {
        this.loadVideo()
      } else {
        //video ended, no video in queue - no action needed
      }
    } else if (e.data === -1) {
      if(this.state.videoQueue[0]) {
        this.loadVideo();
      } else {
        //see above
      }
    } else {
      this.socket.emit('hostAction', {
          type:'stateChange', 
          newState: e.data, 
          newVideo: this.player.getVideoData().video_id, 
          newTime: this.player.getCurrentTime(),
        })
    }
  }

  componentWillUnmount() {
    if(this.socket) {
      this.socket.close();
    }
  }


  loadVideo(id) {
    if(id) {
      this.player.loadVideoById(id);
    } else {
      this.player.loadVideoById(this.state.videoQueue[0]);
      this.setState({videoQueue: this.state.videoQueue.slice(1)});
    }
  }

  gotInvalidIdPattern() {
    console.log('try again buddy');
  }

  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  onIdValChange(e) {
    this.setState({idVal: e.target.value});
  }

  addToQueue(event) {
    event.preventDefault();
    console.log('Hit Queue Button');
    let newId;
    if (this.state.idVal) {
      if(this.state.idVal.length === 11) {
        newId = this.state.idVal;
      } else {
        let {id, service} = getVideoId(this.state.idVal);
        if(service === 'youtube' && id) {
          newId = id;
        } else {
          newId = 'Invalid pattern';
        }
      }
    }  else { 
      newId = 'QLOpdWMbebI';
    }

    if(newId !== 'Invalid pattern') {
      let state = this.player.getPlayerState();
      if (this.player && (state === 0 || state === -1 || state === 5)) {
        this.loadVideo(newId);
      } else {
        this.setState({videoQueue: this.state.videoQueue.concat([newId])})
      }
    }
  }

  render () {
    
    return (
      <div>
        <section className='youtubeComponent-wrapper'>
          <div style={{width:'640px', height:'390px', display:'inline-block'}} ref={(r) => { this.youtubePlayerAnchorHost = r }}></div>
          <br />
        </section>
        <form onSubmit={this.addToQueue}>
          <label htmlFor='YTLocation'>YouTube link, embed code, or video ID:</label>
          <br />
          <input type='text' name='YTLocation' value={this.state.idVal} onChange={this.onIdValChange}></input>
          <button>Add to Queue</button>
        </form>
        <YTVideoQueue videoQueue={this.state.videoQueue} />
        <button onClick={this.logPlayer}>log</button>
        <span> {this.state.hasErrored ? 'Error connecting to session. Attempting to refresh' : 'Now Hosting'} </span>
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