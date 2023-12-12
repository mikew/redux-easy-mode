import type { ReduxActionCreator } from 'createActions'

function isReduxActionCreator(arg: unknown): arg is ReduxActionCreator {
  return typeof arg === 'function' && 'actionType' in arg
}

export default isReduxActionCreator
