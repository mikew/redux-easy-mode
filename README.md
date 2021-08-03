# redux-easy-mode

A very easy to understand and use set of tools for Redux. Includes:

- Easy way of defining actions
- Easy way of building reducers
- Async / Promise based actions
- Action-based side effects
- Selector-based side effects
- TypeScript support

## Actions and Reducers

### Actions

Actions are built using a namespace and an object of "payload creators". The
property names are considered the action types.

A payload creator is a function that takes any number of arguments and returns
what will be the action's payload (or, if you'd prefer, you can return both a
payload and meta.)

```typescript
import { createActions } from 'redux-easy-mode'

export default createActions('example', {
  // A simple action with no arguments or payload
  increment: () => undefined,

  // An action with an argument that also returns a payload.
  setIncrementBy: (n: number) => n,

  // An action that returns meta, payload, and even overrides the action type.
  // Note that when you override the action type, the `.actionType` property
  // will be inconsistent.
  safeSetIncrementBy: (n: number) => ({
    type: 'example/setIncrementBy',
    payload: n > 10 ? 10 : n,
    meta: {
      wasTooLarge: n > 10,
    },
  }),

  // An async action. See below for notes on the async middleware.
  asyncAction: () => async (dispatch, getState) => ({
    foo: 42,
  }),
})
```

### Reducers

`createReducer` builds a reducer for you. No more switch statements.

It uses a builder pattern, so return types are inferred for you.

```typescript
import { createReducer } from 'redux-easy-mode'

import actions from './actions'

const initialState = {
  currentNumber: 0,
  incrementBy: 1,
}

export default createReducer(initialState, (builder) => {
  builder
    // Passing an action creator will automatically infer type of the action.
    .addHandler(actions.increment, (state, action) => ({
      ...state,
      currentNumber: state.currentNumber + state.incrementBy,
    }))

    // You can still go the string route if you need to.
    // Note that when you do this, the type of the action cannot be inferred for
    // you.
    .addHandler(
      'example/setIncrementBy',
      (state, action: ReturnType<typeof actions.setIncrementBy>) => ({
        ...state,
        incrementBy: action.payload,
      }),
    )

    // There's also methods to infer the async result for you.
    .addSuccessHandler(actions.asyncAction, (state, action) => ({
      ...state,
      currentNumber: action.payload.foo,
    }))
})
```

---

## Async Middleware

Allows you use async functions for payloads in redux. Also supports Promises
and synchronous code. Gives thunk abilities when payload is a function.

### Example

```javascript
store.dispatch({
  type: 'fetchResults',
  payload: async (dispatch, getState) => {
    const results = await someApiCall()

    dispatch({
      type: 'recordResults',
      payload: results,
    })
  },
})
```

This will dispatch 3 actions, in this order:

```json
[
  {
    "type": "fetchResults/start"
  },
  {
    "type": "recordResults",
    "payload": ["results of your api call"]
  },
  {
    "type": "fetchResults/success"
  }
]
```

### Installation

```typescript
import { applyMiddleware, createStore } from 'redux'
import { asyncMiddleware } from 'redux-easy-mode'

const configureStore = applyMiddleware(asyncMiddleware())(createStore)
```

### Awaiting dispatch

When calling `dispatch()` with an async function, it will return `Promise<any>`.
That means that you can `await` it when dispatching your actions throughout your
code, enabling more ways of combining async actions.

### Skip `/start` and `/success` actions

These actions are dispatched by the middleware when the payload is either a
Function or a Promise. You can skip them by adding metadata to your action.
This acts more like redux-thunk without having to install both middleware:

```typescript
store.dispatch({
  type: 'foo',
  payload(dispatch) {
    dispatch(/* */)
  },
  meta: {
    asyncPayload: {
      skipOuter: true,
    },
  },
})
```

### Handle payload as Promise instead of async function.

The payload can be a Promise. This will also dispatch the `/start` and
`/success` actions:

```typescript
dispatch({
  type: 'fetchResults',
  payload: someApiCall(),
})
```

### Passing data to `/success` action

No matter what you initially pass as a payload, the `/success` action will receive the result of it should you want to do anything with it in a reducer or at the point of dispatching:

```typescript
dispatch({ payload: Promise.resolve(42), type: 'fetchResults' })
// { payload: 42, type: 'fetchResults/success }

dispatch({
  async payload() {
    return 42
  },
  type: 'fetchResults',
})
// { payload: 42, type: 'fetchResults/success }

dispatch({
  payload() {
    return 42
  },
  type: 'fetchResults',
})
// { payload: 42, type: 'fetchResults/success }
```

### Types for reducers

`redux-async-payload` comes with `ActionStartType`, `ActionSuccessType`, and
`ActionErrorType`.

Using the actions and reducer helpers greatly simplifies this.

```typescript
function reducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case startActionType(actions.constants.myAction): {
      action = action as ActionStartType<typeof actions.myAction>

      return {
        ...state,
      }
    }

    case successActionType(actions.constants.myAction): {
      action = action as ActionSuccessType<typeof actions.myAction>
      return {
        ...state,
      }
    }

    case errorActionType(actions.constants.myAction):
      {
        action = action as ActionErrorType<typeof actions.myAction>
        return {
          ...state,
        }
      }

      return state
  }
}
```

## Side Effects

If async actions are not enough for you, there is also a side effect middleware.
These allow you to run functions when actions are dispatched, or when some part
of the state changes based on a selector.

### Installation

```typescript
import { applyMiddleware, createStore } from 'redux'
import { sideEffectMiddleware } from 'redux-easy-mode'

const configureStore = applyMiddleware(sideEffectMiddleware())(createStore)
```

### Action-based side effects

These side effects will be called whenever given action is dispatched. You are
given access to the store, and can optionally return a function to do some
cleanup.

```ts
import { reduxActionSideEffect } from 'redux-easy-mode'

reduxActionSideEffect(actions.increment, ({ action, dispatch, getState }) => {
  console.log(`${actions.increment.actionType} was dispatched`)

  // Return a function if you'd like to do some cleanup before this function is
  // called again.
  return () => {
    console.log('cleanup')
  }
})
```

### Selector-based side effects

These side effects are run whenever the resulting value of your selector has
changed. You are given access to the store, and can optionally return a function
to do some cleanup.

```ts
import { reduxSelectorSideEffect } from 'redux-easy-mode'

reduxSelectorSideEffect(
  (state: RootState) => state.some.value,
  ({ value, previousValue, dispatch, getState }) => {
    console.log('value:', value)
    console.log('previousValue:', previousValue)

    // Return a function if you'd like to do some cleanup before this function is
    // called again.
    return () => {
      console.log('cleanup')
    }
  },
)
```

## See Also

- [Redux Toolkit](https://redux-toolkit.js.org/). Includes utilities to
  simplify common use cases like store setup, creating reducers, immutable
  update logic, and more.
- [redux-ts-helpers]() and [redux-async-payload](). These were two redux tools I
  built in 2017. `redux-easy-mode` is these two mashed together, inspired by
  Redux Toolkit.
