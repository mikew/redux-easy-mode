import { Dispatch, MiddlewareAPI } from 'redux'

interface ReduxSelectorSideEffectHandler<T> {
  (config: {
    value: T
    previousValue: T | typeof UNSET_PREVIOUS_VALUE
    dispatch: Dispatch
    getState: () => any
  }): void | (() => void)
}

interface Comparator<T> {
  (a: T, b: T): boolean
}

export const UNSET_PREVIOUS_VALUE = Symbol()

const selectorSideEffects: {
  handler: ReduxSelectorSideEffectHandler<any>
  previousValue: any
  compare: Comparator<any>
  selector: (state: any) => any
  cleanup?: void | (() => void)
}[] = []

function reduxSelectorSideEffect<
  Selector extends (...args: any[]) => void,
  Rt = ReturnType<Selector>,
>(
  selector: Selector,
  handler: ReduxSelectorSideEffectHandler<Rt>,
  comparator?: Comparator<Rt>,
) {
  selectorSideEffects.push({
    handler,
    selector,
    previousValue: UNSET_PREVIOUS_VALUE,
    compare: comparator ? comparator : (a, b) => a === b,
  })
}

export default reduxSelectorSideEffect

export function runSelectorSideEffects(store: MiddlewareAPI) {
  if (selectorSideEffects.length === 0) {
    return
  }

  const state = store.getState()

  for (const wut of selectorSideEffects) {
    const newValue = wut.selector(state)

    if (!wut.compare(wut.previousValue, newValue)) {
      try {
        wut.cleanup?.()
      } catch (err) {
        console.error(err)
      }

      // Pull out the previousValue since we intentionally overwrite it ASAP.
      const { previousValue } = wut
      wut.previousValue = newValue

      const maybeCleanupFunction = wut.handler({
        value: newValue,
        previousValue,
        dispatch: store.dispatch,
        getState: store.getState,
      })

      wut.cleanup = maybeCleanupFunction
    }
  }
}

// reduxSelectorSideEffect(
//   (state: any) => ({ foo: 'bar' }),
//   ({ value, previousValue }) => {
//     console.log(value, previousValue)
//   },
// )
