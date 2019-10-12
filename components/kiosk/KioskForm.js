import { Button, Icon, Input, Spin } from "antd"
import classNames from "classnames"
import PropTypes from "prop-types"
import payment2 from "../../static/images/payment2.png"
import Modal from "../Modal"
import Numpad from "../Numpad"

const KioskForm = props => {
  return (
    <form role="form" onSubmit={props.handleSubmit} className="form-horizontal">
      <div className="box-body">
        <Modal
          visible={props.isModalOpen}
          dismiss={props.dismissModal}
          client={"384px"}
        >
          <div className="row">
            <div className="col-sm-12">
              <h2 className="text-center">เลขบัตรประชาชน</h2>
              <div className="display-numpad text-center">
                {props.maskString(props.search)}
              </div>
              <Numpad
                clearSearch={props.onClearSearch}
                deleteSearch={props.onDeleteSearch}
                handleNumpad={number => props.handleNumpad(number)}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-8 col-sm-offset-2">
              <br />
              <div className="loading">
                <Spin size="large" spinning={props.loading} />
              </div>
              <p className="text-center">
                <Button
                  type="primary"
                  icon="search"
                  shape="round"
                  size="large"
                  block
                  onClick={props.fetchDataRight}
                >
                  ตรวจสอบสิทธิ
                </Button>
              </p>
            </div>
          </div>
        </Modal>
        <div className="form-group">
          <label className="control-label col-sm-4" htmlFor="search"></label>
          <div className="col-sm-4">
            <div className="input-group hidden">
              <span className="input-group-addon">
                <i className="fa fa-2x fa-search"></i>
              </span>
            </div>
            <Input
              size="large"
              placeholder="กรอกเลขบัตรประชาชนที่นี่"
              autoFocus
              suffix={
                <Icon type="search" style={{ color: "rgba(0,0,0,.25)" }} />
              }
              onChange={props.onChangeInput}
              onClick={props.onClickInput}
              value={props.search}
            />
          </div>
          <div className="col-sm-4"></div>
        </div>
        <div className="form-group">
          <div className="col-sm-4"></div>
          <div className="col-sm-2">
            <p>
              <Button
                type="danger"
                icon="close"
                shape="round"
                size="large"
                block
                onClick={props.onClearState}
                disabled={!props.search}
              >
                ยกเลิก
              </Button>
            </p>
          </div>
          <div className="col-sm-2">
            <p>
              <Button
                type="primary"
                icon="search"
                shape="round"
                size="large"
                block
                disabled={props.loading || !props.search}
                onClick={props.fetchDataRight}
              >
                ตรวจสอบสิทธิ
              </Button>
            </p>
          </div>
          <div className="col-sm-4"></div>
        </div>
        <div
          className={classNames(
            "form-group",
            !props.right ? "" : "hidden"
          )}
        >
          <div className="col-sm-4"></div>
          <div className="col-sm-4 faa-vertical animated">
            <img
              src={payment2}
              alt="image"
              className="img-responsive center-block"
            />
            <h1 className="text-center kt-font-info">เสียบบัตรประชาชน</h1>
          </div>
          <div className="col-sm-4"></div>
        </div>
      </div>
    </form>
  )
}

KioskForm.propTypes = {
  handleSubmit: PropTypes.func,
  isModalOpen: PropTypes.bool,
  dismissModal: PropTypes.func,
  maskString: PropTypes.func,
  search: PropTypes.string,
  onClearSearch: PropTypes.func,
  onDeleteSearch: PropTypes.func,
  handleNumpad: PropTypes.func,
  loading: PropTypes.bool,
  fetchDataRight: PropTypes.func,
  onChangeInput: PropTypes.func,
  onClickInput: PropTypes.func,
  onClearState: PropTypes.func,
  right: PropTypes.object
}

export default KioskForm
