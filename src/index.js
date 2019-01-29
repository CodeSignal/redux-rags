import makeReducerInjector from './injectReducer';
import createFactory from './factory';
import createFactoryMap from './factoryMap';
import combineAsyncReducers from './combineAsyncReducers';
import noConfigurationWarning from './utils/noConfigurationWarning';

let injectReducer = noConfigurationWarning;
let ragFactory = noConfigurationWarning;
let ragFactoryMap = noConfigurationWarning;

function configureRags(store: *, createRootReducer: *) {
  injectReducer = makeReducerInjector(store, createRootReducer);
  ragFactory = createFactory(injectReducer);
  ragFactoryMap = createFactoryMap(injectReducer);
}

export {
  combineAsyncReducers,
  configureRags,
  injectReducer,
  ragFactory,
  ragFactoryMap,
};
