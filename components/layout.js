import "antd/dist/antd.css"
import Link from "next/link"
import { FormattedMessage, IntlProvider } from "react-intl"
import { connect } from "react-redux"
import en_US from "../locale/en_US"
import th_TH from "../locale/th_TH"
import AppHeader from "./AppHeader"
import AppSideBar from "./AppSidebar"
import Head from "./head"

const Layout = ({
  children,
  mainMenus,
  isLoggedIn,
  user,
  title = "This is the default title",
  lang,
  breadcrumb = "Page"
}) => {
  let showBreadcrumb = () => {
    let bc = breadcrumb.length ? breadcrumb.split(">") : []
    return (
      <ol className="breadcrumb">
        <li key={"bc-home"}>
          <Link href="/">
            <a>
              <i className="fa fa-dashboard"></i>{" "}
              <FormattedMessage id={"หน้าหลัก"} defaultMessage={"หน้าหลัก"} />
            </a>
          </Link>
        </li>
        {bc.map(item => {
          let sItems = item.indexOf("|") > 0 ? item.split("|") : item
          return (
            <li key={"bc-" + item}>
              {Array.isArray(sItems) ? (
                <Link href="/">
                  <a href={"./" + sItems[1]}>{sItems[0]}</a>
                </Link>
              ) : (
                item
              )}
            </li>
          )
        })}
      </ol>
    )
  }
  return (
    <IntlProvider locale={lang} messages={lang === "en" ? en_US : th_TH}>
      <div className="wrapper">
        <Head title={title} />
        <AppHeader />
        <AppSideBar mainMenus={mainMenus} isLoggedIn={isLoggedIn} user={user} />

        <div className="content-wrapper">
          <section className="content-header">
            <h1>
              <FormattedMessage id={title} defaultMessage={title} />
              <small></small>
            </h1>
            {showBreadcrumb()}
          </section>
          <section className="content">{children}</section>
        </div>

        <footer className="main-footer">
          <div className="pull-right hidden-xs">
            <b>Dev</b>{" "}
            <a href="https://github.com/MComScience" target="blank">
              MComScience
            </a>
            .
          </div>
          <strong>
            Copyright © 2019{" "}
            <a href="https://github.com/MComScience" target="blank">
              MComScience
            </a>
            .
          </strong>{" "}
          All rights reserved.
        </footer>
      </div>
    </IntlProvider>
  )
}

const mapStateToProps = state => {
  const { auth, i18n, menu } = state
  return {
    user: auth.user,
    lang: i18n.lang,
    mainMenus: menu.mainMenus,
    isLoggedIn: auth.isLoggedIn
  }
}

export default connect(
  mapStateToProps,
  null
)(Layout)
