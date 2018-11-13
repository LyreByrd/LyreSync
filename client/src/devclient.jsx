import React from 'react';
import ReactDOM from 'react-dom';
import Lobby from './components/Lobby.jsx';

class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: true,
    }
  }

  render() {
    if (this.state.valid) {
      return <Lobby />
    } else {
      return <div>No idea how you got here.</div>
    }
  }
}


ReactDOM.render(<Test />, document.getElementById('app'));