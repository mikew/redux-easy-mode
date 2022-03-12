import { Middleware } from 'redux'

import { runActionSideEffects } from './reduxActionSideEffect'
import { runSelectorSideEffects } from './reduxSelectorSideEffect'

export default function sideEffectMiddleware(): Middleware {
  return (store) => (dispatch) => (action) => {
    // Return if there is no action.
    if (!action) {
      return dispatch(action)
    }

    const result = dispatch(action)

    runActionSideEffects(action, store)
    runSelectorSideEffects(store)

    return result
  }
}
