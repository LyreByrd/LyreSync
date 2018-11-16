import React from 'react';
import ReactDOM from 'react-dom';
import YTHost from './components/YTHost.jsx';


class HostWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      mounted: false,
    }
    this.act.bind(this);
  }

  act() {
  }
  componentDidMount() {
  }
  render() {
    return <div>
      <YTHost {...this.props} />
    </div>
  }
}

//export default HostWindow;
//ReactDOM.render(<HostWindow />, document.getElementById('player-window'));
if(window.hasHostComponent) {
  console.log('host window gets defined')
  window.hasHostComponent(HostWindow);
}