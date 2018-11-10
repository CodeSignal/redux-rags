// @flow
// Assumings keys came from 'path.to.reducer'.split('.'), or some equivalent nesting structure
// Recurse in reducers until we find where this one should go.
const replaceAsyncReducers = (reducers: Object, keys: Array<string>, reducer: Function) => {
    let key = keys.shift();
    if (keys.length === 0) {
        reducers[key] = reducer;
        return;
    }
    if (reducers[key] === undefined) {
        reducers[key] = {};
    }
    let nextReducers = reducers[key];
    replaceAsyncReducers(nextReducers, keys, reducer);
};

const dynamicReducers = {};
const makeReducerInjector = (store: { replaceReducer: Function }, createRootReducer: Function) => (keys: Array<string>, reducer: *) => {
    replaceAsyncReducers(dynamicReducers, keys, reducer);
    store.replaceReducer(createRootReducer(dynamicReducers));
};

export default makeReducerInjector;
