import PropTypes from "prop-types"
import Aux from "../../hoc/Auxiliary"
import logo from "../../static/images/kpj-logo.png"

const KioskPrintTemplate = props => {
  return (
    <Aux>
      <div className="x_content">
        <div
          className="row"
          style={{
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0
          }}
        >
          <div
            className="col-md-12 col-sm-12 col-xs-12"
            style={{ padding: "0 21px 0px 21px" }}
          >
            <div className="col-xs-12" style={{ padding: 0 }}>
              <img
                alt="logo"
                className="center-block"
                src={logo}
                style={{
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                  width: "100px"
                }}
              />
            </div>
          </div>
          <div className="col-sm-12">
            <p style={{ textAlign: "center" }}>
              <span style={{ fontSize: 14 }}>
                <strong>โรงพยาบาลค่ายประจักษ์ศิลปาคม</strong>{" "}
              </span>
            </p>
            <p
              style={{
                marginLeft: 1,
                marginRight: 1,
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: 16 }}>
                <strong>ชื่อ</strong>:
                <strong>
                  {props.getValuePatient("fullname", "ชื่อ-นามสกุล")}
                </strong>
              </span>
            </p>
            <p style={{ textAlign: "center" }}>
              <strong>สิทธิการรักษา</strong>
            </p>
            <p style={{ textAlign: "center" }}>
              <input defaultChecked="checked" type="checkbox" />
              <strong> {props.getValueRight("maininscl_name")} </strong>
            </p>
            <p style={{ textAlign: "center" }}>
              <input defaultChecked="checked" type="checkbox" />
              <strong> {props.getValueRight("subinscl_name")} </strong>
            </p>
          </div>
        </div>
        <div className="row">
          <div
            className="col-md-12 col-sm-12 col-xs-12"
            style={{ padding: "10px 0px 0px" }}
          >
            <h4 style={{ textAlign: "center" }}>
              <strong>ขอบคุณที่มาใช้บริการ</strong>
            </h4>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 col-sm-6 col-xs-6">
            <p style={{ textAlign: "left" }}>{props.printDate}</p>
          </div>
          <div
            className="col-md-6 col-sm-6 col-xs-6"
            style={{ textAlign: "right" }}
          >
            <p style={{ textAlign: "right" }}>{props.printTime}</p>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @font-face {
          font-family: "THSarabunNew";
          src: url("/static/dist/fonts/thsarabunnew-webfont.eot");
          src: url("/static/dist/fonts/thsarabunnew-webfont.eot?#iefix")
              format("embedded-opentype"),
            url("/static/dist/fonts/thsarabunnew-webfont.woff") format("woff"),
            url("/static/dist/fonts/thsarabunnew-webfont.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: "THSarabunNew";
          src: url("/static/dist/fonts/thsarabunnew_bolditalic-webfont.eot");
          src: url("/static/dist/fonts/thsarabunnew_bolditalic-webfont.eot?#iefix")
              format("embedded-opentype"),
            url("/static/dist/fonts/thsarabunnew_bolditalic-webfont.woff") format("woff"),
            url("/static/dist/fonts/thsarabunnew_bolditalic-webfont.ttf")
              format("truetype");
          font-weight: bold;
          font-style: italic;
        }

        @font-face {
          font-family: "THSarabunNew";
          src: url("/static/dist/fonts/thsarabunnew_italic-webfont.eot");
          src: url("/static/dist/fonts/thsarabunnew_italic-webfont.eot?#iefix")
              format("embedded-opentype"),
            url("/static/dist/fonts/thsarabunnew_italic-webfont.woff") format("woff"),
            url("/static/dist/fonts/thsarabunnew_italic-webfont.ttf") format("truetype");
          font-weight: normal;
          font-style: italic;
        }

        @font-face {
          font-family: "THSarabunNew";
          src: url("/static/dist/fonts/thsarabunnew_bold-webfont.eot");
          src: url("/static/dist/fonts/thsarabunnew_bold-webfont.eot?#iefix")
              format("embedded-opentype"),
            url("/static/dist/fonts/thsarabunnew_bold-webfont.woff") format("woff"),
            url("/static/dist/fonts/thsarabunnew_bold-webfont.ttf") format("truetype");
          font-weight: bold;
          font-style: normal;
        }
        @media print {
          /* body {
            font-family: 'THSarabunNew', sans-serif;
            -webkit-print-color-adjust: exact;
            margin: 0px;
          } */
          .color {
            color: black !important;
          }
          .x_content .head_left {
            background: #3d3d3d !important;
            border: 1px solid #2f2f2f !important;
          }
          .x_content .text-head1 {
            color: #ffffff !important;
          }
          .x_content .text-head2 {
            color: #ffffff !important;
          }
          .x_content .color {
            color: #5a5a5a !important;
          }
          .x_content .bg-col {
            background-color: #f5f5f5 !important;
          }
          .x_content th {
            font-size: 13px !important;
            color: #5a5a5a !important;
          }
          .x_content td {
            font-size: 13px !important;
            color: #5a5a5a !important;
          }
          .x_content p {
            font-size: 13px !important;
            color: #5a5a5a !important;
          }
          .x_content b {
            color: black !important;
            font-weight: bold;
          }
        }
        .x_content,
        h6 h5 h4 h3 h2 h1 {
          font-family: "THSarabunNew", sans-serif !important;
        }
        .x_content p {
          font-family: "THSarabunNew", sans-serif !important;
          font-size: 13px !important;
          color: #5a5a5a !important;
        }
        .x_content th {
          font-size: 13px !important;
          color: #5a5a5a !important;
        }
        .x_content td {
          font-size: 12px !important;
          color: #5a5a5a !important;
        }
        .x_content table {
          vertical-align: baseline;
          line-height: 0.3;
        }
        .x_content tr {
          vertical-align: baseline;
          line-height: 0.3;
        }
        .x_content th {
          vertical-align: baseline;
          line-height: 0.3;
        }
        .x_content td {
          vertical-align: baseline;
          line-height: 0.3;
        }

        .x_content b {
          font-weight: normal;
          color: black !important;
        }

        .div-print {
          width: 690px;
          height: 480px;
          margin-top: 23px;
          margin-right: 15px;
          margin-left: 15px;
          border: 1px solid #d8d8d8;
          /*background-image: url("back-print.png");*/
        }
        .x_content .div-1 {
          margin-right: 25px;
          margin-left: 25px;
        }
        .x_content .div-2 {
          margin-right: 25px;
          margin-left: 25px;
        }
        .x_content .div-3 {
          margin-right: 25px;
          margin-left: 25px;
        }
        .x_content .div-4 {
          margin-right: 25px;
          margin-left: 25px;
        }
        .x_content .div-5 {
          margin-right: 25px;
          margin-left: 25px;
        }

        .x_content .button {
          margin-right: 5px;
          padding-right: 19px;
          padding-left: 19px;
          display: inline-block;
          background-color: #676767;
          border: 1px solid #777;
          font: bold 1em/2em Arial, Helvetica;
          text-decoration: none;
          color: #fff;
          border-radius: 0.2em;
        }

        .x_content .button:hover {
          color: #777;
          background-color: #ffffff;
        }
        .x_content {
          /*width: 80mm;*/
          margin: auto;
        }
      `}</style>
    </Aux>
  )
}

KioskPrintTemplate.propTypes = {
  getValueRight: PropTypes.func.isRequired,
  getValuePatient: PropTypes.func.isRequired,
  printDate: PropTypes.string.isRequired,
  printTime: PropTypes.string.isRequired
}

export default KioskPrintTemplate
