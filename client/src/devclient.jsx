import React from 'react';
import ReactDOM from 'react-dom';
import Lobby from './components/Lobby.jsx';
import axios from 'axios';

class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: true,
      sessionHost: null,
      inSession: false,
      isHost: false,
      knownSessions: [],
    }
    this.tryClaimHost = this.tryClaimHost.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.fetchActiveSessions = this.fetchActiveSessions.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
  }

  leaveSession() {
    this.setState({
      sessionHost: null,
      inSession: false,
      isHost: false,
    })
  }

  tryClaimHost() {
    axios.post('/host')
      .then((res) => {
        this.setState({inSession: true, isHost: true});
      })
      .catch((err) => {
        if(err.response.status === 403) {
          alert('Host claimed or in dispute');
        } else {
          console.error(err);
        }
      });
  }

  joinSession() {
    this.setState({inSession: true, isHost: false});
  }

  fetchActiveSessions() {
    axios.get('/api/sessions')
      .then(res => {
        this.setState({knownSessions: res.data});
      })
      .catch(err => {
        console.error(err);
      })
  }

  componentDidMount() {
    this.fetchActiveSessions();
    this.lobbyInterval = setInterval(() => {
      if (this.state.inSession === false) {
        this.fetchActiveSessions();
      }
    }, 3000);
  }

  componentWillUnmount() {
    if (this.lobbyInterval) {
      clearInterval(this.lobbyInterval);
      delete this.lobbyInterval;
    }
  }

  render() {
    if (this.state.valid) {
      return (
        <Lobby 
          inSession={this.state.inSession} 
          isHost={this.state.isHost} 
          tryClaimHost={this.tryClaimHost}
          joinSession={this.joinSession}
          knownSessions={this.state.knownSessions}
        />
      )
    } else {
      return <div>No idea how you got here.</div>
    }
  }
}


ReactDOM.render(<Test />, document.getElementById('app'));