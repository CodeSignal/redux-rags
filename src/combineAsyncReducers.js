// @flow

const recursivelyCombineAsyncReducers = function (combineReducers: Function, asyncReducers: Function | Object) {
  // Don't combine a reducer leaf
  if (typeof asyncReducers !== 'object') {
    return asyncReducers;
  }
  // Call combineReducers on every function, recursive walk.
  const reducers = {};
  for (let prop of Object.getOwnPropertyNames(asyncReducers)) {
    const subreducer = asyncReducers[prop];
    if (typeof subreducer === 'object') {
      recursivelyCombineAsyncReducers(combineReducers, subreducer);
    } else {
      reducers[prop] = subreducer;
    }
  }

  return combineReducers(reducers);
};

const combineAsyncReducers = function (combineReducers: Function, asyncReducers: Function | Object) {
  const newAsyncReducers = Object.getOwnPropertyNames(asyncReducers).reduce(
    (reducers, key) => {
      reducers[key] = recursivelyCombineAsyncReducers(combineReducers, asyncReducers[key]);
      return reducers;
    }
    , {});
  return newAsyncReducers;
};

export default combineAsyncReducers;
