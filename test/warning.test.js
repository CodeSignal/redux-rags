// @flow
const consolespy = jest.spyOn(console, 'error');

import warning from '../src/utils/warning';

describe('warning', () => {
  it('calls console error when it exists', () => {
    warning('warning test');
    expect(consolespy).toHaveBeenCalledTimes(1);
  });
});
