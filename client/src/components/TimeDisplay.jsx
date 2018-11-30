import React from 'react';

// this is going to need to be replaced, but it works enough for internal use

class TimeDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTime: 0,
    }
    this.onTimeInputChange = this.onTimeInputChange.bind(this);
  }

  onTimeInputChange(e) {
    this.setState({newTime: e.target.value});
  }

  render() {
    if (isNaN(this.props.currentPlayingDuration)) {
      return <br />;
    }
    let playingLength = Math.round(this.props.currentPlayingDuration / 1000);
    let timesetter = ''
    if (this.props.isHost) {
      timesetter = (
        <form onSubmit={(event => {
          event.preventDefault();
          if(!isNaN(this.state.newTime)) {
            this.props.setTime(this.state.newTime);
          }
        })}>
          <input type='number' name='time' min='0' max='playingLength' value={this.state.newTime} onChange={this.onTimeInputChange}></input>
          <button>New Time</button>
        </form>
      )
    }
    return (<div>
      {timesetter}
      Current position: {Math.round(this.props.playerTime / 1000)} seconds, of {playingLength}
    </div>);
  }
}

export default TimeDisplay;