const test = require('node:test');
const assert = require('node:assert');
const { withGarmin } = require('../helpers/fake-garmin');

const date = (day) => new Date(day + 'T12:00:00Z');

const GEAR = {
    uuid: 'abc123',
    userProfilePk: 1,
    gearType: 'SHOES',
    status: 'ACTIVE',
    name: 'Test shoes',
    brand: 'Brand',
    usageType: 'ROAD',
    firstUseDate: '2026-01-01',
    numActivitiesLinked: 2,
    durationUsedSeconds: 3600,
    distanceUsedMeters: 10000,
    daysUsed: 2,
    processing: false,
    createdDate: '2026-01-01T00:00:00.0'
};

const LAST_USED = {
    userDeviceId: 42,
    userProfileNumber: 1,
    applicationNumber: 2,
    lastUsedDeviceApplicationKey: 'key',
    lastUsedDeviceName: 'Watch',
    lastUsedDeviceUploadTime: 1767225600000,
    imageUrl: 'https://example.com/watch.png',
    released: true
};

/**
 * Runs one call against a single route and checks what was sent
 * @param route - `METHOD /path`
 * @param reply - Body the fake server answers with, undefined for 204
 * @param call - Called with the client
 * @param expected - `query` and `body` the request must have had
 */
async function expectCall(route, reply, call, expected = {}) {
    await withGarmin({ [route]: reply }, async ({ gc, calls }) => {
        const result = await call(gc);
        const sent = calls();
        assert.strictEqual(sent.length, 1);
        assert.strictEqual(`${sent[0].method} ${sent[0].path}`, route);
        assert.deepStrictEqual(sent[0].query, expected.query || {});
        assert.deepStrictEqual(sent[0].body, expected.body);
        if ('result' in expected) {
            assert.deepStrictEqual(result, expected.result);
        } else if (reply !== undefined) {
            assert.deepStrictEqual(result, reply);
        }
    });
}

/** The call must fail on its arguments without sending anything */
async function expectRejected(call, message) {
    await withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(call(gc), message);
        assert.strictEqual(requests.length, 0);
    });
}

// Gear

test('getGear fetches the profile id once and keeps filterGear', () =>
    withGarmin(
        { 'GET /gear-service/gear/filterGear': [] },
        async ({ gc, requests, calls }) => {
            await gc.getGear();
            await gc.getGear('2026-02-03');
            assert.strictEqual(requests.length - calls().length, 1);
            assert.deepStrictEqual(
                calls().map((r) => r.query),
                [
                    { userProfilePk: '1' },
                    { userProfilePk: '1', availableGearDate: '2026-02-03' }
                ]
            );
        }
    ));

test('getGearList reads the v2 list', () =>
    expectCall('GET /gear-service/gear/v2/list', [GEAR], (gc) =>
        gc.getGearList()
    ));

test('getGearDetails reads one item', async () => {
    await expectCall('GET /gear-service/gear/v2/abc123', GEAR, (gc) =>
        gc.getGearDetails('abc123')
    );
    await expectRejected((gc) => gc.getGearDetails(''), /Missing gearId/);
});

test('path segments from the caller are encoded', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getGearDetails('a/b?c'));
        assert.deepStrictEqual(requests[0].query, {});
        assert.strictEqual(requests[0].path, '/gear-service/gear/v2/a/b?c');
    }));

test('getAvailableGear asks for the gear of a date', () =>
    expectCall('GET /gear-service/gear/v2/available/2026-03-04', [], (gc) =>
        gc.getAvailableGear(new Date('2026-03-04T12:00:00Z'))
    ));

test('createGear posts the payload', async () => {
    const body = { name: 'New shoes' };
    await expectCall(
        'POST /gear-service/gear/v2',
        { uuid: 'new' },
        (gc) => gc.createGear(body),
        { body }
    );
    await expectRejected((gc) => gc.createGear(), /Missing gear/);
});

test('updateGear puts the payload', async () => {
    const body = { name: 'Renamed' };
    await expectCall(
        'PUT /gear-service/gear/v2/abc123',
        { uuid: 'abc123' },
        (gc) => gc.updateGear('abc123', body),
        { body }
    );
    await expectRejected((gc) => gc.updateGear('', body), /Missing gearId/);
    await expectRejected((gc) => gc.updateGear('abc123'), /Missing gear/);
});

test('setGearStatus puts the status in the path', async () => {
    await expectCall(
        'PUT /gear-service/gear/v2/abc123/status/RETIRED',
        { uuid: 'abc123' },
        (gc) => gc.setGearStatus('abc123', 'RETIRED'),
        { body: {} }
    );
    await expectRejected((gc) => gc.setGearStatus('', 'x'), /Missing gearId/);
    await expectRejected(
        (gc) => gc.setGearStatus('abc123', ''),
        /Missing status/
    );
});

test('deleteGearImage deletes the image', async () => {
    await expectCall(
        'DELETE /gear-service/gear/v2/abc123/image/5',
        undefined,
        (gc) => gc.deleteGearImage('abc123', 5)
    );
    await expectRejected((gc) => gc.deleteGearImage('', 5), /Missing gearId/);
    await expectRejected(
        (gc) => gc.deleteGearImage('abc123', ''),
        /Missing imageId/
    );
});

test('removeAllGearFromActivity deletes the association', async () => {
    await expectCall(
        'DELETE /gear-service/activity/v2/7/associated-gear',
        undefined,
        (gc) => gc.removeAllGearFromActivity(7)
    );
    await expectRejected(
        (gc) => gc.removeAllGearFromActivity(),
        /Missing activityId/
    );
});

test('getGearTypes reads the definitions', () =>
    expectCall(
        'GET /gear-service/gear/types',
        [
            {
                gearTypePk: 1,
                gearTypeName: 'Shoes',
                createDate: '2026-01-01T00:00:00.0',
                updateDate: '2026-01-01T00:00:00.0'
            }
        ],
        (gc) => gc.getGearTypes()
    ));

test('getGearUsageTypes reads the usage types', () =>
    expectCall('GET /gear-service/gear/v2/usagetypes', ['ROAD'], (gc) =>
        gc.getGearUsageTypes()
    ));

test('getUserGearTypes reads active and retired types', () =>
    expectCall(
        'GET /gear-service/gear/v2/user-gear-types',
        { activeGearTypes: ['SHOES'], retiredGearTypes: [] },
        (gc) => gc.getUserGearTypes()
    ));

test('getGearCollections reads the collections', () =>
    expectCall('GET /gear-service/collection', [], (gc) =>
        gc.getGearCollections()
    ));

// Devices

test('getDevices reads the registered devices', () =>
    expectCall('GET /device-service/deviceregistration/devices', [], (gc) =>
        gc.getDevices()
    ));

test('getLastUsedDevice reads the device or null', async () => {
    const route = 'GET /device-service/deviceservice/mylastused';
    await expectCall(route, LAST_USED, (gc) => gc.getLastUsedDevice());
    await expectCall(route, undefined, (gc) => gc.getLastUsedDevice(), {
        result: null
    });
});

test('getAllDeviceInfo uses the display name', () =>
    expectCall(
        'GET /device-service/deviceservice/device-info/all/tester',
        [],
        (gc) => gc.getAllDeviceInfo()
    ));

test('getDeviceSettings reads the settings or null', async () => {
    const route = 'GET /device-service/deviceservice/device-info/settings/42';
    await expectCall(route, { deviceId: 42 }, (gc) => gc.getDeviceSettings(42));
    await expectCall(route, undefined, (gc) => gc.getDeviceSettings(42), {
        result: null
    });
    await expectRejected((gc) => gc.getDeviceSettings(), /Missing deviceId/);
});

test('getDeviceSolarData reads one day', async () => {
    const route = 'GET /web-gateway/solar/42/2026-03-04/2026-03-04';
    const query = { singleDayView: 'true' };
    await expectCall(
        route,
        { deviceId: 42 },
        (gc) => gc.getDeviceSolarData(42, date('2026-03-04')),
        { query }
    );
    await expectCall(
        route,
        undefined,
        (gc) => gc.getDeviceSolarData(42, date('2026-03-04')),
        { query, result: null }
    );
    await expectRejected((gc) => gc.getDeviceSolarData(0), /Missing deviceId/);
});

test('getDeviceSolarData defaults to today', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getDeviceSolarData(42));
        assert.match(
            requests[0].path,
            /^\/web-gateway\/solar\/42\/(\d{4}-\d{2}-\d{2})\/\1$/
        );
    }));

test('getDeviceSolarRange reads a range in one request', async () => {
    const route =
        'GET /device-service/devicemonitoring/solargain/42/2026-01-01/2026-03-01';
    const call = (gc) =>
        gc.getDeviceSolarRange(42, date('2026-01-01'), date('2026-03-01'));
    await expectCall(route, { solarGain: [] }, call);
    await expectCall(route, undefined, call, { result: null });
});

test('getDeviceSolarRange validates its arguments', async () => {
    const day = date('2026-01-01');
    await expectRejected(
        (gc) => gc.getDeviceSolarRange(0, day, day),
        /Missing deviceId/
    );
    await expectRejected(
        (gc) => gc.getDeviceSolarRange(42, day),
        /Missing date range/
    );
    await expectRejected(
        (gc) => gc.getDeviceSolarRange(42, date('2026-01-02'), day),
        /start date is after end date/
    );
});

// Courses

test('deleteCourse deletes the course', async () => {
    await expectCall(
        'DELETE /course-service/course/9',
        undefined,
        (gc) => gc.deleteCourse(9),
        { result: undefined }
    );
    await expectRejected((gc) => gc.deleteCourse(), /Missing courseId/);
});

test('getFavoriteCourses reads the favourites', () =>
    expectCall('GET /course-service/course/favorites', [], (gc) =>
        gc.getFavoriteCourses()
    ));

test('addCourseToFavorites posts the course id', async () => {
    await expectCall(
        'POST /course-service/course/favorites',
        undefined,
        (gc) => gc.addCourseToFavorites(9),
        { body: { courseId: 9 } }
    );
    await expectRejected((gc) => gc.addCourseToFavorites(), /Missing courseId/);
});

test('removeCourseFromFavorites deletes the favourite', async () => {
    await expectCall(
        'DELETE /course-service/course/favorites/course/9',
        undefined,
        (gc) => gc.removeCourseFromFavorites(9)
    );
    await expectRejected(
        (gc) => gc.removeCourseFromFavorites(),
        /Missing courseId/
    );
});

test('getCourseDraftFromActivity converts an activity', async () => {
    await expectCall(
        'GET /course-service/course/convert/activity/7',
        { courseName: 'Draft', geoPoints: [] },
        (gc) => gc.getCourseDraftFromActivity(7)
    );
    await expectRejected(
        (gc) => gc.getCourseDraftFromActivity(),
        /Missing activityId/
    );
});

test('exportCourseAsFit returns the bytes untouched', async () => {
    // Not valid UTF-8, so a text decoding on the way would show
    const bytes = Buffer.from([14, 16, 0, 255, 254, 46, 70, 73, 84]);
    await withGarmin(
        { 'GET /course-service/course/fit/9/0': () => ({ body: bytes }) },
        async ({ gc, calls }) => {
            const file = await gc.exportCourseAsFit(9);
            assert.ok(Buffer.isBuffer(file));
            assert.deepStrictEqual(file, bytes);
            assert.deepStrictEqual(calls()[0].query, { elevation: 'true' });
        }
    );
    await expectRejected((gc) => gc.exportCourseAsFit(), /Missing courseId/);
});

// Pacing and power

test('getPaceBandSummaries optionally filters by course', async () => {
    const route = 'GET /course-service/pacebands/summaries';
    await expectCall(route, [], (gc) => gc.getPaceBandSummaries());
    await expectCall(route, [], (gc) => gc.getPaceBandSummaries(9), {
        query: { courseId: '9' }
    });
});

test('getPaceBand reads one pace band', async () => {
    await expectCall('GET /course-service/pacebands/3', { id: 3 }, (gc) =>
        gc.getPaceBand(3)
    );
    await expectRejected((gc) => gc.getPaceBand(), /Missing paceBandId/);
});

test('deletePaceBand deletes the pace band', async () => {
    await expectCall(
        'DELETE /course-service/pacebands/3',
        undefined,
        (gc) => gc.deletePaceBand(3),
        { result: undefined }
    );
    await expectRejected((gc) => gc.deletePaceBand(), /Missing paceBandId/);
});

test('sendPaceBandToDevice posts to the device', async () => {
    const route = 'POST /course-service/pacebands/3/device/42';
    await expectCall(route, undefined, (gc) => gc.sendPaceBandToDevice(3, 42), {
        body: {}
    });
    await expectCall(
        route,
        undefined,
        (gc) => gc.sendPaceBandToDevice(3, 42, { priority: 1 }),
        { body: { priority: 1 } }
    );
    await expectRejected(
        (gc) => gc.sendPaceBandToDevice(0, 42),
        /Missing paceBandId/
    );
    await expectRejected(
        (gc) => gc.sendPaceBandToDevice(3),
        /Missing deviceId/
    );
});

test('getPowerGuideSummaries optionally filters by course', async () => {
    const route = 'GET /v1/powerguidances/summaries';
    await expectCall(route, [], (gc) => gc.getPowerGuideSummaries());
    await expectCall(route, [], (gc) => gc.getPowerGuideSummaries(9), {
        query: { courseId: '9' }
    });
});

test('getPowerGuide reads one power guide', async () => {
    await expectCall('GET /v1/powerguidances/4', { id: 4 }, (gc) =>
        gc.getPowerGuide(4)
    );
    await expectRejected((gc) => gc.getPowerGuide(), /Missing powerGuideId/);
});

test('deletePowerGuide deletes the power guide', async () => {
    await expectCall(
        'DELETE /v1/powerguidances/4',
        undefined,
        (gc) => gc.deletePowerGuide(4),
        { result: undefined }
    );
    await expectRejected((gc) => gc.deletePowerGuide(), /Missing powerGuideId/);
});

// Segments

test('getSegmentClassifications reads the classifications', () =>
    expectCall(
        'GET /segment-service/segment/classifications',
        [{ typeId: 1, typeKey: 'climb', sortOrder: 1, parentTypeId: 0 }],
        (gc) => gc.getSegmentClassifications()
    ));

test('getSegment reads one segment', async () => {
    await expectCall(
        'GET /segment-service/segment/seg-1',
        { geoPoints: [] },
        (gc) => gc.getSegment('seg-1')
    );
    await expectRejected((gc) => gc.getSegment(''), /Missing segmentId/);
});

test('getSegmentsForActivity reads the segments or null', async () => {
    const route = 'GET /segment-service/segment/list/7';
    await expectCall(route, [], (gc) => gc.getSegmentsForActivity(7));
    await expectCall(route, undefined, (gc) => gc.getSegmentsForActivity(7), {
        result: null
    });
    await expectRejected(
        (gc) => gc.getSegmentsForActivity(),
        /Missing activityId/
    );
});

test('getSegmentLeaderboardRank asks for the own rank', async () => {
    const route = 'GET /segment-service/leaderboard/segment/seg-1/rank/tester';
    await expectCall(route, { rank: 3 }, (gc) =>
        gc.getSegmentLeaderboardRank('seg-1')
    );
    await expectCall(
        route,
        undefined,
        (gc) => gc.getSegmentLeaderboardRank('seg-1'),
        { result: null }
    );
    await expectRejected(
        (gc) => gc.getSegmentLeaderboardRank(''),
        /Missing segmentId/
    );
});

test('searchSegments posts the filters', async () => {
    const body = { limit: 5, showFavorites: false };
    await expectCall(
        'POST /segment-service/segment/filterSegments',
        [],
        (gc) => gc.searchSegments(body),
        { body }
    );
    await expectRejected((gc) => gc.searchSegments(), /Missing filters/);
});

test('getSegmentSurfaceTypes reads the surface types', () =>
    expectCall('GET /segment-service/segment/surfaceTypes', [], (gc) =>
        gc.getSegmentSurfaceTypes()
    ));
