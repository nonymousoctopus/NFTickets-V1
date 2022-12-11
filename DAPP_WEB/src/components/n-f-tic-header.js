import React, { useState, useEffect } from 'react'

import {ethers} from 'ethers'

import PropTypes from 'prop-types'

import NFTicketsnavlinks from './n-f-ticketsnavlinks'
import './n-f-tic-header.css'
import logo from '../NFTickets_logo_wide.svg';

//const DEFAULT_LOGO = Image.resolveAssetSource(logo).uri;

const NFTicHeader = (props) => {

  const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet Test');

	const [currentContractVal, setCurrentContractVal] = useState(null);

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [contract, setContract] = useState(null);

  const connectWalletHandler = () => {
		if (window.ethereum && window.ethereum.isMetaMask) {

			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0]);
				setConnButtonText('Wallet Connected');
			})
			.catch(error => {
				setErrorMessage(error.message);
			
			});

		} else {
			console.log('Need to install MetaMask');
			setErrorMessage('Please install MetaMask browser extension to interact');
		}
	}

  const accountChangedHandler = (newAccount) => {
		setDefaultAccount(newAccount);
		updateEthers();
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}

  window.ethereum.on('accountsChanged', accountChangedHandler); // this was causing "max listeners exceeded warning" and a possible memory leak

	window.ethereum.on('chainChanged', chainChangedHandler); // this was causing "max listeners exceeded warning" and a possible memory leak

	const updateEthers = () => {
		let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
		setProvider(tempProvider);

		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);

		//let tempContract = new ethers.Contract(contractAddress, SimpleStorage_abi, tempSigner);
		//setContract(tempContract);	
	}

	const setHandler = (event) => {
		event.preventDefault();
		console.log('sending ' + event.target.setText.value + ' to the contract');
		contract.set(event.target.setText.value);
	}

  useEffect(() => {
    (async () => {
      connectWalletHandler();
    })();
  }, []);


  return (
    <div className="n-f-tic-header-n-f-tic-header">
      <header data-role="Header" className="n-f-tic-header-header-group">
        <img
          alt={props.image_alt}
          src={props.image_src}
          className="n-f-tic-header-image"
        />
        <div className="n-f-tic-header-nav">
          <NFTicketsnavlinks rootClassName="rootClassName10"></NFTicketsnavlinks>
        </div>
        <div className="n-f-tic-header-btn-group">
          <button
            id="btn_connect"
            name="btn_connect"
            className="n-f-tic-header-register button"
            onClick={connectWalletHandler}>{connButtonText}

          </button>
        </div>
        <div data-type="BurgerMenu" className="n-f-tic-header-burger-menu">
          <svg viewBox="0 0 1024 1024" className="n-f-tic-header-icon">
            <path d="M128 554.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 298.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667zM128 810.667h768c23.552 0 42.667-19.115 42.667-42.667s-19.115-42.667-42.667-42.667h-768c-23.552 0-42.667 19.115-42.667 42.667s19.115 42.667 42.667 42.667z"></path>
          </svg>
        </div>
        <div data-type="MobileMenu" className="n-f-tic-header-mobile-menu">
          <div className="n-f-tic-header-nav1">
            <div className="n-f-tic-header-container">
              <img
                alt={props.image_alt1}
                src={props.image_src1}
                className="n-f-tic-header-image1"
              />
              <div
                data-type="CloseMobileMenu"
                className="n-f-tic-header-menu-close"
              >
                <svg viewBox="0 0 1024 1024" className="n-f-tic-header-icon2">
                  <path d="M810 274l-238 238 238 238-60 60-238-238-238 238-60-60 238-238-238-238 60-60 238 238 238-238z"></path>
                </svg>
              </div>
            </div>
            <NFTicketsnavlinks rootClassName="rootClassName11"></NFTicketsnavlinks>
          </div>
        </div>
      </header>
    </div>
  )
}

NFTicHeader.defaultProps = {
  //image_src1: 'https://presentation-website-assets.teleporthq.io/logos/logo.png',
  //image_src: 'https://presentation-website-assets.teleporthq.io/logos/logo.png',
  image_src1: logo,
  image_src: logo,
  Register: 'Connect Wallet',
  image_alt1: 'image',
  image_alt: 'logo',
  Register1: 'Connect Wallet',
}

NFTicHeader.propTypes = {
  image_src1: PropTypes.string,
  image_src: PropTypes.string,
  Register: PropTypes.string,
  image_alt1: PropTypes.string,
  image_alt: PropTypes.string,
  Register1: PropTypes.string,
}

export default NFTicHeader
