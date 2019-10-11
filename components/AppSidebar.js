import PropTypes from "prop-types"
import MenuMain from "./MenuMain"

const AppSidebar = props => (
  <aside className="main-sidebar">
    <section className="sidebar">
      {props.isLoggedIn ? (
        <div className="user-panel">
          <div className="pull-left image">
            <img
              src="/static/images/boy.png"
              className="img-circle"
              alt="User Image"
            />
          </div>
          <div className="pull-left info">
            <p>{props.user.name}</p>
            <a href="#">
              <i className="fa fa-circle text-success" /> Online
            </a>
          </div>
        </div>
      ) : null}
      <MenuMain mainMenus={props.mainMenus} />
    </section>
  </aside>
)

AppSidebar.propTypes = {
  mainMenus: PropTypes.array,
  isLoggedIn: PropTypes.bool,
  user: PropTypes.object
}

export default AppSidebar
