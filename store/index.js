import { applyMiddleware, createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension"
import { persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"
import thunkMiddleware from "redux-thunk"
import rootReducer from "./reducers"

const rootPersistConfig = {
  key: "root",
  storage: storage,
  blacklist: [],
  whitelist: []
}

const persistedReducer = persistReducer(rootPersistConfig, rootReducer)

export function initializeStore(initialState = {}) {
  return createStore(
    persistedReducer,
    initialState,
    composeWithDevTools(applyMiddleware(thunkMiddleware))
  )
}
