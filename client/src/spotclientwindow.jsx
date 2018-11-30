import React from 'react';
// import ReactDOM from 'react-dom';
import SpotifyClient from './components/SpotifyClient.jsx';


class SpotifyClientWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      mounted: false,
    }
  }
  componentDidMount() {
    this.setState({mounted: true});
  }
  render() {
    return (<div>
      {this.state.mounted ? <SpotifyClient {...this.props} /> : 'Loading...'}
    </div>) 
  }
}

//export default ClientWindow;
//ReactDOM.render(<ClientWindow />, document.getElementById('player-window'));
if(window.hasClientComponent) {
  //console.log('client window gets defined')
  window.hasClientComponent(SpotifyClientWindow);
}