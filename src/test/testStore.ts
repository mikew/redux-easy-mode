import type { Action, Middleware, Reducer, Store } from 'redux'
import { applyMiddleware, createStore } from 'redux'

import asyncMiddleware from '../async/asyncMiddleware'
import isAction from '../isAction'
import sideEffectMiddleware from '../sideEffects/sideEffectMiddleware'

const actionHistory: Action[] = []

const logger: Middleware = () => (dispatch) => (action) => {
  if (!isAction(action)) {
    return dispatch({ type: 'undefined' })
  }

  actionHistory.push(action)

  return dispatch(action)
}

export function createWithMiddleware<R extends Reducer>(reducer: R) {
  const store: Store<ReturnType<R>> = createStore(
    reducer,
    applyMiddleware(
      asyncMiddleware({ throwOriginalError: false }),
      sideEffectMiddleware(),
      logger,
    ),
  )

  return store
}

export function clearActionHistory() {
  while (actionHistory.length) {
    actionHistory.pop()
  }
}

export function getActionHistory() {
  return actionHistory
}
