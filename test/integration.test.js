// @flow

import { compose, combineReducers, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { combineAsyncReducers, configureRags, ragFactory, ragFactoryMap } from '../src/index';


describe('integration test', () => {
  // Initializing the redux store.
  const createRootReducer = (dynamicReducers: Object = { root: state => state ?? null }) => {
    dynamicReducers = combineAsyncReducers(combineReducers, dynamicReducers);

    return combineReducers(Object.assign({}, dynamicReducers, {
      // ... list your reducers below
    }));
  };

  const middleware = applyMiddleware(thunk);
  const store = createStore(createRootReducer(), compose(middleware));
  configureRags(store, createRootReducer);


  it('initializes store properly', () => {
    expect(store).toBeTruthy();
  });

  it('adds a reducer to state when calling factory load', async () => {
    const { actions, getters } = ragFactory({ name: 'basic-test', load: () => true });
    const state = store.getState();
    expect(state['@@redux-rags']).toBeTruthy();
    expect(getters.getData(state)).toBe(null);
    await store.dispatch(actions.load());
    const nextState = store.getState();
    expect(getters.getData(nextState)).toBe(true);
  });

  it('adds a reducer to state when calling factoryMap load', async () => {
    let i = 1;
    const { actions, getters } = ragFactoryMap({ getInitialState: () => 0, name: 'map-test', load: (negative) => negative ? -1 * i++ : i++ });
    const state = store.getState();
    expect(getters.getData(state, true)).toBe(0);
    expect(getters.getData(state, false)).toBe(0);

    await store.dispatch(actions.load(true));
    await store.dispatch(actions.load(false));
    const nextState = store.getState();
    expect(nextState['@@redux-rags/map']).toBeTruthy();
    expect(getters.getData(nextState, true)).toBe(-1);
    expect(getters.getData(nextState, false)).toBe(2);
  });
});
