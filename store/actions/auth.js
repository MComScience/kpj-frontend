import jwt from 'jsonwebtoken'
import Swal from 'sweetalert2'
import { loadState } from "../../utils"
import * as actionTypes from "./actionTypes"

export const logout = () => {
  return {
    type: actionTypes.AUTH_LOGOUT
  }
}

export const authSuccess = authData => {
  return {
    type: actionTypes.AUTH_SUCCESS,
    token: authData.token,
    user: authData.user
  }
}

export const authCheckState = () => {
  return dispatch => {
    const store = loadState("persist:auth")
    if (!store) {
      dispatch(logout())
    } 
    else {
      try {
        const decoded = jwt.verify(store.token.replace(/"/g, ''), "supersecret")
        const currentTime = new Date().getTime()
        const expirationTime = new Date(decoded.exp * 1000).getTime()
        if (expirationTime < currentTime) {
          dispatch(logout())
        } else {
          const exp = (expirationTime - currentTime) / 1000
          dispatch(checkAuthTimeout(exp))
        }
      } catch (err) {
        setTimeout(() => {
          dispatch(logout())
        }, 500)
      }
    }
  }
}

export const checkAuthTimeout = expirationTime => {
  return dispatch => {
    setTimeout(() => {
      dispatch(logout())
      let timerInterval
      Swal.fire({
        title: "Session Expired.",
        html: "<strong></strong>",
        timer: 3000,
        onBeforeOpen: () => {
          Swal.showLoading()
          const strong = Swal.getContent().querySelector("strong")
          if (strong) {
            timerInterval = setInterval(() => {
              strong.textContent = Swal.getTimerLeft()
            }, 100)
          }
        },
        onClose: () => {
          clearInterval(timerInterval)
        }
      }).then(result => {
        // window.location.reload()
      })
    }, expirationTime * 1000)
  }
}
