import { ReduxActionCreator } from 'createActions'
import { Action, Dispatch, MiddlewareAPI } from 'redux'

import isReduxActionCreator from '../isReduxActionCreator'

interface ReduxActionSideEffectHandler<Action> {
  (action: Action, dispatch: Dispatch, getState: () => any): void
}

interface ReduxActionSideEffect {
  // Handler that takes a string action type. Here it's up to the user to give a
  // type for the action.
  <A extends Action>(
    actionType: string,
    handler: ReduxActionSideEffectHandler<A>,
  ): void | (() => void)

  // Handler that takes an action creator. The action type will be inferred
  // for the user.
  <ActionCreator extends ReduxActionCreator, Rt = ReturnType<ActionCreator>>(
    actionCreator: ActionCreator,
    handler: ReduxActionSideEffectHandler<Rt>,
  ): void | (() => void)
}

const actionSideEffects: Record<
  string,
  {
    handler: ReduxActionSideEffectHandler<Action>
    cleanup?: void | (() => void)
  }[]
> = {}

const reduxActionSideEffect: ReduxActionSideEffect = (
  action: ReduxActionCreator | string,
  handler: ReduxActionSideEffectHandler<Action>,
) => {
  const actionType = isReduxActionCreator(action) ? action.actionType : action

  if (!actionSideEffects[actionType]) {
    actionSideEffects[actionType] = []
  }

  actionSideEffects[actionType].push({ handler })
}

export default reduxActionSideEffect

export async function runActionSideEffects(
  action: Action,
  store: MiddlewareAPI,
) {
  if (actionSideEffects[action.type]) {
    for (const sideEffect of actionSideEffects[action.type]) {
      try {
        sideEffect.cleanup?.()
      } catch (err) {
        console.error(err)
      }

      const maybeCleanupFunction = sideEffect.handler(
        action,
        store.dispatch,
        store.getState,
      )

      sideEffect.cleanup = maybeCleanupFunction
    }
  }
}
