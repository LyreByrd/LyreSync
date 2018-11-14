import React from 'react';
import ReactDOM from 'react-dom';
import Lobby from './components/Lobby.jsx';

class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: true,
      sessionHost: null,
      inSession: false,
      isHost: false,
    }
  }

  render() {
    if (this.state.valid) {
      return <Lobby inSession={this.state.inSession} isHost={this.state.isHost} />
    } else {
      return <div>No idea how you got here.</div>
    }
  }
}


ReactDOM.render(<Test />, document.getElementById('app'));