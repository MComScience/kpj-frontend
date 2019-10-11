const loadState = (key) => {
  try {
    const serializedState = localStorage.getItem(key)
    if (serializedState === null) {
      return undefined
    } else {
      return JSON.parse(serializedState)
    }
  } catch (error) {
    return undefined
  }
}

const saveState = state => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem("store", serializedState)
  } catch (error) {
    console.log(error.message)
  }
}

const updateObject = (oldObject, updatedProperties) => {
  return {
    ...oldObject,
    ...updatedProperties
  }
}

export const isEmpty = (value, trim) => {
  return value === null || value === undefined || value.length === 0 || (trim && value.trim() === '')
}

export { loadState, saveState, updateObject }

