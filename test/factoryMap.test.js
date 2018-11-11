// @flow
import createFactoryMap from '../src/factoryMap';
const injectReducer = jest.fn();
const factoryMap = createFactoryMap(injectReducer);

describe('factoryMap', () => {
  const loadNumber = jest.fn().mockReturnValue(10);

  const name = 'Test Data';
  let { actions, getters } = factoryMap({
    name,
    load: loadNumber,
  });

  beforeEach(() => {
    let freshMap = factoryMap({
      name,
      load: loadNumber,
    });
    actions = freshMap.actions;
    getters = freshMap.getters;
  });

  describe('getters', () => {
    describe('getWithArgs', () => {
      it('returns object with data and meta fields', () => {
        const obj = getters.getWithArgs('argument');
        expect(obj).toEqual(
          expect.objectContaining({
            data: null,
            meta: expect.any(Object),
          })
        );
      });
    });

    describe('getData', () => {
      it('returns null if nothing has been loaded', () => {
        const data = getters.getData('argument');
        expect(data).toBe(null);
      });
    });

    describe('getMeta', () => {
      it('returns object with loaded false when nothing has been loaded', () => {
        const meta = getters.getMeta('argument');
        expect(meta).toEqual(
          expect.objectContaining({
            loaded: false,
          })
        );
      });
    });

    describe('getIsLoading', () => {
      it('returns false if we did not call load', () => {
        expect(getters.getIsLoading('argument')).toBe(false);
      });
    });
  });

  describe('actions', () => {
    describe('load', () => {
      it('calls inject reducer on getting a new argument', () => {
        const thunk = actions.load('argument');
        thunk(jest.fn());
        expect(injectReducer).toHaveBeenCalledTimes(1);
      });

      it('does not inject reducer when receiving the same argument', () => {
        let thunk = actions.load('argument');
        thunk(jest.fn());
        expect(injectReducer).toHaveBeenCalled();
        // $FlowFixMe: Flow doesn't know this is a jest mock.
        injectReducer.mockClear();
        thunk = actions.load('argument');
        thunk(jest.fn());
        expect(injectReducer).not.toHaveBeenCalled();
      });
    });
  });
});

