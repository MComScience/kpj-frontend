import classNames from 'classnames'
import React, { Component } from "react"
import NotificationSystem from "react-notification-system"
import { connect } from "react-redux"
import en from "../locale/en_US"
import th from "../locale/th_TH"
import * as i18nAction from "../store/actions/i18n"

class Lang extends Component {
  constructor(props) {
    super(props)
    this.SetToThai = this.SetToThai.bind(this)
    this.SetToEnglish = this.SetToEnglish.bind(this)
    this._addNotification = this._addNotification.bind(this)
  }
  _notificationSystem = null

  _addNotification(message) {
    this._notificationSystem.addNotification({
      message,
      level: "success",
      position: "br"
    })
  }
  componentDidMount() {
    this._notificationSystem = this.refs.notificationSystem
  }

  render() {
    let { lang } = this.props.i18n
    // console.log('Lang.lang:', lang);
    return (
      <ul className="nav navbar-nav">
        <li>
          <NotificationSystem ref="notificationSystem" />
        </li>
        <li className={classNames('dropdown', lang === 'en' ? 'active': '')}>
          <a href="#" className="hand-cursor" onClick={this.SetToEnglish}>
            English (US)
          </a>
        </li>
        <li className={classNames('dropdown', lang === 'th' ? 'active': '')}>
          <a href="#" className="hand-cursor" onClick={this.SetToThai}>
            ภาษาไทย
          </a>
        </li>
      </ul>
    )
  }

  SetToThai() {
    console.log("set to th")
    let { dispatch } = this.props
    this._addNotification(th.langChanged)
    return dispatch(i18nAction.i18nSelect('th'))
  }

  SetToEnglish() {
    console.log("set to eng")
    let { dispatch } = this.props
    this._addNotification(en.langChanged)
    return dispatch(i18nAction.i18nSelect('en'))
  }
}

export default connect(state => state)(Lang)
