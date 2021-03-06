// @flow
import warning from './utils/warning';
import { Dispatch } from 'redux';

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


type Reducer<T> = (state?: BoilerState<T>, action: *) => BoilerState<T>;
type PartialReducer<T> = (state: BoilerState<T>, action: *) => BoilerState<T>;

type ConfigType<T, G> = {
  name?: string,
  load?: (...args: G) => T | Promise<T>,
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
  subreducer: Reducer<T>,
  getters: * & {
    get: Object => BoilerState<T>,
    getData: Object => $PropertyType<BoilerState<T>, 'data'>,
    getMeta: Object => $PropertyType<BoilerState<T>, 'meta'>,
  },
};

type FactoryMapGetter<T, G> = ConfigType<T, G> => ReturnType<T, G>;

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

export const createGetInitialState = (getInitialState: ?() => mixed): () => BoilerState<any> => (): BoilerState<any> => ({
  data: typeof getInitialState === 'function' ? getInitialState() : null,
  meta: {
    loaded: false,
    changeCount: 0,
    loading: false,
    lastChangeTime: null,
    errors: null,
  },
});

const createFactory = <T, G: Array<mixed>>(injectReducer: Function): FactoryMapGetter<T, G> => (config: ConfigType<T, G>): ReturnType<T, G> => {
  const {
    name = '',
    load,
    loadOnlyOnce,
    getInStore,
    getInitialState,
    update,
    partialReducer,
  } = config;
  generatedCount += 1;

  const safeDataName = `${name}/${generatedCount}`;
  const wrappedGetInitialState: () => BoilerState<T> = createGetInitialState(getInitialState);
  class Getters {
    static getInitialState  = wrappedGetInitialState;

    static get = getInStore ||
      ((reduxStore: Object): BoilerState<T> =>
        reduxStore[prefix][safeDataName] || Getters.getInitialState());

    static getData = (reduxStore: Object): $PropertyType<BoilerState<T>, 'data'> => {
      const state = Getters.get(reduxStore);
      if (!state.hasOwnProperty('data')) {
        warning(`redux-rags: getData failed to find the property 'data' on the object returned by Getters.get.
        This is likely caused by providing an incorrect 'getInStore' configuration option.`);
      }
      return state.data;
    };

    static getMeta = (reduxStore: Object): $PropertyType<BoilerState<T>, 'meta'> => {
      const state = Getters.get(reduxStore);
      if (!state.hasOwnProperty('meta')) {
        warning(`redux-rags: getData failed to find the property 'meta' on the object returned by Getters.get.
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

    static errors = (errors: T) => ({
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
      dispatch: typeof Dispatch,
      getState: () => Object
    ): Promise<?T> => {
      if (!load) {
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
        const data = await Promise.resolve(load(...args));
        dispatch(Actions.updateData(data));
        return data;
      } catch (err) {
        dispatch(Actions.errors(err));
        dispatch(Actions.endLoading());
        return null;
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
          return { ...state, meta: { ...state.meta, loading: true, } };
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
            }
          };
        case RESET:
          return (Getters.getInitialState(): BoilerState<T>);
        default:
          if (typeof Subreducer.partialReducer === 'function') {
            return { ...state, ...(Subreducer.partialReducer(state, action) || {}) };
          }
          return state;
      }
    };
  }

  if (!getInStore) {
    injectReducer([prefix, safeDataName], Subreducer.subreduce);
  }

  return {
    actions: Actions,
    subreducer: Subreducer.subreduce,
    getters: Getters,
  };
};

export default createFactory;

