import testActions from './test/testActions'

describe('createActions', () => {
  it('supports no arguments / payload', () => {
    expect(testActions.noPayload.actionConstant).toEqual('test/noPayload')
    expect(testActions.noPayload()).toEqual({
      type: 'test/noPayload',
      payload: undefined,
    })
  })

  it('supports returning a payload', () => {
    expect(testActions.simplePayload.actionConstant).toEqual(
      'test/simplePayload',
    )
    expect(testActions.simplePayload()).toEqual({
      type: 'test/simplePayload',
      payload: 'simple',
    })
  })

  it('supports any number of arguments', () => {
    expect(testActions.complexPayload.actionConstant).toEqual(
      'test/complexPayload',
    )
    expect(testActions.complexPayload(42, 'foo')).toEqual({
      type: 'test/complexPayload',
      payload: {
        arg1: 42,
        arg2: 'foo',
      },
    })
  })

  it('supports special properties like type, meta, and payload', () => {
    expect(testActions.specialProperties.actionConstant).toEqual(
      'test/specialProperties',
    )
    expect(testActions.specialProperties(42, 'foo')).toEqual({
      type: 'test/specialProperties',
      payload: {
        arg1: 42,
        arg2: 'foo',
      },
      meta: {
        arg1: 'meta 42',
        arg2: 'meta foo',
      },
    })

    expect(testActions.overriddenActionConstant.actionConstant).toEqual(
      'test/overriddenActionConstant',
    )
    expect(testActions.overriddenActionConstant()).toEqual({
      type: 'totally overridden',
      payload: '',
    })
  })
})
