import React,  { Component } from 'react';

export default class App extends Component {
  render() {
    return <div className="container">
      <div>
        <h1>Hello World! 📦 🚀</h1>
        <h2>{this.props.something}</h2>
      </div>
    </div>;
  }
}