import React from 'react'
import { Link } from 'react-router-dom'

import PropTypes from 'prop-types'

import './n-f-ticketsnavlinks.css'

const NFTicketsnavlinks = (props) => {
  return (
    <nav className={`n-f-ticketsnavlinks-nav ${props.rootClassName} `}>
      <Link to="/" className="n-f-ticketsnavlinks-navlink">
        {props.home}
      </Link>
      <Link to="/my-events" className="n-f-ticketsnavlinks-navlink1">
        {props.my_events}
      </Link>
      <Link to="/arbitration" className="n-f-ticketsnavlinks-navlink2">
        {props.arbitration}
      </Link>
      <Link to="/f-a-qs" className="n-f-ticketsnavlinks-navlink3">
        {props.faqs}
      </Link>
    </nav>
  )
}

NFTicketsnavlinks.defaultProps = {
  my_events: 'My Events',
  rootClassName: '',
  home: 'Home',
  faqs: 'FAQs',
  arbitration: 'Arbitration',
}

NFTicketsnavlinks.propTypes = {
  my_events: PropTypes.string,
  rootClassName: PropTypes.string,
  home: PropTypes.string,
  faqs: PropTypes.string,
  arbitration: PropTypes.string,
}

export default NFTicketsnavlinks
