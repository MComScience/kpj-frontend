import * as actionTypes from "../actions/actionTypes"

const menu = [
  {
    miName: "หน้าหลัก",
    activeFlag: true,
    miIcon: "fa-dashboard",
    url: "/",
    isAuth: true
  },
  {
    miName: "About",
    activeFlag: false,
    miIcon: "fa-circle-o",
    url: "/about"
  },
  {
    miName: "รายการตู้กดบัตรคิว",
    activeFlag: false,
    miIcon: "fa-th",
    url: "/kiosk/list",
    isAuth: false
  },
  {
    miName: "เข้าสู่ระบบ",
    activeFlag: false,
    miIcon: "fa-sign-in",
    url: "/auth/sign-in",
    isAuth: false
  },
  {
    miName: "ตั้งค่า",
    activeFlag: false,
    miIcon: "fa-cogs",
    url: "#",
    isAuth: true,
    subItems: [
      {
        activeFlag: false,
        url: "/settings/user/index",
        name: "ผู้ใช้งาน"
      },
      {
        activeFlag: false,
        url: "/settings/nhso/index",
        name: "โทเค็น สปสช"
      },
      {
        activeFlag: false,
        url: "/settings/kiosk/index",
        name: "ตู้ KIOSK"
      }
    ]
  },
  {
    activeFlag: false,
    miName: "SideMenu2",
    miIcon: "fa-leaf",
    url: "#",
    subItems: [
      {
        activeFlag: false,
        url: "/",
        miIcon: "fa-tree",
        name: "SubMenuItem1"
      },
      {
        activeFlag: false,
        url: "/",
        name: "SubMenuItem2"
      }
    ]
  },
  {
    activeFlag: false,
    miName: "SideMenu3",
    miIcon: "fa-user",
    url: "/",
    subItems: []
  }
]

const initialState = {
  mainMenus: menu
}

const mainMenu = (state = [], action) => {
  switch (action.type) {
    case actionTypes.INIT_MAIN_MENU:
      return Object.assign([], state, menu)
    case actionTypes.ACTIVE_MENU_ITEM_CHANGED:
      // console.log('state.mainMenus:', state.mainMenus);
      let obj = Object.assign([], state.mainMenus)
      //console.log('state.mainMenus.obj:',obj);
      for (var o in obj) {
        obj[o].activeFlag = obj[o].miName === action.activeMiName
      }
      //console.log('ACTIVE_MENU_ITEM_CHANGED:', obj);
      return Object.assign({}, state, {
        mainMenus: obj
      })
    case actionTypes.ACTIVE_SUB_MENU_ITEM_CHANGED:
      let obj1 = Object.assign([], state.mainMenus)
      for (var o in obj1) {
        obj1[o].activeFlag = obj1[o].miName === action.activeMiName
        if (obj1[o].activeFlag) {
          for (var os in obj1[o].subItems) {
            obj1[o].subItems[os].activeFlag =
              obj1[o].subItems[os].name === action.activeSubMiName
          }
        }
      }
      //console.log('ACTIVE_SUB_MENU_ITEM_CHANGED:', obj1)
      return Object.assign({}, state, {
        mainMenus: obj1
      })
    default:
      //console.log('default:', state)
      return state
  }
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.INIT_MAIN_MENU:
    case actionTypes.ACTIVE_MENU_ITEM_CHANGED:
    case actionTypes.ACTIVE_SUB_MENU_ITEM_CHANGED:
      //console.log('menuReducer-action:', action.type, mm)
      return mainMenu(state, action)
    default:
      return state
  }
}

export default reducer
