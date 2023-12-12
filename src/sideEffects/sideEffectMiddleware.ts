import type { Middleware } from 'redux'

import isAction from '../isAction'

import { runActionSideEffects } from './reduxActionSideEffect'
import { runSelectorSideEffects } from './reduxSelectorSideEffect'

export default function sideEffectMiddleware(): Middleware {
  return (store) => (next) => (action) => {
    // Return if there is no action.
    if (!isAction(action)) {
      return next(action)
    }

    const result = next(action)

    runActionSideEffects(action, store)
    runSelectorSideEffects(store)

    return result
  }
}
