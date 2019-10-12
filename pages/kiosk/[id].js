import { Spin } from "antd"
import classNames from "classnames"
import moment from "moment"
import { withRouter } from "next/router"
import React, { Component } from "react"
import io from "socket.io-client"
import Swal from "sweetalert2"
import axios from "../../axios"
import Head from "../../components/head"
import KioskBoxPatient from "../../components/kiosk/KioskBoxPatient"
import KioskBoxRight from "../../components/kiosk/KioskBoxRight"
import KioskForm from "../../components/kiosk/KioskForm"
import KioskHeader from "../../components/kiosk/KioskHeader"
import KioskPrintTemplate from "../../components/kiosk/KioskPrintTemplate"
import Aux from "../../hoc/Auxiliary"
import portlet from "../../public/assets/css/kt-portlet.css"
import boyImg from "../../static/images/boy.png"
moment.locale("th")

const EVENTS = {
  CARD_INSERTED: "CARD_INSERTED",
  READING_START: "READING_START",
  READING_COMPLETE: "READING_COMPLETE",
  READING_FAIL: "READING_FAIL",
  CARD_REMOVED: "CARD_REMOVED",
  DEVICE_DISCONNECTED: "DEVICE_DISCONNECTED"
}

class Kiosk extends Component {
  // static async getInitialProps({ req }) {
  //   const { data } = await axios.get("/repos/zeit/next.js")
  //   return { stars: data }
  // }

  state = {
    kioskId: null,
    kiosk: null,
    search: "",
    isModalOpen: false,
    isPrintting: false,
    reading: false,
    patientInfo: null,
    right: null,
    loading: false,
    currentDate: moment().format("วันddddที่ DD MMMM YYYY"),
    printDate: moment().format("DD MMMM YYYY"),
    printTime: moment().format("HH:mm น."),
    socket: io.connect(process.env.SOCKET_HOST)
  }

  componentDidMount() {
    const { router } = this.props
    this.setState({ kioskId: router.query.id })
    this.fetchDataKiosk(router.query.id)
    this.initSocket()
  }

  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.disconnect()
    }
  }

  initSocket = () => {
    const socket = this.state.socket
    if (socket) {
      // เสียบบัตร
      socket.on(EVENTS.CARD_INSERTED, res => {
        console.log("CARD_INSERTED", res)
        if (res.kioskId === this.state.kioskId) {
          this.setState({ reading: true })
        }
      })
      // เริ่มอ่านบัตร
      socket.on(EVENTS.READING_START, res => {
        console.log("READING_START", res)
        if (res.kioskId === this.state.kioskId) {
          this.setState({ reading: true })
        }
      })
      // อ่านบัตรสำเร็จ
      socket.on(EVENTS.READING_COMPLETE, res => {
        console.log("READING_COMPLETE", res)
        if (res.kioskId === this.state.kioskId) {
          this.onReadingComplete(res)
        }
      })
      // ถอดบัตร
      socket.on(EVENTS.CARD_REMOVED, res => {
        console.log("CARD_REMOVED", res)
        if (res.kioskId === this.state.kioskId) {
          this.onClearState()
        }
      })
      socket.on(EVENTS.READING_FAIL, res => {
        console.log("READING_FAIL", res)
        if (res.kioskId === this.state.kioskId) {
          this.onClearState()
        }
      })
    }
  }

  onReadingComplete = async res => {
    await this.setState({
      reading: false,
      patientInfo: res.card_info,
      search: res.card_info.citizenId
    })
    await this.fetchDataRight()
  }

  fetchDataKiosk = async kioskId => {
    try {
      const { data } = await axios.get(`/kiosk/${kioskId}`)
      this.setState({ kiosk: data })
    } catch (error) {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  fetchDataRight = async () => {
    console.log("fetchDataRight")
    if (
      !this.state.search ||
      this.state.right ||
      this.state.search.length < 13
    ) {
      return
    }
    this.setState({ loading: true })
    try {
      const { data } = await axios.get(`/user/right/${this.state.search}`, {
        headers: {
          "X-Token-Header": this.state.kiosk.token
        }
      })
      this.dismissModal()
      this.setState({ right: data, loading: false })
    } catch (error) {
      this.setState({ loading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  onChangeInput = event => {
    /* var newState = {
      mask: "9999-9999-9999-9999",
      value: value
    }
    if (/^3[47]/.test(value)) {
      newState.mask = "9999-999999-99999"
    }
    console.log(newState) */
    this.setState({ search: event.target.value })
  }

  onChangeInputPreview = event => {
    console.log(event)
  }

  onClickInput = () => {
    if (!this.state.isModalOpen) {
      this.setState({
        isModalOpen: !this.state.isModalOpen
      })
    }
  }

  handleModalOpen = () => {
    this.setState({
      isModalOpen: !this.state.isModalOpen
    })
  }

  dismissModal = () => {
    this.setState({
      isModalOpen: false
    })
  }

  handleNumpad = number => {
    let newvalue = this.state.search + number.toString()
    if (newvalue.length <= 13) {
      this.setState({ search: newvalue })
    }
  }

  maskString = value => {
    if (!value) return ""
    let i = 0
    let newValue = value
    const strLen = 13 - value.length
    if (strLen < 13) {
      for (let x = 0; x < strLen; x++) {
        newValue = newValue + "_"
      }
    }
    const v = newValue.toString()
    const pattern = "#-####-#####-##-#"
    const p = pattern.replace(/#/g, _ => v[i++])
    return p
  }

  onClearSearch = () => {
    console.log("onClearSearch")
    this.setState({ search: "" })
  }

  onDeleteSearch = () => {
    if (this.state.search) {
      const newvalue = this.state.search.substr(0, this.state.search.length - 1)
      this.setState({ search: newvalue })
    }
  }

  handleSubmit = event => {
    console.log("A name was loading: " + this.state.search)
    event.preventDefault()
    this.fetchDataRight()
  }

  getValuePatient = (field, defaultValue = "-") => {
    const right = this.state.right
    if (this.state.patientInfo) {
      if (field === "cid") {
        return this.state.patientInfo["citizenId"].substring(0, 7) + "*****"
      }
      if (field === "birthday") {
        return this.convertBirthDay(this.state.patientInfo["birthday"])
      }
      if (this.state.patientInfo[field]) {
        return this.state.patientInfo[field]
      }
    } else if (right) {
      if (field === "fullname") {
        return right.fname + " " + right.lname
      }
      if (field === "cid") {
        return right.person_id.substring(0, 7) + "*****"
      }
      if (field === "address") {
        return (
          "บ้าน" +
          right.primary_mooban_name +
          " ต." +
          right.primary_tumbon_name +
          " อ." +
          right.primary_amphur_name +
          " จ." +
          right.primary_province_name
        )
      }
      if (field === "birthday") {
        return (
          right.birthdate.substring(6, 8) +
          "/" +
          right.birthdate.substring(4, 6) +
          "/" +
          right.birthdate.substring(0, 4)
        )
      }
      if (field === "nation") {
        return defaultValue
      }
    }
    return defaultValue
  }

  getPhoto = () => {
    if (this.state.patientInfo) {
      return this.state.patientInfo.photo
    } else {
      return boyImg
    }
  }

  convertBirthDay = birthday => {
    return (
      moment(birthday, "YYYY-MM-DD").format("DD MMM ") +
      (parseInt(moment(birthday, "YYYY-MM-DD").format("YYYY")) + 543)
    )
  }

  getValueRight = field => {
    if (!this.state.right) return "-"
    return this.state.right[field]
  }

  onClearState = () => {
    console.log("onClearState")
    this.setState({
      search: "",
      loading: false,
      patientInfo: null,
      right: null,
      isModalOpen: false,
      isPrintting: false,
      printTime: moment().format("HH:mm น."),
      reading: false
    })
  }

  onPrint = async () => {
    const _this = this
    const { value: isConfirm } = await Swal.fire({
      title: "ต้องการพิมพ์ใช่หรือไม่?",
      text: "",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: `<i class="fa fa-print"></i> พิมพ์`,
      cancelButtonText: `<i class="fa fa-close"></i> ยกเลิก`
    })
    if (isConfirm) {
      await this.setState({
        isPrintting: true,
        printTime: moment().format("HH:mm น.")
      })
      await new Promise(resolve => {
        setTimeout(resolve, 300)
      })
      window.print()
      window.onafterprint = function() {
        console.log("close")

        // window.close()
      }
      await new Promise(resolve => {
        setTimeout(resolve, 1000)
      })
      _this.onClearState()
    }
  }

  render() {
    return (
      <Aux>
        <Head title="ตู้กดบัตรคิว" />
        <div className="wrapper">
          <KioskHeader currentDate={this.state.currentDate} />
          <div className="content-wrapper">
            <section className="content">
              <div className="row form-container">
                <div className="col-md-12">
                  <KioskForm
                    handleSubmit={this.handleSubmit}
                    isModalOpen={this.state.isModalOpen}
                    dismissModal={this.dismissModal}
                    maskString={search => this.maskString(search)}
                    search={this.state.search}
                    onClearSearch={this.onClearSearch}
                    onDeleteSearch={this.onDeleteSearch}
                    handleNumpad={number => this.handleNumpad(number)}
                    loading={this.state.loading}
                    fetchDataRight={this.fetchDataRight}
                    onChangeInput={this.onChangeInput}
                    onClickInput={this.onClickInput}
                    onClearState={this.onClearState}
                    right={this.state.right}
                  />
                </div>
              </div>
              <div
                className={classNames(
                  "row box-container",
                  this.state.patientInfo || this.state.right ? "" : "hidden"
                )}
              >
                <div className="col-md-6">
                  <KioskBoxPatient
                    getPhoto={() => this.getPhoto()}
                    getValuePatient={field => this.getValuePatient(field)}
                  />
                </div>
                <div className="col-md-6">
                  <KioskBoxRight
                    getPhoto={() => this.getPhoto()}
                    getValueRight={field => this.getValueRight(field)}
                    right={this.state.right}
                  />
                </div>
              </div>

              <div className="row box-action-container">
                <div className="col-md-4 col-md-offset-4">
                  {this.state.right ? (
                    <button
                      type="button"
                      className="btn btn-brand btn-lg btn-block btn-print"
                      disabled={!this.state.right}
                      onClick={this.onPrint}
                    >
                      <i className="fa fa-print"></i> ออกใบรับรองการตรวจสอบสิทธิ
                    </button>
                  ) : null}
                  <div className="loading">
                    <Spin
                      tip="Loading..."
                      size="large"
                      spinning={this.state.reading}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
        {this.state.isPrintting ? (
          <KioskPrintTemplate
            getValueRight={field => this.getValueRight(field)}
            getValuePatient={field => this.getValuePatient(field)}
            printDate={this.state.printDate}
            printTime={this.state.printTime}
          />
        ) : null}
        {this.state.isPrintting ? (
          <div className="kt-quick-panel-overlay"></div>
        ) : null}
        <style jsx global>
          {portlet}
        </style>
        <style jsx global>{`
          /* @import url("/static/dist/css/style.bundle.css"); */
          html,
          body,
          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          .h1,
          .h2,
          .h3,
          .h4,
          .h5,
          .h6 {
            font-family: "Prompt", sans-serif !important;
          }
          .box-title {
            font-weight: 700;
            text-transform: capitalize;
          }
          .content-wrapper,
          .main-footer {
            margin-left: 0px;
          }
          .main-header .logo {
            height: 100px;
          }
          .main-header .logo-app img {
            max-width: 130px;
          }
          .navbar-static-top .app-name {
            color: #fff;
            font-size: 4rem;
            min-height: 100px;
            margin: auto;
            position: absolute;
            /* transform: translate(-50%, -50%); */
            /* left: 50%; */
            top: 20%;
            text-shadow: 2px 2px #90caf9;
            color: #2196f3;
          }
          .skin-green-light .main-header .navbar {
            background-color: #fff;
          }
          .skin-green-light .main-header .logo,
          .skin-green-light .main-header .logo:hover {
            background-color: #fff;
          }
          .main-header {
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
          }
          .main-header .navbar {
            min-height: 100px;
          }
          .widget--height-fluid {
            /* height: calc(100% - 20px);*/
            display: flex;
            flex-grow: 1;
            flex-direction: column;
            box-shadow: 0px 0px 13px 0px rgba(82, 63, 105, 0.05);
            background-color: #ffffff;
            margin-bottom: 20px;
            border-radius: 4px;
            min-height: 400px;
            border: 1px solid #2196f3;
          }
          .box-title {
            text-shadow: 1px 2px #ccc;
          }
          .box-label {
            font-size: 2rem;
            font-weight: 500;
          }
          .text-success {
            color: #b5d56a !important;
          }
          .box-desc {
            font-size: 2rem;
            color: #2786fb;
          }
          .btn-print {
            font-size: 25px;
          }
          .btn-brand {
            background-color: #2196f3;
            border-color: #2196f3;
            color: #fff !important;
          }
          .btn-brand:hover,
          .btn-brand:active {
            background-color: #2196f3;
            border-color: #2196f3;
            color: #fff !important;
          }
          @media (min-width: 768px) {
            .section-title {
              -ms-flex-direction: row;
              flex-direction: row;
            }
          }
          @media (min-width: 768px) {
            .section-title .shape.shape-left {
              left: 0;
              transform: none;
            }
          }
          .section-title .shape.shape-left {
            left: 45%;
            transform: translateX(-50%);
          }

          @media (min-width: 768px) {
            .section-title .shape {
              position: relative;
              left: auto;
              transform: none;
              top: 0;
            }
          }
          .section-title .shape {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: inline-block;
            padding: 0;
            position: absolute;
            top: -20px;
          }
          .bg-info {
            background-color: #84bed6 !important;
          }
          .section-title .shape.shape-left:before {
            right: 3px;
            width: 70px;
            top: 6px;
          }
          .section-title .shape.shape-left:before,
          .section-title .shape.shape-left:after {
            content: "";
            position: absolute;
            background-color: inherit;
            height: 2px;
          }
          .section-title .shape.shape-left:after {
            right: 3px;
            width: 55px;
            top: 11px;
          }
          .section-title .shape.shape-left:before,
          .section-title .shape.shape-left:after {
            content: "";
            position: absolute;
            background-color: inherit;
            height: 2px;
          }
          .section-title h2 {
            font-family: "Dosis", sans-serif;
            font-size: 2.25rem;
            text-transform: capitalize;
            font-weight: 700;
            position: relative;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            -ms-flex-order: 1;
            order: 1;
          }
          .text-danger {
            color: #ea7066 !important;
          }
          @media (min-width: 768px) {
            .section-title .shape {
              position: relative;
              left: auto;
              transform: none;
              top: 0;
            }
          }
          .section-title .shape {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: inline-block;
            padding: 0;
            position: absolute;
            top: -20px;
          }
          .section-title .shape.shape-right:before {
            left: 3px;
            width: 70px;
            top: 6px;
          }
          .section-title .shape.shape-right:before,
          .section-title .shape.shape-right:after {
            content: "";
            position: absolute;
            background-color: inherit;
            height: 2px;
          }

          #keyboard {
            margin: 0;
            padding: 0;
            list-style: none;
          }
          /* #keyboard li.numpad {
            float: left;
            margin: 0 5px 5px 0;
            width: 60px;
            height: 60px;
            font-size: 24px;
            line-height: 60px;
            text-align: center;
            background: #fff;
            border: 1px solid #f9f9f9;
            border-radius: 5px;
            background-color: #2196f3;
            color: #fff;
          } */
          #keyboard li.none-numpad {
            float: left;
            margin: 0 5px 5px 0;
            width: 60px;
            height: 60px;
            font-size: 24px;
            line-height: 60px;
            text-align: center;
            border-radius: 5px;
            transition: background 0.8s;
          }
          .capslock,
          .tab,
          .left-shift,
          .clearl,
          .switch {
            clear: left;
          }
          #keyboard .tab,
          #keyboard .delete {
            width: 70px;
          }
          #keyboard .capslock {
            width: 80px;
          }
          #keyboard .return {
            width: 90px;
          }
          #keyboard .left-shift {
            width: 70px;
          }

          #keyboard .switch {
            width: 90px;
          }
          #keyboard .rightright-shift {
            width: 109px;
          }
          .lastitem {
            margin-right: 0;
          }
          .uppercase {
            text-transform: uppercase;
          }
          #keyboard .space {
            float: left;
            width: 556px;
          }
          #keyboard .switch,
          #keyboard .space,
          #keyboard .return {
            font-size: 16px;
          }
          .on {
            display: none;
          }
          #keyboard li.numpad:hover {
            position: relative;
            top: 1px;
            left: 1px;
            border-color: #e5e5e5;
            cursor: pointer;
            background: #47a7f5
              radial-gradient(circle, transparent 1%, #47a7f5 1%) center/15000%;
          }
          /* Ripple effect */
          .ripple {
            background-position: center;
            transition: background 0.8s;
          }
          .ripple:hover {
            background: #1890ff
              radial-gradient(circle, transparent 1%, #1890ff 1%) center/15000%;
          }
          .ripple:active {
            background-color: #64b5f6;
            background-size: 100%;
            transition: background 0s;
          }

          /* Button style */
          button.ripple {
            float: left;
            margin: 0 5px 5px 0;
            width: 100px;
            height: 70px;
            font-size: 24px;
            line-height: 60px;
            text-align: center;
            background: #fff;
            border: 1px solid #2196f3;
            border-radius: 5px;
            background-color: #2196f3;
            color: #fff;
          }
          .numpad-container {
            padding: 15px;
          }
          .display-numpad {
            text-align: center;
            border: 2px solid #ccc;
            background-color: rgba(#fff, 0.7);
            border-radius: 3px;
            font-size: 2.5rem;
            height: 50px;
            vertical-align: middle;
          }
          .loading {
            display: flex;
            justify-content: center;
            padding-top: 10px;
          }
          .ant-input-affix-wrapper .ant-input {
            min-height: 100%;
            height: 50px;
            font-size: 2rem;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          }
          .widget-user-username {
            color: #fff;
          }
          .bg-custom {
            background-color: #2196f3 !important;
          }
          .skin-green-light .main-header .navbar .nav > li > a {
            text-shadow: 2px 2px #90caf9;
            color: #2196f3;
            font-size: 4rem;
          }
          .main-header .navbar-custom-menu,
          .main-header .navbar-right {
            float: right;
            height: 100px;
          }
          .navbar-nav {
            float: left;
            margin: 0;
            padding-top: 5%;
          }
          @media (max-width: 767px) {
            .modal-box {
              left: 50% !important;
            }
            .main-header .logo .logo-lg {
              display: none;
            }
            .navbar-static-top .app-name {
              font-size: 2rem !important;
            }
            .skin-green-light .main-header .navbar .nav > li > a {
              font-size: 2rem !important;
            }
            .main-header .logo {
              height: 75px;
            }
            .main-header .logo-app img {
              max-width: 100px;
            }
            .main-header .navbar {
              height: 60px !important;
              min-height: 60px;
            }
          }
          @media (min-width: 768px) and (max-width: 991px) {
            .modal-box {
              left: 50% !important;
            }
            .main-header .logo .logo-lg {
              display: none;
            }
            .navbar-static-top .app-name {
              font-size: 2rem !important;
            }
            .skin-green-light .main-header .navbar .nav > li > a {
              font-size: 2rem !important;
            }
          }
          @media print {
            .form-container,
            .box-container,
            .box-action-container,
            .main-header,
            .wrapper {
              visibility: hidden;
              display: none;
            }
          }
          .kt-quick-panel-overlay {
            background: rgba(0, 0, 0, 0.5);
          }
          .kt-quick-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            overflow: hidden;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.5);
            -webkit-animation: kt-animate-fade-in 0.3s linear 1;
            animation: kt-animate-fade-in 0.3s linear 1;
          }
          .swal2-container {
            z-index: 2200 !important;
          }

          .swal2-popup {
            font-size: 1.6rem !important;
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--noborder {
            border-bottom: 0;
            display: flex;
            justify-content: center;
          }
          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title {
            font-size: 36px !important;
            font-weight: 700;
            color: #fff !important;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__username {
            font-size: 2rem !important;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__label {
            font-size: 16px !important;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__data {
            font-size: 16px;
            color: #2786fb !important;
          }
          .kt-portlet.kt-portlet--height-fluid {
            border: 1px solid #22b9ff;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__head {
            margin-top: auto !important;
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--noborder {
            background-color: #22b9ff;
          }
          /* VERTICAL */
          @keyframes vertical {
            0% {
              transform: translate(0, -3px);
            }
            4% {
              transform: translate(0, 3px);
            }
            8% {
              transform: translate(0, -3px);
            }
            12% {
              transform: translate(0, 3px);
            }
            16% {
              transform: translate(0, -3px);
            }
            20% {
              transform: translate(0, 3px);
            }
            22%,
            100% {
              transform: translate(0, 0);
            }
          }
          .faa-vertical.animated,
          .faa-vertical.animated-hover:hover,
          .faa-parent.animated-hover:hover > .faa-vertical {
            animation: vertical 2s ease infinite;
          }
          .faa-vertical.animated.faa-fast,
          .faa-vertical.animated-hover.faa-fast:hover,
          .faa-parent.animated-hover:hover > .faa-vertical.faa-fast {
            animation: vertical 1s ease infinite;
          }
          .faa-vertical.animated.faa-slow,
          .faa-vertical.animated-hover.faa-slow:hover,
          .faa-parent.animated-hover:hover > .faa-vertical.faa-slow {
            animation: vertical 4s ease infinite;
          }
          .ant-btn-round.ant-btn-lg {
            height: 50px;
            padding: 0 20px;
            font-size: 20px;
            border-radius: 40px;
          }
          .btn.btn-brand.btn-lg.btn-block.btn-print {
            border-radius: 40px;
          }
          .kt-widget__media {
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px;
          }
          /* xxx */
          .kt-portlet--tabs .nav-pills.nav-tabs-btn {
            margin: 0 0 -1px 0;
          }
          .kt-portlet--tabs .nav-pills.nav-tabs-btn.nav-tabs-btn-2x {
            margin: 0 0 -2px 0;
          }
          .kt-portlet--tabs .nav-pills.nav-tabs-btn .nav-item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
          }
          .kt-portlet--tabs .nav-pills.nav-tabs-btn .nav-item .nav-link {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-portlet {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-shadow: 0px 0px 13px 0px rgba(82, 63, 105, 0.05);
            box-shadow: 0px 0px 13px 0px rgba(82, 63, 105, 0.05);
            background-color: #ffffff;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          .kt-page-content-white .kt-portlet {
            -webkit-box-shadow: 0px 0px 13px 0px rgba(82, 63, 105, 0.1);
            box-shadow: 0px 0px 13px 0px rgba(82, 63, 105, 0.1);
          }
          .kt-portlet .kt-portlet__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            position: relative;
            padding: 0 25px;
            border-bottom: 1px solid #ebedf2;
            min-height: 60px;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--right {
            -webkit-box-pack: end;
            -ms-flex-pack: end;
            justify-content: flex-end;
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--noborder {
            border-bottom: 0;
          }
          .kt-portlet .kt-portlet__head .kt-portlet__head-label {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -ms-flex-line-pack: flex-first;
            align-content: flex-first;
          }
          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title {
            margin: 0;
            padding: 0;
            font-size: 1.2rem;
            font-weight: 500;
            color: #48465b;
          }
          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title
            small {
            font-weight: 300;
            padding-left: 0.5rem;
            font-size: 1rem;
            color: #74788d;
          }
          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-icon {
            padding-right: 0.75rem;
            font-size: 1.3rem;
            color: #74788d;
          }
          .kt-portlet .kt-portlet__head .kt-portlet__head-toolbar {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -ms-flex-line-pack: end;
            align-content: flex-end;
          }
          .kt-portlet .kt-portlet__head .kt-portlet__head-toolbar .nav-pills,
          .kt-portlet .kt-portlet__head .kt-portlet__head-toolbar .nav-tabs {
            margin: 0;
          }
          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .kt-portlet__head-wrapper {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-portlet .kt-portlet__head .kt-portlet__head-progress {
            position: absolute;
            left: 0;
            right: 0;
          }
          .kt-portlet.kt-portlet--head-sm .kt-portlet__head {
            min-height: 50px;
          }
          .kt-portlet.kt-portlet--head-lg .kt-portlet__head {
            min-height: 80px;
          }
          .kt-portlet.kt-portlet--head-xl .kt-portlet__head {
            min-height: 100px;
          }
          .kt-portlet.kt-portlet--sticky > .kt-portlet__head {
            height: 50px;
            min-height: 50px;
          }
          .kt-portlet.kt-portlet--sticky
            > .kt-portlet__head.kt-portlet__head--sm {
            height: 40px;
            min-height: 40px;
          }
          .kt-portlet.kt-portlet--sticky
            > .kt-portlet__head.kt-portlet__head--lg {
            height: 70px;
            min-height: 70px;
          }
          .kt-portlet.kt-portlet--sticky
            > .kt-portlet__head.kt-portlet__head--xl {
            height: 90px;
            min-height: 90px;
          }
          .kt-portlet.kt-portlet--head-overlay .kt-portlet__head {
            position: relative;
            z-index: 1;
            border: 0;
            height: 60px;
          }
          .kt-portlet.kt-portlet--head-overlay .kt-portlet__body {
            margin-top: -60px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-sm
            .kt-portlet__head {
            height: 50px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-sm
            .kt-portlet__body {
            margin-top: -50px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-lg
            .kt-portlet__head {
            height: 80px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-lg
            .kt-portlet__body {
            margin-top: -80px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-xl
            .kt-portlet__head {
            height: 100px;
          }
          .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-xl
            .kt-portlet__body {
            margin-top: -100px;
          }
          .kt-portlet .kt-portlet__body {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            padding: 25px;
            border-radius: 4px;
          }
          .kt-portlet .kt-portlet__body .kt-portlet__content {
            padding: 0;
            margin: 0;
          }
          .kt-portlet .kt-portlet__body > .kt-datatable > .kt-datatable__table {
            border-radius: 4px;
          }
          .kt-portlet .kt-portlet__foot {
            padding: 25px;
            border-top: 1px solid #ebedf2;
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }
          .kt-portlet .kt-portlet__foot .kt-portlet__foot-wrapper {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: horizontal;
            -webkit-box-direction: normal;
            -ms-flex-direction: row;
            flex-direction: row;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--sm {
            padding-top: 10px;
            padding-bottom: 10px;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--md {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--no-border {
            border-top: 0;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--top {
            border-top: 0;
            border-bottom: 1px solid #ebedf2;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--solid {
            background-color: #f7f8fa;
            border-top: 0;
          }
          .kt-portlet
            .kt-portlet__foot.kt-portlet__foot--solid.kt-portlet__foot--top {
            border-bottom: 0;
          }
          .kt-portlet .kt-portlet__separator {
            height: 0;
            border-top: 1px solid #ebedf2;
          }
          .kt-portlet.kt-portlet--bordered {
            -webkit-box-shadow: none;
            box-shadow: none;
            border: 1px solid #ebedf2;
          }
          .kt-portlet.kt-portlet--unelevate {
            -webkit-box-shadow: none;
            box-shadow: none;
          }
          .kt-portlet.kt-portlet--unround .kt-portlet__head {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
          .kt-portlet.kt-portlet--unround .kt-portlet__body {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
          .kt-portlet.kt-portlet--unround .kt-portlet__foot {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
          .kt-portlet.kt-portlet--last {
            margin-bottom: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--center {
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--center-x {
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--center-y {
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-portlet .kt-portlet__body .kt-portlet__body--hor-fit {
            margin-left: -25px;
            margin-right: -25px;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--stick-bottom {
            position: relative;
            bottom: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fluid {
            height: 100%;
            -webkit-box-orient: horizontal;
            -webkit-box-direction: normal;
            -ms-flex-direction: row;
            flex-direction: row;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            width: 100%;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fill {
            -webkit-box-flex: 1 !important;
            -ms-flex-positive: 1 !important;
            flex-grow: 1 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--unfill {
            -webkit-box-flex: 0 !important;
            -ms-flex-positive: 0 !important;
            flex-grow: 0 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fullheight {
            -webkit-box-flex: auto;
            -ms-flex-positive: auto;
            flex-grow: auto;
          }
          .kt-portlet.kt-portlet--fit .kt-portlet__head {
            padding: 0;
          }
          .kt-portlet.kt-portlet--fit .kt-portlet__body {
            padding: 0;
          }
          .kt-portlet.kt-portlet--fit .kt-portlet__foot {
            padding: 0;
          }
          .kt-portlet.kt-portlet--fit.kt-portlet--height-fluid-half {
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
          }
          .kt-portlet.kt-portlet--fit.kt-portlet--height-fluid-half
            .kt-portlet__body {
            height: 100%;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
          }
          .kt-portlet.kt-portlet--contain {
            overflow: hidden;
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--fit {
            padding: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit {
            padding: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-top {
            padding-top: 0 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-bottom {
            padding-bottom: 0 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-x,
          .kt-portlet .kt-portlet__body.kt-portlet__body--hor-fit {
            padding-left: 0;
            padding-right: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-y {
            padding-top: 0;
            padding-bottom: 0;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--fit {
            padding: 0;
          }
          .kt-portlet.kt-portlet--space {
            padding-left: 25px;
            padding-right: 25px;
          }
          .kt-portlet.kt-portlet--space .kt-portlet__head,
          .kt-portlet.kt-portlet--space .kt-portlet__body,
          .kt-portlet.kt-portlet--space .kt-portlet__foot {
            padding-left: 0;
            padding-right: 0;
          }
          .kt-portlet.kt-portlet--head-noborder .kt-portlet__head {
            border-bottom: 0;
          }
          .kt-portlet.kt-portlet--head-noborder .kt-portlet__body {
            padding-top: 12.5px;
          }
          .kt-portlet.kt-portlet--tabs
            .kt-portlet__head
            .kt-portlet__head-toolbar {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
          }
          .kt-portlet.kt-portlet--tabs-border-3x .kt-portlet__head {
            border-bottom: 3px solid #f7f8fa;
          }
          .kt-portlet.kt-portlet--tabs-border-3x
            .kt-portlet__head
            .nav.nav-tabs {
            margin-bottom: -3px;
          }
          .kt-portlet.kt-portlet--solid-brand {
            background: #22b9ff;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #03afff;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-brand .kt-portlet__head {
            border-bottom: 3px solid rgba(34, 185, 255, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-brand {
            border-bottom: 3px solid rgba(34, 185, 255, 0.2);
          }
          .kt-portlet.kt-portlet--solid-light {
            background: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__head {
            color: #282a3c;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #1c1d2a;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #1c1d2a;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-light .kt-portlet__body {
            color: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__foot {
            color: #282a3c;
            border-top: 1px solid transparent;
            background: #f0f0f0;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-light .kt-portlet__head {
            border-bottom: 3px solid rgba(255, 255, 255, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-light {
            border-bottom: 3px solid rgba(255, 255, 255, 0.2);
          }
          .kt-portlet.kt-portlet--solid-dark {
            background: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #1c1d2a;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-dark .kt-portlet__head {
            border-bottom: 3px solid rgba(40, 42, 60, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-dark {
            border-bottom: 3px solid rgba(40, 42, 60, 0.2);
          }
          .kt-portlet.kt-portlet--solid-primary {
            background: #5867dd;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #3f50d8;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-primary .kt-portlet__head {
            border-bottom: 3px solid rgba(88, 103, 221, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-primary {
            border-bottom: 3px solid rgba(88, 103, 221, 0.2);
          }
          .kt-portlet.kt-portlet--solid-success {
            background: #1dc9b7;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-success .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #19ae9f;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-success .kt-portlet__head {
            border-bottom: 3px solid rgba(29, 201, 183, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-success {
            border-bottom: 3px solid rgba(29, 201, 183, 0.2);
          }
          .kt-portlet.kt-portlet--solid-info {
            background: #2786fb;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-info .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #0975fa;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-info .kt-portlet__head {
            border-bottom: 3px solid rgba(39, 134, 251, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-info {
            border-bottom: 3px solid rgba(39, 134, 251, 0.2);
          }
          .kt-portlet.kt-portlet--solid-warning {
            background: #ffb822;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__head {
            color: #111111;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #111111;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #020202;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #020202;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__body {
            color: #111111;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__foot {
            color: #111111;
            border-top: 1px solid transparent;
            background: #ffae03;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-warning .kt-portlet__head {
            border-bottom: 3px solid rgba(255, 184, 34, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-warning {
            border-bottom: 3px solid rgba(255, 184, 34, 0.2);
          }
          .kt-portlet.kt-portlet--solid-danger {
            background: #fd27eb;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #fd09e8;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-danger .kt-portlet__head {
            border-bottom: 3px solid rgba(253, 39, 235, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-danger {
            border-bottom: 3px solid rgba(253, 39, 235, 0.2);
          }
          .kt-portlet.kt-portlet--sortable .kt-portlet__head {
            cursor: move;
          }
          .kt-portlet.kt-portlet--sortable-empty {
            visibility: hidden;
            height: 45px;
            min-height: 125px;
          }
          .kt-portlet.ui-sortable-helper {
            border: 1px dashed #ebedf2;
          }
          .kt-portlet .kt-portlet__head {
            -webkit-transition: left 0.3s, right 0.3s, height 0.3s;
            transition: left 0.3s, right 0.3s, height 0.3s;
          }
          .kt-portlet.kt-portlet--sticky > .kt-portlet__head {
            -webkit-transition: left 0.3s, right 0.3s, height 0.3s;
            transition: left 0.3s, right 0.3s, height 0.3s;
            position: fixed;
            -webkit-box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.1);
            box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.1);
            z-index: 101;
            background: #fff;
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title {
            color: #fff;
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title
            small {
            color: rgba(255, 255, 255, 0.8);
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-icon {
            color: rgba(255, 255, 255, 0.8);
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head:not(.kt-portlet__head--noborder) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }
          .kt-portlet.kt-portlet--skin-solid .kt-portlet__body {
            color: #fff;
          }
          .kt-portlet .kt-portlet__space-x {
            padding-left: 25px !important;
            padding-right: 25px !important;
          }
          .kt-portlet .kt-portlet__space-y {
            padding-top: 25px !important;
            padding-bottom: 25px !important;
          }
          .kt-portlet.kt-portlet--collapsed > .kt-form,
          .kt-portlet.kt-portlet--collapsed > .kt-portlet__body {
            display: none;
          }
          .kt-portlet.kt-portlet--collapsed
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-angle-down:before,
          .kt-portlet.kt-portlet--collapse
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-angle-down:before {
            content: "\f113";
          }
          .kt-portlet.kt-portlet--collapsed
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-plus:before,
          .kt-portlet.kt-portlet--collapse
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-plus:before {
            content: "\f28e";
          }
          .kt-portlet .kt-portlet__head.kt-portlet__head--fit {
            padding: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit {
            padding: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-top {
            padding-top: 0 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-bottom {
            padding-bottom: 0 !important;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-x,
          .kt-portlet .kt-portlet__body.kt-portlet__body--hor-fit {
            padding-left: 0;
            padding-right: 0;
          }
          .kt-portlet .kt-portlet__body.kt-portlet__body--fit-y {
            padding-top: 0;
            padding-bottom: 0;
          }
          .kt-portlet .kt-portlet__foot.kt-portlet__foot--fit {
            padding: 0;
          }
          .kt-portlet.kt-portlet--space {
            padding-left: 25px;
            padding-right: 25px;
          }
          .kt-portlet.kt-portlet--space .kt-portlet__head,
          .kt-portlet.kt-portlet--space .kt-portlet__body,
          .kt-portlet.kt-portlet--space .kt-portlet__foot {
            padding-left: 0;
            padding-right: 0;
          }
          .kt-portlet.kt-portlet--head-noborder .kt-portlet__head {
            border-bottom: 0;
          }
          .kt-portlet.kt-portlet--head-noborder .kt-portlet__body {
            padding-top: 12.5px;
          }
          .kt-portlet.kt-portlet--tabs
            .kt-portlet__head
            .kt-portlet__head-toolbar {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: stretch;
            -ms-flex-align: stretch;
            align-items: stretch;
          }
          .kt-portlet.kt-portlet--tabs-border-3x .kt-portlet__head {
            border-bottom: 3px solid #f7f8fa;
          }
          .kt-portlet.kt-portlet--tabs-border-3x
            .kt-portlet__head
            .nav.nav-tabs {
            margin-bottom: -3px;
          }
          .kt-portlet.kt-portlet--solid-brand {
            background: #22b9ff;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-brand
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-brand .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #03afff;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-brand .kt-portlet__head {
            border-bottom: 3px solid rgba(34, 185, 255, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-brand {
            border-bottom: 3px solid rgba(34, 185, 255, 0.2);
          }
          .kt-portlet.kt-portlet--solid-light {
            background: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__head {
            color: #282a3c;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #1c1d2a;
          }
          .kt-portlet.kt-portlet--solid-light
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #1c1d2a;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-light .kt-portlet__body {
            color: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-light .kt-portlet__foot {
            color: #282a3c;
            border-top: 1px solid transparent;
            background: #f0f0f0;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-light .kt-portlet__head {
            border-bottom: 3px solid rgba(255, 255, 255, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-light {
            border-bottom: 3px solid rgba(255, 255, 255, 0.2);
          }
          .kt-portlet.kt-portlet--solid-dark {
            background: #282a3c;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-dark
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-dark .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #1c1d2a;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-dark .kt-portlet__head {
            border-bottom: 3px solid rgba(40, 42, 60, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-dark {
            border-bottom: 3px solid rgba(40, 42, 60, 0.2);
          }
          .kt-portlet.kt-portlet--solid-primary {
            background: #5867dd;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-primary
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-primary .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #3f50d8;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-primary .kt-portlet__head {
            border-bottom: 3px solid rgba(88, 103, 221, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-primary {
            border-bottom: 3px solid rgba(88, 103, 221, 0.2);
          }
          .kt-portlet.kt-portlet--solid-success {
            background: #1dc9b7;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-success
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-success .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-success .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #19ae9f;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-success .kt-portlet__head {
            border-bottom: 3px solid rgba(29, 201, 183, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-success {
            border-bottom: 3px solid rgba(29, 201, 183, 0.2);
          }
          .kt-portlet.kt-portlet--solid-info {
            background: #2786fb;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-info
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-info .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-info .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #0975fa;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-info .kt-portlet__head {
            border-bottom: 3px solid rgba(39, 134, 251, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-info {
            border-bottom: 3px solid rgba(39, 134, 251, 0.2);
          }
          .kt-portlet.kt-portlet--solid-warning {
            background: #ffb822;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__head {
            color: #111111;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #111111;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #020202;
          }
          .kt-portlet.kt-portlet--solid-warning
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #020202;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__body {
            color: #111111;
          }
          .kt-portlet.kt-portlet--solid-warning .kt-portlet__foot {
            color: #111111;
            border-top: 1px solid transparent;
            background: #ffae03;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-warning .kt-portlet__head {
            border-bottom: 3px solid rgba(255, 184, 34, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-warning {
            border-bottom: 3px solid rgba(255, 184, 34, 0.2);
          }
          .kt-portlet.kt-portlet--solid-danger {
            background: #fd27eb;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__head {
            color: #ffffff;
            border-bottom: 1px solid transparent;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-title {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-title
            small {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-danger
            .kt-portlet__head
            .kt-portlet__head-icon
            i {
            color: #f0f0f0;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__body {
            padding-top: 5px;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__wrapper,
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__body {
            color: #ffffff;
          }
          .kt-portlet.kt-portlet--solid-danger .kt-portlet__foot {
            color: #ffffff;
            border-top: 1px solid transparent;
            background: #fd09e8;
          }
          .kt-portlet.kt-portlet--tabs-border-3x-danger .kt-portlet__head {
            border-bottom: 3px solid rgba(253, 39, 235, 0.1);
          }
          .kt-portlet.kt-portlet--border-bottom-danger {
            border-bottom: 3px solid rgba(253, 39, 235, 0.2);
          }
          .kt-portlet.kt-portlet--sortable .kt-portlet__head {
            cursor: move;
          }
          .kt-portlet.kt-portlet--sortable-empty {
            visibility: hidden;
            height: 45px;
            min-height: 125px;
          }
          .kt-portlet.ui-sortable-helper {
            border: 1px dashed #ebedf2;
          }
          .kt-portlet .kt-portlet__head {
            -webkit-transition: height 0.3s;
            transition: height 0.3s;
          }
          .kt-portlet.kt-portlet--sticky > .kt-portlet__head {
            -webkit-transition: height 0.3s;
            transition: height 0.3s;
            position: fixed;
            -webkit-box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.1);
            box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.1);
            z-index: 101;
            background: #fff;
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title {
            color: #fff;
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title
            small {
            color: rgba(255, 255, 255, 0.8);
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-icon {
            color: rgba(255, 255, 255, 0.8);
          }
          .kt-portlet.kt-portlet--skin-solid
            .kt-portlet__head:not(.kt-portlet__head--noborder) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }
          .kt-portlet.kt-portlet--skin-solid .kt-portlet__body {
            color: #fff;
          }
          .kt-portlet .kt-portlet__space-x {
            padding-left: 25px !important;
            padding-right: 25px !important;
          }
          .kt-portlet .kt-portlet__space-y {
            padding-top: 25px !important;
            padding-bottom: 25px !important;
          }
          .kt-portlet.kt-portlet--collapsed > .kt-form,
          .kt-portlet.kt-portlet--collapsed > .kt-portlet__body {
            display: none;
          }
          .kt-portlet.kt-portlet--collapsed
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-angle-down:before,
          .kt-portlet.kt-portlet--collapse
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-angle-down:before {
            content: "\f113";
          }
          .kt-portlet.kt-portlet--collapsed
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-plus:before,
          .kt-portlet.kt-portlet--collapse
            .kt-portlet__head
            .kt-portlet__head-toolbar
            .la-plus:before {
            content: "\f28e";
          }

          .tooltip-portlet {
            opacity: 1;
          }

          @media (min-width: 1025px) {
            .kt-portlet.kt-portlet--height-fluid {
              height: calc(100% - 20px);
            }
            .kt-portlet.kt-portlet--height-fluid .kt-portlet__body {
              -webkit-box-flex: 1;
              -ms-flex-positive: 1;
              flex-grow: 1;
            }
            .kt-portlet.kt-portlet--height-fluid-half {
              height: calc(50% - 20px);
            }
            .kt-portlet.kt-portlet--height-fluid-half .kt-portlet__body {
              -webkit-box-flex: 1;
              -ms-flex-positive: 1;
              flex-grow: 1;
            }
          }

          @media (max-width: 1024px) {
            .kt-portlet {
              margin-bottom: 20px;
            }
            .kt-portlet .kt-portlet__head {
              padding: 0 15px;
              min-height: 50px;
            }
            .kt-portlet .kt-portlet__head.kt-portlet__head--sm {
              min-height: 40px;
            }
            .kt-portlet .kt-portlet__head.kt-portlet__head--lg {
              min-height: 60px;
            }
            .kt-portlet .kt-portlet__head.kt-portlet__head--xl {
              min-height: 80px;
            }
            .kt-portlet.kt-portlet--head-sm .kt-portlet__head {
              min-height: 40px;
            }
            .kt-portlet.kt-portlet--head-lg .kt-portlet__head {
              min-height: 60px;
            }
            .kt-portlet.kt-portlet--head-xl .kt-portlet__head {
              min-height: 80px;
            }
            .kt-portlet .kt-portlet__body {
              padding: 15px;
            }
            .kt-portlet .kt-portlet__body .kt-portlet__body--hor-fit {
              margin-left: -15px;
              margin-right: -15px;
            }
            .kt-portlet .kt-portlet__foot {
              padding: 15px;
            }
            .kt-portlet.kt-portlet--marginless {
              margin-bottom: 0;
            }
            .kt-portlet.kt-portlet--sticky > .kt-portlet__head {
              height: 40px;
            }
            .kt-portlet.kt-portlet--sticky
              > .kt-portlet__head.kt-portlet__head--sm {
              height: 30px;
            }
            .kt-portlet.kt-portlet--sticky
              > .kt-portlet__head.kt-portlet__head--lg {
              height: 50px;
            }
            .kt-portlet.kt-portlet--sticky
              > .kt-portlet__head.kt-portlet__head--xl {
              height: 70px;
            }
            .kt-portlet.kt-portlet--head-overlay .kt-portlet__head {
              height: 50px;
            }
            .kt-portlet.kt-portlet--head-overlay .kt-portlet__body {
              margin-top: -50px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-sm
              .kt-portlet__head {
              height: 40px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-sm
              .kt-portlet__body {
              margin-top: -40px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-lg
              .kt-portlet__head {
              height: 60px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-lg
              .kt-portlet__body {
              margin-top: -60px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-xl
              .kt-portlet__head {
              height: 80px;
            }
            .kt-portlet.kt-portlet--head-overlay.kt-portlet--head-xl
              .kt-portlet__body {
              margin-top: -80px;
            }
            .kt-portlet.kt-portlet--head--noborder .kt-portlet__body {
              padding-top: 7.5px;
            }
            .kt-portlet .kt-portlet__space-x {
              padding-left: 15px !important;
              padding-right: 15px !important;
            }
            .kt-portlet .kt-portlet__space-y {
              padding-top: 15px !important;
              padding-bottom: 15px !important;
            }
          }

          @media (max-width: 768px) {
            .kt-portlet.kt-portlet--head-break-sm .kt-portlet__head {
              padding-top: 15px;
              padding-bottom: 15px;
              min-height: initial !important;
              height: auto;
              -ms-flex-wrap: wrap;
              flex-wrap: wrap;
            }
            .kt-portlet.kt-portlet--head-break-sm
              .kt-portlet__head
              .kt-portlet__head-label {
              margin-bottom: 1rem;
            }
          }
          /*  */
          .kt-widget.kt-widget--user-profile-2 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-top: -45px;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__img {
            max-width: 90px;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 90px;
            height: 90px;
            font-size: 1.5rem;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--brand {
            background: rgba(34, 185, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--light {
            background: rgba(255, 255, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--dark {
            background: rgba(40, 42, 60, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--primary {
            background: rgba(88, 103, 221, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--success {
            background: rgba(29, 201, 183, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--info {
            background: rgba(39, 134, 251, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--warning {
            background: rgba(255, 184, 34, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--danger {
            background: rgba(253, 39, 235, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__username {
            font-size: 1.4rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__titel {
            font-size: 1.4rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__titel:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__desc {
            display: block;
            font-weight: 500;
            font-size: 1.1rem;
            padding-top: 0.4rem;
            color: #74788d;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__body {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__section {
            padding: 1rem 0 1rem 0;
            color: #595d6e;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__section
            a {
            padding-right: 0.3rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            padding-bottom: 1.7rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__icon
            i {
            font-size: 2.7rem;
            color: #a2a5b9;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details
            .kt-widget__title {
            display: block;
            color: #595d6e;
            font-weight: 500;
            font-size: 0.95rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details
            .kt-widget__value {
            display: block;
            color: #48465b;
            font-weight: 600;
            font-size: 1.2rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item {
            padding: 0.7rem 0;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding-bottom: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__label {
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__data {
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            a.kt-widget__data:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact:last-child {
            padding-bottom: 0;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__footer {
            margin-top: 2rem;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__footer .btn {
            font-size: 1rem;
            font-weight: 600;
            padding: 1.1rem 0;
            width: 100%;
          }

          @media (max-width: 768px) {
            .kt-widget.kt-widget--user-profile-2 .kt-widget__head {
              margin-top: -30px;
            }
            .kt-widget.kt-widget--user-profile-2
              .kt-widget__head
              .kt-widget__media
              .kt-widget__img {
              max-width: 60px;
            }
            .kt-widget.kt-widget--user-profile-2
              .kt-widget__head
              .kt-widget__media
              .kt-widget__pic {
              max-width: 60px;
              max-height: 60px;
              font-size: 1.2rem;
            }
          }
          .kt-hidden,
          .kt-hide {
            display: none !important;
          }

          /* widget */
          .kt-widget1 {
            padding: 25px;
          }
          .kt-widget1.kt-widget1--fit {
            padding: 0;
          }
          .kt-widget1.kt-widget1--paddingless {
            padding: 0;
          }
          .kt-widget1 .kt-widget1__item {
            padding: 1.1rem 0;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            border-bottom: 0.07rem dashed #ebedf2;
          }
          .kt-widget1 .kt-widget1__item:last-child {
            padding-bottom: 0;
          }
          .kt-widget1 .kt-widget1__item:first-child {
            padding-top: 0;
          }
          .kt-widget1 .kt-widget1__item .kt-widget1__info .kt-widget1__title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget1 .kt-widget1__item .kt-widget1__info .kt-widget1__desc {
            font-size: 1rem;
            font-weight: normal;
            color: #74788d;
          }
          .kt-widget1 .kt-widget1__item .kt-widget1__number {
            font-size: 1.4rem;
            font-weight: 600;
            color: #74788d;
          }
          .kt-widget1 .kt-widget1__item:last-child {
            border-bottom: 0;
          }

          @media (max-width: 1024px) {
            .kt-widget1 {
              padding: 15px;
            }
          }

          .kt-widget2 .kt-widget2__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 1.4rem;
            position: relative;
          }
          .kt-widget2 .kt-widget2__item:before {
            position: absolute;
            display: block;
            width: 0.3rem;
            border-radius: 4px;
            width: 4px;
            border-radius: 4px;
            height: 100%;
            left: 0.8rem;
            content: "";
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__checkbox {
            padding: 1rem 0 0 2.2rem;
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__info {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            padding-left: 0.23rem 0 0 0.3rem;
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__info .kt-widget2__title {
            font-weight: 500;
            margin: 0;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget2
            .kt-widget2__item
            .kt-widget2__info
            .kt-widget2__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget2
            .kt-widget2__item
            .kt-widget2__info
            .kt-widget2__username {
            text-decoration: none;
            font-size: 0.9rem;
            color: #74788d;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget2
            .kt-widget2__item
            .kt-widget2__info
            .kt-widget2__username:hover {
            text-decoration: none;
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__actions {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            text-align: right;
            padding: 0 0.5rem 0 0.8rem;
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__actions a {
            text-decoration: none;
          }
          .kt-widget2 .kt-widget2__item .kt-widget2__actions i {
            font-size: 2.1rem;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--brand:before {
            background: #22b9ff;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--light:before {
            background: #ffffff;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--dark:before {
            background: #282a3c;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--primary:before {
            background: #5867dd;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--success:before {
            background: #1dc9b7;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--info:before {
            background: #2786fb;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--warning:before {
            background: #ffb822;
          }
          .kt-widget2 .kt-widget2__item.kt-widget2__item--danger:before {
            background: #fd27eb;
          }

          .kt-widget3 .kt-widget3__item {
            margin-bottom: 1rem;
            border-bottom: 0.07rem dashed #ebedf2;
          }
          .kt-widget3 .kt-widget3__item .kt-widget3__header {
            margin-top: 1.5rem;
            padding-bottom: 0.8rem;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget3
            .kt-widget3__item
            .kt-widget3__header
            .kt-widget3__user-img
            .kt-widget3__img {
            width: 3.2rem;
            border-radius: 50%;
          }
          .kt-widget3 .kt-widget3__item .kt-widget3__header .kt-widget3__info {
            padding-left: 1rem;
          }
          .kt-widget3
            .kt-widget3__item
            .kt-widget3__header
            .kt-widget3__info
            .kt-widget3__username {
            font-weight: 500;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget3
            .kt-widget3__item
            .kt-widget3__header
            .kt-widget3__info
            .kt-widget3__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget3
            .kt-widget3__item
            .kt-widget3__header
            .kt-widget3__info
            .kt-widget3__time {
            font-size: 0.9rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget3
            .kt-widget3__item
            .kt-widget3__header
            .kt-widget3__status {
            font-weight: 500;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            text-align: right;
          }
          .kt-widget3 .kt-widget3__item .kt-widget3__body .kt-widget3__text {
            color: #74788d;
          }
          .kt-widget3 .kt-widget3__item:last-child {
            border-bottom: 0;
          }
          .kt-widget3 .kt-widget3__item:first-child .kt-widget3__header {
            margin-top: 0;
          }

          .kt-widget4 .kt-widget4__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            padding-top: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px dashed #ebedf2;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__pic {
            padding-right: 1rem;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__pic img {
            width: 2.5rem;
            border-radius: 4px;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__pic.kt-widget4__pic--sm
            img {
            width: 2.5rem;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__pic.kt-widget4__pic--lg
            img {
            width: 3.5rem;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__pic.kt-widget4__pic--xl
            img {
            width: 4rem;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__pic.kt-widget4__pic--circle
            img {
            border-radius: 50%;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__img {
            margin-right: 0.5rem;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__info {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            padding-right: 1.25rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__info
            .kt-widget4__username {
            font-weight: 500;
            font-size: 1rem;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__info
            .kt-widget4__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__info .kt-widget4__title {
            font-weight: 500;
            font-size: 1.1rem;
            color: #595d6e;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__info .kt-widget4__text {
            font-size: 1rem;
            margin: 0;
            color: #74788d;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__title {
            color: #595d6e;
            font-size: 1rem;
            font-weight: 500;
            padding-right: 1.25rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__title.kt-widget4__title--light {
            font-weight: 400;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__number {
            width: 7rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            text-align: right;
            font-weight: 500;
            font-size: 1.1rem;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__icon {
            padding-right: 1.25rem;
          }
          .kt-widget4 .kt-widget4__item .kt-widget4__icon > i {
            font-size: 1.6rem;
            text-align: right;
            color: #74788d;
          }
          .kt-widget4
            .kt-widget4__item
            .kt-widget4__icon.kt-widget4__icon--2x
            > i {
            font-size: 2.2rem;
          }
          .kt-widget4 .kt-widget4__item:first-child {
            padding-top: 0;
          }
          .kt-widget4 .kt-widget4__item:last-child {
            padding-bottom: 0;
            border-bottom: 0;
          }

          .kt-widget4.kt-widget4--progress .kt-widget4__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 50%;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-right: 1.5rem;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress
            .kt-widget4__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 0.7rem;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress
            .kt-widget4__stats
            > span {
            line-height: 1.1;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress
            .kt-widget4__stats
            > span:first-child {
            font-size: 1.1rem;
            font-weight: 600;
            color: #595d6e;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress
            .kt-widget4__stats
            > span:last-child {
            font-size: 0.9rem;
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget4.kt-widget4--progress
            .kt-widget4__content
            .kt-widget4__progress
            .progress {
            width: 100%;
          }

          .kt-widget4 .kt-widget4__chart {
            position: relative;
          }

          .kt-widget4.kt-widget4--sticky {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget4.kt-widget4--sticky .kt-widget4__items {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
          }
          .kt-widget4.kt-widget4--sticky
            .kt-widget4__items.kt-widget4__items--bottom {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-pack: end;
            -ms-flex-pack: end;
            justify-content: flex-end;
          }
          .kt-widget4.kt-widget4--sticky .kt-widget4__chart canvas {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }

          .kt-widget5 .kt-widget5__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 0.07rem dashed #ebedf2;
          }
          .kt-widget5 .kt-widget5__item .kt-widget5__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget5 .kt-widget5__item .kt-widget5__content .kt-widget5__pic {
            padding-right: 1.25rem;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__pic
            img {
            max-width: 8.5rem;
            border-radius: 4px;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget5 .kt-widget5__item .kt-widget5__content .kt-widget5__desc {
            margin: 0;
            padding: 0.4rem 0;
            font-size: 1rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__info
            span:nth-child(even) {
            font-weight: 500;
            margin-right: 0.71rem;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__stats
            .kt-widget5__number {
            font-size: 1.3rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget5
            .kt-widget5__item
            .kt-widget5__content
            .kt-widget5__stats:first-child {
            padding-right: 3rem;
          }
          .kt-widget5 .kt-widget5__item .kt-widget5__content:last-child {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            text-align: right;
            -webkit-box-pack: end;
            -ms-flex-pack: end;
            justify-content: flex-end;
            padding-left: 1rem;
          }
          .kt-widget5 .kt-widget5__item:last-child {
            border-bottom: 0;
          }

          @media (max-width: 1024px) {
            .kt-widget5 {
              padding: 1rem;
            }
            .kt-widget5
              .kt-widget5__item
              .kt-widget5__content
              .kt-widget5__pic {
              padding-right: 0.5rem;
            }
            .kt-widget5
              .kt-widget5__item
              .kt-widget5__content
              .kt-widget5__pic
              img {
              max-width: 4rem;
            }
            .kt-widget5
              .kt-widget5__item
              .kt-widget5__content
              .kt-widget5__stats
              .kt-widget5__number {
              font-size: 1.2rem;
              font-weight: 500;
            }
            .kt-widget5
              .kt-widget5__item
              .kt-widget5__content
              .kt-widget5__stats:first-child {
              padding-right: 1rem;
            }
          }

          .kt-widget6 .kt-widget6__head .kt-widget6__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 1.07rem;
          }
          .kt-widget6 .kt-widget6__head .kt-widget6__item > span {
            font-size: 1rem;
            color: #74788d;
            font-weight: 400;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            text-align: left;
          }
          .kt-widget6 .kt-widget6__head .kt-widget6__item > span:last-child {
            text-align: right;
          }

          .kt-widget6 .kt-widget6__body .kt-widget6__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            padding: 1.07rem 0;
            border-bottom: 1px dashed #ebedf2;
          }
          .kt-widget6 .kt-widget6__body .kt-widget6__item > span {
            color: #595d6e;
            font-weight: 400;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            text-align: left;
            font-size: 1rem;
          }
          .kt-widget6 .kt-widget6__body .kt-widget6__item > span:last-child {
            text-align: right;
          }
          .kt-widget6 .kt-widget6__body .kt-widget6__item:last-child {
            border-bottom: 0;
          }

          .kt-widget6 .kt-widget6__foot .kt-widget6__action {
            text-align: right;
            margin-top: 1rem;
          }

          .kt-widget7 .kt-widget7__desc {
            text-align: center;
            margin-top: 7rem;
            font-size: 1.3rem;
            color: #595d6e;
          }

          .kt-widget7 .kt-widget7__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-top: 2rem;
          }
          .kt-widget7 .kt-widget7__content .kt-widget7__userpic img {
            width: 3.6rem;
            border-radius: 50%;
          }
          .kt-widget7 .kt-widget7__content .kt-widget7__info {
            padding-left: 1rem;
          }
          .kt-widget7
            .kt-widget7__content
            .kt-widget7__info
            .kt-widget7__username {
            color: #595d6e;
            font-weight: 500;
            font-size: 1.4rem;
            margin-bottom: 0;
          }
          .kt-widget7 .kt-widget7__content .kt-widget7__info .kt-widget7__time {
            color: #74788d;
            font-size: 0.9rem;
          }

          .kt-widget7 .kt-widget7__button {
            text-align: center;
            margin-top: 2rem;
          }

          .kt-widget7.kt-widget7--skin-light .kt-widget7__desc {
            color: #fff;
          }

          .kt-widget7.kt-widget7--skin-light
            .kt-widget7__info
            .kt-widget7__username {
            color: #fff;
          }

          .kt-widget7.kt-widget7--skin-light
            .kt-widget7__info
            .kt-widget7__time {
            color: #fff;
            opacity: 0.8;
          }

          .kt-widget9 {
            padding: 2.2rem;
          }
          .kt-widget9 .kt-widget9__header {
            padding: 1.1rem 0;
            margin-bottom: 0.5rem;
          }
          .kt-widget9 .kt-widget9__header .kt-widget9__title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0;
            color: #595d6e;
          }
          .kt-widget9 .kt-widget9__header .kt-widget9__desc {
            display: inline-block;
            margin-top: 0.2rem;
            color: #74788d;
          }
          .kt-widget9 .kt-widget9__header .kt-widget9__text {
            color: #74788d;
          }
          .kt-widget9 .kt-widget9__chart {
            position: relative;
            margin-top: 0.5rem;
          }
          .kt-widget9 .kt-widget9__chart .kt-widget9__stat {
            font-size: 2.4rem;
            font-weight: 700;
            color: #74788d;
          }

          .kt-widget10 .kt-widget10__chart {
            margin-top: 1rem;
            margin-bottom: 3.5rem;
            position: relative;
          }
          .kt-widget10 .kt-widget10__chart canvas {
            border-radius: 8px;
          }

          .kt-widget10
            .kt-widget10__items
            .kt-widget10__item
            .kt-widget10__stats {
            font-size: 1.1rem;
            font-weight: 700;
            color: #74788d;
          }

          .kt-widget10
            .kt-widget10__items
            .kt-widget10__item
            .kt-widget10__text {
            font-size: 0.9rem;
            float: right;
            margin-top: 0.3rem;
            color: #74788d;
          }

          .kt-widget10 .kt-widget10__items .kt-widget10__item .progress {
            margin-bottom: 1.6rem;
          }

          .kt-widget10 .kt-widget10__desc {
            margin-top: 1.6rem;
            font-size: 1rem;
          }

          .kt-widget11 .table-responsive {
            overflow-y: hidden;
          }

          .kt-widget11 .table thead > tr > td {
            padding: 0;
            vertical-align: top;
            border-top: 0;
            font-weight: 500;
            color: #74788d;
          }

          .kt-widget11 .table tbody > tr {
            border-bottom: 1px dashed #ebedf2;
          }
          .kt-widget11 .table tbody > tr > td {
            border: 0;
            padding-left: 0;
            padding-right: 0.5rem;
            padding-top: 20px;
            vertical-align: top;
            color: #595d6e;
          }
          .kt-widget11 .table tbody > tr > td > label {
            right: 0;
            top: 0.5rem;
            vertical-align: top;
          }
          .kt-widget11 .table tbody > tr > td .kt-widget11__chart {
            position: relative;
            margin-top: -0.6rem;
          }
          .kt-widget11 .table tbody > tr > td:last-child {
            padding-right: 0;
          }
          .kt-widget11 .table tbody > tr .kt-widget11__title {
            font-size: 1.1rem;
            font-weight: 500;
            display: block;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget11 .table tbody > tr .kt-widget11__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget11 .table tbody > tr .kt-widget11__title > span {
            color: #74788d;
          }
          .kt-widget11 .table tbody > tr .kt-widget11__sub {
            display: block;
            font-size: 1rem;
          }
          .kt-widget11 .table tbody > tr:last-child {
            border: 0;
          }

          .kt-widget12 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget12 .kt-widget12__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            padding-bottom: 1rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget12 .kt-widget12__content .kt-widget12__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            margin-bottom: 2.5rem;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info
            .kt-widget12__desc {
            font-size: 1rem;
            color: #74788d;
            padding-bottom: 0.5rem;
            font-weight: 500;
            display: block;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info
            .kt-widget12__value {
            font-size: 1.4rem;
            font-weight: 600;
            color: #595d6e;
            display: block;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info
            .kt-widget12__progress {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            line-height: 0;
            padding-top: 1rem;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info
            .kt-widget12__progress
            .progress {
            width: 100%;
            height: 0.6rem;
          }
          .kt-widget12
            .kt-widget12__content
            .kt-widget12__item
            .kt-widget12__info
            .kt-widget12__progress
            .kt-widget12__stat {
            font-size: 1.3rem;
            font-weight: 700;
            color: #74788d;
            padding-left: 1rem;
          }
          .kt-widget12 .kt-widget12__chart {
            position: relative;
          }
          .kt-widget12 .kt-widget12__chart canvas {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }

          .kt-widget13 {
            padding: 2rem 0;
          }
          .kt-widget13 .kt-widget13__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 2rem;
          }
          .kt-widget13 .kt-widget13__item .kt-widget13__desc {
            color: #74788d;
            text-align: right;
            padding-right: 1rem;
            font-weight: 400;
          }
          .kt-widget13 .kt-widget13__item .kt-widget13__text {
            color: #74788d;
            padding-left: 1rem;
            font-weight: 400;
          }
          .kt-widget13
            .kt-widget13__item
            .kt-widget13__text.kt-widget13__text--bold {
            color: #595d6e;
            font-size: 1.2rem;
            font-weight: 500;
          }
          .kt-widget13 .kt-widget13__item > span {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget13 .kt-widget13__item:lasst-child {
            margin-bottom: 0;
          }
          .kt-widget13 .kt-widget13__action {
            margin-top: 30px;
            padding-top: 30px;
          }
          .kt-widget13 .kt-widget13__action .kt-widget__detalis {
            margin-right: 10px;
            border-top: 0.07rem dashed #ebedf2;
          }
          .kt-widget13 .kt-widget13__action .kt-widget13__action {
            border-top: 0.07rem dashed #ebedf2;
          }

          .kt-widget14 {
            padding: 25px;
          }
          .kt-widget14.kt-widget14--no-padding {
            padding: 0;
          }
          .kt-widget14 .kt-widget14__header {
            padding: 0.5rem 0 1.1rem 0;
            margin-bottom: 0.5rem;
          }
          .kt-widget14 .kt-widget14__header .kt-widget14__title {
            font-size: 1.3rem;
            font-weight: 500;
            margin-bottom: 0;
            color: #595d6e;
          }
          .kt-widget14 .kt-widget14__header .kt-widget14__desc {
            display: inline-block;
            margin-top: 0.2rem;
            color: #74788d;
          }
          .kt-widget14 .kt-widget14__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget14 .kt-widget14__legends {
            padding-left: 2rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
          }
          .kt-widget14 .kt-widget14__legends .kt-widget14__legend {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget14
            .kt-widget14__legends
            .kt-widget14__legend
            .kt-widget14__bullet {
            width: 1.5rem;
            height: 0.45rem;
            border-radius: 1.1rem;
          }
          .kt-widget14
            .kt-widget14__legends
            .kt-widget14__legend
            .kt-widget14__stats {
            color: #74788d;
            font-weight: 500;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-left: 1rem;
          }
          .kt-widget14
            .kt-widget14__legends
            .kt-widget14__legend:not(:first-child):not(:last-child) {
            padding: 0.5rem 0;
          }
          .kt-widget14 .kt-widget14__chart {
            position: relative;
          }
          .kt-widget14 .kt-widget14__chart .kt-widget14__stat {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            top: 0;
            font-size: 2.2rem;
            font-weight: 500;
            color: #a2a5b9;
            opacity: 0.7;
          }
          .kt-widget14 .kt-widget14__chart canvas {
            position: relative;
            z-index: 1;
          }

          @media (max-width: 1024px) {
            .kt-widget14 {
              padding: 15px;
            }
            .kt-widget14 .kt-widget14__legends {
              padding-left: 0.5rem;
            }
          }

          .kt-widget15 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget15 .kt-widget15__items {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
          }
          .kt-widget15 .kt-widget15__items.kt-widget15__items--bottom {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            -webkit-box-pack: end;
            -ms-flex-pack: end;
            justify-content: flex-end;
          }
          .kt-widget15
            .kt-widget15__items
            .kt-widget15__item
            .kt-widget15__stats {
            font-size: 1.1rem;
            font-weight: 500;
            color: #74788d;
          }
          .kt-widget15
            .kt-widget15__items
            .kt-widget15__item
            .kt-widget15__text {
            font-size: 1rem;
            float: right;
            margin-top: 0.3rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget15 .kt-widget15__items .kt-widget15__item .progress {
            margin-bottom: 1.6rem;
            height: 0.45rem;
          }
          .kt-widget15 .kt-widget15__items .kt-widget15__desc {
            margin-top: 0.5rem;
            font-size: 0.9rem;
            font-weight: 400;
            color: #74788d;
          }

          .kt-widget16 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget16 .kt-widget16__items {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-right: 1rem;
            width: 50%;
          }
          .kt-widget16 .kt-widget16__items .kt-widget16__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding: 0.7rem 0;
            border-bottom: 1px dashed #ebedf2;
          }
          .kt-widget16
            .kt-widget16__items
            .kt-widget16__item
            .kt-widget16__sceduled {
            font-weight: 500;
            color: #74788d;
            font-size: 1rem;
          }
          .kt-widget16
            .kt-widget16__items
            .kt-widget16__item
            .kt-widget16__amount {
            font-size: 1rem;
            font-weight: 500;
            color: #74788d;
            text-align: right;
          }
          .kt-widget16
            .kt-widget16__items
            .kt-widget16__item
            .kt-widget16__date {
            font-size: 1rem;
            font-weight: 300;
            color: #74788d;
          }
          .kt-widget16
            .kt-widget16__items
            .kt-widget16__item
            .kt-widget16__price {
            font-size: 1rem;
            font-weight: 500;
            text-align: right;
          }
          .kt-widget16 .kt-widget16__items .kt-widget16__item:last-child {
            border-bottom: 0;
          }
          .kt-widget16 .kt-widget16__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-left: 1rem;
            width: 50%;
          }
          .kt-widget16 .kt-widget16__stats .kt-widget16__legends {
            font-weight: 1;
            padding-left: 2rem;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__legends
            .kt-widget16__legend
            .kt-widget16__bullet {
            width: 1.5rem;
            height: 0.45rem;
            display: inline-block;
            border-radius: 1.1rem;
            margin: 0 1rem 0.1rem 0;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__legends
            .kt-widget16__legend
            .kt-widget16__stat {
            display: inline-block;
            color: #74788d;
            font-weight: 500;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__legends
            .kt-widget16__legend:not(:first-child):not(:last-child) {
            padding: 0.5rem 0;
          }
          .kt-widget16 .kt-widget16__stats .kt-widget16__legends:last-child {
            margin-bottom: 0;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__visual
            .kt-widget16__chart {
            margin-top: 0.5rem;
            position: relative;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__visual
            .kt-widget16__chart
            .kt-widget16__stat {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            top: 0;
            font-size: 2.2rem;
            font-weight: 500;
            color: #a2a5b9;
          }
          .kt-widget16
            .kt-widget16__stats
            .kt-widget16__visual
            .kt-widget16__chart
            canvas {
            position: relative;
            z-index: 1;
          }

          @media (max-width: 768px) {
            .kt-widget16 {
              display: -webkit-box;
              display: -ms-flexbox;
              display: flex;
              -webkit-box-orient: vertical;
              -webkit-box-direction: normal;
              -ms-flex-direction: column;
              flex-direction: column;
            }
            .kt-widget16 .kt-widget16__items {
              width: 100%;
            }
            .kt-widget16 .kt-widget16__stats {
              width: 100%;
            }
            .kt-widget16 .kt-widget16__stats .kt-widget16__legends {
              padding-left: 1rem;
            }
          }

          .kt-widget17 .kt-widget17__visual {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-widget17 .kt-widget17__visual .kt-widget17__chart {
            position: relative;
            padding-top: 8rem;
          }

          .kt-widget17 .kt-widget17__stats {
            display: column;
            margin: -4.3rem auto 0 auto;
            position: relative;
            width: 90%;
          }
          .kt-widget17 .kt-widget17__stats .kt-widget17__items {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item {
            padding: 2rem;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            overflow: hidden;
            background-color: white;
            margin: 0.3rem;
            -webkit-box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.06);
            box-shadow: 0px 1px 15px 1px rgba(69, 65, 78, 0.06);
            cursor: pointer;
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item
            .kt-widget17__icon {
            display: block;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item
            .kt-widget17__icon
            > i {
            font-size: 2.6rem;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item
            .kt-widget17__icon
            svg {
            margin-left: -4px;
            width: 38px;
            height: 38px;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item
            .kt-widget17__subtitle {
            display: block;
            margin-top: 0.75rem;
            font-size: 1.2rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item
            .kt-widget17__desc {
            display: block;
            font-size: 1rem;
            color: #74788d;
          }
          .kt-widget17
            .kt-widget17__stats
            .kt-widget17__items
            .kt-widget17__item:hover {
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
            -webkit-box-shadow: 0px 1px 21px 1px rgba(69, 65, 78, 0.12);
            box-shadow: 0px 1px 21px 1px rgba(69, 65, 78, 0.12);
          }

          @media (max-width: 768px) {
            .kt-widget17
              .kt-widget17__stats
              .kt-widget17__items
              .kt-widget17__item {
              padding-left: 0.5rem;
            }
          }

          .kt-widget19 .kt-widget19__pic {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            position: relative;
            background-repeat: no-repeat;
            background-size: cover;
          }
          .kt-widget19 .kt-widget19__pic > img {
            width: 100%;
          }
          .kt-widget19 .kt-widget19__pic .kt-widget19__shadow {
            position: absolute;
            top: 70%;
            bottom: 0;
            left: 0;
            right: 0;
            background: -webkit-gradient(
                linear,
                left top,
                left bottom,
                color-stop(20%, rgba(0, 0, 0, 0)),
                color-stop(40%, rgba(0, 0, 0, 0.1)),
                color-stop(90%, rgba(0, 0, 0, 0.5))
              )
              no-repeat scroll 0 0;
            background: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0) 20%,
                rgba(0, 0, 0, 0.1) 40%,
                rgba(0, 0, 0, 0.5) 90%
              )
              no-repeat scroll 0 0;
          }
          .kt-widget19 .kt-widget19__pic .kt-widget19__title {
            position: absolute;
            bottom: 0;
            display: block;
            z-index: 1;
            padding-left: 25px;
            padding-bottom: 12.5px;
            color: #595d6e;
          }
          .kt-widget19 .kt-widget19__pic .kt-widget19__labels {
            position: absolute;
            top: 25px;
            left: 25px;
          }
          @media (max-width: 1024px) {
            .kt-widget19 .kt-widget19__pic .kt-widget19__labels {
              top: 15px;
              left: 15px;
            }
          }

          .kt-widget19 .kt-widget19__wrapper {
            margin-bottom: 1rem;
          }
          .kt-widget19 .kt-widget19__wrapper .kt-widget19__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin: 0 0 1.75rem 0;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__userpic
            > img {
            width: 3.2rem;
            border-radius: 100%;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__info {
            padding-left: 1rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__info
            .kt-widget19__username {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__info
            .kt-widget19__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__info
            .kt-widget19__time {
            font-size: 1rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__stats {
            font-size: 1rem;
            font-weight: 500;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__stats
            .kt-widget19__number {
            font-size: 1.4rem;
            font-weight: 700;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__stats
            .kt-widget19__comment {
            font-size: 0.9rem;
            color: #74788d;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__stats
            .kt-widget19__comment:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget19
            .kt-widget19__wrapper
            .kt-widget19__content
            .kt-widget19__stats
            span {
            text-align: center;
            display: block;
          }
          .kt-widget19 .kt-widget19__wrapper .kt-widget19__text {
            text-align: justify;
            color: #74788d;
            font-size: 1.1rem;
            font-weight: 400;
          }

          .kt-widget19 .kt-widget19__action {
            margin-top: 1.5rem;
          }

          .kt-widget20 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget20 .kt-widget20__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            padding-top: 1.15rem;
            padding-bottom: 1.25rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget20 .kt-widget20__content .kt-widget20__desc {
            color: #74788d;
            font-size: 1rem;
            font-weight: 400;
            margin-top: 0.25rem;
          }
          .kt-widget20 .kt-widget20__content .kt-widget20__number {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            font-weight: 600;
            font-size: 1.8rem;
          }
          .kt-widget20 .kt-widget20__chart {
            position: relative;
          }
          .kt-widget20 .kt-widget20__chart canvas {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }

          .kt-widget21 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget21 .kt-widget21__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            padding-top: 1.15rem;
            padding-bottom: 1.25rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            display: flex;
          }
          .kt-widget21 .kt-widget21__content .kt-widget21__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-left: 2rem;
            margin-top: 1.5rem;
          }
          .kt-widget21
            .kt-widget21__content
            .kt-widget21__item
            .kt-widget21__icon {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
          }
          .kt-widget21
            .kt-widget21__content
            .kt-widget21__item
            .kt-widget21__icon
            i {
            font-size: 1.4rem;
          }
          .kt-widget21
            .kt-widget21__content
            .kt-widget21__item
            .kt-widget21__info {
            padding-left: 1rem;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget21
            .kt-widget21__content
            .kt-widget21__item
            .kt-widget21__info
            .kt-widget21__title {
            display: block;
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget21
            .kt-widget21__content
            .kt-widget21__item
            .kt-widget21__info
            .kt-widget21__sub {
            display: block;
            font-size: 1rem;
            color: #74788d;
          }
          .kt-widget21 .kt-widget21__chart {
            position: relative;
          }
          .kt-widget21 .kt-widget21__chart canvas {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }

          @media (max-width: 768px) {
            .kt-widget21 .kt-widget21__content .kt-widget21__item {
              padding-left: 0;
              margin-top: 0.5rem;
            }
            .kt-widget21
              .kt-widget21__content
              .kt-widget21__item
              .kt-widget21__info {
              padding-left: 0.5rem;
            }
          }

          .kt-widget24 {
            padding: 25px;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget24 .kt-widget24__details {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget24
            .kt-widget24__details
            .kt-widget24__info
            .kt-widget24__title {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget24
            .kt-widget24__details
            .kt-widget24__info
            .kt-widget24__title:hover {
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
            color: #22b9ff;
          }
          .kt-widget24
            .kt-widget24__details
            .kt-widget24__info
            .kt-widget24__desc {
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget24 .kt-widget24__details .kt-widget24__stats {
            font-size: 1.75rem;
            font-weight: 500;
            padding-left: 0.5rem;
          }
          .kt-widget24 .progress {
            height: 0.5rem;
            margin: 2rem 0 0.5rem 0;
          }
          .kt-widget24 .kt-widget24__action {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            font-weight: 400;
          }
          .kt-widget24 .kt-widget24__action .kt-widget24__change {
            color: #74788d;
          }
          .kt-widget24 .kt-widget24__action .kt-widget24__number {
            color: #74788d;
          }
          .kt-widget24.kt-widget24--solid {
            border: 1px solid #ebedf2;
            padding: 1rem;
            border-radius: 4px;
          }

          @media (max-width: 1024px) {
            .kt-widget24 {
              padding: 15px;
            }
          }

          .kt-widget25 {
            margin: 2rem 0;
          }
          .kt-widget25 .kt-widget25__stats {
            font-size: 4.5rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget25 .kt-widget25__subtitle {
            color: #74788d;
            font-size: 1.1rem;
            padding-left: 1rem;
          }
          .kt-widget25 .kt-widget25__items {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-top: 2rem;
          }
          .kt-widget25 .kt-widget25__items .kt-widget25__item {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget25
            .kt-widget25__items
            .kt-widget25__item
            .kt-widget25__progress-sub {
            display: inline-block;
            margin-top: 6px;
            font-size: 1.1rem;
            font-weight: 500;
          }
          .kt-widget25
            .kt-widget25__items
            .kt-widget25__item
            .kt-widget25__number {
            font-size: 2rem;
            font-weight: 600;
          }
          .kt-widget25 .kt-widget25__items .kt-widget25__item .progress {
            height: 0.5rem;
          }
          .kt-widget25
            .kt-widget25__items
            .kt-widget25__item
            .kt-widget25__desc {
            font-size: 1.1rem;
            font-weight: 500;
            color: #74788d;
            padding-top: 0.7rem;
            display: block;
          }
          .kt-widget25
            .kt-widget25__items
            .kt-widget25__item:not(:first-child):not(:last-child) {
            margin: 0 2rem;
          }

          .kt-widget26 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
            width: 100%;
          }
          .kt-widget26 .kt-widget26__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            padding-bottom: 1rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget26 .kt-widget26__content .kt-widget26__number {
            font-weight: 600;
            font-size: 1.8rem;
          }
          .kt-widget26 .kt-widget26__content .kt-widget26__desc {
            color: #74788d;
            font-size: 1.1rem;
            font-weight: 400;
            margin-top: 0.55rem;
          }
          .kt-widget26 .kt-widget26__chart {
            position: relative;
          }
          .kt-widget26 .kt-widget26__chart canvas {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
          }

          .kt-widget27 {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-widget27 .kt-widget27__visual {
            position: relative;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-widget27 .kt-widget27__visual > img {
            width: 100%;
            height: 286px;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-widget27 .kt-widget27__visual .kt-widget27__title {
            position: absolute;
            left: 50%;
            top: 60%;
            -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%);
            display: block;
            z-index: 1;
            color: #ffffff;
          }
          .kt-widget27 .kt-widget27__visual .kt-widget27__title > span {
            font-size: 4.5rem;
          }
          .kt-widget27 .kt-widget27__visual .kt-widget27__title > span > span {
            font-size: 2.5rem;
            padding-right: 0.4rem;
          }
          .kt-widget27 .kt-widget27__visual .kt-widget27__btn .btn {
            position: absolute;
            left: 50%;
            top: 100%;
            -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%);
            z-index: 1;
            display: block;
            padding: 1rem 2.5rem;
          }
          .kt-widget27 .kt-widget27__visual .kt-widget27__btn .btn:hover,
          .kt-widget27 .kt-widget27__visual .kt-widget27__btn .btn:focus,
          .kt-widget27 .kt-widget27__visual .kt-widget27__btn .btn:active {
            background-color: #fff;
          }
          .kt-widget27 .kt-widget27__container {
            margin: 3rem 0;
            width: 100%;
            padding: 1rem 0.5rem 0 0.5rem;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }
          .kt-widget27 .kt-widget27__container .nav {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-spacing: 0.7rem;
          }
          .kt-widget27 .kt-widget27__container .nav .nav-item {
            display: table-cell;
          }
          .kt-widget27 .kt-widget27__container .nav .nav-item > a {
            text-align: center;
            font-weight: 600;
            padding: 0.8rem 0 0.8rem 0;
            color: #74788d;
            border: 1px solid #f7f8fa;
          }
          .kt-widget27 .kt-widget27__container .nav .nav-item > a.active {
            background-color: #22b9ff;
            border-color: #22b9ff !important;
            color: #ffffff;
          }
          .kt-widget27 .kt-widget27__container .tab-content {
            padding: 0 1rem;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__header {
            padding: 1.1rem 0;
            margin-bottom: 0.5rem;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__header
            .kt-widget27__title {
            font-size: 1.3rem;
            font-weight: 500;
            margin-bottom: 0;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__header
            .kt-widget27__desc {
            display: inline-block;
            margin-top: 0.2rem;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__legends
            .kt-widget27__legend {
            margin-bottom: 0.9rem;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__legends
            .kt-widget27__legend:last-child {
            margin-bottom: 0;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__legends
            .kt-widget27__legend
            .kt-widget27__stats {
            color: #74788d;
            display: inline-block;
            font-weight: 500;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__legends
            .kt-widget27__legend
            .kt-widget27__bullet {
            width: 1.5rem;
            height: 0.45rem;
            display: inline-block;
            border-radius: 1.1rem;
            margin: 0 1rem 0.1rem 0;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__chart {
            position: relative;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            height: 110px;
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__chart
            .kt-widget27__stat {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            top: 0;
            font-size: 2.2rem;
            font-weight: 500;
            color: #74788d;
          }
          .kt-widget27
            .kt-widget27__container
            .tab-content
            .kt-widget27__chart
            canvas {
            position: relative;
            z-index: 1;
          }

          .kt-widget28 .kt-widget28__visual {
            position: relative;
            min-height: 286px;
            background-repeat: no-repeat;
            background-size: cover;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
          }

          .kt-widget28 .kt-widget28__wrapper {
            width: 100%;
          }
          .kt-widget28 .kt-widget28__wrapper .nav {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-spacing: 1.2rem;
            margin-top: -8rem;
            position: absolute;
            left: 50%;
            -webkit-transform: translate(-50%, -50%);
            transform: translate(-50%, -50%);
            padding: 0 1rem;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item {
            display: table-cell;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a {
            text-align: center;
            padding: 1rem 0 1rem 0;
            border: 1px solid rgba(255, 255, 255, 0);
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a > span {
            display: block;
            color: rgba(255, 255, 255, 0.7);
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a > span > i {
            font-size: 2.2rem;
            margin-right: 0;
            padding-bottom: 1rem;
            padding-top: 0.4rem;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .nav
            .nav-item
            > a
            > span:last-child {
            font-weight: 400;
            font-size: 1rem;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a.active {
            border: 1px solid white;
            background-color: transparent;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a.active > span {
            color: #fff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .nav
            .nav-item
            > a.active
            > span
            > i {
            color: #fff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:focus,
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:active,
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:hover {
            background-color: transparent;
          }
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:focus > span,
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:active > span,
          .kt-widget28 .kt-widget28__wrapper .nav .nav-item > a:hover > span {
            color: #fff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .nav
            .nav-item
            > a:focus
            > span
            > i,
          .kt-widget28
            .kt-widget28__wrapper
            .nav
            .nav-item
            > a:active
            > span
            > i,
          .kt-widget28
            .kt-widget28__wrapper
            .nav
            .nav-item
            > a:hover
            > span
            > i {
            color: #fff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget28 .kt-widget28__wrapper .tab-content {
            margin-top: 2rem;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item {
            margin-top: 1.2rem;
            border-bottom: 1px solid #ebedf2;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item
            > span {
            display: block;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item
            > span:first-child {
            font-size: 1rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item
            > span:last-child {
            color: #595d6e;
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 1rem;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item:first-child {
            margin-top: 0;
          }
          .kt-widget28
            .kt-widget28__wrapper
            .tab-content
            .tab-pane
            .kt-widget28__tab-items
            .kt-widget28__tab-item:last-child {
            border-bottom: none;
          }

          .kt-widget29 {
            margin-top: 1rem;
          }
          .kt-widget29 .kt-widget29__content {
            margin-bottom: 1.25rem;
            padding: 2rem;
            background-color: #fff;
          }
          .kt-widget29 .kt-widget29__content .kt-widget29__title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget29 .kt-widget29__content .kt-widget29__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget29
            .kt-widget29__content
            .kt-widget29__item
            .kt-widget29__info {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            text-align: left;
          }
          .kt-widget29
            .kt-widget29__content
            .kt-widget29__item
            .kt-widget29__info
            .kt-widget29__subtitle {
            display: block;
            color: #74788d;
            font-weight: 400;
            font-size: 1rem;
            padding: 0.25rem 0;
          }
          .kt-widget29
            .kt-widget29__content
            .kt-widget29__item
            .kt-widget29__info
            .kt-widget29__stats {
            display: block;
            font-size: 1.2rem;
            font-weight: 500;
          }
          .kt-widget29 .kt-widget29__content:last-child {
            margin-bottom: 0;
          }
          .kt-widget29 .kt-widget29__actions {
            margin-top: 1.5rem;
            padding: 0rem;
          }

          @media (max-width: 768px) {
            .kt-widget29 .kt-widget29__content {
              padding: 2.2rem 1rem;
            }
            .kt-widget29
              .kt-widget29__content
              .kt-widget29__item
              .kt-widget29__info
              > span {
              padding-right: 1rem;
            }
            .kt-widget29
              .kt-widget29__content
              .kt-widget29__item
              .kt-widget29__info
              > span:last-child {
              padding-right: 0;
            }
          }

          .kt-widget30 {
            margin: 1.5rem 0;
          }
          .kt-widget30 .kt-widget30__head {
            padding: 0;
            max-width: 100%;
            margin: 0 auto 2rem auto;
          }
          .kt-widget30 .kt-widget30__head .owl-carousel .carousel {
            cursor: pointer;
            text-align: center;
            padding: 1rem 0;
            margin: 1rem 1rem;
            -webkit-box-shadow: 0px 2px 14px 2px rgba(0, 0, 0, 0.04);
            box-shadow: 0px 2px 14px 2px rgba(0, 0, 0, 0.04);
            border-radius: 4px;
          }
          .kt-widget30 .kt-widget30__head .owl-carousel .carousel > span {
            display: block;
          }
          .kt-widget30
            .kt-widget30__head
            .owl-carousel
            .carousel
            > span:first-child {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget30
            .kt-widget30__head
            .owl-carousel
            .carousel
            > span:last-child {
            font-size: 0.9rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget30 .kt-widget30__head .owl-carousel .center > div {
            cursor: auto;
            background-color: #22b9ff;
            -webkit-box-shadow: 0px 2px 14px 2px rgba(34, 185, 255, 0.2);
            box-shadow: 0px 2px 14px 2px rgba(34, 185, 255, 0.2);
          }
          .kt-widget30
            .kt-widget30__head
            .owl-carousel
            .center
            > div
            > span:first-child {
            color: #ffffff;
          }
          .kt-widget30
            .kt-widget30__head
            .owl-carousel
            .center
            > div
            > span:last-child {
            color: rgba(255, 255, 255, 0.7);
          }
          .kt-widget30 .kt-widget30__body .owl-carousel .kt-widget30__items {
            padding: 0 2.2rem;
            border-bottom: 1px dashed #ebedf2;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item
            .kt-widget30__pic
            > img {
            width: 3rem;
            height: 3rem;
            border-radius: 100%;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item
            .kt-widget30__info {
            width: 100%;
            text-align: left;
            padding: 0 1rem;
            font-weight: 500;
            color: #74788d;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item
            .kt-widget30__info
            > a {
            display: block;
            font-size: 1rem;
            font-weight: 500;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item
            .kt-widget30__info
            > a:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item
            .kt-widget30__info
            > span {
            display: block;
            font-size: 1rem;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items
            .kt-widget30__item:last-child {
            border-bottom: none;
          }
          .kt-widget30
            .kt-widget30__body
            .owl-carousel
            .kt-widget30__items:last-child {
            border-bottom: none;
          }

          @media (max-width: 1024px) {
            .kt-widget30 {
              margin: 1rem 0;
            }
          }

          .kt-widget31 .kt-widget31__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 1.5rem;
          }
          .kt-widget31 .kt-widget31__item .kt-widget31__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__pic
            > img {
            width: 4rem;
            border-radius: 50%;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__info {
            padding: 0 1.2rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__info
            .kt-widget31__username {
            font-weight: 500;
            font-size: 1.1rem;
            color: #595d6e;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__info
            .kt-widget31__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__info
            .kt-widget31__text {
            font-size: 1rem;
            margin: 0;
            font-weight: 400;
            color: #74788d;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
            padding-right: 3rem;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress
            .kt-widget31__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 0.7rem;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress
            .kt-widget31__stats
            > span {
            line-height: 1.1;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress
            .kt-widget31__stats
            > span:first-child {
            font-size: 1.1rem;
            font-weight: 500;
            color: #595d6e;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress
            .kt-widget31__stats
            > span:last-child {
            font-size: 1rem;
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget31
            .kt-widget31__item
            .kt-widget31__content
            .kt-widget31__progress
            .progress {
            width: 100%;
          }
          .kt-widget31 .kt-widget31__item .kt-widget31__content:last-child {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 50%;
          }
          .kt-widget31 .kt-widget31__item:last-child {
            margin-bottom: 0;
          }

          @media (max-width: 768px) {
            .kt-widget31 .kt-widget31__item {
              display: -webkit-box;
              display: -ms-flexbox;
              display: flex;
              -ms-flex-wrap: wrap;
              flex-wrap: wrap;
            }
            .kt-widget31 .kt-widget31__item .kt-widget31__content {
              width: 100%;
            }
            .kt-widget31 .kt-widget31__item .kt-widget31__content:last-child {
              width: 100%;
              margin: 1rem 0;
            }
          }

          .kt-widget__files .kt-widget__media {
            text-align: center;
          }
          .kt-widget__files .kt-widget__media img {
            width: 5rem;
          }
          .kt-widget__files .kt-widget__media g [fill] {
            fill: rgba(40, 42, 60, 0.2);
          }
          .kt-widget__files .kt-widget__media .kt-widget__icon {
            height: 5rem;
            display: block;
            text-align: center;
          }
          .kt-widget__files .kt-widget__media .kt-widget__icon svg {
            width: 4rem;
            height: 4rem;
          }

          .kt-widget__files .kt-widget__desc {
            text-align: center;
            display: block;
            font-weight: 500;
            color: #595d6e;
            font-size: 1.2rem;
            padding-top: 5rem;
          }
          .kt-widget__files .kt-widget__desc:hover {
            color: #22b9ff;
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
          }
          .kt-widget__files .kt-widget__desc.kt-widget__desc--m {
            padding-top: 1rem;
            margin-bottom: 4rem;
          }

          .kt-widget33 .kt-widget33__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            padding-bottom: 3rem;
          }
          .kt-widget33 .kt-widget33__head .kt-widget33__title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #595d6e;
          }
          .kt-widget33 .kt-widget33__head .kt-widget33__title:hover {
            color: #22b9ff;
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
          }

          .kt-widget33 .kt-widget33__body .kt-widget33__title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #595d6e;
          }
          .kt-widget33 .kt-widget33__body .kt-widget33__title:hover {
            color: #22b9ff;
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
          }

          .kt-widget33 .kt-widget33__body .kt-widget33__desc {
            display: block;
            font-weight: 500;
            color: #74788d;
          }

          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            padding: 2rem 0;
            border-bottom: 1px solid #ebedf2;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__pic {
            width: 8rem;
            margin-right: 2rem;
            border-radius: 4px;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content {
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            margin-top: -0.4rem;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__subtitle {
            font-weight: 500;
            color: #74788d;
            margin-bottom: 0.5rem;
            display: block;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__action {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__action
            .kt-widget33__check {
            border-radius: 4px;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__action
            .btn {
            width: 23px;
            height: 23px;
            padding: 0;
            margin: 0;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__action
            .btn
            i {
            padding: 0;
            font-size: 0.8rem;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__content
            .kt-widget33__action
            span {
            font-size: 1.2rem;
            font-weight: 600;
            color: #595d6e;
            padding-left: 1rem;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item
            .kt-widget33__price {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            font-size: 1.1rem;
            font-weight: 600;
            color: #595d6e;
            margin-top: -2.7rem;
          }
          .kt-widget33
            .kt-widget33__body
            .kt-widget33__items
            .kt-widget33__item:last-child {
            border-bottom: none;
          }

          .kt-widget33 .kt-widget33__foot .kt-widget33__section {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-bottom: 2rem;
          }
          .kt-widget33
            .kt-widget33__foot
            .kt-widget33__section
            .kt-widget33__desc {
            font-weight: 600;
            font-size: 1.2rem;
            color: #48465b;
          }
          .kt-widget33
            .kt-widget33__foot
            .kt-widget33__section
            .kt-widget33__subtotal {
            font-weight: 600;
            color: #48465b;
            font-size: 1.2rem;
          }

          .kt-widget33 .kt-widget33__foot .kt-widget33__button {
            text-align: center;
          }
          .kt-widget33 .kt-widget33__foot .kt-widget33__button .btn {
            width: 100%;
            padding: 1rem 0;
          }

          .kt-widget.kt-widget--user-profile-1 {
            padding-bottom: 1.7rem;
          }
          .kt-widget.kt-widget--user-profile-1 .kt-widget__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: start;
            -ms-flex-align: start;
            align-items: flex-start;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__media
            img {
            width: 90px;
            max-width: 100%;
            border-radius: 8px;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content {
            padding-left: 1.6rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__username {
            font-size: 1.3rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__username
            i {
            font-size: 1.1rem;
            padding-left: 0.4rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__subtitle {
            font-size: 1;
            display: block;
            padding: 0.25rem 0 0 0;
            font-weight: 500;
            color: #74788d;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__action {
            margin-top: 1rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__head
            .kt-widget__content
            .kt-widget__action
            .btn {
            margin-right: 0.4rem;
            font-weight: 600;
            padding: 0.3rem 1rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content {
            padding: 1.9rem 0 2.1rem 0;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__info {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding-bottom: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__info
            .kt-widget__label {
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__info
            .kt-widget__data {
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__info
            a.kt-widget__data:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__info:last-child {
            padding-bottom: 0;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding: 0.9rem 1.05rem 0.9rem 0.6rem;
            margin: 0.4rem 0;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item.kt-widget__item--active {
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
            background: #f2f3f7;
            border-radius: 4px;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item.kt-widget__item--active
            .kt-widget__section
            .kt-widget__desc {
            color: #22b9ff;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item.kt-widget__item--active
            .kt-widget__section
            .kt-widget__icon
            .kt-svg-icon
            g
            [fill] {
            fill: #22b9ff;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item
            .kt-widget__section
            .kt-widget__icon
            svg {
            width: 2rem;
            height: 1.5rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item
            .kt-widget__section
            .kt-widget__icon
            .kt-svg-icon
            g
            [fill] {
            fill: #74788d;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item
            .kt-widget__section
            .kt-widget__desc {
            color: #74788d;
            font-weight: 500;
            padding-left: 0.3rem;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item:hover {
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
            background: #f2f3f7;
            cursor: pointer;
            border-radius: 4px;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item:hover
            .kt-widget__desc {
            color: #22b9ff;
          }
          .kt-widget.kt-widget--user-profile-1
            .kt-widget__body
            .kt-widget__items
            .kt-widget__item:hover
            .kt-widget__icon
            .kt-svg-icon
            g
            [fill] {
            fill: #22b9ff;
          }

          .kt-portlet__body.kt-portlet__body--fit-y .kt-widget {
            margin-top: -10px;
          }

          @media (max-width: 1024px) {
            .kt-widget.kt-widget--user-profile-1 {
              padding-bottom: 1.2rem;
            }
            .kt-widget.kt-widget--user-profile-1
              .kt-widget__head
              .kt-widget__media
              img {
              max-width: 60px;
            }
            .kt-widget.kt-widget--user-profile-1
              .kt-widget__head
              .kt-widget__content
              .kt-widget__section
              .kt-widget__username {
              font-size: 1.1rem;
              color: #48465b;
              font-weight: 500;
            }
            .kt-widget.kt-widget--user-profile-1
              .kt-widget__head
              .kt-widget__content
              .kt-widget__action {
              margin-top: 0.5rem;
            }
            .kt-widget.kt-widget--user-profile-1
              .kt-widget__head
              .kt-widget__content
              .kt-widget__action
              .btn {
              margin-right: 0.4rem;
              font-weight: 500;
              padding: 0.25rem 1.25rem;
            }
            .kt-widget.kt-widget--user-profile-1
              .kt-widget__body
              .kt-widget__content {
              padding-bottom: 2rem;
            }
          }

          .kt-widget.kt-widget--user-profile-2 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: 100%;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-top: -45px;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__img {
            max-width: 90px;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 90px;
            height: 90px;
            font-size: 1.5rem;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--brand {
            background: rgba(34, 185, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--light {
            background: rgba(255, 255, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--dark {
            background: rgba(40, 42, 60, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--primary {
            background: rgba(88, 103, 221, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--success {
            background: rgba(29, 201, 183, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--info {
            background: rgba(39, 134, 251, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--warning {
            background: rgba(255, 184, 34, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--danger {
            background: rgba(253, 39, 235, 0.1);
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__username {
            font-size: 1.4rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__titel {
            font-size: 1.4rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__titel:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__head
            .kt-widget__info
            .kt-widget__desc {
            display: block;
            font-weight: 500;
            font-size: 1.1rem;
            padding-top: 0.4rem;
            color: #74788d;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__body {
            -webkit-box-flex: 1;
            -ms-flex: 1;
            flex: 1;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__section {
            padding: 1rem 0 1rem 0;
            color: #595d6e;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__section
            a {
            padding-right: 0.3rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            padding-bottom: 1.7rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__icon
            i {
            font-size: 2.7rem;
            color: #a2a5b9;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details
            .kt-widget__title {
            display: block;
            color: #595d6e;
            font-weight: 500;
            font-size: 0.95rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__content
            .kt-widget__stats
            .kt-widget__details
            .kt-widget__value {
            display: block;
            color: #48465b;
            font-weight: 600;
            font-size: 1.2rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item {
            padding: 0.7rem 0;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            padding-bottom: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__label {
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            .kt-widget__data {
            color: #74788d;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact
            a.kt-widget__data:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-2
            .kt-widget__body
            .kt-widget__item
            .kt-widget__contact:last-child {
            padding-bottom: 0;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__footer {
            margin-top: 2rem;
          }
          .kt-widget.kt-widget--user-profile-2 .kt-widget__footer .btn {
            font-size: 1rem;
            font-weight: 600;
            padding: 1.1rem 0;
            width: 100%;
          }

          @media (max-width: 768px) {
            .kt-widget.kt-widget--user-profile-2 .kt-widget__head {
              margin-top: -30px;
            }
            .kt-widget.kt-widget--user-profile-2
              .kt-widget__head
              .kt-widget__media
              .kt-widget__img {
              max-width: 60px;
            }
            .kt-widget.kt-widget--user-profile-2
              .kt-widget__head
              .kt-widget__media
              .kt-widget__pic {
              max-width: 60px;
              max-height: 60px;
              font-size: 1.2rem;
            }
          }

          .kt-widget.kt-widget--user-profile-3 .kt-widget__top {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: start;
            -ms-flex-align: start;
            align-items: flex-start;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__media {
            margin-top: 0.2rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__media
            img {
            width: 110px;
            border-radius: 8px;
          }
          .kt-widget.kt-widget--user-profile-3 .kt-widget__top .kt-widget__pic {
            margin-top: 0.2rem;
            width: 100%;
            max-width: 110px;
            height: 110px;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            font-size: 1.5rem;
            border-radius: 8px;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--brand {
            background: rgba(34, 185, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--light {
            background: rgba(255, 255, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--dark {
            background: rgba(40, 42, 60, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--primary {
            background: rgba(88, 103, 221, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--success {
            background: rgba(29, 201, 183, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--info {
            background: rgba(39, 134, 251, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--warning {
            background: rgba(255, 184, 34, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__pic.kt-widget__pic--danger {
            background: rgba(253, 39, 235, 0.1);
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content {
            width: 100%;
            padding-left: 1.7rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__user {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__username {
            font-size: 1.3rem;
            color: #48465b;
            font-weight: 500;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin-right: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__username
            i {
            font-size: 1.2rem;
            color: #57c974;
            padding-left: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__title {
            font-size: 1.3rem;
            color: #48465b;
            font-weight: 600;
            margin: 0.8rem 0 0.7rem 0;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__head
            .kt-widget__action
            .btn {
            font-weight: 600;
            margin-left: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__subhead {
            padding: 0.6rem 0 0.8rem 0;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__subhead
            a {
            padding-right: 2rem;
            color: #74788d;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__subhead
            a:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__subhead
            a
            i {
            padding-right: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: horizontal;
            -webkit-box-direction: normal;
            -ms-flex-flow: row wrap;
            flex-flow: row wrap;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__desc {
            color: #595d6e;
            font-weight: 400;
            padding-right: 2rem;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            margin-bottom: 0.5rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__progress {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            max-width: 500px;
            width: 100%;
            margin: 0.1rem 0;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__progress
            .kt-widget__text {
            padding-right: 1rem;
            color: #595d6e;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__progress
            .kt-widget__stats {
            padding-left: 1rem;
            color: #48465b;
            font-weight: 600;
            font-size: 1.1rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats {
            margin-bottom: 0.7rem;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item {
            padding-top: 1rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__date {
            color: #595d6e;
            font-weight: 500;
            padding-bottom: 1rem;
            display: block;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__subtitel {
            color: #595d6e;
            font-weight: 500;
            display: block;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__progress {
            width: 100%;
            margin: 1.4rem 0 0.5rem 0;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__progress
            .kt-widget__stat {
            padding-left: 0.7rem;
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item:not(:first-child):not(:last-child) {
            margin: 0 2.2rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__top
            .kt-widget__content
            .kt-widget__info
            .kt-widget__stats
            .kt-widget__item:last-child {
            padding-left: 1rem;
          }

          .kt-widget.kt-widget--user-profile-3 .kt-widget__bottom {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 100%;
            border-top: 1px solid #ebedf2;
            margin-top: 2rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-flex: 1;
            -ms-flex-positive: 1;
            flex-grow: 1;
            padding: 2rem 1.5rem 0 0;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__icon
            i {
            font-size: 2.7rem;
            color: #a2a5b9;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            .kt-widget__title {
            display: block;
            color: #595d6e;
            font-weight: 600;
            font-size: 0.95rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            .kt-widget__value {
            display: block;
            color: #48465b;
            font-weight: 600;
            font-size: 1.2rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            .kt-widget__value
            span {
            color: #595d6e;
            font-weight: 400;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            a.kt-widget__value {
            font-size: 0.95rem;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            a.kt-widget__value:hover {
            color: #22b9ff;
          }
          .kt-widget.kt-widget--user-profile-3
            .kt-widget__bottom
            .kt-widget__item
            .kt-widget__details
            .kt-section__content {
            padding-left: 0.7rem;
          }

          .kt-widget.kt-widget--user-profile-3 .kt-widget__form {
            margin-top: 1.5rem;
          }

          @media (max-width: 768px) {
            .kt-widget.kt-widget--user-profile-3 {
              padding-top: 0.5rem;
            }
            .kt-widget.kt-widget--user-profile-3 .kt-widget__top {
              display: -webkit-box;
              display: -ms-flexbox;
              display: flex;
              -webkit-box-align: start;
              -ms-flex-align: start;
              align-items: flex-start;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__media {
              margin-top: 0.5rem;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__media
              img {
              max-width: 60px;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__pic {
              width: 60px;
              height: 60px;
              margin-top: 0.5rem;
              font-size: 1.3rem;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content {
              padding-left: 1rem;
              margin-top: 0;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__head
              .kt-widget__username {
              padding-bottom: 0.6rem;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__subhead {
              padding: 1.2rem 0;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__subhead
              a:not(:first-child):not(:last-child) {
              padding: 0.5rem 1rem 0.5rem 0;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__info {
              display: -webkit-box;
              display: -ms-flexbox;
              display: flex;
              -webkit-box-orient: vertical;
              -webkit-box-direction: normal;
              -ms-flex-direction: column;
              flex-direction: column;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__info
              .kt-widget__desc {
              padding-bottom: 1rem;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__top
              .kt-widget__content
              .kt-widget__info
              .kt-widget__progress {
              width: 100%;
            }
            .kt-widget.kt-widget--user-profile-3 .kt-widget__bottom {
              padding-top: 1rem;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__bottom
              .kt-widget__item {
              padding: 1rem 1rem 0 0;
            }
            .kt-widget.kt-widget--user-profile-3
              .kt-widget__bottom
              .kt-widget__item
              .kt-widget__icon
              i {
              font-size: 2.5rem;
            }
          }

          .kt-widget.kt-widget--user-profile-4 .kt-widget__head {
            margin-top: 1rem;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__img {
            max-width: 90px;
            max-height: 90px;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            width: 90px;
            height: 90px;
            font-size: 1.5rem;
            border-radius: 50%;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--brand {
            background: rgba(34, 185, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--light {
            background: rgba(255, 255, 255, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--dark {
            background: rgba(40, 42, 60, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--primary {
            background: rgba(88, 103, 221, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--success {
            background: rgba(29, 201, 183, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--info {
            background: rgba(39, 134, 251, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--warning {
            background: rgba(255, 184, 34, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__media
            .kt-widget__pic.kt-widget__pic--danger {
            background: rgba(253, 39, 235, 0.1);
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__username {
            text-align: center;
            display: block;
            padding: 0.8rem 0 0.6rem 0;
            font-size: 1.3rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__button {
            text-align: center;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__button
            .btn {
            font-weight: 600;
            padding: 0.3rem 0.8rem;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__action {
            text-align: center;
            margin-top: 2.3rem;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__action
            > .btn-label-warning:hover {
            color: #fff;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__head
            .kt-widget__content
            .kt-widget__section
            .kt-widget__action
            .btn:not(:first-child):not(:last-child) {
            margin: 0 1rem;
          }

          .kt-widget.kt-widget--user-profile-4 .kt-widget__body {
            margin-top: 2.5rem;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__body
            .kt-widget__item {
            display: block;
            text-align: center;
            color: #595d6e;
            font-weight: 500;
            font-size: 1.1rem;
            padding: 0.9rem 0;
            margin: 0.4rem 0;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__body
            .kt-widget__item:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
            background: #edf0fc;
            cursor: pointer;
            border-radius: 4px;
          }
          .kt-widget.kt-widget--user-profile-4
            .kt-widget__body
            .kt-widget__item.kt-widget__item--active {
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
            background: #edf0fc;
            color: #22b9ff;
            border-radius: 4px;
          }

          @media (max-width: 768px) {
            .kt-widget.kt-widget--user-profile-4
              .kt-widget__head
              .kt-widget__media
              .kt-widget__img {
              max-width: 80px;
              max-height: 80px;
            }
            .kt-widget.kt-widget--user-profile-4
              .kt-widget__head
              .kt-widget__media
              .kt-widget__pic {
              max-width: 80px;
              max-height: 80px;
              font-size: 1.2rem;
            }
          }

          .kt-widget.kt-widget--users .kt-widget__item {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            margin: 1.3rem 0 2.3rem 0;
          }
          .kt-widget.kt-widget--users .kt-widget__item .kt-media img {
            width: 100%;
            max-width: 43px;
            height: 43px;
          }
          .kt-widget.kt-widget--users .kt-widget__item:last-child {
            margin-bottom: 0;
          }
          .kt-widget.kt-widget--users .kt-widget__item .kt-widget__info {
            padding-top: 0.1rem;
            -webkit-box-flex: 3;
            -ms-flex: 3;
            flex: 3;
            margin-left: 1rem;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__info
            .kt-widget__section {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__info
            .kt-widget__section
            .kt-widget__username {
            font-size: 1.1rem;
            color: #48465b;
            font-weight: 500;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__info
            .kt-widget__section
            .kt-widget__username:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__info
            .kt-widget__section
            .kt-badge {
            margin-left: 0.5rem;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__info
            .kt-widget__desc {
            display: block;
            color: #74788d;
            font-weight: 500;
          }
          .kt-widget.kt-widget--users .kt-widget__item .kt-widget__action {
            text-align: right;
            padding-top: 0.2rem;
            -webkit-box-flex: 1.1;
            -ms-flex: 1.1;
            flex: 1.1;
          }
          .kt-widget.kt-widget--users
            .kt-widget__item
            .kt-widget__action
            .kt-widget__date {
            display: block;
            color: #74788d;
            font-weight: 500;
          }

          @media (max-width: 1024px) {
            .kt-widget.kt-widget--users .kt-widget__item .kt-widget__info {
              -webkit-box-flex: 1.5;
              -ms-flex: 1.5;
              flex: 1.5;
            }
            .kt-widget.kt-widget--users .kt-widget__item .kt-widget__action {
              -webkit-box-flex: 1;
              -ms-flex: 1;
              flex: 1;
            }
          }

          .kt-widget.kt-widget--project-1 {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
            height: calc(100% + 20px);
          }
          .kt-widget.kt-widget--project-1 .kt-widget__head {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            padding: 25px;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__head .kt-widget__label {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__media
            .kt-media
            .kt-widget__icon {
            max-width: 62px;
            height: 62px;
            margin-top: -0.5rem;
            margin-left: -0.5rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__media
            .kt-media
            img {
            width: 65px;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__media.kt-widget__media--m {
            margin-top: 1.5px;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__info {
            padding: 0.25rem 0 0 1rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__info
            .kt-widget__title {
            font-size: 1.3rem;
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__info
            .kt-widget__title:hover {
            color: #22b9ff;
            -webkit-transition: color 0.3s ease;
            transition: color 0.3s ease;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__head
            .kt-widget__label
            .kt-widget__info
            .kt-widget__desc {
            padding-top: 0.4rem;
            color: #595d6e;
            font-weight: 500;
            display: block;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__head .kt-widget__toolbar {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: start;
            -ms-flex-align: start;
            align-items: flex-start;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__body {
            padding: 25px;
            height: 100%;
            padding-top: 0 !important;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__body .kt-widget__stats {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item {
            padding-top: 1rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__date {
            color: #595d6e;
            font-weight: 500;
            padding-bottom: 1rem;
            display: block;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__subtitel {
            color: #595d6e;
            font-weight: 500;
            display: block;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__progress {
            width: 100%;
            margin: 1.4rem 0 0.5rem 0;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item
            .kt-widget__progress
            .kt-widget__stat {
            padding-left: 0.7rem;
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item:not(:first-child):not(:last-child) {
            margin: 0 2.2rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__stats
            .kt-widget__item:last-child {
            padding-left: 1rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__container {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            margin: 2.7rem 0 1.2rem 0;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__container
            .kt-widget__subtitel {
            color: #595d6e;
            font-weight: 500;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__container
            .kt-widget__progress {
            width: 100%;
            margin: 0 1rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__container
            .kt-widget__progress
            .kt-widget__stat {
            padding-left: 0.7rem;
            color: #48465b;
            font-weight: 600;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__body .kt-widget__text {
            color: #595d6e;
            font-weight: 500;
            margin-top: 2.7rem;
            display: block;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__body .kt-widget__content {
            padding: 1rem 0 1.3rem 0;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details {
            margin-right: 3.7rem;
            padding-top: 1rem;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -ms-flex-direction: column;
            flex-direction: column;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details
            .kt-widget__subtitle {
            color: #595d6e;
            font-weight: 600;
            padding-bottom: 1.1rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details
            .kt-widget__value {
            color: #48465b;
            font-weight: 600;
            font-size: 1.2rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details
            .kt-widget__value
            span {
            color: #74788d;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details
            .kt-badge {
            margin: 0.3rem 0 0 7px;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details:last-child {
            margin-right: 0;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details:last-child
            .kt-widget__subtitle {
            margin-top: 0rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__body
            .kt-widget__content
            .kt-widget__details
            .kt-media-group {
            margin-top: -0.5rem;
          }
          .kt-widget.kt-widget--project-1 .kt-widget__footer {
            border-top: 1px solid #ebedf2;
            width: 100%;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper {
            padding: 25px;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-pack: justify;
            -ms-flex-pack: justify;
            justify-content: space-between;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper
            .kt-widget__section {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper
            .kt-widget__section
            .kt-widget__blog {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper
            .kt-widget__section
            .kt-widget__blog
            i {
            font-size: 1.3rem;
            color: #d2d8e8;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper
            .kt-widget__section
            .kt-widget__blog
            .kt-widget__value {
            font-weight: 700;
            padding-left: 0.6rem;
          }
          .kt-widget.kt-widget--project-1
            .kt-widget__footer
            .kt-widget__wrapper
            .kt-widget__section
            .kt-widget__blog:last-child {
            padding-left: 1.7rem;
          }

          @media (max-width: 1024px) {
            .kt-widget.kt-widget--project-1 .kt-widget__head {
              padding-bottom: 1rem;
              padding: 15px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media
              img {
              width: 100%;
              max-width: 50px;
              height: 50px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media
              span {
              width: 50px;
              height: 50px;
              font-size: 1.2rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--fixed {
              width: 50px;
              height: 50px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--fixed
              img {
              width: 50px;
              height: 50px;
              max-width: auto;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media
              img {
              width: 50px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--md
              img {
              width: 100%;
              max-width: 45px;
              height: 45px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--md
              span {
              width: 45px;
              height: 45px;
              font-size: 1rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--md.kt-media--fixed {
              width: 45px;
              height: 45px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--md.kt-media--fixed
              img {
              width: 45px;
              height: 45px;
              max-width: auto;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media.kt-media--md
              img {
              width: 47px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media
              .kt-media
              .kt-widget__icon {
              margin-top: -0.7rem;
              width: 62px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__head
              .kt-widget__media.kt-widget__media--m {
              margin-top: 1px;
            }
            .kt-widget.kt-widget--project-1 .kt-widget__head .kt-widget__info {
              padding: 0.2rem 0 0 1rem;
            }
            .kt-widget.kt-widget--project-1 .kt-widget__body {
              padding: 15px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__stats
              .kt-widget__item:not(:first-child):not(:last-child) {
              margin: 0 1.5rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__stats
              .kt-widget__item:last-child {
              padding-left: 0;
            }
            .kt-widget.kt-widget--project-1 .kt-widget__body .kt-widget__text {
              margin-top: 1.5rem;
              margin-bottom: 1rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__content {
              padding: 0.5rem 0 1rem 0;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__content
              .kt-widget__details {
              margin-right: 1.2rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__content
              .kt-widget__details:last-child {
              margin-right: 0;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__body
              .kt-widget__content
              .kt-widget__details:last-child
              .kt-widget__subtitle {
              margin-top: 0rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__footer
              .kt-widget__wrapper {
              padding: 15px;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__footer
              .kt-widget__wrapper
              .kt-widget__section {
              padding-right: 1rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__footer
              .kt-widget__wrapper
              .kt-widget__section
              .kt-widget__blog
              .kt-widget__value {
              padding-left: 0.4rem;
            }
            .kt-widget.kt-widget--project-1
              .kt-widget__footer
              .kt-widget__wrapper
              .kt-widget__section
              .kt-widget__blog:last-child {
              padding-left: 1.2rem;
            }
          }
          /*  */

          .kt-portlet
            .kt-portlet__head
            .kt-portlet__head-label
            .kt-portlet__head-title {
            margin: 0;
            padding: 0;
            font-size: 1.2rem;
            font-weight: 500;
            color: #48465b;
          }

          .row.box-container {
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            -ms-flex-wrap: wrap;
            flex-wrap: wrap;
            margin-right: -10px;
            margin-left: -10px;
          }
        `}</style>
      </Aux>
    )
  }
}

export default withRouter(Kiosk)
