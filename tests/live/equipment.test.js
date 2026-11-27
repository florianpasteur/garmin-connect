const fs = require('fs');
const path = require('path');
const assert = require('node:assert');
const { liveTest, liveWriteTest } = require('../helpers/live');
const { load, root } = require('../helpers/dist');

// Only booleans and types are asserted: the responses hold personal data, which
// a failing assertion must not print.
const isArray = (value) => assert.ok(Array.isArray(value), 'expected a list');
const isObject = (value) =>
    assert.ok(value !== null && typeof value === 'object', 'expected data');
const isObjectOrNull = (value) => value === null || isObject(value);

/** The first value found under one of `keys`, anywhere in a response */
function findValue(data, keys) {
    if (data === null || typeof data !== 'object') {
        return undefined;
    }
    const key = keys.find((name) => data[name]);
    if (key) {
        return data[key];
    }
    for (const child of Object.values(data)) {
        const found = findValue(child, keys);
        if (found) {
            return found;
        }
    }
    return undefined;
}

async function firstCourseId(gc) {
    const { coursesForUser } = await gc.listCourses();
    return coursesForUser?.[0]?.courseId;
}

/** Recent activities with a GPS track, newest first */
async function outdoorActivities(gc) {
    const activities = await gc.getActivities(0, 20);
    return activities.filter((activity) => activity.startLatitude);
}

async function firstDeviceId(gc) {
    const devices = await gc.getDevices();
    return (
        findValue(devices, ['deviceId', 'userDeviceId']) ||
        (await gc.getLastUsedDevice())?.userDeviceId
    );
}

async function firstSegmentId(gc) {
    for (const activity of (await outdoorActivities(gc)).slice(0, 5)) {
        const segments = await gc.getSegmentsForActivity(activity.activityId);
        const id = findValue(segments, ['segmentUuid', 'uuid']);
        if (id) {
            return id;
        }
    }
    return undefined;
}

/** Solar endpoints fail for devices without a solar panel */
async function solar(t, request) {
    try {
        isObjectOrNull(await request());
    } catch (error) {
        if (!/\((400|404)\)/.test(error.message)) {
            throw error;
        }
        t.skip('the device has no solar data');
    }
}

// Gear

liveTest('getGear lists legacy gear', async (gc) => {
    isArray(await gc.getGear());
});

liveTest('getGearList lists gear', async (gc) => {
    const gear = await gc.getGearList();
    isArray(gear);
    for (const item of gear) {
        assert.strictEqual(typeof item.uuid, 'string');
        assert.strictEqual(typeof item.distanceUsedMeters, 'number');
    }
});

liveTest('getGearDetails reads one item', async (gc, t) => {
    const [first] = await gc.getGearList();
    if (!first) {
        return t.skip('no gear');
    }
    isObject(await gc.getGearDetails(first.uuid));
});

liveTest('getAvailableGear lists the gear of today', async (gc) => {
    assert.ok(Array.isArray(await gc.getAvailableGear()));
});

liveTest('getGearTypes lists the definitions', async (gc) => {
    const types = await gc.getGearTypes();
    isArray(types);
    for (const type of types) {
        assert.strictEqual(typeof type.gearTypePk, 'number');
        assert.strictEqual(typeof type.gearTypeName, 'string');
    }
});

liveTest('getGearUsageTypes lists strings', async (gc) => {
    const types = await gc.getGearUsageTypes();
    isArray(types);
    assert.ok(types.every((type) => typeof type === 'string'));
});

liveTest('getUserGearTypes lists active and retired types', async (gc) => {
    const types = await gc.getUserGearTypes();
    isArray(types.activeGearTypes);
    isArray(types.retiredGearTypes);
});

liveTest('getGearCollections lists collections', async (gc) => {
    isArray(await gc.getGearCollections());
});

// Devices

liveTest('getDevices lists devices', async (gc) => {
    isArray(await gc.getDevices());
});

liveTest('getLastUsedDevice answers', async (gc) => {
    const device = await gc.getLastUsedDevice();
    if (device !== null) {
        assert.strictEqual(typeof device.userDeviceId, 'number');
    }
});

liveTest('getAllDeviceInfo lists device information', async (gc) => {
    isArray(await gc.getAllDeviceInfo());
});

liveTest('getDeviceSettings reads settings', async (gc, t) => {
    const deviceId = await firstDeviceId(gc);
    if (!deviceId) {
        return t.skip('no device');
    }
    isObjectOrNull(await gc.getDeviceSettings(deviceId));
});

liveTest('getDeviceSolarData reads one day', async (gc, t) => {
    const deviceId = await firstDeviceId(gc);
    if (!deviceId) {
        return t.skip('no device');
    }
    await solar(t, () => gc.getDeviceSolarData(deviceId));
});

liveTest('getDeviceSolarRange reads a week', async (gc, t) => {
    const deviceId = await firstDeviceId(gc);
    if (!deviceId) {
        return t.skip('no device');
    }
    const end = new Date();
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    await solar(t, () => gc.getDeviceSolarRange(deviceId, start, end));
});

// Courses

liveTest('getFavoriteCourses lists favourites', async (gc) => {
    isArray(await gc.getFavoriteCourses());
});

liveTest('getCourseDraftFromActivity builds a draft', async (gc, t) => {
    const [activity] = await outdoorActivities(gc);
    if (!activity) {
        return t.skip('no activity with a GPS track');
    }
    isObject(await gc.getCourseDraftFromActivity(activity.activityId));
});

liveTest('exportCourseAsFit downloads a FIT file', async (gc, t) => {
    const courseId = await firstCourseId(gc);
    if (!courseId) {
        return t.skip('no course');
    }
    const file = await gc.exportCourseAsFit(courseId);
    assert.ok(Buffer.isBuffer(file));
    assert.strictEqual(file.toString('ascii', 8, 12), '.FIT');
});

// Pacing and power

liveTest('getPaceBandSummaries lists pace bands', async (gc) => {
    isArray(await gc.getPaceBandSummaries());
});

liveTest('getPaceBand reads one pace band', async (gc, t) => {
    const id = findValue(await gc.getPaceBandSummaries(), ['paceBandId', 'id']);
    if (!id) {
        return t.skip('no pace band');
    }
    isObject(await gc.getPaceBand(id));
});

liveTest('getPowerGuideSummaries lists power guides', async (gc) => {
    isArray(await gc.getPowerGuideSummaries());
});

liveTest('getPowerGuide reads one power guide', async (gc, t) => {
    const id = findValue(await gc.getPowerGuideSummaries(), [
        'powerGuideId',
        'id'
    ]);
    if (!id) {
        return t.skip('no power guide');
    }
    isObject(await gc.getPowerGuide(id));
});

// Segments

liveTest('getSegmentClassifications lists classifications', async (gc) => {
    const classifications = await gc.getSegmentClassifications();
    isArray(classifications);
    for (const item of classifications) {
        assert.strictEqual(typeof item.typeId, 'number');
        assert.strictEqual(typeof item.typeKey, 'string');
    }
});

liveTest('getSegmentSurfaceTypes answers', async (gc) => {
    assert.ok((await gc.getSegmentSurfaceTypes()) !== undefined);
});

liveTest('searchSegments answers', async (gc) => {
    const found = await gc.searchSegments({ limit: 1, showFavorites: false });
    assert.ok(found !== undefined);
});

liveTest('getSegmentsForActivity answers', async (gc, t) => {
    const [activity] = await outdoorActivities(gc);
    if (!activity) {
        return t.skip('no activity with a GPS track');
    }
    isObjectOrNull(await gc.getSegmentsForActivity(activity.activityId));
});

liveTest('getSegment reads one segment', async (gc, t) => {
    const segmentId = await firstSegmentId(gc);
    if (!segmentId) {
        return t.skip('no segment');
    }
    isArray((await gc.getSegment(segmentId)).geoPoints);
});

liveTest('getSegmentLeaderboardRank answers', async (gc, t) => {
    const segmentId = await firstSegmentId(gc);
    if (!segmentId) {
        return t.skip('no segment');
    }
    assert.ok((await gc.getSegmentLeaderboardRank(segmentId)) !== undefined);
});

// Writes

liveWriteTest('a course is created, favourited and deleted', async (gc) => {
    const fileName = 'paris-marathon.gpx';
    const gpx = fs.readFileSync(
        path.join(root, 'examples/assets', fileName),
        'utf8'
    );
    const { GpxActivityType, CoursePrivacyRule } = load();
    const imported = await gc.importGpx(fileName, gpx);
    const { courseId } = await gc.createCourse(
        GpxActivityType.Running,
        `garmin-connect test ${Date.now()}`,
        imported.geoPoints,
        imported.coursePoints,
        CoursePrivacyRule.PRIVATE
    );

    const isFavorite = async () =>
        JSON.stringify(await gc.getFavoriteCourses()).includes(
            String(courseId)
        );
    try {
        assert.strictEqual(typeof courseId, 'number');
        await gc.addCourseToFavorites(courseId);
        assert.ok(await isFavorite(), 'the course is not a favourite');

        const file = await gc.exportCourseAsFit(courseId);
        assert.strictEqual(file.toString('ascii', 8, 12), '.FIT');

        await gc.removeCourseFromFavorites(courseId);
        assert.ok(!(await isFavorite()), 'the course is still a favourite');
    } finally {
        await gc.deleteCourse(courseId);
    }

    const { coursesForUser } = await gc.listCourses();
    assert.ok(
        !coursesForUser.some((course) => course.courseId === courseId),
        'the course was not deleted'
    );
});
