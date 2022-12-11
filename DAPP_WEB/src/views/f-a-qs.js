import React from 'react'

import { Helmet } from 'react-helmet'

import NFTicHeader from '../components/n-f-tic-header'
import QuestionCard from '../components/question-card'
import NFTicFooter from '../components/n-f-tic-footer'
import './f-a-qs.css'

const faqs = [
  {title: "What is NFTickets?", description: <p>It’s a dapp designed to allow anyone to market and sell tickets to their real work events on the blockchain, and allow buyers to easily purchase and use their tickets when attending these events.<br></br><br></br>
  It is built with anti scalping in mind, and penalties for bad behaviour.</p>},
  {title: "How do I use NFTickets?", description: <p>NFTickets has two interfaces, a website that you are already on, and a mobile app for Android. The website is used to create and manage events, and arbitrate disputes. The mobile app is used by buyers to purchase, use, and manage their tickets, and by event hosts/sellers to scan and verify tickets at the event. The app can also be used to lodge a dispute should the need arise.<br></br><br></br>
  To use either the website or the mobile app, you will need to use a blockchain wallet like Metamask, and connect it to the site or app. Please note, NFTickets is currently in Proof of Concept stage, all smart contracts are on the Avalanche Fuji testnet, and no real money should be paid for anything on this site. Please ensure you are not using real money on a mainnet chain when interacting with NFTickets.<br></br><br></br>
  To obtain testnet funds, please visit the <a href='https://faucet.avax.network/' target="_blank" style={{color: '#67D8AE'}}>Avalanche testnet faucet.</a></p>},
  {title: "How do I create an event and sell tickets?", description: <p>You can create an event on the Home or My events pages of this site, by using the green plus button in the bottom right. You will need to fill in a simple form, and provide an image for your event.</p>},
  {title: "How do I sell additional tickets?", description: <p>You can list additional tickets for an existing event on the <a href='#/my-events' style={{color: '#67D8AE'}}>My Events</a> page, simply select your event, specify how many tickets you would like to add, and click ‘Add tickets to market’.</p>},
  {title: "What are the host/seller fees?", description: <p>Tickets sellers will be charged a flat 5% fee on their sales, however they must deposit 20% of the total potential sales value when creating an event or adding additional tickets. Most of this deposit will be refunded unless the event submitted is fraudulent and penalties need to be applied.<br></br><br></br>
  <i>In addition to the above, you will be charged for gas by the blockchain.</i></p>},
  {title: "What are the penalty mechanisms of NFTickets?", description: <p>If an event is deemed fraudulent by a buyer, they can submit a dispute for an event no later than 24 hours after the event has finished. To reduce the chances of dishonest disputes, disputes with less than 5% of ticket purchasers will be automatically ruled in favour of the seller.<br></br><br></br>
  Disputes that have more than 5% of purchasers, will go to arbitration, and will be voted on by $NFTK token holders. And will have their votes tallied up after 3 days.<br></br><br></br>
  Disputes found in favour of the seller will proceed to payment and the event host/seller will receive payment 4-5 days after their event finishes (depending on time zones).<br></br><br></br>
  Disputes found in favour of the buyer will proceed with a full refund of the purchase price, plus 15% of the ticket value taken from the host/seller deposit.</p>},
  {title: "Can I create events on the app?", description: <p>No, to keep administration of events a little easier, in this version of NFTickets all events must be created via the website.</p>},
  {title: "How do I check tickets for my event?", description: <p>To check the tickets at the door, use the NFTickets app on your Android mobile phone. Go to the <a href='#/my-events' style={{color: '#67D8AE'}}>My Events</a> section at the bottom of the screen, select your event, and tap on ‘Scan tickets’.<br></br><br></br>
  It is recommended that you scan event tickets no earlier than 3 hours before the event starts as at this point tickets can no longer be re-listed on the market by a buyer for an automatic refund.</p>},
  {title: "When does the host/seller get paid?", description: <p>If an event does not get disputed within 24 hours of finishing, the host/seller will be paid 1-2 days after the event finishes (depending on time zones). If an event has a dispute raised against it, but is found in favour of the host/seller, payment will be automatically processed within 4-5 days (depending on time zones).</p>},
  {title: "Can I refund my buyers if I made a mistake in my event?", description: <p>Yes, you can choose to refund individual buyers using their wallet address via the <a href='#/my-events' style={{color: '#67D8AE'}}>My Events</a> page of the website. Simply select the event you wish to refund a buyer for, enter their wallet address and click ‘Refund wallet’.<br></br><br></br>
  To refund all ticket holders of an event, go to the <a href='#/my-events' style={{color: '#67D8AE'}}>My Events</a> page of this site, select the event you wish to refund, and click ‘REFUND ALL’.</p>},
  {title: "How do I buy tickets?", description: <p>You can buy tickets from this website, or directly from the NFTickets app on your Android phone. To buy tickets on the site, go to the <a href='#/' style={{color: '#67D8AE'}}>Home</a> page, select an event from the upcoming events section and buy it.<br></br><br></br>
  To buy an event from the app, simply open the app and connect to the blockchain using Metamask or similar wallet. Then browse the events on the ‘Market’ section and make a purchase by tapping on the event you are interested in, specifying how many tickets you would like, tapping the ‘Buy’ button. You will need to authorise payment via your (Metamask) wallet.</p>},
  {title: "What are the buyer fees?", description: <p>Apart from the cost of tickets, the only fees you should expect to pay are gas fees imposed by the blockchain.</p>},
  {title: "How do I use my tickets?", description: <p>To use your tickets, head over to the ‘My Events’ section of the mobile app and select the event you wish to access. You can then generate your QR ticket for the event for scanning at the door, re-list unwanted tickets onto the market up to 3 hours before the event start time, or dispute the event if you believe it is fraudulent.</p>},
  {title: "Can I print and bring a physical ticket to the event?", description: <p>While you can take a screenshot of the QR ticket and print it, this option is not recommended as it increases the risk of losing your ticket, and prevents you from being able to lodge a dispute if the need arises.</p>},
  {title: "What if I can no longer attend an event?", description: <p>If you can no longer attend an event, you can re-list your ticket back on the market for a full refund up to 3 hours before the event start time.</p>},
  {title: "What if I bought a ticket to a fake/fraudulent event?", description: <p>You should lodge a dispute for this event within 24 hours of its finish time by going to the ‘My Events’ section of the mobile app, selecting your event, and tapping the ‘Lodge a dispute’ button. You will then need to specify a reason, upload photo or video evidence, and tap the ‘Lodge dispute’ button. You must remain on this screen while your evidence is uploaded until you are prompted to sign a transaction by your (Metamask) wallet and pay the small blockchain gas fee.<br></br><br></br>
  Your dispute will then go through the arbitration process described in the ‘What are the penalty mechanisms of NFTickets?’ question above.<br></br><br></br>
  <i>Please note, additional metadata will be uploaded along with your dispute.</i></p>},
  {title: "Can I lodge a dispute on the website?", description: <p>No, this option is not enabled as it will not provide the necessary metadata required to submit an accurate dispute.</p>},
  {title: "What information do I need to lodge a dispute?", description: <p>You will need to specify a reason from the available drop down menu, and submit a photo/video proving that the event is fraudulent.<br></br><br></br>
  Additionally, your gps coordinates as well as the timestamp of your dispute will be automatically provided by the app.</p>},
  {title: "When will I get refunded?", description: <p>If you re-list a ticket back on the market (more than 3 hours before the event start time), you will be automatically refunded on the spot.<br></br><br></br>
  If a host/seller chooses to refund you or all buyers, you will be refunded on the spot.<br></br><br></br>
  If you have submitted a dispute that has been ruled in the buyers favour, you should receive a refund within 4-5 days after the event finishes (depending on time zones). </p>},
  {title: "What if a buyer lodged a fraudulent dispute?", description: <p>If less than 5% of buyers for your event lodge a dispute, you will not be penalised and will be paid your event proceeds (less 5% commission) 1-2 days after your event finishes (depending on time zones).<br></br><br></br>
  If more than 5% of buyers for your event lodge a dispute, this will proceed to arbitration. Fraudulent disputes (as judged by $NFTK token holders) will take 4-5 days to process (depending on time zones).</p>},
  {title: "Why do time zones matter for payments and disputes?", description: <p>NFTickets uses automated dispute and payment processing using Chainlink Automation, and is scheduled to process transactions every 24 hours at midnight UTC time. Depending on the time zone of your event, your event processing may fall into the day’s batch or be scheduled for tomorrow.</p>},
  {title: "Who arbitrates disputes?", description: <p>Only $NFTK token holders who held tokens at the time a dispute is raised can vote on disputes.<br></br><br></br>
  Additionally, automated decisions will be carried out by the smart contract such as in cases where less than 5% of ticket buyers submit a dispute. For more information please refer to the ‘What are the penalty mechanisms of NFTickets?’ question above.</p>},
  {title: "How can I buy $NFTK tokens?", description: <p>As NFTickets is currently in the ‘Proof of Concept’ stage, no tokens are being distributed, and only the creator can choose to send tokens to wallet addresses for testing. If you would like to get in touch, reach out to @nonymousoctopus on twitter.</p>},
  {title: "How can a $NFTK token holder withdraw their voting rewards?", description: <p>$NFTK token holders can withdraw their voting rewards via the website on the ‘Arbitration’ page.</p>}
]

const FAQs = (props) => {
  return (
    <div className="f-a-qs-container">
      <Helmet>
        <title>FAQs - NFTickets Web</title>
        <meta property="og:title" content="FAQs - NFTickets Web" />
      </Helmet>

      <div className="f-a-qs-n-f-tic-all-events">
        <div className="f-a-qs-features">
          <h1 className="f-a-qs-text">FAQs</h1>
          <div className="f-a-qs-container1">
            {faqs.map((faq) => (
              <QuestionCard rootClassName="rootClassName"
                title={faq.title}
                description={faq.description}
                ></QuestionCard>
            ))}
          </div>
        </div>
      </div>
      <NFTicFooter></NFTicFooter>
    </div>
  )
}

export default FAQs
