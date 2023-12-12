function identityPayloadCreator<T>() {
  return (payload: T) => payload
}

export default identityPayloadCreator
