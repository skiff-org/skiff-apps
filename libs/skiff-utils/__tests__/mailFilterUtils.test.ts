import { isClientside } from '../src/mailFilterUtils';

describe('isClientside', () => {
  it('should return true if filter contains clientside criteria', () => {
    expect(
      isClientside({
        filterType: 'SUBJECT',
        subFilter: []
      })
    ).toBe(true);
    expect(
      isClientside({
        filterType: 'BODY',
        subFilter: []
      })
    ).toBe(true);
    expect(
      isClientside({
        filterType: 'AND',
        subFilter: [
          {
            filterType: 'SUBJECT',
            subFilter: []
          },
          {
            filterType: 'BODY',
            subFilter: []
          }
        ]
      })
    ).toBe(true);
  });
  it('should return false if the filter does not contain clientside criteria', () => {
    expect(isClientside({ filterType: 'TO', serializedData: 'test@test.com', subFilter: [] })).toBe(false);
    expect(
      isClientside({
        filterType: 'NOT',
        subFilter: [{ filterType: 'TO', serializedData: 'test@test.com', subFilter: [] }]
      })
    ).toBe(false);
  });
});
