import { updateObject } from '../../utils'
import * as actionTypes from '../actions/actionTypes'

const initialState = {
  token: null,
  isLoggedIn: false,
  user: null
}

const authSuccess = (state, action) => {
  return updateObject(state, {
    token: action.token,
    user: action.user,
    isLoggedIn: true
  })
}

const authLogout = (state, action) => {
  return updateObject(state, {
    token: null,
    user: null,
    isLoggedIn: false
  })
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.AUTH_SUCCESS:
      return authSuccess(state, action)
    case actionTypes.AUTH_LOGOUT:
      return authLogout(state, action)
    default:
      return state
  }
}

export default reducer
