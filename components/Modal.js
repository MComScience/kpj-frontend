import PropTypes from "prop-types"
import React, { Component } from "react"
import { ModalBg, ModalBoxSetup, ModalWrapper } from "./GeneralStyle"
/*
visible: boolean,
dismiss: function on click on Close.
*/
export default class ModalSetup extends Component {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    dismiss: PropTypes.func.isRequired
  }
  render() {
    const { visible, dismiss, children, client } = this.props
    return (
      <React.Fragment>
        {visible ? (
          <ModalWrapper>
            <ModalBoxSetup width={client} className="modal-box">{children} </ModalBoxSetup>
            <ModalBg onClick={dismiss} />
          </ModalWrapper>
        ) : null}
      </React.Fragment>
    )
  }
}
