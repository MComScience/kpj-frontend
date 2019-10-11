import Link from "next/link"
import React from "react"
import { FormattedMessage } from "react-intl"
import Head from "../components/head"
import Layout from "../components/layout"

class About extends React.Component {
  state = {
    name: "About Us"
  }

  render() {
    return (
      <Layout breadcrumb="About Page">
        <div>
          <Head title={this.state.name} />
          <ul>
            <li>
              <Link href="/">
                <a>
                  <FormattedMessage id="Home" />
                </a>
              </Link>
            </li>
            <li>About Us</li>
            <li>
              <Link href={`/kiosk/[id]`} as={`/kiosk/1`}>
                <a>Kiosk</a>
              </Link>
            </li>
          </ul>

          <h1>About</h1>
          <p>We are a cool company.</p>
        </div>
      </Layout>
    )
  }
}

// About.getInitialProps = async () => {
//   await new Promise(resolve => {
//     setTimeout(resolve, 500)
//   })
//   return { title: "about" }
// }

export default About
