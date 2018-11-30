import React from 'react';
// import ReactDOM from 'react-dom';
import SpotifyHost from './components/SpotifyHost.jsx';


class SpotifyHostWindow extends React.Component {
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
      {this.state.mounted ? <SpotifyHost {...this.props} /> : 'Loading...'}
    </div>) 
  }
}

//export default HostWindow;
//ReactDOM.render(<HostWindow />, document.getElementById('player-window'));
if(window.hasHostComponent) {
  //console.log('host window gets defined')
  window.hasHostComponent(SpotifyHostWindow);
}