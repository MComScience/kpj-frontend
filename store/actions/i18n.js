import * as actionTypes from './actionTypes'

export const i18nSelect = lang => {
  return {
    type: actionTypes.I18N_SELECT,
    lang: lang
  }
}
