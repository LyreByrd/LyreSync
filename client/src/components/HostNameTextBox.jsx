import React from 'react';

class HostNameTextBox extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  handleSubmit(event) {
    event.preventDefault();
    this.props.tryClaimHost();
  }
  render() {
    return (<div>
      <form onSubmit={this.handleSubmit}>
        <input type='text' placeholder='Name to host with' value={this.props.hostingName} onChange={this.props.hostNameTextChange} />
        <button type='submit' >Claim host if available</button>
      </form >
    </div>)
  }
}

export default HostNameTextBox;