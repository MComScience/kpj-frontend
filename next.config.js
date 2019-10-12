const withCSS = require("@zeit/next-css")
const withImages = require("next-images")
const isProd = process.env.NODE_ENV === "production"

/* Modules */
module.exports = withImages()
module.exports = withCSS()
/* module.exports = withCSS({
  distDir: "build",
  // cssModules: true,
  assetPrefix: isProd ? 'http://localhost:8081' : '',
  webpack: config => {
    // Fixes npm packages that depend on `fs` module
    config.node = {
      fs: "empty"
    }

    return config
  }
}) */

module.exports = withCSS({
  distDir: "build",
  env: {
    SOCKET_HOST: "http://192.168.1.13:3000"
  },
  // cssModules: true,
  // assetPrefix: isProd ? "http://192.168.1.13" : "",
  webpack: (config, { isServer }) => {
    if (isServer) {
      const antStyles = /antd\/.*?\/style\/css.*?/
      const origExternals = [...config.externals]
      config.externals = [
        (context, request, callback) => {
          if (request.match(antStyles)) return callback()
          if (typeof origExternals[0] === "function") {
            origExternals[0](context, request, callback)
          } else {
            callback()
          }
        },
        ...(typeof origExternals[0] === "function" ? [] : origExternals)
      ]

      config.module.rules.unshift({
        test: antStyles,
        use: "null-loader"
      })
    }
    // if (!isServer) {
    //   config.node = {
    //     fs: 'empty'
    //   }
    // }
    config.module.rules.push({
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
      use: {
        loader: "url-loader",
        options: {
          limit: 100000,
          name: "[name].[ext]"
        }
      }
    })
    return config
  }
})
