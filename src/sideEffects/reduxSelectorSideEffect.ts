import type { Dispatch, MiddlewareAPI } from 'redux'

interface ReduxSelectorSideEffectHandler<T> {
  (
    value: T,
    previousValue: T | undefined,
    dispatch: Dispatch,
    // Setting this to `unknown` makes it hard for people to just specify their
    // own `getState` type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
    getState: () => any,
  ): void | (() => void)
}

interface Comparator<T> {
  (a: T, b: T): boolean
}

const selectorSideEffects: {
  // It's either `any` here, or "could be instantiated with an arbitrary type
  // which could be unrelated to 'unknown'" // below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  handler: ReduxSelectorSideEffectHandler<any>
  previousValue: unknown
  // It's either `any` here, or "could be instantiated with an arbitrary type
  // which could be unrelated to 'unknown'" // below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  compare: Comparator<any>
  selector: (state: unknown) => unknown
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
    previousValue: undefined,
    compare: comparator ? comparator : (a, b) => a === b,
  })
}

export default reduxSelectorSideEffect

export function runSelectorSideEffects(store: MiddlewareAPI) {
  if (selectorSideEffects.length === 0) {
    return
  }

  const state = store.getState()

  for (const sideEffect of selectorSideEffects) {
    const newValue = sideEffect.selector(state)

    if (!sideEffect.compare(sideEffect.previousValue, newValue)) {
      try {
        sideEffect.cleanup?.()
      } catch (err) {
        console.error(err)
      }

      // Pull out the previousValue since we intentionally overwrite it ASAP.
      const { previousValue } = sideEffect
      sideEffect.previousValue = newValue

      const maybeCleanupFunction = sideEffect.handler(
        newValue,
        previousValue,
        store.dispatch,
        store.getState,
      )

      sideEffect.cleanup = maybeCleanupFunction
    }
  }
}
