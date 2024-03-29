import Document, { Head, Html, Main, NextScript } from "next/document"

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body className="hold-transition skin-green-light sidebar-mini">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
