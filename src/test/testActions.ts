import createActions from '../createActions'
import identityPayloadCreator from '../identityPayloadCreator'

const testActions = createActions('test', {
  noPayload: () => undefined,
  simplePayload: () => 'simple',
  identityPayload: identityPayloadCreator<string>(),
  complexPayload: (arg1: number, arg2: string) => ({ arg1, arg2 }),
  specialProperties: (arg1: number, arg2: string) => ({
    payload: { arg1, arg2 },
    meta: { arg1: `meta ${arg1}`, arg2: `meta ${arg2}` },
  }),
  overriddenActionType: () => ({
    type: 'totally overridden',
    payload: '',
  }),

  functionPayload: () => () => 42,
  promisePayload: () => Promise.resolve('promise'),
  asyncPayload: async () => 'async',
})

export default testActions
