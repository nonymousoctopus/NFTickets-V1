import logo from './logo.svg';
import './App.css';

import React from 'react'
import ReactDOM from 'react-dom'
//import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'


import './style.css'
import Home from './views/home'
import Item from './views/item'

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Home/>} exact path="/" />
        <Route element={<Item/>} exact path="/item" />
      </Routes>
  </Router>
    /*
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
    */
  );
}

export default App;
