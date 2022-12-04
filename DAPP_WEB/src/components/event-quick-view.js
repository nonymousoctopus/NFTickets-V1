import React, { useState } from 'react'
import Modal from 'react-modal';
import { ethers } from "ethers";
import { useFormik } from 'formik';
import * as yup from 'yup';

import PropTypes from 'prop-types'

import './event-quick-view.css'

import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'
import NFTicketsUtils_abi from './../abis/NFTicketsUtils.json'

const provider = new ethers.providers.Web3Provider(window.ethereum)
//await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner()

const marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
const ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
const utilsContract = new ethers.Contract(NFTicketsUtils_abi.address, NFTicketsUtils_abi.abi, signer);

const reviewSchema = yup.object({
  ticketQuantity: yup.number().integer().min(1)
});



// Event quick view: key = itemId, name = name, sold = totalSales, price = price, tickets on sale = amount, event start = need to get from ipfs, status = status, image = image
const EventQuickView = (props) => {
  const onSubmit = async (values, actions) => {
    await listMoreTicketsFunction(price, nftContract, tokenId, values.ticketQuantity, name)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    actions.resetForm();
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormik({
    initialValues: {
      ticketQuantity: "",
    },
    validationSchema: reviewSchema,
    onSubmit,
  });

  function eventSelection (id) {
    openModalShowMyEvent();
  }

  const [modalShowMyEventOpen, setModalShowMyEventOpen] = useState(false);
  function openModalShowMyEvent() {
    setModalShowMyEventOpen(true);
  }
  function closeModalShowMyEvent() {
    setModalShowMyEventOpen(false);
  }

  

  const listMoreTicketsFunction = async (priceInCents, nftContractAddress, tokenId, amount, name) => {
    //let ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
    const ticketContractWithSigner = ticketContract.connect(signer);
    let moreTickets = await ticketContractWithSigner.createMoreTokens(tokenId, amount, '0x00');

    let perTicketPrice = await utilsContract.getConversion(priceInCents);
    let listingFee = perTicketPrice * amount / 5;

    //let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
    const marketContractWithSigner = marketContract.connect(signer);
    let tx = await marketContractWithSigner.listMoreOfMarketItem(nftContractAddress, tokenId, amount, '0x00', name, {value: (listingFee.toString())});
  }

  const [address, setAddress] = useState("");
  function testFunction(values) {
    console.log(values);
  }

  const handleSubmitRefund = async (event) => {
    event.preventDefault();
    console.log(address);
    console.log(itemId);
    const marketContractWithSigner = marketContract.connect(signer);
    let tx = await marketContractWithSigner.sellerRefundOne(itemId.toString(), address.toString());
  }


//0xeFB8824157755b5d3e12f0a49CBf215B65BB91f6

  const { price, name, image, tokenId, sold, available, start, status, location, startFull, finish, description, nftContract, itemId } = props;
  return (
    <div>
    <Modal isOpen={modalShowMyEventOpen} onRequestClose={closeModalShowMyEvent} ariaHideApp={false} contentLabel="Create Event Modal">
        <div className="my-events-show-my-event">
        <div className="my-events-container1">
          <button className="my-events-button button" onClick={closeModalShowMyEvent}>
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
            <div className="my-events-event-location-row3">
              <span className="my-events-text17">Status:</span>
              <span className="my-events-text18">{status}</span>
            </div>
            <div className="my-events-event-location-row4">
              <span className="my-events-text19">Price:</span>
              <span className="my-events-text20">${price/100}</span>
            </div>
            <div className="my-events-event-location-row5">
              <span className="my-events-text21">Tickets sold:</span>
              <span className="my-events-text22">{sold}</span>
            </div>
            <div className="my-events-event-location-row5">
              <span className="my-events-text21">Tickets left:</span>
              <span className="my-events-text22">{available}</span>
            </div>
            <div className="my-events-event-location-row6">
              <span className="my-events-text23">Description:</span>
              <span className="my-events-text24">
                {description}
              </span>
            </div>
            <h1 className="my-events-seller-actions">
              <span>Seller actions:</span>
              <br></br>
            </h1>
            <form onSubmit={values => handleSubmit(values, price, nftContract, tokenId, name)} className="my-events-container3">
              <span className="my-events-text25">Tickets:</span>
              <div className="input-width-limit">
              <input
                value={values.ticketQuantity && values.ticketQuantity}
                onChange={handleChange}
                id="ticketQuantity"
                type="number"
                step="1"
                required
                placeholder="1"
                onBlur={handleBlur}
                className={errors.ticketQuantity && touched.ticketQuantity ? "input-error" : ""}
                />
              </div>
              <button className="my-events-button1 button" disabled={isSubmitting} type="submit">
                Add tickets to market
              </button>
            </form>
            
            <form className="my-events-container3" onSubmit={handleSubmitRefund}>
              <span className="my-events-text25">Refund:</span>
              <div className="input-width-limit">
              <input
                value={address}
                type="text"
                name="wallet-address"
                placeholder="0x..."
                className="my-events-input-refund"
                onChange={(e) => setAddress(e.target.value)}
              />
              </div>
              <button className="my-events-refund-button button" type="submit">
                Refund wallet
              </button>
            </form>
            <button className="my-events-refund-all-button button">
              REFUND ALL
            </button>
            
            
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
            Status: {status}
          </span>
        </div>
        <div className="event-quick-view-container2">
          <span id="event_location" className="event-quick-view-text2">
            ${price/100}
          </span>
          <span id="event_location" className="event-quick-view-text3">
            {sold} tickets sold
          </span>
          <span id="event_location" className="event-quick-view-text3">
            {available} tickets left
          </span>
        </div>
      </div>
    </div>
    </div>
  )
}

EventQuickView.defaultProps = {
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

EventQuickView.propTypes = {
  event_price: PropTypes.string,
  image_alt: PropTypes.string,
  event_name: PropTypes.string,
  event_spots: PropTypes.string,
  image_src: PropTypes.string,
  event_purchasers: PropTypes.string,
  event_date1: PropTypes.string,
  rootClassName: PropTypes.string,
}

export default EventQuickView