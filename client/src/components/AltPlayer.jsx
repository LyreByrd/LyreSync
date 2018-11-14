import React from 'react'
import io from 'socket.io-client';
import { runInThisContext } from 'vm';

let loadYT

class YTPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.loadVideo = this.loadVideo.bind(this);
    this.logPlayer = this.logPlayer.bind(this);
    this.onPlayerReady = this.onPlayerReady.bind(this);
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
        },
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange
        }
      })
    })
  }

  onPlayerReady() {
    this.socket = io();
    this.socket.on('hostAction', event => {
      if(event.type === 'stateChange') {
        if(event.newVal === 2) {
          this.player.pauseVideo();
        } else if (event.newVal === 1) {
          this.player.playVideo();
        }
      }
      console.log(event);
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
    this.player.loadVideoById('QLOpdWMbebI')
  }

  logPlayer() {
    console.log(this.player)
    window.player = this.player;
  }

  render () {
    return (
      <section className='youtubeComponent-wrapper'>
        <div ref={(r) => { this.youtubePlayerAnchor = r }}></div>
        <br />
        <button onClick={this.loadVideo}>Load Video</button>
        <button onClick={this.logPlayer}>Log Player</button>
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

export default YTPlayer;