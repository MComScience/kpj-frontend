import axios from "axios"
import { loadState } from './utils'

const instance = axios.create({
  baseURL: "http://10.0.7.176:8081/v1/" //'http://queue-udh-api.local/v1/'
})
instance.CancelToken = axios.CancelToken
instance.isCancel = axios.isCancel

instance.interceptors.request.use(
  req => {
    const store = loadState("persist:auth")
    if (store && store.token && store.token !== 'null') {
      req.headers["Authorization"] = `Bearer ${store.token.replace(/"/g, '')}`
    }
    return req
  },
  error => {
    // Do something with request error
    return Promise.reject(error)
  }
)

// Add a response interceptor
instance.interceptors.response.use(
  res => {
    if (res.status === 200) {
      return res.data
    }
    return res
  },
  error => {
    if(error.response) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
    // Do something with response error
    
  }
)

export default instance
