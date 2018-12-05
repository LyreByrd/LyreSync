import React from 'react';
import RelativeClickListener from './RelativeClickListener.jsx';


class TimeDisplayBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTime: null,
    }
    this.displayWidth = props.displayWidth || 200;
    this.onTimeInputChange = this.onTimeInputChange.bind(this);
    this.timeFromClick = this.timeFromClick.bind(this);
  }
  
  timeFromClick(e) {
    console.log('X of click: ', e.clientX); //might this be the actual thing? 
    //element.clientWidth maybe...
    let leftEdge = e.target.getBoundingClientRect().left;
    console.log('left position maybe: ', leftEdge)
    console.log('offsetWidth: ', e.target.offsetWidth);
    console.log('clientWidth: ', e.target.clientWidth);
    let clickPercent = (e.clientX - leftEdge) / e.target.clientWidth;
    console.log('Percentage in: ', clickPercent)
    console.log('Possible desired time: ', clickPercent * this.props.currentPlayingDuration);
    let targetTime = clickPercent * this.props.currentPlayingDuration / 1000;
    this.props.setTime(targetTime);
  }

  onTimeInputChange(e) {
    this.setState({newTime: e.target.value});
  }

  startTimesetterFloat(e) {

  }

  render() {
    let msLength = this.props.currentPlayingDuration; 
    let secLength = Math.round(msLength / 1000)
    let percentDone = msLength ? 100 * Math.min(this.props.playerTime / msLength, 1) : 0;
    let timesetter = null;
    if (this.props.isHost) {
      timesetter = (<div 
        className='timesetter' 
        style={{background:'black', height:'100%', width:'4px', position:'relative', left: percentDone + '%'}}
      />)
    }
    let clickListener = null;
    if (this.props.isHost) {
      clickListener = <RelativeClickListener handleClick={this.timeFromClick} />;
    }
    return (<div className ='time-display' style={{padding: '20px'}}>
       <div 
        className={'time-display-holder'} 
        style={{height: '20px', width: '200px', border: '1px black solid'}}
        >
        {clickListener}
        <div style={{'height': '100%', 'width': percentDone + '%', 'background':'red', position: 'relative', top:'0', left:'0'}} /> 
        {timesetter}
      </div>
      Current position: {Math.round(this.props.playerTime / 1000)} seconds, of {secLength}
    </div>);
  }
}

export default TimeDisplayBar;