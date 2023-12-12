import type { Dispatch } from 'redux'

import {
  clearActionHistory,
  createWithMiddleware,
  getActionHistory,
} from '../test/testStore'

import type { ActionErrorType, ActionSuccessType } from './asyncMiddleware'
import {
  errorActionType,
  startActionType,
  successActionType,
} from './asyncMiddleware'

describe('asyncMiddleware', () => {
  beforeEach(clearActionHistory)

  it('works when action is null', () => {
    const store = createWithMiddleware((state) => state)

    // Intentionally testing incorrect code.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- see above
    store.dispatch(null as any)
    // Intentionally testing incorrect code.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- see above
    store.dispatch(undefined as any)
    // Intentionally testing incorrect code.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- see above
    store.dispatch(0 as any)
  })

  describe('Success', () => {
    it('Works with function payload', async () => {
      const store = createWithMiddleware((state) => state)

      const result = await store.dispatch({
        type: 'foo',
        payload(dispatch: Dispatch) {
          dispatch({ type: 'OMG' })

          return 'foo'
        },
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(3)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: 'OMG',
      })
      expect(actionHistory[2]).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
      expect(result).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
    })

    it('Works with a regular payload', async () => {
      const store = createWithMiddleware((state) => state)

      const result = await store.dispatch({ type: 'OMG' })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(1)
      expect(actionHistory[0]).toEqual({
        type: 'OMG',
      })
      expect(result).toEqual({
        type: 'OMG',
      })
    })

    it('Works with a promise payload', async () => {
      const store = createWithMiddleware((state) => state)

      const result = await store.dispatch({
        type: 'foo',
        payload: Promise.resolve('foo'),
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(2)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
      expect(result).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
    })

    it('Works with an async function', async () => {
      const store = createWithMiddleware((state) => state)

      const result = await store.dispatch({
        type: 'foo',
        async payload(dispatch: Dispatch) {
          const payload = await Promise.resolve(42)
          dispatch({ payload, type: 'OMG' })

          return 'foo'
        },
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(3)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: 'OMG',
        payload: 42,
      })
      expect(actionHistory[2]).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
      expect(result).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
        meta: undefined,
      })
    })

    it('Can skip start / success actions', async () => {
      const store = createWithMiddleware((state) => state)

      const result = await store.dispatch({
        type: 'foo',
        async payload(dispatch: Dispatch) {
          const payload = await Promise.resolve(42)
          dispatch({ payload, type: 'OMG' })

          return 'foo'
        },
        meta: {
          asyncPayload: {
            skipOuter: true,
          },
        },
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(1)
      expect(actionHistory[0]).toEqual({
        type: 'OMG',
        payload: 42,
      })
      expect(result).toEqual('foo')
    })
  })

  describe('Error', () => {
    it('Works with function payload', async () => {
      const store = createWithMiddleware((state) => state)

      await store.dispatch({
        type: 'foo',
        payload(dispatch: Dispatch) {
          dispatch({ type: 'OMG' })
          throw new Error('the error message')
        },
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(3)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: 'OMG',
      })
      expect(actionHistory[2]).toEqual({
        type: errorActionType('foo'),
        payload: 'the error message',
        error: true,
        meta: undefined,
      })
    })

    it('Works with a promise payload', async () => {
      const store = createWithMiddleware((state) => state)

      await store.dispatch({
        type: 'foo',
        payload: Promise.reject(new Error('the error message')),
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(2)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: errorActionType('foo'),
        payload: 'the error message',
        error: true,
        meta: undefined,
      })
    })

    it('Works with an async function', async () => {
      const store = createWithMiddleware((state) => state)

      await store.dispatch({
        type: 'foo',
        async payload(dispatch: Dispatch) {
          const result = await Promise.reject(new Error('the error message'))
          dispatch({ type: 'OMG', payload: result })

          return 'foo'
        },
      })

      const actionHistory = getActionHistory()

      expect(actionHistory).toHaveLength(2)
      expect(actionHistory[0]).toEqual({
        type: startActionType('foo'),
        error: undefined,
        meta: undefined,
      })
      expect(actionHistory[1]).toEqual({
        type: errorActionType('foo'),
        payload: 'the error message',
        error: true,
        meta: undefined,
      })
    })
  })

  describe('dispatch()', () => {
    it('can be cast to ActionSuccessType', async () => {
      const store = createWithMiddleware((state) => state)

      const action = () => ({
        type: 'foo',
        payload(dispatch: Dispatch) {
          dispatch({ type: 'OMG' })

          return 'foo'
        },
      })

      // TODO This means that users code has to do similar casting, maybe
      // there's a better way?
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see above
      const result = (await store.dispatch(
        action(),
      )) as unknown as ActionSuccessType<typeof action>

      expect(result).toEqual({
        type: successActionType('foo'),
        payload: 'foo',
        error: false,
      })
    })

    it('can be cast to ActionErrorType', async () => {
      const store = createWithMiddleware((state) => state)

      const action = () => ({
        type: 'foo',
        payload() {
          throw new Error()
        },
      })

      // TODO This means that users code has to do similar casting, maybe
      // there's a better way?
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see above
      const result = (await store.dispatch(
        action(),
      )) as unknown as ActionErrorType<typeof action>

      expect(result).toEqual({
        type: errorActionType('foo'),
        payload: 'Error',
        error: true,
      })
    })
  })
})
