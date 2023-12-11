import type { ReduxActionCreator } from 'createActions'

function isReduxActionCreator(arg: any): arg is ReduxActionCreator {
  return !!arg?.actionType
}

export default isReduxActionCreator
