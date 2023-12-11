import type { Action } from 'redux'

// Only copying this so we don't have an actual dependency on redux.
// https://github.com/reduxjs/redux/blob/4bdb8aca102f6982b156e1942e200fdc88022eba/src/utils/isAction.ts
export default function isAction(action: unknown): action is Action<string> {
  return (
    isPlainObject(action) && 'type' in action && typeof action.type === 'string'
  )
}

export function isPlainObject(obj: unknown): obj is object {
  if (typeof obj !== 'object' || obj == null) {
    return false
  }

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return (
    Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null
  )
}
