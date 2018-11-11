// @flow
jest.mock('../src/utils/warning');
import warning from '../src/utils/warning';
import noConfigurationWarning from '../src/utils/noConfigurationWarning';

describe('noConfigurationWarning', () => {
  let _NODE_ENV = null;

  beforeAll(() => {
    _NODE_ENV = process.env.NODE_ENV;
  });

  beforeEach(() => {
    // $FlowFixMe : Flow doesn't understand jest module mocks.
    warning.mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = _NODE_ENV;
  });

  it('calls warning when env is not production', () => {
    process.env.NODE_ENV = 'develop';
    noConfigurationWarning();
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('does not call warning if env is production', () => {
    process.env.NODE_ENV = 'production';
    noConfigurationWarning();
    expect(warning).toHaveBeenCalledTimes(0);
  });
});
