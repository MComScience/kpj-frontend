import Link from "next/link"
import React, { Component } from "react"
import { connect } from "react-redux"
import { logout } from "../store/actions"
import Lang from "./Lang"

class AppHeader extends Component {
  onLogout = e => {
    e.preventDefault()
    this.props.authLogout()
  }

  render() {
    const isLoggedIn = this.props.auth.isLoggedIn

    return (
      <header className="main-header">
        {/* Logo */}
        <Link href="/">
          <a href="#" className="logo">
            {/* mini logo for sidebar mini 50x50 pixels */}
            <span className="logo-mini">
              <b>A</b>LT
            </span>
            {/* logo for regular state and mobile devices */}
            <span className="logo-lg">
              <b>KPJ</b> Hospital
            </span>
          </a>
        </Link>

        {/* Header Navbar: style can be found in header.less */}
        <nav className="navbar navbar-static-top">
          {/* Sidebar toggle button*/}
          <a
            href="#"
            className="sidebar-toggle"
            data-toggle="push-menu"
            role="button"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar" />
            <span className="icon-bar" />
            <span className="icon-bar" />
          </a>
          <div className="navbar-custom-menu">
            <ul className="nav navbar-nav">
              <li>
                <Lang />
              </li>
              {/* User Account: style can be found in dropdown.less */}
              {isLoggedIn ? (
                <li className="dropdown user user-menu">
                  <a
                    href="#"
                    className="dropdown-toggle"
                    data-toggle="dropdown"
                  >
                    <img
                      src="/static/images/boy.png"
                      className="user-image"
                      alt="User Image"
                    />
                    <span className="hidden-xs">
                      {this.props.auth.user.name}
                    </span>
                  </a>
                </li>
              ) : null}
              {/* Control Sidebar Toggle Button */}
              {isLoggedIn ? (
                <li>
                  <a href="#" onClick={e => this.onLogout(e)}>
                    <i className="fa fa-sign-out" /> ออกจากระบบ
                  </a>
                </li>
              ) : null}
              {!isLoggedIn ? (
                <li>
                  <Link href="/auth/sign-in">
                    <a>
                      <i className="fa fa-sign-out" /> เข้าสู่ระบบ
                    </a>
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </nav>
      </header>
    )
  }
}

const mapStateToProps = state => {
  return state
}

const mapDispatchToProps = dispatch => {
  return {
    authLogout: () => dispatch(logout())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppHeader)
