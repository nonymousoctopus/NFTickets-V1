import React from 'react'

import { Helmet } from 'react-helmet'

import NFTicHeader from '../components/n-f-tic-header'
import QuestionCard from '../components/question-card'
import NFTicFooter from '../components/n-f-tic-footer'
import './f-a-qs.css'

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
            <QuestionCard rootClassName="rootClassName"></QuestionCard>
            <QuestionCard rootClassName="rootClassName3"></QuestionCard>
            <QuestionCard rootClassName="rootClassName2"></QuestionCard>
            <QuestionCard rootClassName="rootClassName1"></QuestionCard>
          </div>
        </div>
      </div>
      <NFTicFooter></NFTicFooter>
    </div>
  )
}

export default FAQs
