import type { Action, Dispatch, Middleware, MiddlewareAPI } from 'redux'

import isAction from '../isAction'

export interface MiddlewareOptions {
  throwOriginalError: boolean
}

interface ActionContext {
  didError: boolean
}

export type PayloadType<T> =
  // If T is a function that returns a promise, infer U from Promise.
  // ... If T is a function, infer U from its return type.
  // ... ... If T is just a promise, infer U.
  T extends (...args: any[]) => Promise<infer U>
    ? U
    : T extends (...args: any[]) => infer U
      ? U
      : T extends Promise<infer U>
        ? U
        : T

export type ActionStartType<
  F extends (...args: unknown[]) => { payload: unknown },
> = Omit<ReturnType<F>, 'payload'>

export type ActionSuccessType<
  F extends (...args: unknown[]) => { payload: unknown },
> = Omit<ReturnType<F>, 'payload'> & {
  payload: PayloadType<ReturnType<F>['payload']>
  error: false
}

export type ActionErrorType<
  F extends (...args: unknown[]) => { payload: unknown },
> = Omit<ReturnType<F>, 'payload'> & {
  payload: string
  error: true
}

export type AsyncAction = Action & {
  error?: boolean
  meta?: { asyncPayload?: { skipOuter?: boolean }; [key: string]: unknown }
}

const defaultOptions: MiddlewareOptions = {
  throwOriginalError: true,
}

let currentOptions: MiddlewareOptions

/**
 * Middleware adding native async / await support to Redux.
 */
function asyncMiddleware(options?: MiddlewareOptions): Middleware {
  // Merge given options and our defaults.
  let opts: MiddlewareOptions = defaultOptions

  if (options) {
    opts = {
      ...defaultOptions,
      ...options,
    }
  }

  currentOptions = opts

  return (store) => (next) => (action) => {
    const context: ActionContext = {
      didError: false,
    }

    // Return if there is no action or payload.
    if (!isAction(action) || !('payload' in action)) {
      return next(action)
    }

    // If the payload is already a promise, IE `fetch('http://...')`
    // dispatch the start action while returning the promise with our
    // success / error handlers.
    if (isPromise(action.payload)) {
      dispatchPendingAction(store.dispatch, action)

      return attachHandlers(context, store, action, action.payload)
    }

    // If the payload is a function dispatch the start action and call the
    // function with `dispatch` and `getState` as arguments.
    // If the result is not a promise, just turn it into one, attach our
    // success / error handlers, and return it.
    if (typeof action.payload === 'function') {
      dispatchPendingAction(store.dispatch, action)
      let result: Promise<unknown> | null = null

      try {
        result = action.payload(store.dispatch, store.getState)
      } catch (err) {
        const errorResult = dispatchRejectedAction(context, store, action, err)

        if (!currentOptions.throwOriginalError) {
          return errorResult
        }
      }

      if (!isPromise(result)) {
        result = Promise.resolve(result)
      }

      return attachHandlers(context, store, action, result)
    }

    // Just pass the action along if we've somehow gotten here.
    return next(action)
  }
}

export default asyncMiddleware

export function startActionType<T extends string>(type: T) {
  return `${type}/start` as const
}

export function successActionType<T extends string>(type: T) {
  return `${type}/success` as const
}

export function errorActionType<T extends string>(type: T) {
  return `${type}/error` as const
}

/**
 * Checks if the argument given is a Promise or Promise-like object.
 */
function isPromise(
  // Using any here because `unknown` would involve a lot more checks, and they
  // can fail for promise-like things that aren't actually a Promise but are
  // still then-able.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  promiseLike: any,
): promiseLike is Promise<unknown> {
  if (typeof promiseLike?.then === 'function') {
    return true
  }

  return false
}

/**
 * Check if start / success actions should be skipped.
 */
function shouldSkipOuter(action: AsyncAction) {
  return !!action.meta?.asyncPayload?.skipOuter
}

/**
 * Dispatches the start action.
 */
function dispatchPendingAction(dispatch: Dispatch, action: AsyncAction) {
  if (shouldSkipOuter(action)) {
    return
  }

  dispatch({
    type: startActionType(action.type),
    error: action.error,
    meta: action.meta,
  })
}

/**
 * Dispatches the success action and passes the payload along.
 */
function dispatchFulfilledAction(
  context: ActionContext,
  store: MiddlewareAPI,
  action: AsyncAction,
  payload: unknown,
) {
  if (context.didError) {
    return
  }

  if (shouldSkipOuter(action)) {
    return payload
  }

  return store.dispatch({
    payload,
    type: successActionType(action.type),
    error: false,
    meta: action.meta,
  })
}

/**
 * Dispatches the error action, sets `error` to `true`, and passes the
 * error as the payload.
 */
function dispatchRejectedAction(
  context: ActionContext,
  store: MiddlewareAPI,
  action: AsyncAction,
  err: unknown,
) {
  context.didError = true

  let errorMessage = 'Unknown error'
  if (err instanceof Error) {
    errorMessage = err.message || 'Error'
  }

  const result = store.dispatch({
    type: errorActionType(action.type),
    payload: errorMessage,
    error: true,
    meta: action.meta,
  })

  if (currentOptions.throwOriginalError) {
    throw err
  }

  return result
}

/**
 * Attaches fulfilled / error handlers to a promise while still throwing
 * the original error.
 */
function attachHandlers<T extends Promise<unknown>>(
  context: ActionContext,
  store: MiddlewareAPI,
  action: AsyncAction,
  promise: T,
) {
  return promise
    .then((payload) => dispatchFulfilledAction(context, store, action, payload))
    .catch((err) => dispatchRejectedAction(context, store, action, err))
}
