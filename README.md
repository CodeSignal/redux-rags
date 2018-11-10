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

Huge thanks to Jimmy Shen for [this amazing Medium article](https://medium.com/@jimmy_shen/inject-reducer-arbitrarily-rather-than-top-level-for-redux-store-to-replace-reducer-fdc1060a6a7)
on dynamically injecting reducers into the redux store.

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

<details><summary>Unfold to see an example of placing the subreducer in a custom location in redux</summary>

Connect subreducer to your desired location in the redux store, and tell the generator
where you put it. Getters are also factories for you. If you don't care where the
subreducer lives, don't pass in a `getInStore` method and the generator will place it for you.
In this case taking `subreducer` and adding it to the `combineSubreducers` function in the `currentUser` subreducer. (But you can place
it wherever you want, just update the `getInStore` function passed to `ragFactory`.
```js
import { generator };
const { actions, subreducer, get, getData, getMeta } = generator({
  name: 'MY_DATA',
  fetchData: (param) => methodService.run('fetchSomething', param),
  getInStore: (store) => store && store.currentUser && store.currentUser.my_data
});
```

</details>

<details><summary>Unfold to see an example of ragFactoryMap</summary>

Not much to say, it's pretty much how you would use `ragFactory`, except treating the input arguments
as a key for a different mini state machine.

```js
 const { action: { load }, getters: { getData, getMeta } } =
   ragFactoryMap({ fetchData: Function })

 // Somewhere else, maybe in a component

 ...
 componentDidMount() {
   const { loaded, taskId, userId } = this.props;
   !loaded && load(userId, taskId);
 }
 ...
 mapStateToProps(state, props) {
   const { userId, taskId } = props;
   return {
     loaded: getMeta(userId, taskId).loaded,
     taskData: getData(userId, taskId)
   }
 }
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

## Details and Options

### A few types to consider:
The generated subreducer uses the following type for the state:
```js
type BoilerState<T> = {
  data: ?T,
  meta: {
    loading: boolean,
    loaded: boolean,
    changeCount: number,
    lastChangeTime: ?number,
    errors?: *
  }
}
```
|  Meta Property | Description |
|:----:|:---:|
| loading | Is the data currently being loaded |
| loaded | Has the data every been loaded? Equivalent to `changeCount > 0` |
| changeCount | Number of times the data has been loaded / updated |
| lastChangeTime | The time of the last change |
| errors | Error object from the loading function, if any |


### ragFactory
|  Props  |  Type  |  Optional  |  Description  |
|:-------:|:------:|:----------:|:-------------:|
| name | string | yes | A string that identifies the data. If you pass a name, the actions sent to redux and the automatically injected subreducer will use that name. |
| fetchData | Function | no | A function that loads data |
| getInitialState | Function | yes | Function to create initial data for the return of fetchData, will use null if not defined |
| getInStore | Function | yes | ``(state) => state.some.path.to.subreducer` Function to locate the subreducer in the store. Will place in default location if not specified, otherwise will use this location in getters. |
| update | Function | yes | (dataValue, ...args) => { return newData; } A function to manipulate the data attribute. Returned `update` will have signature `(...args) => void` |
| loadOnlyOnce | boolean | yes | Prevent the `load` function from being called more than once. |
| partialReducer | Function | yes | Allows you to hook in to other actions in the redux store and modify the state. You'll be working with the BoilerState argument. Extend the reducer and listen to other actions, for example you can could clear the data on user logout. Write this like a reducer to extend the functionality of the generated boilerplate. You can also delay assignment if you want to utilize actions in the returned Actions object, just assign the function to `subreducer.partialReducer`.|
|:-------:|:------:|:----------:|:-------------:|
The `ragFactory` will place the dynamically added subreducers in the `@@redux-rags` top leve of the redux store.
If you want to place this somewhere else, just put the returned `subreducer` somewhere in your redux store and
pass in the `getInStore` function.

### ragFactoryMap
What's this `ragFactoryMap`? Well if you want to cache data based on the query parameters, then the `ragFactoryMap` is for you!
For each collection of args, a new reducer will be injected. The params are stringified and used as the key for the injected subreducer.

The `ragFactoryMap` builds on top of `ragFactory`. That factory is used internally to generate the subreducers and actions for each key.

| Props | Type | Optional | Description |
|:-----:|:----:|:--------:|:-----------:|
| name | string | yes | A string that identifies the data. If you pass a name, the actions sent to redux and the automatically injected subreducer will use that name. |
| fetchData | Function | no | A function that loads data. The returned function will have the same signature. |
| getInitialState | Function | yes | Function to create initial data for the return of fetchData, will use null if not defined |

## License
MIT
