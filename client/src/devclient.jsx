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
      hostingName: '',
      knownSessions: [],
    }
    this.tryClaimHost = this.tryClaimHost.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.fetchActiveSessions = this.fetchActiveSessions.bind(this);
    this.leaveSession = this.leaveSession.bind(this);
    this.hostNameTextChange = this.hostNameTextChange.bind(this);
    this.resetToLobby = this.resetToLobby.bind(this);
  }

  resetToLobby() {
    this.setState({
      sessionHost: null,
      inSession: false,
      isHost: false,
      knownSessions: [],
    })
  }

  leaveSession() {
    this.setState({
      sessionHost: null,
      inSession: false,
      isHost: false,
    })
  }

  tryClaimHost() {
    //console.log('attempting to host as ' + this.state.hostingName)
    axios.post('/host', {hostingName: this.state.hostingName})
      .then((res) => {
        //console.log('host claim response: ', res);
        if(res.data.hostName === this.state.hostingName) {
          this.setState({inSession: true, isHost: true});
        }
      })
      .catch((err) => {
        if(err.response.status === 403) {
          alert('Host claimed or in dispute');
        } else {
          console.error(err);
        }
      });
  }

  joinSession(hostName) {
    this.setState({inSession: true, isHost: false, sessionHost: hostName});
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

  hostNameTextChange(e) {
    this.setState({hostingName: e.target.value});
  }

  render() {
    if (this.state.valid) {
      return (
        <Lobby 
          inSession={this.state.inSession} 
          isHost={this.state.isHost} 
          tryClaimHost={this.tryClaimHost}
          joinSession={this.joinSession}
          sessionHost={this.state.sessionHost}
          knownSessions={this.state.knownSessions}
          hostingName={this.state.hostingName}
          hostNameTextChange={this.hostNameTextChange}
          resetToLobby={this.resetToLobby}
        />
      )
    } else {
      return <div>No idea how you got here.</div>
    }
  }
}


ReactDOM.render(<Test />, document.getElementById('app'));