import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

let loadHost, loadClient;

let HostComponent = () => <div></div>;
HostComponent.loaded = false;

let ClientComponent = () => <div></div>;
ClientComponent.loaded = false;

class Loader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      subProps: {
          resetToLobby: this.resetToLobby.bind(this), 
          hostingName: 'LNB',
          sessionHost: 'LNB',
        },
      hostLoaded: false,
      clientLoaded: false,
      inSession: false,
      isHosting: false,
    }
    this.onClick = this.onClick.bind(this);
    this.hostComponentReady = this.hostComponentReady.bind(this);
    this.clientComponentReady = this.clientComponentReady.bind(this);
    this.tryClaimHost = this.tryClaimHost.bind(this);
    this.joinSession = this.joinSession.bind(this);
  }

  resetToLobby(err) {
    console.log('reset to lobby', err);
    this.setState({inSession: false, isHosting: false});
  }

  onClick(type) {
    console.log('clicked ' + type)
    if(type === 'host') {
      if(HostComponent.loaded === false) {
        console.log('fetching host component');
        loadHost = new Promise((resolve) => {
          console.log('getting script');
          const tag = document.createElement('script')
          tag.src = '/api/player/host/'
          const firstScriptTag = document.getElementsByTagName('script')[0]
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
          this.hostScript = tag;
          window.hasHostComponent = (HostComponent) => this.hostComponentReady(HostComponent);
        })
      } else {
        this.hostComponentReady();
      }
    }
    if (type === 'client') {
      if(ClientComponent.loaded === false) {
        console.log('fetching client component');
        loadHost = new Promise((resolve) => {
          console.log('getting script');
          const tag = document.createElement('script')
          tag.src = '/api/player/client/'
          const firstScriptTag = document.getElementsByTagName('script')[0]
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
          this.clientScript = tag;
          window.hasClientComponent = (ClientComponent) => this.clientComponentReady(ClientComponent);
        })
      } else {
        this.ClientComponentReady();
      }
    }
  }
  clientComponentReady(newComponent) {
    window.hasClientComponent = () => undefined;
    if (newComponent) {
      ClientComponent = newComponent;
    }
    this.setState({clientLoaded: true}, this.joinSession);
  }
  hostComponentReady(newComponent) {
    window.hasHostComponent = () => undefined;
    if (newComponent) {
      HostComponent = newComponent;
    }
    this.setState({hostLoaded: true}, this.tryClaimHost);
  }
  tryClaimHost() {
    axios.post('/host', {hostingName: 'LNB'})
      .then((res) => {
        console.log('host claim response: ', res);
        if(res.data.hostName === this.state.subProps.hostingName) {
          console.log('setting state to in session')
          this.setState({inSession: true, isHosting: true}, () => console.log(this.state.inSession));
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
  joinSession() {
    this.setState({inSession: true, isHosting: false});
  }
  render() {
    return <div>
      <button onClick={() => this.onClick('host')}>Load Host</button>
      <button onClick={() => this.onClick('client')}>Load Client</button>
      {this.state.inSession ? 
        this.state.isHosting ? 
          <HostComponent {...this.state.subProps} /> : 
          <ClientComponent {...this.state.subProps} /> :
        <div id='player-window'></div>}
    </div>
  }
}


ReactDOM.render(<Loader />, document.getElementById('app'));
