// @flow
import createFactory from '../src/factory';
const injectReducer = jest.fn();
const factory = createFactory(injectReducer);

describe('factory-simple', () => {
  const loadNumber = jest.fn().mockReturnValue(10);

  const name = 'TEST_DATA';
  const getInStore = x => x;
  const {
    actions,
    subreducer: { subreduce },
    getters,
  } = factory({
    name,
    fetchData: loadNumber,
    getInStore,
  });

  describe('getters', () => {
    describe('get', () => {
      it('is the same function as getInStore', () => {
        expect(getters.get).toBe(getInStore);
      });
    });

    describe('getData', () => {
      it('extracts the data field', () => {
        const mockStore = { data: {}, meta: {} };
        expect(getters.getData(mockStore)).toBe(mockStore.data);
      });
    });

    describe('getMeta', () => {
      it('extracts the meta field', () => {
        const mockStore = { data: {}, meta: {} };
        expect(getters.getMeta(mockStore)).toBe(mockStore.meta);
      });
    });

    describe('getInitialState', () => {
      it('returns object with data and meta', () => {
        const state = getters.getInitialState();
        expect(typeof state).toEqual('object');
        expect(state).toHaveProperty('data');
        expect(state).toHaveProperty('meta');
      });

      it('returns meta with sensible defaults', () => {
        const meta = getters.getInitialState().meta;
        expect(meta.loaded).toBeFalsy();
        expect(meta.changeCount).toBe(0);
        expect(meta.loading).toBeFalsy();
        expect(meta.lastChangeTime).toBeFalsy();
        expect(meta.errors).toBeFalsy();
      });
    });
  });

  describe('actions', () => {
    describe('beginLoading', () => {
      it('is a valid action', () => {
        const action = actions.beginLoading();
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('BEGIN_LOADING'));
        expect(action.type).toEqual(expect.stringContaining(name));
      });
    });

    describe('endLoading', () => {
      it('is a valid action', () => {
        const action = actions.endLoading();
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('END_LOADING'));
        expect(action.type).toEqual(expect.stringContaining(name));
      });
    });

    describe('reset', () => {
      it('is a valid action', () => {
        const action = actions.reset();
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('RESET'));
        expect(action.type).toEqual(expect.stringContaining(name));
      });
    });

    describe('errors', () => {
      it('is a valid action', () => {
        const action = actions.errors('bad things happened');
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('ERROR'));
        expect(action.type).toEqual(expect.stringContaining(name));

        expect(action).toHaveProperty('payload');
        expect(action.payload).toEqual(expect.stringContaining('bad things'));
      });
    });

    describe('clearErrors', () => {
      it('is a valid action', () => {
        const action = actions.clearErrors();
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('ERROR'));
        expect(action.type).toEqual(expect.stringContaining(name));

        expect(action).toHaveProperty('payload');
        expect(action.payload).toEqual(null);
      });
    });

    describe('updateData', () => {
      it('is a valid action', () => {
        const action = actions.updateData('string data');
        expect(action).toHaveProperty('type');
        expect(action.type).toEqual(expect.stringContaining('UPDATE'));
        expect(action.type).toEqual(expect.stringContaining(name));

        expect(action).toHaveProperty('payload');
        expect(action.payload).toEqual('string data');
      });
    });
  });

  describe('thunks', () => {
    describe('update', () => {
      it('does nothing since it was not defined', () => {
        const dispatch = jest.fn();
        const getState = jest.fn().mockReturnValue(getters.getInitialState());
        const asyncThunk = actions.update();

        return asyncThunk(dispatch, getState).then(() => {
          expect(dispatch).not.toHaveBeenCalled();
        });
      });
    });

    describe('load', () => {
      it('works', () => {
        const dispatch = jest.fn();
        const getState = jest.fn().mockReturnValue(getters.getInitialState());
        const asyncThunk = actions.load();

        return asyncThunk(dispatch, getState).then(() => {
          expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
              type: expect.stringContaining('BEGIN_LOADING'),
            })
          );
          expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
              type: expect.stringContaining('UPDATE'),
            })
          );
          expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
              type: expect.stringContaining('END_LOADING'),
            })
          );
          expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({
              type: expect.stringContaining('ERRORS'),
            })
          );
        });
      });
    });
  });

  describe('subreducer', () => {
    const mockState = getters.getInitialState();
    const mockStateFilled = {
      data: 'special data',
      meta: {
        loading: false,
        loaded: true,
        lastChangeTime: 1,
        changeCount: 2,
        errors: 'could not load twice',
      },
    };

    it('returns correct initial state on no-op action', () => {
      const state = subreduce();
      expect(state).toEqual(mockState);
    });

    it('updates loading with begin load action', () => {
      expect(subreduce(mockState, actions.beginLoading())).toMatchObject({
        meta: {
          loading: true,
        },
      });
      expect(subreduce(mockStateFilled, actions.beginLoading())).toMatchObject({
        meta: {
          loading: true,
        },
      });
    });

    it('updates loading with end load action', () => {
      expect(subreduce(mockState, actions.endLoading())).toMatchObject({
        meta: {
          loading: false,
        },
      });
      expect(subreduce(mockStateFilled, actions.endLoading())).toMatchObject({
        meta: {
          loading: false,
        },
      });
    });

    it('updates errors with errors action', () => {
      expect(subreduce(mockState, actions.errors('error value'))).toMatchObject({
        meta: {
          errors: 'error value',
        },
      });

      expect(subreduce(mockStateFilled, actions.errors('error value'))).toMatchObject({
        meta: {
          errors: 'error value',
        },
      });
    });

    it('clears errors with clearErrors action', () => {
      expect(subreduce(mockState, actions.clearErrors())).toMatchObject({
        meta: {
          errors: null,
        },
      });

      expect(subreduce(mockStateFilled, actions.clearErrors())).toMatchObject({
        meta: {
          errors: null,
        },
      });
    });

    it('resets state on reset action', () => {
      const initialState = getters.getInitialState();
      expect(subreduce(mockState, actions.reset())).toMatchObject(initialState);

      expect(subreduce(mockStateFilled, actions.reset())).toMatchObject(initialState);
    });

    it('updates data field with update action', () => {
      expect(subreduce(mockState, actions.updateData(10))).toMatchObject({
        data: 10,
        meta: {
          loaded: true,
          changeCount: 1,
          errors: null,
        },
      });
    });
  });
});

