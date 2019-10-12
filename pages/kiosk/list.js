import { Spin } from "antd"
import Link from "next/link"
import React, { Component } from "react"
import Swal from "sweetalert2"
import axios from "../../axios"
import Layout from "../../components/layout"
import Aux from "../../hoc/Auxiliary"
import kioskImg from "../../static/images/kiosk_02.png"

class List extends Component {
  state = {
    kiosks: [],
    loading: false
  }

  componentDidMount() {
    this.fetchDataKiosk()
  }

  fetchDataKiosk = async () => {
    try {
      await this.setState({ loading: true })
      const { data } = await axios.get(`/kiosk/index`)
      this.setState({ kiosks: data, loading: false })
    } catch (error) {
      this.setState({ loading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  render() {
    const listItems = this.state.kiosks.map((kiosk, index) => (
      <div className="col" key={index}>
        <Link href={`/kiosk/[id]`} as={`/kiosk/${kiosk.kiosk_id}`}>
          <a className="product_nav ">
            <div className="block-media">
              <img src={kioskImg} alt="image" />
            </div>
            <p className="hoveraction_blockmedia_p">
              {kiosk.kiosk_name} <span className="second-line " />
            </p>
          </a>
        </Link>
      </div>
    ))

    return (
      <Aux>
        <Layout title="รายการตู้กดบัตรคิว" breadcrumb="รายการตู้กดบัตรคิว">
          <div className="row">
            <div className="col-md-12 product_grid__listproduct">
              <div className="box box-success">
                <div className="box-header with-border">
                  <h3 className="box-title">รายการตู้กดบัตรคิว</h3>
                  <div className="box-tools pull-right">
                    <button
                      type="button"
                      className="btn btn-box-tool"
                      data-widget="remove"
                    >
                      <i className="fa fa-times" />
                    </button>
                  </div>
                  {/* /.box-tools */}
                </div>
                {/* /.box-header */}
                <div className="box-body">
                  <div className="loading">
                    <Spin size="large" spinning={this.state.loading} />
                  </div>
                  <div id="productGrid">{listItems}</div>
                </div>
                {/* /.box-body */}
              </div>
            </div>
          </div>

          <style global jsx>{`
            .block-media img {
              max-width: 112px;
            }
            .loading {
              display: flex;
              justify-content: center;
              padding-top: 10px;
            }
            .product_grid__listproduct #productGrid {
              position: relative;
              overflow: hidden;
              display: flex;
            }
            .col {
              flex-basis: 0;
              flex-grow: 1;
              max-width: 100%;
            }
            .product_grid__listproduct #productGrid .col {
              padding: 0;
              max-width: 122px;
              margin: 0 17px 8px 0;
            }
            .product_grid__listproduct .tab-content .active {
              display: flex;
              margin: 0;
            }
            .product_grid__listproduct #productGrid .col a .block-media {
              background-color: #f5f6f6;
              max-width: 122px;
              min-width: 120px;
              height: 120px;
              border-radius: 4px;
              border: 2px solid #f5f6f6;
            }
            .media {
              display: flex;
              align-items: flex-start;
            }
            .img-fluid {
              max-width: 100%;
              height: auto;
            }
            .product_grid__listproduct #productGrid .col a:hover .block-media {
              border: 2px solid #29b5dc !important;
            }
            @media only screen and (min-width: 992px) {
              .product_grid__listproduct #productGrid .col p {
                height: 44px;
              }
            }
            .product_grid__listproduct #productGrid .col p {
              font-size: 13px;
              color: #4a4a4a;
              text-align: center;
              font-family: "Open Sans", sans-serif;
              font-weight: 400;
              position: relative;
            }
            .product_grid__listproduct
              #productGrid
              .col
              a:hover
              p.hoveraction_blockmedia_p {
              color: #29b5dc !important;
            }
            .product_grid__listproduct #productGrid .col p span {
              color: #919190;
              display: block;
              font-size: 10px;
              line-height: 12px;
            }
          `}</style>
        </Layout>
      </Aux>
    )
  }
}

export default List
