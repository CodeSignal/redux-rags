module.exports = require('babel-jest').createTransformer({
    presets: ['flow', 'env', 'stage-3'],
    plugins: [
        'syntax-dynamic-import',
        'babel-plugin-dynamic-import-node',
    ]
});
