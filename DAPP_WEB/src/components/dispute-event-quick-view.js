import React, { useState } from 'react'
import Modal from 'react-modal';
import { ethers } from "ethers";
import { NFTStorage, File } from 'nft.storage'

import PropTypes from 'prop-types'

import './event-quick-view.css'

import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'
import NFTicketsUtils_abi from './../abis/NFTicketsUtils.json'
import NFTicketsArbitration_abi from './../abis/NFTicketsArbitration.json'

const provider = new ethers.providers.Web3Provider(window.ethereum)
//await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner()

const NFT_STORAGE_KEY = process.env.REACT_APP_NFT_STORAGE_KEY;

const marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
const ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
const utilsContract = new ethers.Contract(NFTicketsUtils_abi.address, NFTicketsUtils_abi.abi, signer);
const arbitrationContract = new ethers.Contract(NFTicketsArbitration_abi.address, NFTicketsArbitration_abi.abi, signer);


// Event quick view: key = itemId, name = name, sold = totalSales, price = price, tickets on sale = amount, event start = need to get from ipfs, status = status, image = image
const DisputeEventQuickView = (props) => {

  function disputeSelection (id) {
    openModalShowDispute();
  }

  const [modalShowDisputeOpen, setModalShowDisputeOpen] = useState(false);
  function openModalShowDispute() {
    setModalShowDisputeOpen(true);
  }
  function closeModalShowDispute() {
    setModalShowDisputeOpen(false);
  }

  /***************************** */
  // SUBMIT DISPUTE ACTIONS 
  /***************************** */

  async function voteForSeller (disputeId) {
    setProcessing("Submitting your vote, please approve a transaction");
    const contractWithSigner = arbitrationContract.connect(signer);
    let tx = await contractWithSigner.vote(disputeId, 2);     
    let receipt = await tx.wait(1)
    //console.log(receipt);
    setProcessing(null);
  }

  async function voteForBuyer (disputeId) {
    setProcessing("Submitting your vote, please approve a transaction");
    const contractWithSigner = arbitrationContract.connect(signer);
    let tx = await contractWithSigner.vote(disputeId, 1);     
    let receipt = await tx.wait(1)
    //console.log(receipt);
    setProcessing(null);
  }
  const [processing, setProcessing] = useState(null);

  const [disputeTempImage, setDisputeTempImage] = useState();
  const readFiles = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setDisputeTempImage({...disputeTempImage, file: files[0]});
    }
    //console.log(disputeTempImage);
  };
 
  const { itemId, name, sold, disputers, location, startFull, finish, price, offered, evidence, image, disputeId, status, reason } = props;
  return (
    <div>
    <Modal isOpen={modalShowDisputeOpen} onRequestClose={closeModalShowDispute} ariaHideApp={false} contentLabel="Create Event Modal">
        <div className="my-events-show-my-event">
        <div className="my-events-container1">
          <button className="my-events-button button" onClick={closeModalShowDispute}>
            <svg
              viewBox="0 0 804.5714285714286 1024"
              className="my-events-icon"
            >
              <path d="M741.714 755.429c0 14.286-5.714 28.571-16 38.857l-77.714 77.714c-10.286 10.286-24.571 16-38.857 16s-28.571-5.714-38.857-16l-168-168-168 168c-10.286 10.286-24.571 16-38.857 16s-28.571-5.714-38.857-16l-77.714-77.714c-10.286-10.286-16-24.571-16-38.857s5.714-28.571 16-38.857l168-168-168-168c-10.286-10.286-16-24.571-16-38.857s5.714-28.571 16-38.857l77.714-77.714c10.286-10.286 24.571-16 38.857-16s28.571 5.714 38.857 16l168 168 168-168c10.286-10.286 24.571-16 38.857-16s28.571 5.714 38.857 16l77.714 77.714c10.286 10.286 16 24.571 16 38.857s-5.714 28.571-16 38.857l-168 168 168 168c10.286 10.286 16 24.571 16 38.857z"></path>
            </svg>
          </button>
          <img
            alt="image"
            src={image}
            className="my-events-image"
          />
          <div className="my-events-container2">
            <h1 className="my-events-text08">
              <span>{name}</span>
              <br></br>
            </h1>
            <div className="my-events-event-location-row">
              <span className="my-events-text11">Location:</span>
              <span className="my-events-text12">{location}</span>
            </div>
            <div className="my-events-event-location-row1">
              <span className="my-events-text13">Starts:</span>
              <span className="my-events-text14">{startFull}</span>
            </div>
            <div className="my-events-event-location-row2">
              <span className="my-events-text15">Finish:</span>
              <span className="my-events-text16">{finish}</span>
            </div>
            <div className="my-events-event-location-row4">
              <span className="my-events-text19">Tickets offered:</span>
              <span className="my-events-text20">{offered}</span>
            </div>
            <div className="my-events-event-location-row4">
              <span className="my-events-text19">Disputed by:</span>
              <span className="my-events-text20">{disputers}</span>
            </div>
            <div className="my-events-event-location-row4">
              <span className="my-events-text19">Reason:</span>
              <span className="my-events-text20">{reason}</span>
            </div>
            <div className="my-events-event-location-row4">
              <span className="my-events-text19">Evidence:</span>
              <span className="my-events-link"><a href={evidence} target="_blank">Attached here</a></span>
            </div>
            <h1 className="my-events-seller-actions">
              <span>Submit your vote:</span>
            </h1>
            <div className="arbitration-container7">
              <button className="arbitration-button1 button" onClick={() => voteForBuyer(disputeId)}>
                REFUND BUYER
              </button>
              <button className="arbitration-button2 button" onClick={() => voteForSeller(disputeId)}>
                PAY SELLER
              </button>
            </div>
            <span className='processing-dispute'>{processing}</span>
            
            
          </div>
        </div>
      </div>
      </Modal>
    <div className={`event-quick-view-gallery-card ${props.rootClassName} `} onClick={() => disputeSelection({disputeId})}>
      <img
        alt={props.image_alt}
        //src={props.image_src}
        src={image}
        loading="lazy"
        className="event-quick-view-image"
      />
      <h2 id="event_name" className="event-quick-view-heading">
        {name}
      </h2>
      <div className="event-quick-view-container">
        <div className="event-quick-view-container1">
          <span id="event_location" className="event-quick-view-text">
            Tickets Purchased: {sold}
          </span>
          <span id="event_location" className="event-quick-view-text1">
            Disputes: {disputers}
          </span>
          <span id="event_location" className="event-quick-view-text1">
            Status: {status}
          </span>
        </div>
        
      </div>
    </div>
    </div>
  )
}

DisputeEventQuickView.defaultProps = {
  event_price: '$7.77',
  image_alt: 'image',
  event_name: 'Event Title',
  //event_spots: '99',
  image_src:
    'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?ixid=Mnw5MTMyMXwwfDF8c2VhcmNofDEyfHxmb3Jlc3R8ZW58MHx8fHwxNjI2MjUxMjg4&ixlib=rb-1.2.1&w=1500',
  event_purchasers: 'Number of purchasers',
  event_date1: '7/7/2077',
  rootClassName: '',
}

DisputeEventQuickView.propTypes = {
  event_price: PropTypes.string,
  image_alt: PropTypes.string,
  event_name: PropTypes.string,
  event_spots: PropTypes.string,
  image_src: PropTypes.string,
  event_purchasers: PropTypes.string,
  event_date1: PropTypes.string,
  rootClassName: PropTypes.string,
}

export default DisputeEventQuickView
