# Redux-Rags
Redux Reducers, Actions, and Generators: Simplified!

TLDR: `({ fetchData }) => ({ actions: { load }, getters: { getData } })`

## Motivation
We found that a lot of our reducers were redefining a common theme. We have some endpoint
that we want to query for data. So we'll want a `begin loading` action, so we can render
a fancy loading spinner. Then we'll hit the endpoint, maybe it returns data, maybe we get
an error. But we definitely stopped loading. And that's it. A mini-state machine that we
redefined dozens of times. But what if there were an easier way? What if we could define
that mini state machine once and re-use the logic with each query? Well `redux-rags` is
here to help clean up all the spilled copy-pasta from your redux boilerplate!

## Usage
Here's an example of how you'd interact with redux for a data request:
```js
import { ragFactory } from 'redux-rags';

const fetchData = () => axios.get('/faq')

const { actions: { load }, getters: { getData, getIsLoading } } =
  ragFactory({ fetchData: Function });

export {
  loadFaq: load,
  getFaq: getData,
  getIsFaqLoading: getIsLoading
};
```
The returned `load` function will take the same arguments as the `fetchData` function.

<details><summary>Unfold to see how to use that example in a react component </summary>

```js
import React from 'react';
import { connect } from 'react-redux';
import { loadFaq, getFaq, getIsFaqLoading } from './faqData';
import Loading from './Loading';
import FaqItem from './FaqItem';

class Faq extends React.Component {
  componentDidMount() {
    this.props.loadFaq();
  }

  render() {
    const { isLoading, faqData } = this.props;
    if (isLoading) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        {faqData.map((data, index) => <FaqItem key={index} data={data} />}
      </React.Fragment>
    )
  }
}

const mapStateFromProps = state => ({
  faqData: getFaq(state),
  isLoading: getIsFaqLoading(state)
});

export default connect(mapStateFromProps, { loadFaq })(Faq);
```
</details>

## Pre Requisites
You'll need `redux-thunk` and to reformate your `createRootReducer` function. We'll need to handle the addition of dynamic reducers!

Here's what your redux store creation will look like:
```js
import { combineReducers, createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { combineAsyncReducers, configureRags } from 'redux-rags';

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
configureRags(store, createRootReducer);
```

## Options

### ragFactory
|  Props  |  Type  |  Description  |
|:-------:|:------:|:-------------:|
| name | string | A string that identifies the data |

### ragFactoryMap
What's this `ragFactoryMap`? Well if you want to cache data based on the query parameters, then the `ragFactoryMap` is for you!
For each collection of args, a new reducer will be injected.
