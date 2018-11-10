# redux-rags
Redux Reducers, Actions, and Generators: Simplified!

## Pre Requisites
You'll need `redux-thunk` and to reformate your `createRootReducer` function. We'll need to handle the addition of dynamic reducers!

Here's what your redux store creation will look like:
```js
import { combineReducers, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { combineAsyncReducers } from 'redux-rags';

// ... import a few reducers, we'll use userReducer as an example
import userReducer from './userReducer';

const createRootReducer = (dynamicReducers: Object = {}) => {
  dynamicReducers = combineAsyncReducers(combineReducers, dynamicReducers);
  
  return combineReducers({
    ...dynamicReducers,
    // Then list your reducers below
    userReducer
  });
}

const middleware = applyMiddleware(thunk);
const store = createStore(createRootReducer(), compose(middleware));
```
