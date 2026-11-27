// The compiled library under test: ./.build/test, which `npm test` writes.
// GC_DIST points somewhere else. ./dist is not used, it can hold stale files.
const path = require('path');

const root = path.resolve(__dirname, '../..');
const dist = path.resolve(root, process.env.GC_DIST || '.build/test');

module.exports = {
    root,
    dist,
    load: (file = 'index') => require(path.join(dist, file))
};
