import makeReducerInjector from './injectReducer';
import createFactory from './factory';
import createFactoryMap from './factoryMap';
import combineAsyncReducers from './combineAsyncReducers';
import warning from './utils/warning';

const noConfigurationWarning = () => {
  if (process.env.NODE_ENV !== 'production') {
    warning('You must call configureRags(store, createRootReducer) to use redux-rags!');
  }
};

let injectReducer = noConfigurationWarning;
let ragFactory = noConfigurationWarning;
let ragFactoryMap = noConfigurationWarning;

const configureRags = (store: *, createRootReducer: *) => {
  injectReducer = makeReducerInjector(store, createRootReducer);
  ragFactory = createFactory(injectReducer);
  ragFactoryMap = createFactoryMap(injectReducer);
};

export {
  combineAsyncReducers,
  configureRags,
  injectReducer,
  ragFactory,
  ragFactoryMap,
};
