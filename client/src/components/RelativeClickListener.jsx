import React from 'react';

const RelativeClickListener = (props) => {
  //console.log('listener onClick: ', props.handleClick);
  return (
    <div 
      onClick={props.handleClick} 
      style={ {
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top:'0', 
        left:'0',
       //visibility:'hidden',
       'zIndex': '5',
      }}
    />
  )
}

export default RelativeClickListener;