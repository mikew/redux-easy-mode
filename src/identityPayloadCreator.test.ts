import identityPayloadCreator from './identityPayloadCreator'

describe('identityPayloadCreator', () => {
  it('has one argument which is typed and returned', () => {
    const payloadCreator = identityPayloadCreator<number>()
    const payload = payloadCreator(12)

    expect(typeof payload).toBe('number')
    expect(payload).toBe(12)
  })
})
