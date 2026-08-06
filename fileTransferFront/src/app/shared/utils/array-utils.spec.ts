import { chunk } from './array-utils';

describe('chunk', () => {

  it('should split input array into groups of 3 items', () => {
    const length = 3;

    expect(chunk([1, 2], length)).toEqual([[1, 2]]);

    expect(chunk([1, 2, 3], length)).toEqual([[1, 2, 3]]);

    expect(chunk([1, 2, 3, 4], length)).toEqual([[1, 2, 3], [4]]);

    expect(chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], length)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11]]);
  });

});
