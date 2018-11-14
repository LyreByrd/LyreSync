import React from 'react'
import io from 'socket.io-client';

let loadYT

class YTHost extends React.Component {
  constructor(props) {
    super(props);
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
  }
  componentDidMount () {
    this.socket = io();
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
          onStateChange: this.onPlayerStateChange
        }
      })
    })
  }

  onPlayerStateChange(e) {
    this.socket.emit('hostAction', {type:'stateChange', newVal: e.data})
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
      <section className='youtubeComponent-wrapper'>
        <div style={{width:'640px', height:'390px', display:'inline-block'}} ref={(r) => { this.youtubePlayerAnchorHost = r }}></div>
        <br />
        <button onClick={this.loadVideo}>Load Video</button>
        <button onClick={this.logPlayer}>Log Player</button>
        <span> Now Hosting </span>
      </section>
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