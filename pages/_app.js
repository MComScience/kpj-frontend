import App from 'next/app'
import Router from "next/router"
import NProgress from "nprogress"
import React from 'react'
import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import withReduxStore from '../lib/redux-store'
import "../static/nprogress.css"
import { authCheckState } from '../store/actions'

Router.events.on("routeChangeStart", url => {
  // console.log(`Loading: ${url}`)
  NProgress.start()
})
Router.events.on("routeChangeComplete", () => NProgress.done())
Router.events.on("routeChangeError", () => NProgress.done())

class MyApp extends App {
  constructor (props) {
    super(props)
    this.persistor = persistStore(props.reduxStore)
  }

  render () {
    const { Component, pageProps, reduxStore } = this.props
    reduxStore.dispatch(authCheckState())
    return (
      <Provider store={reduxStore}>
        <PersistGate
          loading={<Component {...pageProps} />}
          persistor={this.persistor}
        >
          <Component {...pageProps} />
        </PersistGate>
      </Provider>
    )
  }
}

export default withReduxStore(MyApp)