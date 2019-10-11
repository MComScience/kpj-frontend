import PropTypes from 'prop-types';

const KioskBoxPatient = props => {
  return (
    <div className="kt-portlet kt-portlet--height-fluid">
      <div className="kt-portlet__head kt-portlet__head--noborder">
        <div className="kt-portlet__head-label">
          <h3 className="kt-portlet__head-title">
            <i className="fa fa-user"></i> ข้อมูลทั่วไป
          </h3>
        </div>
      </div>
      <div className="kt-portlet__body">
        {/*begin::Widget */}
        <div className="kt-widget kt-widget--user-profile-2">
          <div className="kt-widget__head">
            <div className="kt-widget__media">
              <img
                className="kt-widget__img kt-hidden-"
                src={props.getPhoto()}
                alt="image"
              />
              <div className="kt-widget__pic kt-widget__pic--success kt-font-success kt-font-boldest kt-hidden"></div>
            </div>
            <div className="kt-widget__info">
              <a href="#" className="kt-widget__username">
                {props.getValuePatient("fullname", "ชื่อ-นามสกุล")}
              </a>
              <span className="kt-widget__desc"></span>
            </div>
          </div>
          <div className="kt-widget__body">
            <div className="kt-widget__section"></div>
            <div className="kt-widget__item">
              <div className="kt-widget__contact">
                <span className="kt-widget__label">เลขบัตรประชาชน:</span>
                <a href="#" className="kt-widget__data">
                  {props.getValuePatient("cid")}
                </a>
              </div>
              <div className="kt-widget__contact">
                <span className="kt-widget__label">ชื่อ-นามสกุล:</span>
                <a href="#" className="kt-widget__data">
                  {props.getValuePatient("fullname", "ชื่อ-นามสกุล")}
                </a>
              </div>
              <div className="kt-widget__contact">
                <span className="kt-widget__label">ที่อยู่:</span>
                <span className="kt-widget__data">
                  {props.getValuePatient("address")}
                </span>
              </div>
              <div className="kt-widget__contact">
                <span className="kt-widget__label">วันเกิด:</span>
                <span className="kt-widget__data">
                  {props.getValuePatient("birthday")}
                </span>
              </div>
              <div className="kt-widget__contact">
                <span className="kt-widget__label">สัญชาติ:</span>
                <span className="kt-widget__data">
                  {props.getValuePatient("nation")}
                </span>
              </div>
            </div>
          </div>
          <div className="kt-widget__footer"></div>
        </div>
        {/*end::Widget */}
      </div>
    </div>
  )
}

KioskBoxPatient.propTypes = {
  getPhoto: PropTypes.func.isRequired,
  getValuePatient: PropTypes.func.isRequired
};

export default KioskBoxPatient
