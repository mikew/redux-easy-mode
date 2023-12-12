import reduxSelectorSideEffect, {
  runSelectorSideEffects,
} from './reduxSelectorSideEffect'

interface State {
  foo: string
}

function createState(state: State) {
  return state
}

describe('reduxSelectorSideEffect', () => {
  it('is called when the result of the selector changes', () => {
    const dispatch = vi.fn()
    const valueTest = vi.fn()
    const previousValueTest = vi.fn()

    reduxSelectorSideEffect(
      (state: State) => state.foo,
      (value, previousValue, dispatch, getState) => {
        valueTest(value)
        previousValueTest(previousValue)
        getState()
        dispatch({ type: '' })
      },
    )

    runSelectorSideEffects({
      dispatch,
      getState: () => createState({ foo: 'bar' }),
    })

    expect(dispatch).toHaveBeenCalled()
    expect(valueTest).toHaveBeenLastCalledWith('bar')
    expect(previousValueTest).toHaveBeenLastCalledWith(undefined)

    runSelectorSideEffects({
      dispatch,
      getState: () => createState({ foo: 'updated' }),
    })

    expect(valueTest).toHaveBeenLastCalledWith('updated')
    expect(previousValueTest).toHaveBeenLastCalledWith('bar')
  })

  it('allows for a cleanup function', () => {
    const dispatch = vi.fn()
    const valueTest = vi.fn()
    const previousValueTest = vi.fn()
    const cleanup = vi.fn()

    reduxSelectorSideEffect(
      (state: State) => state.foo,
      (value, previousValue, dispatch, getState) => {
        valueTest(value)
        previousValueTest(previousValue)
        getState()
        dispatch({ type: '' })

        return cleanup
      },
    )

    runSelectorSideEffects({
      dispatch,
      getState: () => createState({ foo: 'bar' }),
    })

    expect(dispatch).toHaveBeenCalled()
    expect(valueTest).toHaveBeenLastCalledWith('bar')
    expect(previousValueTest).toHaveBeenLastCalledWith(undefined)
    expect(cleanup).not.toHaveBeenCalled()

    runSelectorSideEffects({
      dispatch,
      getState: () => createState({ foo: 'updated' }),
    })

    expect(valueTest).toHaveBeenLastCalledWith('updated')
    expect(previousValueTest).toHaveBeenLastCalledWith('bar')
    expect(cleanup).toHaveBeenCalled()
  })
})
