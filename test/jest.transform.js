module.exports = require('babel-jest').createTransformer({
    presets: ['flow', 'env', 'stage-3'],
    plugins: [
        'babel-plugin-transform-runtime',
        'babel-plugin-transform-class-properties',
        'syntax-dynamic-import',
        'babel-plugin-dynamic-import-node',
    ]
});
