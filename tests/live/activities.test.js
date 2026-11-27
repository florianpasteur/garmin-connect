const assert = require('node:assert');
const path = require('path');
const { liveTest, liveWriteTest } = require('../helpers/live');
const { root } = require('../helpers/dist');

// Assertions only look at types: messages must never hold personal data.
const isObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const isEmpty = (value) => value === '' || value === null;

const assertArray = (value) =>
    assert.ok(Array.isArray(value) || isEmpty(value), 'expected an array');

/** The object, or null when the endpoint had no data */
function optionalObject(value) {
    if (isEmpty(value)) return null;
    assert.ok(isObject(value), 'expected an object');
    return value;
}

let newest;

/** ID of the newest activity, or skips the test when there is none */
async function anyActivityId(gc, t) {
    newest = newest || gc.getActivities(0, 1);
    const [activity] = await newest;
    if (!activity) {
        t.skip('the account has no activity');
        return undefined;
    }
    return activity.activityId;
}

/** A read of one activity: `check(response)` asserts its shape */
function activityRead(method, check) {
    liveTest(`${method} answers for an activity`, async (gc, t) => {
        const id = await anyActivityId(gc, t);
        if (id === undefined) return;
        check(await gc[method](id));
    });
}

/** Asserts that `key` is an array whenever there is a response */
const hasList = (key) => (value) => {
    const found = optionalObject(value);
    if (found) assertArray(found[key]);
};

activityRead('getActivityDetails', hasList('metricDescriptors'));
activityRead('getActivitySplits', hasList('lapDTOs'));
activityRead('getActivityTypedSplits', hasList('splits'));
activityRead('getActivitySplitSummaries', hasList('splitSummaries'));
activityRead('getActivityWeather', optionalObject);
activityRead('getActivityHeartRateZones', assertArray);
activityRead('getActivityPowerZones', assertArray);
activityRead('getActivityExerciseSets', optionalObject);
activityRead('getActivityWorkouts', assertArray);
activityRead('getActivityPolyline', optionalObject);

liveTest('getActivityDetails accepts size limits', async (gc, t) => {
    const id = await anyActivityId(gc, t);
    if (id === undefined) return;
    const details = await gc.getActivityDetails(id, {
        maxChartSize: 100,
        maxPolylineSize: 100
    });
    hasList('activityDetailMetrics')(details);
});

liveTest('searchActivities filters by date', async (gc) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    const found = await gc.searchActivities({
        start: 0,
        limit: 3,
        startDate,
        endDate
    });
    assert.ok(Array.isArray(found), 'expected an array');
    assert.ok(found.length <= 3, 'expected at most 3 results');
    for (const activity of found) {
        assert.strictEqual(typeof activity.activityId, 'number');
    }
});

liveTest('getFirstAndLastActivity returns ids', async (gc, t) => {
    if ((await anyActivityId(gc, t)) === undefined) return;
    const ids = await gc.getFirstAndLastActivity();
    assert.strictEqual(typeof ids.firstActivityId, 'number');
    assert.strictEqual(typeof ids.lastActivityId, 'number');
});

liveTest('getActivityTypes lists type keys', async (gc) => {
    const types = await gc.getActivityTypes();
    assert.ok(types.length > 0, 'expected activity types');
    for (const type of types) {
        assert.strictEqual(typeof type.typeId, 'number');
        assert.strictEqual(typeof type.typeKey, 'string');
    }
});

liveTest('the ActivityType enum only holds known keys', async (gc) => {
    const { ActivityType } = require('../helpers/dist').load();
    const known = (await gc.getActivityTypes()).map((type) => type.typeKey);
    const unknown = Object.keys(ActivityType)
        .map((name) => ActivityType[name])
        .filter((key) => known.indexOf(key) === -1);
    // These are Garmin's public type keys, not personal data
    assert.deepStrictEqual(unknown, []);
});

liveTest('getEventTypes lists type keys', async (gc) => {
    const types = await gc.getEventTypes();
    assert.ok(types.length > 0, 'expected event types');
    for (const type of types) {
        assert.strictEqual(typeof type.typeKey, 'string');
    }
});

liveTest('getPowerCurve returns entries', async (gc) => {
    hasList('entries')(await gc.getPowerCurve());
});

liveTest('getActivityStats aggregates a range', async (gc) => {
    assertArray(
        await gc.getActivityStats({
            startDate: new Date('1970-01-02T12:00:00Z'),
            endDate: new Date(),
            aggregation: 'lifetime',
            metric: 'duration'
        })
    );
});

/**
 * Creates a private manual activity, runs `body` with its ID and always deletes
 * it. The activity is also looked up by its unique name, so it is removed even
 * when the creation response holds no ID.
 */
async function withTestActivity(gc, body) {
    const name = `garmin-connect test ${Date.now()}-${Math.floor(
        Math.random() * 1e6
    )}`;
    const names = [name, `${name} updated`];
    const startTime = new Date(Date.now() - 60 * 60 * 1000);
    const findIds = async () => {
        const found = await gc.searchActivities({
            start: 0,
            limit: 20,
            startDate: startTime,
            endDate: startTime
        });
        return found
            .filter((a) => names.indexOf(a.activityName) !== -1)
            .map((a) => a.activityId);
    };

    let id;
    try {
        const created = await gc.createManualActivity({
            activityName: name,
            activityType: 'other',
            startTime,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            durationInSeconds: 60,
            distanceInMeters: 10,
            calories: 1,
            privacy: 'private'
        });
        id = (created && created.activityId) || (await findIds())[0];
        assert.strictEqual(
            typeof id,
            'number',
            `no ID for the new activity, check that "${name}" is deleted`
        );
        await body(id, names[1]);
    } finally {
        const ids = id ? [id] : await findIds();
        for (const activityId of ids) {
            await gc.deleteActivity({ activityId });
        }
    }
}

liveWriteTest(
    'createManualActivity, updateActivity and deleteActivity round trip',
    (gc) =>
        withTestActivity(gc, async (activityId, newName) => {
            await gc.updateActivity(activityId, {
                activityName: newName,
                description: 'Created and deleted by an automated test'
            });
            const updated = await gc.getActivity({ activityId });
            assert.ok(updated.activityName === newName, 'name not updated');
        })
);

liveWriteTest(
    'deleteActivityPhoto removes a photo of a test activity',
    (gc, t) =>
        withTestActivity(gc, async (activityId) => {
            await gc.uploadActivityPhoto(
                activityId,
                path.join(root, 'examples/assets/image.jpg')
            );
            const images = async () => {
                const activity = await gc.getActivity({ activityId });
                const metadata = activity.metadataDTO || {};
                return metadata.activityImages || [];
            };
            const [image] = await images();
            if (!image) {
                t.skip('the uploaded photo is not listed yet');
                return;
            }
            await gc.deleteActivityPhoto(activityId, image.imageId);
            const left = await images();
            assert.ok(
                left.every((other) => other.imageId !== image.imageId),
                'photo still listed'
            );
        })
);
