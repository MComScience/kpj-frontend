import PropTypes from "prop-types"
import React, { Component } from "react"
import MenuItem from "./MenuItem"

class MenuMain extends Component {
  render() {
    var { mainMenus } = this.props

    var menuMap = () => {
      return mainMenus.map(mi => {
        return <MenuItem key={mi.miName} menuData={mi}></MenuItem>
      })
    }
    return (
      <ul className="sidebar-menu ">
        <li className="header">MAIN NAVIGATION</li>
        {menuMap()}
      </ul>
    )
  }
}

MenuMain.propTypes = {
  mainMenus: PropTypes.array
}

export default MenuMain
