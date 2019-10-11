import PropTypes from 'prop-types';

const KioskBoxRight = props => {
  return (
    <div className="kt-portlet kt-portlet--height-fluid">
      <div className="kt-portlet__head kt-portlet__head--noborder">
        <div className="kt-portlet__head-label">
          <h3 className="kt-portlet__head-title">
            <i className="fa fa-h-square"></i> ข้อมูลสิทธิการรักษา
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
                {!props.right
                  ? "ชื่อโรงพยาบาล"
                  : props.getValueRight("hmain_name")}
              </a>
              <span className="kt-widget__desc"></span>
            </div>
          </div>
          <div className="kt-widget__body">
            <div className="kt-widget__section"></div>
            <div className="kt-widget__item">
              <div className="kt-widget__contact">
                <span className="kt-widget__label">
                  <i className="fa fa-check-circle-o"></i> ชื่อสิทธิ
                </span>
                <a href="#" className="kt-widget__data">
                  {props.getValueRight("maininscl_name")}
                </a>
              </div>
              <div className="kt-widget__contact">
                <span className="kt-widget__label">
                  <i className="fa fa-check-circle-o"></i> ชื่อสิทธิ
                </span>
                <a href="#" className="kt-widget__data">
                  {props.getValueRight("subinscl_name")}
                </a>
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

KioskBoxRight.propTypes = {
  getPhoto: PropTypes.func,
  right: PropTypes.object,
  getValueRight: PropTypes.func
};

export default KioskBoxRight
