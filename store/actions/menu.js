import * as actionTypes from "./actionTypes"

export const initMainMenu = () => {
  //console.log('menuActions.initMainMenu');
  return {
    type: actionTypes.INIT_MAIN_MENU
  }
}

export const activeMenuChanged = miName => {
  return {
    type: actionTypes.ACTIVE_MENU_ITEM_CHANGED,
    activeMiName: miName
  }
}

export const activeSubMenuChanged = (miName, subMiName) => {
  return {
    type: actionTypes.ACTIVE_SUB_MENU_ITEM_CHANGED,
    activeMiName: miName,
    activeSubMiName: subMiName
  }
}
