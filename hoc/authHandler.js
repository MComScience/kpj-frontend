import Router from "next/router"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import Aux from "../hoc/Auxiliary"
import { logout } from "../store/actions"

const roles = [10, 20, 30] // user, admin , kiosk

export default function(WrappedComponent, role = null) {
  class authHandler extends React.Component {
    componentDidMount() {
      // this._checkAndRedirect()
    }

    componentDidUpdate() {
      this._checkAndRedirect()
    }

    _checkAndRedirect() {
      const { isLoggedIn, onLogout, user } = this.props
      if (!isLoggedIn) {
        onLogout()
        Router.push("/auth/sign-in")
      } else if (role && roles.includes(role) && role !== user.role) {
        Router.push("/403")
      }
    }

    render() {
      if (!this.props.isLoggedIn) return null
      return (
        <Aux>
          <WrappedComponent {...this.props} />
        </Aux>
      )
    }
  }

  const mapStateToProps = state => {
    return {
      isLoggedIn: state.auth.isLoggedIn,
      user: state.auth.user
    }
  }

  const mapDispatchToProps = dispatch => {
    return {
      onLogout: () => dispatch(logout())
    }
  }

  authHandler.propTypes = {
    isLoggedIn: PropTypes.bool,
    onLogout: PropTypes.func
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(authHandler)
}
