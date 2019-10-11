import { combineReducers } from "redux"
import { persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"
import authReducer from "./auth"
import i18nReducer from "./i18n"
import menuReducer from "./menu"

const authPersistConfig = {
  key: "auth",
  storage: storage,
  blacklist: []
}

const i18nPersistConfig = {
  key: "i18n",
  storage: storage,
  blacklist: []
}

const menuPersistConfig = {
  key: "menu",
  storage: storage,
  blacklist: []
}

export default combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  i18n: persistReducer(i18nPersistConfig, i18nReducer),
  menu: persistReducer(menuPersistConfig, menuReducer)
})
