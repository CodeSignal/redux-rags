// @flow
import createFactory, { createGetInitialState, type BoilerState } from './factory';

export type MapState<T> = { [string]: BoilerState<T> };

type ConfigType<T, G> = {
  name?: string,
  load?: (...args: G) => T | Promise<T>,
  getInitialState?: () => T,
};

type ReturnType<T, G: Array<mixed>> = {
  actions: * & {
    reset: () => *,
    clearErrors: () => *,
    load: (...args: G) => *,
  },
  getters: * & {
    get: Object => MapState<T>,
    getWithArgs: (store: Object, ...args: Array<mixed>) => BoilerState<T>,
    getData: (store: Object, ...args: Array<mixed>) => $PropertyType<BoilerState<T>, 'data'>,
    getMeta: (store: Object, ...args: Array<mixed>) => $PropertyType<BoilerState<T>, 'meta'>,
    getIsLoading: (
      store: Object,
      ...args: Array<mixed>
    ) => $PropertyType<$PropertyType<BoilerState<T>, 'meta'>, 'loading'>,
  },
};

const prefix = '@@redux-rags/map';

let generatedCount = 0;

const convertArgsToString = (...args) => JSON.stringify(args);

const createFactoryMap = (injectReducer: Function) => {
    const factory = createFactory(injectReducer);
    return <T, G: Array<mixed>>(config: ConfigType<T, G>): ReturnType<T, G> => {
      const { name = '', load, getInitialState } = config;
      generatedCount += 1;

      const safeDataName = `${name}/${generatedCount}`;
      const mapArgsToGenerated = {};
      const Getters = new function() {
        const _getInitialStateForKey: () => BoilerState<T> = createGetInitialState(getInitialState);

        this.get = (reduxStore: Object): MapState<T> =>
          reduxStore[prefix] && reduxStore[prefix][safeDataName];

        this.getWithArgs = (reduxStore, ...args) => {
          const argsKey = convertArgsToString(...args);
          const state = this.get(reduxStore);
          if (!state || !state.hasOwnProperty(argsKey)) {
            return _getInitialStateForKey();
          }
          return state[argsKey];
        };

        this.getData = (reduxStore, ...args) => this.getWithArgs(reduxStore, ...args).data;

        this.getMeta = (reduxStore, ...args) => this.getWithArgs(reduxStore, ...args).meta;

        this.getIsLoading = (reduxStore: Object, ...args) => {
          const meta = this.getMeta(reduxStore, ...args);
          return meta.loading;
        };
      };

      const Actions = new function() {
        const _queryOrCreateBoilerplate = (...args) => {
          const stringHash = convertArgsToString(...args);
          if (!mapArgsToGenerated[stringHash]) {
            // Need to generate everything for this. Luckily we have a generator
            const getOutOfStore: any = store => Getters.getWithArgs(store, ...args);
            mapArgsToGenerated[stringHash] = factory({
              name: safeDataName,
              load,
              getInitialState,
              getInStore: getOutOfStore,
            });
            const subreducer = mapArgsToGenerated[stringHash].subreducer;
            injectReducer([prefix, safeDataName, stringHash], subreducer);
          }
          return mapArgsToGenerated[stringHash];
        };

        // Links to argument-less actions generated by the factory.
        const _forwardActionForSubreducer = (actionName: string, { forwardArgs = false }: * = {}) => (
          ...args: Array<mixed>
        ) => async dispatch => {
          const actions = _queryOrCreateBoilerplate(...args).actions;
          const action = actions[actionName];
          if (forwardArgs) {
            return dispatch(action(...args)); // Assumed to be loading arguments.
          }
          return dispatch(action());
        };

        this.load = _forwardActionForSubreducer('load', { forwardArgs: true });

        this.reset = _forwardActionForSubreducer('reset');

        this.clearErrors = _forwardActionForSubreducer('clearErrors');
      }

      return {
        actions: Actions,
        getters: Getters,
      };
    };
  };

export default createFactoryMap;

