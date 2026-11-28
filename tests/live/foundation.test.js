const assert = require('node:assert');
const { liveTest } = require('../helpers/live');

liveTest('the profile identifies the user', async (gc) => {
    const profile = await gc.getUserProfile();
    assert.strictEqual(typeof profile.profileId, 'number');
    assert.strictEqual(typeof profile.displayName, 'string');
});

liveTest('graphql answers a query', async (gc) => {
    const today = new Date().toISOString().slice(0, 10);
    const data = await gc.graphql(
        `query{latestWeightScalar(asOfDate:"${today}")}`
    );
    assert.ok('latestWeightScalar' in data);
});
