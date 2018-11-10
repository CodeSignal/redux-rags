// @flow
import { type Dispatch } from 'redux';

export type BoilerState<T> = {
  data: ?T,
  meta: {
    loading: boolean,
    loaded: boolean,
    changeCount: number,
    lastChangeTime: ?number,
    errors?: *,
  },
};

/** A redux-boilerplate maker.
* This generator creates a subreducer and actions, and wires them up for you.
* TL:DR: ({ fetchData }) => ({ actions: { load }, getters: { getData } })


** Basic Example:
* Use `load` in `mapDispatchToProps` to have an action to call, same arguments as `fetchData`.
* `getData` selects the data out of the redux store for you, just pass the store in.
```js
const { actions: { load }, getters: { getData } } =
  makeReduxBoilerplate({ fetchData: Function })
```


** Simple Example:
* Give a descriptive name and a loading function. Get back a loading action, and a getter.
* You'll find the information under the `factories` subreducer in redux.
```js
const {actions: {load}, getData} = generator({name: 'MY_DATA', fetchData: Function})
```


** Example:
* Placing the factories subreducer somewhere else in the store, in this case taking `subreducer` and
* adding it to the `combineSubreducers` function in the `currentUser` subreducer. (But you can place
* it wherever you want, just update the `getInStore` function.
```js
import { generator };
const { actions, subreducer, get, getData, getMeta } = generator({
  name: 'MY_DATA',
  fetchData: (param) => methodService.run('fetchSomething', param),
  getInStore: (store) => store && store.currentUser && store.currentUser.my_data
});
```

* Connect subreducer to your desired location in the redux store, and tell the generator
*   where you put it. Getters are also factories for you. If you don't care where the
*   subreducer lives, don't pass in a `getInStore` method and the generator will place it
*   for you.
*
* Configuration Parameters
* @param name - String that identifies the data
* @param fetchData - An async method that loads data, any params will be the params of `actions.load` in the return.
* @param partialReducer - Extend the reducer and listen to other actions, for example
*     you can could clear the data on user logout. Write this like a reducer to extend the functionality of the
*     generated boilerplate. You can also delay assignment if you want to utilize actions in the returned
*     Actions object, just assign the function to `subreducer.partialReducer`.
* @param getInitialState - Function to create initial data, will use null if not defined.
* @param loadOnlyOnce - Prevent the `load` function from being called more than once.
* @param getInStore - Function to locate the subreducer in the store. Will place in default location
*     if not specified, otherwise will use this location in getters.
* */

type Reducer<T> = (state?: BoilerState<T>, action: *) => BoilerState<T>;
type PartialReducer<T> = (state: BoilerState<T>, action: *) => BoilerState<T>;

type ConfigType<T, G> = {
  name?: string,
  fetchData?: (...args: G) => T | Promise<T>,
  partialReducer?: PartialReducer<T>,
  update?: (data: ?T, *) => ?T | Promise<?T>,
  getInStore?: (store: Object) => BoilerState<T>,
  getInitialState?: () => T,
  // Options
  loadOnlyOnce?: ?boolean,
};

type ReturnType<T, G: Array<mixed>> = {
  actions: * & {
    reset: () => *,
    errors: (*) => *,
    clearErrors: () => *,
    load: (...args: G) => *,
    updateData: (?T) => *,
    update: (*) => *,
    beginLoading: () => *,
    endLoading: () => *,
  },
  subreducer: {
    partialReducer?: PartialReducer<T>,
    subreduce: Reducer<T>,
  },
  getters: * & {
    get: Object => BoilerState<T>,
    getData: Object => $PropertyType<BoilerState<T>, 'data'>,
    getMeta: Object => $PropertyType<BoilerState<T>, 'meta'>,
  },
};

let generatedCount = 0;
const prefix = '@@redux-rags';
type LoadingEnum = 'loading';
type EndLoadingEnum = 'endLoading';
type ErrorsEnum = 'errors';
type UpdateEnum = 'update';
type ResetEnum = 'reset';
const getLoadingType = (name): LoadingEnum =>
  (`${prefix}/${generatedCount}/${name}: begin loading`: any);
const getEndLoadingType = (name): EndLoadingEnum =>
  (`${prefix}/${generatedCount}/${name}: end loading`: any);
const getErrorsType = (name): ErrorsEnum => (`${prefix}/${generatedCount}/${name}: errors`: any);
const getUpdateType = (name): UpdateEnum => (`${prefix}/${generatedCount}/${name}: update`: any);
const getResetType = (name): ResetEnum => (`${prefix}/${generatedCount}/${name}: reset`: any);

export const createGetInitialState = (getInitialState: *) => (): BoilerState<any> => ({
  data: typeof getInitialState === 'function' ? getInitialState() : null,
  meta: {
    loaded: false,
    changeCount: 0,
    loading: false,
    lastChangeTime: null,
    errors: null,
  },
});

const createFactory = (injectReducer: Function) => <T, G: Array<mixed>>(config: ConfigType<T, G>): ReturnType<T, G> => {
  const {
    name = '',
    fetchData,
    getInStore,
    loadOnlyOnce,
    getInitialState,
    update,
    partialReducer,
  } = config;
  generatedCount += 1;

  const safeDataName = `${name}_${generatedCount}`;

  class Getters {
    static getInitialState: () => BoilerState<T> = createGetInitialState(getInitialState);

    static get =
      getInStore ||
      ((reduxStore: Object): BoilerState<T> =>
        reduxStore.generated[safeDataName] || Getters.getInitialState());

    static getData = (reduxStore: Object): $PropertyType<BoilerState<T>, 'data'> => {
      const state = Getters.get(reduxStore);
      if (!state.hasOwnProperty('data')) {
        throw new Error(`makeReduxBoilerplate: getData failed to find the property \'data\' on the object returned by Getters.get.
        This is likely caused by providing an incorrect 'getInStore' configuration option.`);
      }
      return state.data;
    };

    static getMeta = (reduxStore: Object): $PropertyType<BoilerState<T>, 'meta'> => {
      const state = Getters.get(reduxStore);
      if (!state.hasOwnProperty('meta')) {
        throw new Error(`makeReduxBoilerplate: getData failed to find the property \'meta\' on the object returned by Getters.get.
        This is likely caused by providing an incorrect 'getInStore' configuration option.`);
      }
      return state.meta;
    };

    static getIsLoading = (reduxStore: Object) => {
      const meta = Getters.getMeta(reduxStore);
      return meta && meta.loading;
    };
  }

  const BEGIN_LOADING = getLoadingType(name);
  const END_LOADING = getEndLoadingType(name);
  const ERRORS = getErrorsType(name);
  const UPDATE_DATA = getUpdateType(name);
  const RESET = getResetType(name);

  class Actions {
    static beginLoading = () => ({
      type: BEGIN_LOADING,
      payload: null,
    });

    static endLoading = () => ({
      type: END_LOADING,
      payload: null,
    });

    static reset = () => ({
      type: RESET,
      payload: null,
    });

    static errors = (errors: Object | String) => ({
      type: ERRORS,
      payload: errors,
    });

    static clearErrors = () => ({
      type: ERRORS,
      payload: null,
    });

    static updateData = (data: ?T) => ({
      type: UPDATE_DATA,
      payload: data,
    });

    static update = (...args: *) => async (dispatch, getState: () => Object) => {
      if (!update || typeof update !== 'function') {
        return;
      }
      try {
        const manipulated = await Promise.resolve(update(Getters.getData(getState()), ...args));
        dispatch(Actions.updateData(manipulated));
      } catch (err) {
        dispatch(Actions.errors(err));
      }
    };

    static load = (...args: G) => async (
      dispatch: Dispatch,
      getState: () => Object
    ): Promise<?T> => {
      if (!fetchData) {
        return null;
      }
      if (loadOnlyOnce) {
        const state = Getters.get(getState());
        if (state && state.meta.loaded) {
          return state.data;
        }
      }
      dispatch(Actions.beginLoading());
      try {
        const data = await Promise.resolve(fetchData(...args));
        dispatch(Actions.updateData(data));
        return data;
      } catch (err) {
        dispatch(Actions.errors(err));
        return null;
      } finally {
        dispatch(Actions.endLoading());
      }
    };
  }

  type Interpret = <R>((...Iterable<any>) => R) => R;
  type ExtractReturn<Fn> = $Call<Interpret, Fn>;

  type GeneratedAction =
    | ExtractReturn<typeof Actions.beginLoading>
    | ExtractReturn<typeof Actions.errors>
    | ExtractReturn<typeof Actions.clearErrors>
    | ExtractReturn<typeof Actions.updateData>
    | ExtractReturn<typeof Actions.endLoading>;

  class Subreducer {
    static partialReducer = partialReducer;

    static subreduce = (
      state?: BoilerState<T> = Getters.getInitialState(),
      action?: GeneratedAction | * // Support other action types
    ) => {
      if (!action || typeof action !== 'object' || !action.type) {
        return state;
      }
      switch (action.type) {
        case BEGIN_LOADING:
          return { ...state, meta: { ...state.meta, loading: true } };
        case END_LOADING:
          return { ...state, meta: { ...state.meta, loading: false } };
        case ERRORS:
          return { ...state, meta: { ...state.meta, errors: action.payload } };
        case UPDATE_DATA:
          return {
            ...state,
            data: action.payload,
            meta: {
              ...state.meta,
              loading: false,
              loaded: true,
              changeCount: state.meta.changeCount + 1,
              lastChangeTime: Date.now(),
              errors: null,
            },
          };
        case RESET:
          return (Getters.getInitialState(): BoilerState<T>);
        default:
          if (typeof Subreducer.partialReducer === 'function') {
            return {
              ...state,
              ...(Subreducer.partialReducer(state, action) || {}),
            };
          }
          return state;
      }
    };
  }

  if (!getInStore) {
    injectReducer(['generated', safeDataName], Subreducer.subreduce);
  }

  return {
    actions: Actions,
    subreducer: Subreducer,
    getters: Getters,
  };
};

export default createFactory;

