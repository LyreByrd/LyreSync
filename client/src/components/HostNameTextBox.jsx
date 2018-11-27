import React from 'react';

class HostNameTextBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(event, service) {
    if (event) {
      event.preventDefault();
      this.props.tryClaimHost('youtube');
    } else {
      this.props.tryClaimHost(service);
    }
  }
  render() {
    return (<div>
      <form onSubmit={this.handleSubmit}>
        <input type='text' placeholder='Name to host with' value={this.props.hostingName} onChange={this.props.hostNameTextChange} />
        <button type='submit'>Claim host if available (YouTube)</button>
      </form >
      <button onClick={() => this.handleSubmit(null, 'spotify')}>Host with Spotify</button>
    </div>)
  }
}

export default HostNameTextBox;