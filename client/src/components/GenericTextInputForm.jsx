import React from 'react';

class GenericTextInputForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      textInput: '',
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({textInput: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.state.textInput);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        {/* <input 
          type='text' 
          placeholder={this.props.placeholder || ''} 
          value={this.state.textInput} 
          onChange={this.handleChange} /> */}
          <div className="ui action input">
            <input 
            type="text" 
            placeholder={this.props.placeholder || 'Search...'}
            // buttontext={'Search for an album'}
            value={this.state.textInput} 
            onChange={this.handleChange}
            />
            <button 
            type='submit'
            className='ui button'
            >
            {/* {this.props.buttonText} */}
            Search
            </button>
          </div>
      </form >)
  }
}

export default GenericTextInputForm;