import React from 'react';
//import ReactDOM from 'react-dom';
import YTPlayer from './components/YTPlayer.jsx';


class ClientWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state= {
      mounted: false,
    }
  }
  componentDidMount() {
    this.setState({mounted: true});
  }
  render() {
    return <div>
      {this.state.mounted ? <YTPlayer {...this.props} /> : 'Loading...'}
    </div>
  }
}

export default ClientWindow;
//ReactDOM.render(<ClientWindow />, document.getElementById('player-window'));