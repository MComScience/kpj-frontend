import * as actionTypes from '../actions/actionTypes'

const initialState = {
  lang: "en",
  languages: []
}


const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.I18N_SELECT:
      return Object.assign({}, state, {
        lang: action.lang
      })
    default:
      return state
  }
}

export default reducer