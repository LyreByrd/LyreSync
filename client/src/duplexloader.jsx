import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

let loadHost, loadClient, loadFile;

let HostComponent = () => <div></div>;
HostComponent.loaded = false;

let ClientComponent = () => <div></div>;
ClientComponent.loaded = false;

let ActiveComponent = () => <div></div>;

let components = {
  spotify: {
    host: {loaded: false},
    client: {loaded: false},
  },
  youtube: {
    host: {loaded: false},
    client: {loaded: false},
  }
}

class Loader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      subProps: {
          resetToLobby: this.resetToLobby.bind(this), 
          hostingName: 'LNB',
          sessionHost: 'LNB',
          env: 'dev',
        },
      hostLoaded: false,
      clientLoaded: false,
      inSession: false,
      isHosting: false,
      service: 'youtube',
      activeLoaded: false,
      isLoading: false,
    }
    this.onClick = this.onClick.bind(this);
    //this.hostComponentReady = this.hostComponentReady.bind(this);
    //this.clientComponentReady = this.clientComponentReady.bind(this);
    this.tryClaimHost = this.tryClaimHost.bind(this);
    this.joinSession = this.joinSession.bind(this);
    this.newComponentReady = this.newComponentReady.bind(this);

  }

  resetToLobby(err) {
    //console.log('reset to lobby', err);
    this.setState({inSession: false, isHosting: false});
  }

  onClick(type, service) {
    this.setState({inSession: false, isHosting: false}, () => {
      if (components[service][type].loaded !== false) {
        this.setState({activeLoaded: true, service: service, isHosting: (type === 'host')}, () => {
          this.newComponentReady(null, type, service);
        });
      } else if (this.state.isLoading === false) {
        this.setState({isLoading: true}, () => {
          components[service][type].loadFile = new Promise((resolve) => {
            const tag = document.createElement('script')
            let src = `api/player/${type}/${service}`;
            console.log('src: ' + src);
            tag.src = src;
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
            if(type === 'host') {
              window.hasHostComponent = (NewComponent) => this.newComponentReady(NewComponent, type, service);
            } else if (type === 'client') {
              window.hasClientComponent = (NewComponent) => this.newComponentReady(NewComponent, type, service);
            }
          });
        });
      }
    })
  }

  newComponentReady(NewComponent, userType, service) {
    if (NewComponent) {
      console.log(components);
      console.log(`usertype: ${userType}, service: ${service}`);
      console.log(components[service])
      components[service][userType] = NewComponent;
    }
    this.setState({activeLoaded: true, isLoading: false}, () => {
      ActiveComponent = components[service][userType];
      console.log('usertype: ', userType)
      if (userType === 'host') {
        console.log('claiming host in newComponentReady');
        this.tryClaimHost();
      } else {
        this.joinSession();
      }
    })
  }

  tryClaimHost() {
    axios.post('/host', {hostingName: 'LNB', service: this.state.service, env: 'dev'})
      .then((res) => {
        //console.log('host claim response: ', res);
        if(res.data.hostName === this.state.subProps.hostingName) {
          //console.log('setting state to in session')
          this.setState({inSession: true, isHosting: true}, 
            () => undefined //console.log(this.state.inSession)
          );
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
      <button onClick={() => this.onClick('host', 'youtube')}>Load Host (YT)</button>
      <button onClick={() => this.onClick('client', 'youtube')}>Load Client (YT)</button>
      <button onClick={() => this.onClick('host', 'spotify')}>Load Host (Spot)</button>
      <button onClick={() => this.onClick('client', 'spotify')}>Load Client (Spot)</button>
      {this.state.inSession ? 
        <ActiveComponent {...this.state.subProps} /> :
        <div id='player-window'></div>}
    </div>
  }
}


ReactDOM.render(<Loader />, document.getElementById('app'));
