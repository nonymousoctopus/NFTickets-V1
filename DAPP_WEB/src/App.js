//import logo from './logo.svg';
//import './App.css';

import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import {ethers} from 'ethers'


import './style.css'
import Arbitration from './views/arbitration'
import Home from './views/home'
import FAQs from './views/f-a-qs'
import MyEvents from './views/my-events'
import NFTicHeader from './components/n-f-tic-header'
import NFTicFooter from './components/n-f-tic-footer'




function App() {

  


  return (
    
    <Router>
      <div style={{minHeight:"100vh", display:"flex", flexDirection:"column"}}>
        <NFTicHeader/>
        
        <Routes>
          <Route element={<Arbitration />} exact path="/arbitration" />
          <Route element={<Home />} exact path="/" />
          <Route element={<FAQs />} exact path="/f-a-qs" />
          <Route element={<MyEvents />} exact path="/my-events" />
        </Routes>
        <NFTicFooter></NFTicFooter>
      </div>
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
