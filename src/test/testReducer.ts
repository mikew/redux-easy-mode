import createReducer from '../createReducer'

import testActions from './testActions'

const initialState = {
  simplePayload: '',
  complexPayload: {
    arg1: -1,
    arg2: '',
  },
  specialProperties: {
    arg1: -1,
    arg2: '',
  },

  start: '',
  success: '',
  error: '',
}

const testReducer = createReducer(initialState, (builder) => {
  builder
    .addHandler(testActions.simplePayload, (state, action) => ({
      ...state,
      simplePayload: action.payload,
    }))
    .addHandler(testActions.complexPayload, (state, action) => ({
      ...state,
      complexPayload: {
        arg1: action.payload.arg1,
        arg2: action.payload.arg2,
      },
    }))
    .addHandler(testActions.specialProperties, (state, action) => ({
      ...state,
      specialProperties: {
        arg1: action.payload.arg1,
        arg2: action.payload.arg2,
      },
    }))
    .addStartHandler(testActions.promisePayload, (state) => ({
      ...state,
      start: 'started',
    }))
    .addSuccessHandler(testActions.promisePayload, (state, action) => ({
      ...state,
      success: action.payload,
    }))
    .addErrorHandler(testActions.promisePayload, (state) => ({
      ...state,
      error: 'error',
    }))
})

export default testReducer
