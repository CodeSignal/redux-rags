module.exports = require('babel-jest').createTransformer({
    presets: ['flow', 'env', 'stage-3'],
    plugins: [
        'babel-plugin-transform-runtime',
        'syntax-dynamic-import',
        'babel-plugin-dynamic-import-node',
    ]
});
