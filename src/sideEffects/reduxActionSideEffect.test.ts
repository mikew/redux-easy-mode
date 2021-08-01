import testActions from '../test/testActions'

import reduxActionSideEffect, {
  runActionSideEffects,
} from './reduxActionSideEffect'

describe('reduxActionSideEffect', () => {
  it('is called when the given type is dispatched', () => {
    let actionPayload: unknown
    const dispatch = jest.fn()
    const getState = jest.fn()

    reduxActionSideEffect(
      testActions.simplePayload,
      ({ action, getState, dispatch }) => {
        actionPayload = action.payload
        getState()
        dispatch({ type: '' })
      },
    )

    runActionSideEffects(testActions.simplePayload(), {
      dispatch,
      getState,
    })

    expect(actionPayload).toEqual('simple')
    expect(dispatch).toHaveBeenCalled()
    expect(getState).toHaveBeenCalled()
  })

  it('allows for a cleanup function', () => {
    const dispatch = jest.fn()
    const getState = jest.fn()
    const cleanup = jest.fn()

    reduxActionSideEffect(testActions.simplePayload, () => {
      return cleanup
    })

    runActionSideEffects(testActions.simplePayload(), {
      dispatch,
      getState,
    })

    expect(cleanup).not.toHaveBeenCalled()

    runActionSideEffects(testActions.simplePayload(), {
      dispatch,
      getState,
    })

    expect(cleanup).toHaveBeenCalled()
  })
})
