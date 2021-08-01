import { ReduxActionCreator } from 'createActions'

function isReduxActionCreator(arg: any): arg is ReduxActionCreator {
  return !!arg?.actionConstant
}

export default isReduxActionCreator
