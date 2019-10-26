import PropTypes from "prop-types"
import logo from "../../static/images/kpj-logo.png"

const KioskHeader = props => {
  return (
    <header className="main-header">
      <a className="logo">
        {/* mini logo for sidebar mini 50x50 pixels */}
        <span className="logo-mini hidden-lg hidden-md">
          <b>KPJ</b>
        </span>
        {/* logo for regular state and mobile devices */}
        <span className="logo-lg hidden-lg hidden-md">
          <b>KPJ</b>
        </span>
        <span className="logo-app">
          <img src={logo} className="img-responsive center-block" alt="logo" />
        </span>
      </a>
      <nav className="navbar navbar-static-top">
        <div className="app-name">โรงพยาบาลค่ายประจักษ์ศิลปาคม</div>
        <div className="navbar-custom-menu">
          <ul className="nav navbar-nav">
            <li>
              <a href="#">{props.currentDate}</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

KioskHeader.propTypes = {
  currentDate: PropTypes.string
}

export default KioskHeader
