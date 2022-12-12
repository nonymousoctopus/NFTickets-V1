import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { ethers } from "ethers";

import NFTicHeader from '../components/n-f-tic-header'
import ArbitrationQuickView from '../components/arbitration-quick-view'
import NFTicFooter from '../components/n-f-tic-footer'
import './arbitration.css'

import DisputeEventQuickView from '../components/dispute-event-quick-view'

import NFTicketsTic_abi from './../abis/NFTicketsTic.json'
import NFTicketsMarket_abi from './../abis/NFTicketsMarket.json'
import NFTicketsArbitration_abi from './../abis/NFTicketsArbitration.json'
import NFTicketsUtils_abi from './../abis/NFTicketsUtils.json'

const provider = new ethers.providers.Web3Provider(window.ethereum)
//await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner()

const marketContract = new ethers.Contract(NFTicketsMarket_abi.address, NFTicketsMarket_abi.abi, signer);
const ticketContract = new ethers.Contract(NFTicketsTic_abi.address, NFTicketsTic_abi.abi, signer);
const arbitrationContract = new ethers.Contract(NFTicketsArbitration_abi.address, NFTicketsArbitration_abi.abi, signer);

const Arbitration = (props) => {

  /******************************************************* */
  // MY EVENTS LOADING FUNCTIONS
  /******************************************************* */


  const [disputes, setDisputes] = useState([]);
  let tempDisputes = [];
  const [disputesText, setdisputesText] = useState("Looks like there are no dispsutes at this time.");

  async function drawDisputesGallery () {
    let totalDisputes = await arbitrationContract.disputeIndex();

    for (let i = 0; i < totalDisputes; i++) {
      let thisDispute = await arbitrationContract.getDispute(i);
      let itemDetails = await marketContract.getMarketItem(thisDispute.itemId);
      let rawURI = await ticketContract.uri(itemDetails.tokenId);
      let cleanURI = 'https://nftstorage.link/ipfs/' + rawURI.replace("ipfs://", "");
      let data = await fetch(cleanURI).then((response) => response.json()); // getting the JSON data from the uri in the NFT
      let imgLoad = await data['image'].replace("ipfs://", "https://nftstorage.link/ipfs/");
      let disputeStatus = await arbitrationContract.disputeToDecisions(i);
      let statusResult = await statusConversion(disputeStatus.outcome);
      let reasonTranslation = await reasonConverter(thisDispute.disputerReason);
      
      //console.log(disputeStatus.outcome);

      let existingDisputeTest = false;
      for (let j=0; j<tempDisputes.length; j++) {
        if (thisDispute.itemId.toNumber() == tempDisputes[j].itemId.toNumber()) {
          existingDisputeTest = true;
        }
      }

      if (existingDisputeTest == false) {
        tempDisputes.push({
          itemId: thisDispute.itemId, 
          name: itemDetails.name, 
          sold: itemDetails.initialQuantity - itemDetails.amount,
          disputers: thisDispute.disputers.length,
          location: data.location,
          startFull: data.start,
          finish: data.finish,
          price: itemDetails.price,
          offered: itemDetails.initialQuantity.toString(),
          evidence: thisDispute.disputerEvidence,
          image: imgLoad,
          disputeId: i,
          status: statusResult,
          reason: reasonTranslation,
        })
      }
      existingDisputeTest = false;
    }    
    await setDisputes(tempDisputes);
    await placeholder(tempDisputes);
    //console.log(disputes);
  }

  async function statusConversion (statusNumber) {
    if (statusNumber == 0) {
      return "Undecided";
    } else if (statusNumber == 1) {
      return "Ruled in buyer's favour";
    } else if (statusNumber == 2) {
      return "Ruled in seller's favour";
    } 
  }

  async function reasonConverter (reason) {
    if (reason == 1) {
      return "Event not organized";
    } else if (reason == 2) {
      return "Event not as desribed";
    } else if (reason == 3) {
      return "Event access denied";
    } else {
      return "Reason unknown";
    }
  }

  const withdrawShareFunction = async () => {
    
    const arbitrationWithSigner = arbitrationContract.connect(signer);
    let tx = await arbitrationWithSigner.withdrawShare();
    //console.log(tx);

  }

  const placeholder = async (temp) => {
    if (temp.length>0) {
      setdisputesText("Select an event below to review the evidence and vote with your decision.")
    }
  }

  useEffect(() => {
    (async () => {
        drawDisputesGallery();

    })();
  }, []);

  return (
    <div className="arbitration-container">
      <Helmet>
        <title>Arbitration - NFTickets Web</title>
        <meta property="og:title" content="Arbitration - NFTickets Web" />
      </Helmet>

      <div className="arbitration-n-f-tic-all-events">
      <div className="arbitration-banner">
            <h1 className="arbitration-banner-text">Get Involved!</h1>
            <span className="arbitration-banner-text01">
              <span className="arbitration-banner-text02">
                When an event is in dispute, NFTickets token holders ($NFTK) are encouraged to review the dispute and evidence provided, and make a decision as to who is in the right. 
                <br></br>
                Active voters, are rewarded with a portion of the event fees regardless of which way they vote. </span>
              <br></br>
              <br></br>
              <span>
                Rewards are automatically allocated to voters after the dispute is processes which is 3-4 days after a dispute is lodged. 
                <br></br>
                So if you vote on a dispute, remember to come back in a few days to withdraw your rewards.
              </span>
              <br></br>
            </span>
            <button
              id="withdraw"
              name="withdraw"
              className="withdraw-button" onClick={() => withdrawShareFunction()}
            >
              Withdraw Rewards
            </button>
          </div>
        <div className="arbitration-gallery">
          <h1 className="arbitration-text">Disputed events</h1>
          <span className="arbitration-text01">
            {disputesText}
          </span>
          <div className="arbitration-gallery1">
            {disputes.map((dispute) => (
              <DisputeEventQuickView rootClassName="event-quick-view-root-class-name" key={dispute.disputeId} itemId={dispute.itemId} name={dispute.name} sold={dispute.sold} disputers={dispute.disputers} location={dispute.location} startFull={dispute.startFull} finish={dispute.finish} price={dispute.price} offered={dispute.offered} evidence={dispute.evidence} disputeId={dispute.disputeId} image={dispute.image} status={dispute.status} reason={dispute.reason} />
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Arbitration
