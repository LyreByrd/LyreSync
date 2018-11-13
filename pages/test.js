import React from 'react';
import Lobby from '../components/Lobby.js';

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

export default Test;