import testActions from './test/testActions'
import testReducer from './test/testReducer'

describe('createReducer', () => {
  it('uses a builder pattern', () => {
    let state = testReducer(undefined, { type: '' })

    state = testReducer(state, testActions.simplePayload())
    expect(state).toEqual(expect.objectContaining({ simplePayload: 'simple' }))

    state = testReducer(state, testActions.complexPayload(42, 'foo'))
    expect(state).toEqual(
      expect.objectContaining({
        complexPayload: {
          arg1: 42,
          arg2: 'foo',
        },
      }),
    )

    state = testReducer(state, testActions.specialProperties(42, 'foo'))
    expect(state).toEqual(
      expect.objectContaining({
        specialProperties: {
          arg1: 42,
          arg2: 'foo',
        },
      }),
    )
  })
})
