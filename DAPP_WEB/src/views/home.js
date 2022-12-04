import React, { useState, useEffect } from 'react'

import { Helmet } from 'react-helmet'

import Modal from 'react-modal';
import { useFormik } from 'formik';
import * as yup from 'yup';

//import * as dotenv from 'dotenv'
import { NFTStorage, File } from 'nft.storage'
import mime from 'mime'
//import path from 'path'
//import fs from 'fs'

import { useFilePicker } from 'use-file-picker';

import Geocode from "react-geocode";

import { ethers } from "ethers";


import AllEventQuickView from '../components/all-event-quick-view'
import NFTicFooter from '../components/n-f-tic-footer'
import './home.css'

import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'
import NFTicketsArbitration_abi from './../abis/NFTicketsArbitration.json'
import NFTicketsUtils_abi from './../abis/NFTicketsUtils.json'


const NFT_STORAGE_KEY = process.env.REACT_APP_NFT_STORAGE_KEY;
const GEOCODE_KEY = process.env.REACT_APP_GEOCODE_KEY2;

// Testing EthersJS
const provider = new ethers.providers.Web3Provider(window.ethereum)
//await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner()

let marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
let ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);



/* Validation for create event form */
const patternTwoDigisAfterComma = /^\d+(\.\d{0,2})?$/;
const commonStringValidator = yup
  .number()
  .positive()
  .test(
    "is-decimal",
    "The amount should be a decimal with maximum two digits after comma",
    (val) => {
      if (val != undefined) {
        return patternTwoDigisAfterComma.test(val);
      }
      return true;
    }
  )
  .min(0.01, "minimum $0.01")
  .required("Is required");
const reviewSchema = yup.object({
  eventName: yup.string().required().min(4),
  eventLocation: yup.string().required().min(5),
  eventStart: yup.string().required().min(5),
  eventFinish: yup.string().required().min(5),
  ticketPrice: commonStringValidator,
  ticketQuantity: yup.number().integer().min(1),
  eventDescription: yup.string().required().min(4),
});

const Home = (props) => {

  /******************************************************* */
  // NEW EVENT CREATION FUNCTIONS
  /******************************************************* */

  const [image, setImage] = useState();

  const onSubmit = async (values, actions) => {
    // Data to upload into IPFS
    setProcessing("Your event is being created, you will need to authorise two transactions in metamask.");
    console.log('Starting ipfs image upload test');
    const client = new NFTStorage({ token: NFT_STORAGE_KEY });
    const imageFile = new File([ eventTempImage.file ], eventTempImage.file.name, { type: eventTempImage.file.type }); // image
    const metadata = await client.store({
      name: values.eventName,
      description: values.eventDescription,
      location: values.eventLocation,
      start: values.eventStart.toString().replace('T', ' ') + ' ' + (Intl.DateTimeFormat().resolvedOptions().timeZone),
      finish: values.eventFinish.toString().replace('T', ' ') + ' ' + (Intl.DateTimeFormat().resolvedOptions().timeZone),
      image: imageFile,
    })     
    // Get GPS coordinates for token minting
    Geocode.setApiKey(GEOCODE_KEY);
    Geocode.enableDebug();
    Geocode.setLocationType("ROOFTOP");
    Geocode.fromAddress(values.eventLocation.toString()).then(
      (response) => {
        const { lat, lng } = response.results[0].geometry.location;
        console.log('The Lat is: ' + lat + ' & the Lon is: ' + lng);
        // Mint the token - remember to multiply out the coordinates to avoid decimal places
        createTokenFunction(metadata.url, values.ticketQuantity, values.ticketPrice, Date.parse(values.eventFinish)/1000, Math.round(lat*10000000000), Math.round(lng*10000000000), values.eventName);
      },
      (error) => {
        console.error(error);
      }
    );
    
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
        eventName: "",
        eventLocation: "",
        eventStart: "",
        eventFinish: "",
        ticketPrice: "",
        ticketQuantity: "",
        eventDescription: "",
 
      },
      validationSchema: reviewSchema,
      onSubmit,
    });

  // Create event modal functions
  const [modalCreateEventOpen, setModalCreateEventOpen] = useState(false);
  function openModalCreateEvent() {
    setModalCreateEventOpen(true);
  }
  function closeModalCreateEvent() {
    setModalCreateEventOpen(false);
  }

  const [eventTempImage, setEventTempImage] = useState();
  const readFiles = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setEventTempImage({...eventTempImage, file: files[0]});
    }
  };

  //Get coordinates from address  
  const [eventLat, setEventLat] = useState();
  const [eventLon, setEventLon] = useState();
  function addressToGPS (address) {
    Geocode.setApiKey(GEOCODE_KEY);
    Geocode.enableDebug();
    Geocode.setLocationType("ROOFTOP");
    Geocode.fromAddress(address.toString()).then(
      (response) => {
        const { lat, lng } = response.results[0].geometry.location;
        setEventLat(lat);
        setEventLon(lng);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  const [processing, setProcessing] = useState(null);

  const createTokenFunction = async (uri, amount, price, finishTime, lattitude, longitude, name) => {
    // need uri from ipfs, amount, data, price, finish time in unix time, lat, lon
    let ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
    const contractWithSigner = ticketContract.connect(signer);
    let priceInCents = price * 100;

    let tx = await contractWithSigner.createToken(uri, amount, '0x00', priceInCents, finishTime, lattitude, longitude);   
    let receipt = await tx.wait(1)

    let tokenId = receipt.events[0].args.id.toNumber();
    let marketListing = await listMarketItemFunction(priceInCents, NFTicketsTic_abi.address, tokenId, amount, name);
  }

  const listMarketItemFunction = async (priceInCents, nftContractAddress, tokenId, amount, name) => {
    
    const contractWithSigner = marketContract.connect(signer);

    let utilsContract = new ethers.Contract(NFTicketsUtils_abi.address, NFTicketsUtils_abi.abi, signer);
    let perTicketPrice = await utilsContract.getConversion(priceInCents);

    let listingFee = perTicketPrice * amount / 5;
    let tx = await contractWithSigner.listNewMarketItem(nftContractAddress, tokenId, amount, '0x00', name, {value: (listingFee.toString())});
    setProcessing(null);
  }

  /*
  const testFunction = async () => {
    let tempContract = new ethers.Contract(NFTicketsArbitration_abi.address, NFTicketsArbitration_abi.abi, signer);
    let val = await tempContract.voterCount(); // read function test
    console.log(val);

    let tempContract2 = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
    const contractWithSigner = tempContract2.connect(signer);

    let tx = await contractWithSigner.createToken('testuri', 5, '0x00', 5, 123, 456, 789); // write function test
    console.log('got here with no issues');
    const blockTest = await provider.getBlockNumber();
  }
  */

  /******************************************************* */
  // MY EVENTS LOADING FUNCTIONS
  /******************************************************* */

  const [events, setEvents] = useState([]);
  let tempEvents = [];

  async function drawMyEventsGallery () {
    //let result = await marketContract.fetchMyNFTs();
    let result = await marketContract.fetchItemsOnSale();
    console.log('result: ');
    console.log(result);
    //console.log(result2);
    for (let i=0; i < result.length; i++) {
      if (result[i].itemId.toNumber() !== 0){
        let rawURI = await ticketContract.uri(result[i].tokenId.toNumber());
        let cleanURI = 'https://nftstorage.link/ipfs/' + rawURI.replace("ipfs://", "");
        let data = await fetch(cleanURI).then((response) => response.json()); // getting the JSON data from the uri in the NFT
        //console.log(data);
        //console.log(data.start.slice(0,10));
  
        let existingTest = false;
        for (let j=0; j<tempEvents.length; j++) {
          if (tempEvents[j].itemId === result[i].itemId.toNumber()) {
            existingTest = true;
          }
        }
        if (existingTest === false) {
          let imgLoad = await data['image'].replace("ipfs://", "https://nftstorage.link/ipfs/");
          let statusNumber = await result[i].status;
          console.log(imgLoad);
          //console.log("Sold this many: " + (result[i].initialQuantity.toNumber() - result[i].amount.toNumber()))
          //let status = await statusConversion(statusNumber);
          // Event quick view: key = itemId, name = name, sold = totalSales, price = price, tickets on sale = amount, event start = need to get from ipfs, status = status
          tempEvents.push({
            itemId: result[i].itemId.toNumber(), 
            name: result[i].name, 
            price: result[i].price.toNumber(), 
            image: imgLoad, 
            tokenId: result[i].tokenId.toNumber(), 
            sold: result[i].initialQuantity.toNumber() - result[i].amount.toNumber(), 
            //status: status, 
            start: data.start.slice(0,10), 
            available: result[i].amount.toNumber(), 
            location: data.location, 
            startFull: data.start, 
            finish: data.finish, 
            description: data.description,
            nftContract: result[i].nftContract, 
          })
        }
        existingTest = false;

      }
      
    };
    setEvents(tempEvents);
  }

/*
  async function statusConversion (statusNumber) {
    if (statusNumber === 0) {
      return "Normal";
    } else if (statusNumber === 1) {
      return "Sales processed";
    } else if (statusNumber === 2) {
      return "In dispute";
    } else if (statusNumber === 3) {
      return "Dispute resolved in seller's favour";
    } else if (statusNumber === 4) {
      return "Dispute resolved in buyer's favour";
    } else if (statusNumber === 6) {
      return "Refunded by seller";
    }
  }
  */
  
    useEffect(() => {
      (async () => {
          drawMyEventsGallery();

      })();
    }, []);



  return (  
    <div className="home-container">
      {/* This is The create an event modal */}
      <Modal isOpen={modalCreateEventOpen} onRequestClose={closeModalCreateEvent} ariaHideApp={false} contentLabel="Create Event Modal">
        <div className="home-container5">
          <button id="btn_createevent_close" className="home-button3 button" onClick={closeModalCreateEvent}>
            <svg viewBox="0 0 804.5714285714286 1024" className="home-icon2">
              <path d="M741.714 755.429c0 14.286-5.714 28.571-16 38.857l-77.714 77.714c-10.286 10.286-24.571 16-38.857 16s-28.571-5.714-38.857-16l-168-168-168 168c-10.286 10.286-24.571 16-38.857 16s-28.571-5.714-38.857-16l-77.714-77.714c-10.286-10.286-16-24.571-16-38.857s5.714-28.571 16-38.857l168-168-168-168c-10.286-10.286-16-24.571-16-38.857s5.714-28.571 16-38.857l77.714-77.714c10.286-10.286 24.571-16 38.857-16s28.571 5.714 38.857 16l168 168 168-168c10.286-10.286 24.571-16 38.857-16s28.571 5.714 38.857 16l77.714 77.714c10.286 10.286 16 24.571 16 38.857s-5.714 28.571-16 38.857l-168 168 168 168c10.286 10.286 16 24.571 16 38.857z"></path>
            </svg>
          </button>       

          <form onSubmit={handleSubmit} autoComplete="off" className='testouter'>
            <div className='innercenter'>
          <h1 className="home-text42">
            <span>Create a new event</span>
            <br></br>
          </h1>
          </div>
            <div className='create-event-form'>
            <div className='innerleft'>
                <label htmlFor="eventName"/>
                <span className='form-input-label'>Event name</span>
                <input
                value={values.eventName}
                onChange={handleChange}
                id="eventName"
                placeholder="Enter your event name"
                onBlur={handleBlur}
                className={errors.eventName && touched.eventName ? "input-error" : ""}
                />
                {errors.eventName && touched.eventName && <p className="error">{errors.eventName}</p>}

                <span className='form-input-label'>Event description</span>
                <label htmlFor="eventDescription"/>
                <textarea
                value={values.eventDescription}
                onChange={handleChange}
                id="eventDescription"
                cols="50"
                rows="5"
                placeholder="Enter a description"
                onBlur={handleBlur}
                className={errors.eventDescription && touched.eventDescription ? "input-error" : ""}
                />
                {errors.eventDescription && touched.eventDescription && <p className="error">{errors.eventDescription}</p>}

                

                <span className='form-input-label'>Start</span>
                <input
                value={values.eventStart}
                onChange={handleChange}
                id="eventStart"
                type="datetime-local"
                placeholder=""
                onBlur={handleBlur}
                className={errors.eventStart && touched.eventStart ? "input-error" : ""}
                />
                {errors.eventStart && touched.eventStart && <p className="error">{errors.eventStart}</p>}

                <span className='form-input-label'>Finish</span>
                <input
                value={values.eventFinish}
                onChange={handleChange}
                id="eventFinish"
                type="datetime-local"
                placeholder=""
                onBlur={handleBlur}
                className={errors.eventFinish && touched.eventFinish ? "input-error" : ""}
                />
                {errors.eventFinish && touched.eventFinish && <p className="error">{errors.eventFinish}</p>}

                
            </div>

            <div className='innerright'>

            <span className='form-input-label'>Location</span>
                <input
                value={values.eventLocation}
                onChange={handleChange}
                id="eventLocation"
                placeholder="Enter your event's location"
                onBlur={handleBlur}
                className={errors.eventLocation && touched.eventLocaation ? "input-error" : ""}
                />
                {errors.eventLocation && touched.eventLocation && <p className="error">{errors.eventLocation}</p>}

            <span className='form-input-label'>Ticket price in $USD</span>
                <input
                value={values.ticketPrice}
                onChange={handleChange}
                id="ticketPrice"
                type="number"
                placeholder="Enter ticket price"
                onBlur={handleBlur}
                className={errors.ticketPrice && touched.ticketPrice ? "input-error" : ""}
                />
                {errors.ticketPrice && touched.ticketPrice && <p className="error">{errors.ticketPrice}</p>}
                
                <span className='form-input-label'>Number of tickets</span>
                <input
                value={values.ticketQuantity}
                onChange={handleChange}
                id="ticketQuantity"
                type="number"
                placeholder="Enter no of tickets"
                onBlur={handleBlur}
                className={errors.ticketQuantity && touched.ticketQuantity ? "input-error" : ""}
                />
                {errors.ticketQuantity && touched.ticketQuantity && <p className="error">{errors.ticketQuantity}</p>}

                <span className='form-input-label'>Event image</span>
                <input type="file" onChange={readFiles} />
                <span className='processing-message'>{processing}</span>
            </div>
            </div>
                <button id="btn_createevent_submit" className="home-button4 button" disabled={isSubmitting} type="submit">
                Create event
                </button>
                
              </form>
        </div>
      </Modal>
      <Helmet>
        <title>NFTickets Web</title>
        <meta property="og:title" content="NFTickets Web" />
      </Helmet>
      <div className="home-n-f-tic-hero">
        <div className="home-hero">
          <img
            alt="image"
            src="https://images.unsplash.com/photo-1633358050629-bb6a292616ff?ixid=Mnw5MTMyMXwwfDF8c2VhcmNofDc5fHxldmVudHxlbnwwfHx8fDE2NjY5NDMyNTQ&amp;ixlib=rb-4.0.3&amp;w=1500"
            loading="lazy"
            className="home-image"
          />
          <div className="home-container1">
            <h1 className="home-text">Real events</h1>
            <h2 className="home-text01">Powered by blockchain</h2>
            <div className="home-btn-group">
              <a
                href="#events_gallery"
                id="btn_exploreevents"
                className="home-link button"
              >
                Explore events
              </a>
              <button id="btn_learnmore" className="home-button button">
                Learn more
              </button>
            </div>
            <span className="home-text02">
              <span>
                <span>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  non volutpat turpis.
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
                <span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
              </span>
              <span>
                <span>
                  Mauris luctus rutrum mi ut rhoncus. Integer in dignissim
                  tortor. Lorem
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
                <span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
              </span>
              <span>
                <span>
                  ipsum dolor sit amet, consectetur adipiscing elit.
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
                <span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
              </span>
              <br></br>
              <span></span>
              <br></br>
              <span>
                <span>
                  Mauris luctus rutrum mi ut rhoncus. Integer in dignissim
                  tortor.
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
                <span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: ' ',
                    }}
                  />
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="home-n-f-tic-all-events">
        <div id="events_gallery" className="home-gallery">
          <h1 className="home-text16">Upcoming Events</h1>
          <span className="home-text17">
            <span>
              <span>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non
                volutpat turpis.
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
              <span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
            </span>
            <br></br>
            <span>
              <span>
                Mauris luctus rutrum mi ut rhoncus. Integer in dignissim tortor.
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
              <span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: ' ',
                  }}
                />
              </span>
            </span>
          </span>
          <div className="home-gallery1">
          {events.map((event) => (
              <AllEventQuickView rootClassName="event-quick-view-root-class-name" key={event.itemId} itemId={event.itemId} name={event.name} price={event.price} image={event.image} tokenId={event.tokenId} sold={event.sold} available={event.available} start={event.start} status={event.status} location={event.location} startFull={event.startFull} finish={event.finish} description={event.description} nftContract={event.nftContract}/>
            ))}
          </div>
        </div>
      </div>
      <NFTicFooter></NFTicFooter>
      <button id="btn_addevent" className="home-button5 button" onClick={() => openModalCreateEvent()}>
        <svg viewBox="0 0 804.5714285714286 1024" className="home-icon4">
          <path d="M804.571 420.571v109.714c0 30.286-24.571 54.857-54.857 54.857h-237.714v237.714c0 30.286-24.571 54.857-54.857 54.857h-109.714c-30.286 0-54.857-24.571-54.857-54.857v-237.714h-237.714c-30.286 0-54.857-24.571-54.857-54.857v-109.714c0-30.286 24.571-54.857 54.857-54.857h237.714v-237.714c0-30.286 24.571-54.857 54.857-54.857h109.714c30.286 0 54.857 24.571 54.857 54.857v237.714h237.714c30.286 0 54.857 24.571 54.857 54.857z"></path>
        </svg>
      </button>
    </div>
  )
}

export default Home