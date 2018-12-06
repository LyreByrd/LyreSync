import React from 'react';
import io from 'socket.io-client';
import getVideoId from 'get-video-id';
import YTVideoQueue from './YTVideoQueue.jsx';
import YTSearchResults from './YTSearchResults.jsx';
import { debounce } from 'debounce';
import { Dropdown, Icon, Menu, Input } from 'semantic-ui-react';

let HOME_URL, SOCKET_PORT, FEED_URL, FEED_PORT;
try {
  let config = require('../../../config.js');
  HOME_URL = config.HOME_URL;
  SOCKET_PORT = config.SOCKET_PORT;
  FEED_URL = config.FEED_PORT;
  FEED_PORT = config.FEED_PORT;
} catch (err) {
  HOME_URL = 'localhost';
  SOCKET_PORT = 9001;
  FEED_URL = 'localhost';
  FEED_PORT = 8080;
}

let loadYT;

class YTHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoQueue: [],
      searchResults: [],
      idVal: '',
      hasErrored: false,
      expectUnstarted: false,
    };
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlaybackRateChange = this.onPlaybackRateChange.bind(this);
    //this.loadVideo = this.loadVideo.bind(this);
    //this.logPlayer = this.logPlayer.bind(this);
    this.onIdValChange = this.onIdValChange.bind(this);
    this.addToQueue = this.addToQueue.bind(this);
    this.addSearchResultToQueue = this.addSearchResultToQueue.bind(this);
    this.sendSearchRequest = this.sendSearchRequest.bind(this);
    this.emitVideoData = this.emitVideoData.bind(this);
    this.loadNextVideo = this.loadNextVideo.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
  }

  componentDidMount() {
    let props = this.props;
    //console.log(this.props)
    this.socket = io(`http://${HOME_URL}:${SOCKET_PORT}`); //io(`/${this.props.hostingName}`); namespace implementation
    console.log('feed port: ' + FEED_PORT);
    if (FEED_PORT === 'inactive') {
      console.log('make no port');
      this.feedSocket = {
        emit: () => undefined,
      };
    } else {
      this.feedSocket = io(`http://${FEED_URL}:${FEED_PORT}`);
    }

    this.socket.on('initPing', () => {
      //console.log('claiming host, name: ' + props.hostingName);
      this.socket.emit('claimHost', {
        host: props.hostingName,
        service: 'youtube',
        hostTimestamp: props.hostTimestamp,
      });
    });
    this.socket.on('findInitStatus', socketId => {
      //console.log('client attempting to initialize, id: ' + socketId)
      if (!this.player) {
        this.socket.emit('sendInitStatus', {
          status: 'loadingPlayer',
          socketId,
        });
      } else {
        let currentState = {
          videoId: this.player.getVideoData().video_id,
          time: this.player.getCurrentTime(),
          state: this.player.getPlayerState(),
          rate: this.player.getPlaybackRate(),
        };
        this.socket.emit('sendInitStatus', { status: currentState, socketId });
      }
    });
    this.socket.on('hostingError', err => {
      //console.log('got host error');
      this.setState({ hasErrored: true }, () => {
        setTimeout(() => this.props.resetToLobby(err), 5000);
      });
    });
    this.socket.on('gotSearchResults', data => {
      if (data.status === 'forbidden') {
        this.setState({ searchResults: null });
      } else if (data.mode === 'id') {
        if (data.items[0]) {
          data.items[0].id = { videoId: data.videoId };
          this.addSearchResultToQueue(data.items[0]);
        } else {
          //no such video
        }
      } else if (data.mode === 'search') {
        console.log('search results: ', data);
        this.setState({ searchResults: data.items });
      }
    });
    //this.socket.on('log', data => console.log('logging data: ', data))

    if (!loadYT) {
      window.YT = {};
      loadYT = new Promise(resolve => {
        //console.log('Host trying to add a script')
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        this.YTScript = tag;
        window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      });
    }
    loadYT.then(YT => {
      //console.log('loadYT\'s .then fired in host')
      this.player = new YT.Player(this.youtubePlayerAnchorHost, {
        height: this.props.height || 390,
        width: this.props.width || 640,
        videoId: this.props.YTid,
        events: {
          //          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange,
          onPlaybackRateChange: this.onPlaybackRateChange,
        },
      });
    });
  }

  //  onPlayerReady() {
  //  }

  onPlaybackRateChange() {
    //console.log(this.player.getPlaybackRate());
    this.socket.emit('hostAction', {
      type: 'rateChange',
      newSpeed: this.player.getPlaybackRate(),
    });
  }

  onPlayerStateChange(e) {
    console.log('state change to ', e.data);
    if (e.data === 0) {
      if (this.state.videoQueue[1]) {
        this.loadNextVideo();
      } else {
        //video ended, no video in queue - no action needed
      }
    } else if (e.data === -1) {
      if (this.state.expectUnstarted) {
        console.log('skipping expected unstarted');
        this.setState({ expectUnstarted: false });
      } else if (this.state.videoQueue[1]) {
        this.loadNextVideo();
      } else {
        //see above
      }
    } else {
      this.socket.emit('hostAction', {
        type: 'stateChange',
        newState: e.data,
        newVideo: this.player.getVideoData().video_id,
        newTime: this.player.getCurrentTime(),
      });
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.timedUpdates) {
      clearInterval(this.timedUpdates);
    }
  }

  /* old, direct video loading - replaced by loadNextVideo
  loadVideo(id) {
    if (id) {
      this.player.loadVideoById(id);
      this.emitVideoData(id);
    } else {
      this.player.loadVideoById(this.state.videoQueue[0]);
      this.emitVideoData(this.state.videoQueue[0].vidId);
      this.setState({ videoQueue: this.state.videoQueue.slice(1) });
    }
    let videoData = {
      host: this.props.hostingName,
      id: id,
    };
  }
*/

  loadNextVideo() {
    //console.log('loading next from ', this.state.videoQueue)
    if (this.player) {
      if (this.state.videoQueue[1]) {
        this.emitVideoData(this.state.videoQueue[1].videoId);
        //console.log('skipping to next', this.state.videoQueue[1])
        this.setState(
          { videoQueue: this.state.videoQueue.slice(1), expectUnstarted: true },
          () => {
            this.player.loadVideoById(this.state.videoQueue[0].videoId);
          },
        );
      } else if (this.state.videoQueue[0]) {
        this.emitVideoData(this.state.videoQueue[0].videoId);
        //console.log('loading first in queue')
        this.player.loadVideoById(this.state.videoQueue[0].videoId);
      }

      if (!this.timedUpdates) {
        this.startTimedUpdates();
      }
    }
  }

  startTimedUpdates() {
    this.timedUpdates = setInterval(() => {
      this.socket.emit('hostAction', {
        type: 'stateChange',
        newState: this.player.getPlayerState(),
        newVideo: this.player.getVideoData().video_id,
        newTime: this.player.getCurrentTime(),
        newSpeed: this.player.getPlaybackRate(),
      });
    }, 5000);
  }

  //gotInvalidIdPattern() {
  //  console.log('try again buddy');
  //}

  //logPlayer() {
  //  console.log(this.player)
  //  window.player = this.player;
  //}

  onIdValChange(e) {
    //should be replaced with a GenericTextBox...
    this.setState({ idVal: e.target.value });
  }

  addToQueue(event) {
    //console.log(this.state.videoQueue);
    event.preventDefault();
    //console.log('Hit Queue Button');
    let newId;
    if (this.state.idVal) {
      if (this.state.idVal.length === 11) {
        newId = this.state.idVal;
      } else {
        let { id, service } = getVideoId(this.state.idVal);
        if (service === 'youtube' && id) {
          newId = id;
        } else {
          newId = 'Invalid pattern';
        }
      }
    } else {
      newId = 'QLOpdWMbebI';
    }

    if (newId !== 'Invalid pattern') {
      this.sendSearchRequest(newId, 'id');
      //let state = this.player.getPlayerState();
      //if (this.player && (state === 0 || state === -1 || state === 5)) {
      //  this.setState({videoQueue: this.state.videoQueue.concat([{videoId: newId, queueTimestamp: Date.now()}])}, () => {
      //    this.loadNextVideo();
      //  })
      //} else {
      //  this.setState({videoQueue: this.state.videoQueue.concat([{videoId: newId, queueTimestamp: Date.now()}])});
      //}
    }
  }

  handleNextClick() {
    this.loadNextVideo();
  }

  addSearchResultToQueue(searchResult) {
    //console.log('attempting to add result to queue:', searchResult);
    const newQueueEntry = {
      queueTimestamp: Date.now(),
      videoId: searchResult.id.videoId,
      title: searchResult.snippet.title,
      snippet: searchResult.snippet,
    };
    this.setState(
      { videoQueue: this.state.videoQueue.concat([newQueueEntry]) },
      () => {
        let state;
        if (this.player) {
          state = this.player.getPlayerState();
        }
        if (state === 0 || state === -1 || state === 5) {
          this.loadNextVideo();
        }
      },
    );
  }

  sendSearchRequest(term, mode = 'search') {
    //console.log('Attempting to search for ' + term);
    this.socket.emit('sendSearchRequest', { term, mode });
  }

  emitVideoData(id) {
    //console.log('id :', id);
    let videoData = {
      id: id,
      host: this.props.hostingName,
    };
    this.feedSocket.emit('video data', videoData);
  }

  render() {
    return (
      <React.Fragment>
        <div className="player">
          <div
            className="player-window"
            ref={r => {
              this.youtubePlayerAnchorHost = r;
            }}
          />
        </div>
        <div className="controls">
          <form onSubmit={this.addToQueue}>
            <input
              type="text"
              name="YTLocation"
              value={this.state.idVal}
              placeholder="  YouTube link, embed code, or video ID:"
              onChange={this.onIdValChange}
            />
            <button>Add to Queue</button>
          </form>
          <button
            className="next-queue-btn next-queue-btn-yt"
            onClick={this.handleNextClick}>
            Skip to Next in Queue
          </button>
          <YTVideoQueue videoQueue={this.state.videoQueue} />
          <YTSearchResults
            searchResults={this.state.searchResults}
            addSearchResultToQueue={this.addSearchResultToQueue}
            sendSearchRequest={this.sendSearchRequest}
          />
          <button onClick={this.logPlayer}>log</button>
          <span>
            {' '}
            {this.state.hasErrored
              ? 'Error connecting to session. Attempting to refresh'
              : 'Now Hosting'}{' '}
          </span>
        </div>
        <style jsx>{`
          .player {
            margin-top: 10px;
            height: 60vh;
            width: 60vw;
            margin: 5px;
          }
          .player-window {
            height: 100%;
            width: 100%;
          }

          .controls {
            border: 1px solid black;
          }
        `}</style>
      </React.Fragment>
    );
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
