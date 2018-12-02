// @flow
import warning from './warning';

const noConfigurationWarning = function() {
  if (process.env.NODE_ENV !== 'production') {
    warning('You must call configureRags(store, createRootReducer) to use redux-rags!');
  }
};

export default noConfigurationWarning;
