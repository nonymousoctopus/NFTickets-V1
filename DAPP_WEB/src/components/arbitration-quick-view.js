import React from 'react'

import PropTypes from 'prop-types'

import './arbitration-quick-view.css'

const ArbitrationQuickView = (props) => {
  return (
    <div
      className={`arbitration-quick-view-gallery-card ${props.rootClassName} `}
    >
      <img
        alt={props.image_alt}
        src={props.image_src}
        loading="lazy"
        className="arbitration-quick-view-image"
      />
      <h2 id="event_name" className="arbitration-quick-view-heading">
        {props.event_name}
      </h2>
      <div className="arbitration-quick-view-event-purchase-row">
        <span className="arbitration-quick-view-text">{props.text}</span>
        <span className="arbitration-quick-view-text1">{props.text1}</span>
      </div>
      <div className="arbitration-quick-view-event-purchase-row1">
        <span className="arbitration-quick-view-text2">{props.text2}</span>
        <span className="arbitration-quick-view-text3">{props.text11}</span>
      </div>
      <div className="arbitration-quick-view-event-purchase-row2">
        <span className="arbitration-quick-view-text4">{props.text21}</span>
        <span className="arbitration-quick-view-text5">{props.text111}</span>
      </div>
    </div>
  )
}

ArbitrationQuickView.defaultProps = {
  text21: 'Vote status:',
  text1: '{$Purchased}',
  text2: 'Tickets disputed:',
  image_src:
    'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?ixid=Mnw5MTMyMXwwfDF8c2VhcmNofDEyfHxmb3Jlc3R8ZW58MHx8fHwxNjI2MjUxMjg4&ixlib=rb-1.2.1&w=1500',
  rootClassName: '',
  text11: '{$Disputed}',
  text: 'Tickets purchased:',
  event_name: 'Event Title',
  text111: '{$Submited}',
  image_alt: 'image',
}

ArbitrationQuickView.propTypes = {
  text21: PropTypes.string,
  text1: PropTypes.string,
  text2: PropTypes.string,
  image_src: PropTypes.string,
  rootClassName: PropTypes.string,
  text11: PropTypes.string,
  text: PropTypes.string,
  event_name: PropTypes.string,
  text111: PropTypes.string,
  image_alt: PropTypes.string,
}

export default ArbitrationQuickView
