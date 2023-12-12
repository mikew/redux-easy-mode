import type { Action } from 'redux'

// Only copying this so we don't have an actual dependency on redux.
// https://github.com/reduxjs/redux/blob/4bdb8aca102f6982b156e1942e200fdc88022eba/src/utils/isAction.ts
export default function isAction(action: unknown): action is Action<string> {
  return (
    action != null &&
    typeof action === 'object' &&
    'type' in action &&
    typeof action.type === 'string'
  )
}
