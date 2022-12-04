import React, { useState } from 'react'
import Modal from 'react-modal';
import { ethers } from "ethers";
import { NFTStorage, File } from 'nft.storage'
import { useFormik } from 'formik';
import * as yup from 'yup';


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

const reviewSchema = yup.object({});




// Event quick view: key = itemId, name = name, sold = totalSales, price = price, tickets on sale = amount, event start = need to get from ipfs, status = status, image = image
const PurchasedEventQuickView = (props) => {

  function eventSelection (id) {
    openModalShowPurchasedEvent();
  }

  const [modalShowPurchasedEventOpen, setModalShowPurchasedEventOpen] = useState(false);
  function openModalShowPurchasedEvent() {
    setModalShowPurchasedEventOpen(true);
  }
  function closeModalShowPurchasedEvent() {
    setModalShowPurchasedEventOpen(false);
  }

  /***************************** */
  // SUBMIT DISPUTE ACTIONS 
  /***************************** */

  async function lodgeDisputeFunction (itemId) {
    console.log('entered test function')
    let temp = itemId.itemId.toNumber();
    console.log(disputeTempImage.file.name);
    setProcessing("Your dispute is being submitted, you will need to authorise a transactions in metamask.");
    console.log('Starting ipfs image upload test');
    const client = new NFTStorage({ token: NFT_STORAGE_KEY });
    const imageFile = new File([ disputeTempImage.file ], disputeTempImage.file.name, { type: disputeTempImage.file.type }); // image
    const metadata = await client.store({
      name: disputeTempImage.file.name,
      description: 'Dispute evidence submitted by purchaser',
      image: imageFile,
    });
    console.log('finished ipfs upload');
    let lat = 5;
    let lon = 5;
    let time = new Date().getTime();
    const contractWithSigner = arbitrationContract.connect(signer);
    console.log('begining dispute onchain');
    let tx = await contractWithSigner.lodgeDispute(itemId.itemId.toNumber(), lat, lon, time, metadata.url);     
    let receipt = await tx.wait(1)
    console.log(receipt);
    console.log('submitted dispute');
    setProcessing(null);
  }

  const [processing, setProcessing] = useState(null);

  const [disputeTempImage, setDisputeTempImage] = useState();
  const readFiles = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setDisputeTempImage({...disputeTempImage, file: files[0]});
    }
    console.log(disputeTempImage);
  };
 




  const { price, name, image, tokenId, start, location, startFull, finish, description, nftContract, itemId, amount } = props;
  return (
    <div>
    <Modal isOpen={modalShowPurchasedEventOpen} onRequestClose={closeModalShowPurchasedEvent} ariaHideApp={false} contentLabel="Create Event Modal">
        <div className="my-events-show-my-event">
        <div className="my-events-container1">
          <button className="my-events-button button" onClick={closeModalShowPurchasedEvent}>
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
              <span className="my-events-text19">Price:</span>
              <span className="my-events-text20">${price/100}</span>
            </div>
            <div className="my-events-event-location-row6">
              <span className="my-events-text23">Description:</span>
              <span className="my-events-text24">
                {description}
              </span>
            </div>
            <h1 className="my-events-seller-actions">
              <span>Lodge a dispute:</span>
              <br></br>
            </h1>
            <span className='evidence-label'>Evidence:</span>
            <form className='event-dispute-form'>
            
            <div className='evidence-input'>
            <input type="file" onChange={readFiles} />
            </div>

            <button className="evidence-button button" onClick={() => lodgeDisputeFunction({itemId})}>
              Lodge dipute
            </button>
            </form>
            <span className='processing-dispute'>{processing}</span>
            
            
          </div>
        </div>
      </div>
      </Modal>
    <div className={`event-quick-view-gallery-card ${props.rootClassName} `} onClick={() => eventSelection({tokenId})}>
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
            Location: {location}
          </span>
          <span id="event_location" className="event-quick-view-text1">
            Date: {start}
          </span>
          <span id="event_location" className="event-quick-view-text1">
            Finish: {finish}
          </span>
        </div>
        <div className="event-quick-view-container2">
          <span id="event_location" className="event-quick-view-text2">
            ${price/100}
          </span>
          <span id="event_location" className="event-quick-view-text3">
            {amount} tickets purchased
          </span>
        </div>
      </div>
    </div>
    </div>
  )
}

PurchasedEventQuickView.defaultProps = {
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

PurchasedEventQuickView.propTypes = {
  event_price: PropTypes.string,
  image_alt: PropTypes.string,
  event_name: PropTypes.string,
  event_spots: PropTypes.string,
  image_src: PropTypes.string,
  event_purchasers: PropTypes.string,
  event_date1: PropTypes.string,
  rootClassName: PropTypes.string,
}

export default PurchasedEventQuickView
