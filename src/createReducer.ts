import type { Action } from 'redux'

import type {
  ActionErrorType,
  ActionStartType,
  ActionSuccessType,
} from './async/asyncMiddleware'
import {
  errorActionType,
  startActionType,
  successActionType,
} from './async/asyncMiddleware'
import type { ReduxActionCreator } from './createActions'
import isReduxActionCreator from './isReduxActionCreator'

interface ReduxReducerBuilder<State> {
  addHandler: AddHandler<State>

  addStartHandler: <ActionCreator extends ReduxActionCreator>(
    actionCreator: ActionCreator,
    handler: ReduxReducerCaseHandler<State, ActionStartType<ActionCreator>>,
  ) => ReduxReducerBuilder<State>

  addSuccessHandler: <ActionCreator extends ReduxActionCreator>(
    actionCreator: ActionCreator,
    handler: ReduxReducerCaseHandler<State, ActionSuccessType<ActionCreator>>,
  ) => ReduxReducerBuilder<State>

  addErrorHandler: <ActionCreator extends ReduxActionCreator>(
    actionCreator: ActionCreator,
    handler: ReduxReducerCaseHandler<State, ActionErrorType<ActionCreator>>,
  ) => ReduxReducerBuilder<State>
}

interface AddHandler<State> {
  // Handler that takes a string action type. Here it's up to the user to give a
  // type for the action.
  <A extends Action>(
    actionType: string,
    handler: ReduxReducerCaseHandler<State, A>,
  ): ReduxReducerBuilder<State>

  // Handler that takes an action creator. The action type will be inferred
  // for the user.
  <ActionCreator extends ReduxActionCreator, Rt = ReturnType<ActionCreator>>(
    actionCreator: ActionCreator,
    handler: ReduxReducerCaseHandler<State, Rt>,
  ): ReduxReducerBuilder<State>
}

interface ReduxReducerCaseHandler<State, Action> {
  (state: State, action: Action): State
}

function createReducer<State>(
  initialState: State,
  builderFn: (builder: ReduxReducerBuilder<State>) => void,
) {
  const handlers: Record<string, ReduxReducerCaseHandler<State, Action>> = {}

  const builder: ReduxReducerBuilder<State> = {
    addHandler: (
      actionCreator: ReduxActionCreator | string,
      handler: ReduxReducerCaseHandler<State, Action>,
    ) => {
      if (isReduxActionCreator(actionCreator)) {
        handlers[actionCreator.actionType] = handler
      } else {
        handlers[actionCreator] = handler
      }
      return builder
    },
    addStartHandler: (actionCreator, handler) => {
      handlers[startActionType(actionCreator.actionType)] = handler as any
      return builder
    },
    addSuccessHandler: (actionCreator, handler) => {
      handlers[successActionType(actionCreator.actionType)] = handler as any
      return builder
    },
    addErrorHandler: (actionCreator, handler) => {
      handlers[errorActionType(actionCreator.actionType)] = handler as any
      return builder
    },
  }

  builderFn(builder)

  return (state = initialState, action: Action) => {
    if (handlers[action.type]) {
      return handlers[action.type](state, action)
    }

    return state
  }
}

export default createReducer
