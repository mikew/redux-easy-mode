type ReduxPayloadCreator = (...args: any[]) => any

type ReduxPayloadCreatorMap = Record<string, ReduxPayloadCreator>

export type ReduxActionCreatorMap<
  Namespace extends string,
  PayloadCreatorMap extends ReduxPayloadCreatorMap,
> = {
  [ActionType in keyof PayloadCreatorMap]: ActionType extends string
    ? ReduxActionCreator<Namespace, ActionType, PayloadCreatorMap[ActionType]>
    : undefined
}

// Provide defaults for types in here cause it's used a few places and subbing
// in the defaults is long and repetitive.
export interface ReduxActionCreator<
  Namespace extends string = string,
  ActionType extends string = string,
  PayloadCreator extends ReduxPayloadCreator = ReduxPayloadCreator,
> {
  (...args: Parameters<PayloadCreator>): {
    type: `${Namespace}/${ActionType}`
  } & PayloadAndMeta<PayloadCreator>
  actionConstant: `${Namespace}/${ActionType}`
}

type PayloadAndMeta<
  PayloadCreator extends ReduxPayloadCreator,
  Rt = ReturnType<PayloadCreator>,
> = Rt extends {
  type?: string
  payload?: any
  meta?: any
}
  ? Rt
  : { payload: Rt }

function createActions<
  Namespace extends string,
  PayloadCreatorMap extends ReduxPayloadCreatorMap,
>(namespace: Namespace, payloadCreatorMap: PayloadCreatorMap) {
  // We have to use casting _somewhere_ with this variable. The types rely
  // heavily on inference, and there's no way an empty object will be assignable
  // to ReduxActionCreatorMap.
  const actionCreators = {} as ReduxActionCreatorMap<
    Namespace,
    PayloadCreatorMap
  >

  for (const key in payloadCreatorMap) {
    actionCreators[key] = ((...args: any[]) => {
      const payloadOrObject = payloadCreatorMap[key](...args)

      const action: { type: string; payload?: unknown; meta?: unknown } = {
        type: `${namespace}/${key}`,
        payload: payloadOrObject,
      }

      // If the payload is an object with a payload property, use that for the
      // payload. Also allow the user to override the type and set some meta.
      if (payloadOrObject?.payload != null) {
        action.type = payloadOrObject?.type ?? `${namespace}/${key}`
        action.payload = payloadOrObject?.payload ?? payloadOrObject
        action.meta = payloadOrObject?.meta ?? undefined
      }

      return action

      // Need to cast here because there's no way to assign a function + extra
      // attributes in one go.
    }) as any

    actionCreators[key].actionConstant = `${namespace}/${key}`
  }

  return actionCreators
}

export default createActions
