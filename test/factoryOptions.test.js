// @flow
import createFactory from '../src/factory';
const injectReducer = jest.fn();
const factory = createFactory(injectReducer);

describe('factoryOptions', () => {
  describe('update', () => {
    const update = (data: ?{ [string]: string }, id, value) => ({
      ...(data || {}),
      [id]: value,
    });
    const name = 'CACHE_TEST';

    const getInStore = x => x;
    const { actions, getters } = factory({
      name,
      update,
      getInStore,
    });

    describe('thunks', () => {
      describe('update', () => {
        it('works', () => {
          const dispatch = jest.fn();
          const getState = jest.fn().mockReturnValue(getters.getInitialState());
          const asyncThunk = actions.update('key_1', 'val_1');

          return asyncThunk(dispatch, getState).then(() => {
            expect(dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                type: expect.stringContaining('update'),
                payload: expect.objectContaining({
                  key_1: 'val_1',
                }),
              })
            );
          });
        });
      });

      describe('load', () => {
        it('does nothing as it was not defined', () => {
          const dispatch = jest.fn();
          const getState = jest.fn().mockReturnValue(getters.getInitialState());
          const asyncThunk = actions.load();

          return asyncThunk(dispatch, getState).then(() => {
            expect(dispatch).not.toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe('loadOnlyOnce', () => {
    const load = jest.fn().mockResolvedValue(5);
    const name = 'LOAD_ONCE_TEST';

    const getInStore = x => x;
    const {
      actions,
      subreducer,
      getters,
    } = factory({
      name,
      load,
      getInStore,
      loadOnlyOnce: true,
    });

    describe('thunks', () => {
      describe('load', () => {
        beforeEach(() => {
          load.mockClear();
        });

        it('loads value on first call', () => {
          const dispatch = jest.fn();
          const getState = jest.fn().mockReturnValue(getters.getInitialState());
          const asyncThunk = actions.load();

          return asyncThunk(dispatch, getState).then(() => {
            expect(dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                type: expect.stringContaining('update'),
                payload: 5,
              })
            );
          });
        });

        it('does not load after having been loaded', () => {
          const dispatch = jest.fn();
          const getState = jest.fn().mockReturnValue({
            data: 0,
            meta: { loaded: true },
          });
          const asyncThunk = actions.load();

          return asyncThunk(dispatch, getState).then(() => {
            expect(dispatch).not.toHaveBeenCalled();
          });
        });

        it('loads after resetting the values', () => {
          const dispatch = jest.fn();
          const asyncThunk = actions.load();

          const state = getters.getInitialState();
          state.data = 0;
          state.meta.loaded = true;

          const stateAfterLoadAndReset = subreducer(state, actions.reset());
          const getState = jest.fn().mockReturnValue(stateAfterLoadAndReset);

          return asyncThunk(dispatch, getState).then(() => {
            expect(dispatch).toHaveBeenCalledWith(
              expect.objectContaining({
                type: expect.stringContaining('update'),
              })
            );
          });
        });
      });
    });
  });

  describe('partialReducer', () => {
    describe('on initial creation', () => {
      const load = jest.fn().mockResolvedValue(5);
      const name = 'PARTIAL_REDUCER_TEST';

      const getInStore = x => x;
      const partialReducer = (state: *, action) => {
        if (action.type === 'LOGOUT') {
          return {
            ...state,
            data: null,
          };
        }
        return state;
      };

      const {
        subreducer,
        getters,
      } = factory({
        name,
        load,
        partialReducer,
        getInStore,
        loadOnlyOnce: true,
      });

      it('updates data on recieving action in partialReducer', () => {
        const state = getters.getInitialState();
        state.data = 'Fancy Data';

        expect(subreducer(state, { type: 'LOGOUT' })).toMatchObject({
          data: null,
        });
      });
    });
  });
});

