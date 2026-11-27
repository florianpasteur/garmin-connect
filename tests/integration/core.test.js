// Methods that existed before the library was split into modules.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withGarmin } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const { GpxActivityType, CoursePrivacyRule } = load();

const date = new Date('2026-03-05T12:00:00');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gc-core-'));

const line = (r) => `${r.method} ${r.path}`;

/** The method returns no value */
const NOTHING = Symbol('nothing');

/**
 * Calls one method and checks the single request it sends and what it returns.
 */
function sends(
    name,
    { route, reply = { ok: true }, query, body, call, result }
) {
    test(name, () =>
        withGarmin({ [route]: reply }, async ({ gc, calls }) => {
            const returned = await call(gc);
            assert.deepStrictEqual(calls().map(line), [route]);
            if (query) assert.deepStrictEqual(calls()[0].query, query);
            if (body) assert.deepStrictEqual(calls()[0].body, body);
            const expected = result === undefined ? reply : result;
            assert.deepStrictEqual(
                returned,
                result === NOTHING ? undefined : expected
            );
        })
    );
}

sends('getUserSettings', {
    route: 'GET /userprofile-service/userprofile/user-settings/',
    call: (gc) => gc.getUserSettings()
});

test('getUserProfile', () =>
    withGarmin({}, async ({ gc, requests }) => {
        assert.strictEqual((await gc.getUserProfile()).displayName, 'tester');
        assert.deepStrictEqual(requests.map(line), [
            'GET /userprofile-service/socialProfile'
        ]);
    }));

sends('post', {
    route: 'POST /anything',
    body: { a: 1 },
    call: (gc) => gc.post(gc.url.GC_API + '/anything', { a: 1 })
});

sends('put', {
    route: 'PUT /anything',
    body: { a: 1 },
    call: (gc) => gc.put(gc.url.GC_API + '/anything', { a: 1 })
});

sends('getActivity', {
    route: 'GET /activity-service/activity/12',
    call: (gc) => gc.getActivity({ activityId: 12 })
});

sends('deleteActivity', {
    route: 'DELETE /activity-service/activity/12',
    reply: undefined,
    call: (gc) => gc.deleteActivity({ activityId: 12 }),
    result: NOTHING
});

sends('renameActivity', {
    route: 'PUT /activity-service/activity/12',
    reply: undefined,
    body: { activityName: 'new' },
    call: (gc) => gc.renameActivity(12, 'new'),
    result: NOTHING
});

test('countActivities asks for lifetime totals', () =>
    withGarmin(
        { 'GET /fitnessstats-service/activity': [] },
        async ({ gc, calls }) => {
            await gc.countActivities();
            const { query } = calls()[0];
            assert.strictEqual(query.aggregation, 'lifetime');
            assert.strictEqual(query.startDate, '1970-01-01');
            assert.strictEqual(query.metric, 'duration');
            assert.match(query.endDate, /^\d{4}-\d\d-\d\d$/);
        }
    ));

for (const [type, route] of [
    ['zip', '/download-service/files/activity/12'],
    ['gpx', '/download-service/export/gpx/activity/12'],
    ['tcx', '/download-service/export/tcx/activity/12'],
    ['kml', '/download-service/export/kml/activity/12']
]) {
    test(`downloadOriginalActivityData writes a ${type} file`, () =>
        withGarmin(
            { [`GET ${route}`]: () => ({ body: 'content' }) },
            async ({ gc }) => {
                const dir = tmp();
                await gc.downloadOriginalActivityData(
                    { activityId: 12 },
                    dir,
                    type
                );
                const file = path.join(dir, `12.${type}`);
                assert.strictEqual(fs.readFileSync(file, 'utf8'), 'content');
            }
        ));
}

test('uploadActivityPhoto sends the file as multipart', () =>
    withGarmin(
        { 'POST /activity-service/activity/12/image': { ok: true } },
        async ({ gc, calls }) => {
            const file = path.join(tmp(), 'photo.jpg');
            fs.writeFileSync(file, 'pixels');
            await gc.uploadActivityPhoto(12, file);
            const [request] = calls();
            assert.match(request.headers['content-type'], /^multipart\//);
            assert.match(request.rawBody, /filename="photo\.jpg"[\s\S]*pixels/);
        }
    ));

sends('getWorkouts', {
    route: 'GET /workout-service/workouts',
    reply: [],
    query: { start: '2', limit: '3' },
    call: (gc) => gc.getWorkouts(2, 3)
});

test('workouts lists the own workouts', () =>
    withGarmin(
        { 'GET /workout-service/workouts': [] },
        async ({ gc, calls }) => {
            await gc.workouts();
            assert.strictEqual(calls()[0].query.myWorkoutsOnly, 'true');
            assert.strictEqual(calls()[0].query.orderBy, 'UPDATE_DATE');
        }
    ));

sends('scheduleWorkout', {
    route: 'POST /workout-service/schedule/5',
    body: { date: '2026-03-05' },
    call: (gc) => gc.scheduleWorkout({ workoutId: '5' }, '2026-03-05')
});

sends('getYearCalendarEvents', {
    route: 'GET /calendar-service/year/2026',
    call: (gc) => gc.getYearCalendarEvents(2026)
});

sends('getMonthCalendarEvents', {
    route: 'GET /calendar-service/year/2026/month/2',
    call: (gc) => gc.getMonthCalendarEvents(2026, 2)
});

sends('getWeekCalendarEvents', {
    route: 'GET /calendar-service/year/2026/month/2/day/5/start/1',
    call: (gc) => gc.getWeekCalendarEvents(2026, 2, 5)
});

sends('getDailyWeightData', {
    route: 'GET /weight-service/weight/dayview/2026-03-05',
    call: (gc) => gc.getDailyWeightData(date)
});

sends('getDailyWeightInPounds converts grams', {
    route: 'GET /weight-service/weight/dayview/2026-03-05',
    reply: { totalAverage: { weight: 0 } },
    call: (gc) => gc.getDailyWeightInPounds(date),
    result: 0
});

sends('getHeartRate', {
    route: 'GET /wellness-service/wellness/dailyHeartRate',
    query: { date: '2026-03-05' },
    call: (gc) => gc.getHeartRate(date)
});

sends('getGolfSummary', {
    route: 'GET /gcs-golfcommunity/api/v2/scorecard/summary',
    call: (gc) => gc.getGolfSummary()
});

sends('getGolfScorecard', {
    route: 'GET /gcs-golfcommunity/api/v2/scorecard/detail',
    query: { 'scorecard-ids': '9' },
    call: (gc) => gc.getGolfScorecard(9)
});

sends('getGearsForActivity', {
    route: 'GET /gear-service/gear/filterGear',
    reply: [],
    query: { activityId: '12' },
    call: (gc) => gc.getGearsForActivity(12)
});

sends('linkGearToActivity', {
    route: 'PUT /gear-service/gear/link/abc/activity/12',
    call: (gc) => gc.linkGearToActivity(12, 'abc')
});

sends('unlinkGearFromActivity', {
    route: 'PUT /gear-service/gear/unlink/abc/activity/12',
    call: (gc) => gc.unlinkGearFromActivity(12, 'abc')
});

test('importGpx uploads the file content', () =>
    withGarmin(
        { 'POST /course-service/course/import': { ok: true } },
        async ({ gc, calls }) => {
            await gc.importGpx('route.gpx', '<gpx/>');
            assert.match(
                calls()[0].rawBody,
                /filename="route\.gpx"[\s\S]*<gpx\/>/
            );
        }
    ));

test('createCourse posts a private course by default', () =>
    withGarmin(
        { 'POST /course-service/course': { courseId: 1 } },
        async ({ gc, calls }) => {
            await gc.createCourse(GpxActivityType.Running, 'name', [
                { latitude: 1, longitude: 2, elevation: 3, distance: 0 }
            ]);
            const { body } = calls()[0];
            assert.strictEqual(body.courseName, 'name');
            assert.strictEqual(body.rulePK, CoursePrivacyRule.PRIVATE);
        }
    ));

sends('listCourses', {
    route: 'GET /web-gateway/course/owner/',
    reply: { coursesForUser: [] },
    call: (gc) => gc.listCourses()
});

sends('getCourseDetails', {
    route: 'GET /course-service/course/3',
    call: (gc) => gc.getCourseDetails(3)
});

for (const [name, call, expected] of [
    [
        'updateCoursePrivacy',
        (gc) => gc.updateCoursePrivacy(3, CoursePrivacyRule.PUBLIC),
        { courseId: 3, courseName: 'old', rulePK: 1 }
    ],
    [
        'renameCourse',
        (gc) => gc.renameCourse(3, 'new'),
        { courseId: 3, courseName: 'new', rulePK: 2 }
    ],
    [
        'updateCourse',
        (gc) => gc.updateCourse({ courseId: 3, courseName: 'x', rulePK: 2 }),
        { courseId: 3, courseName: 'x', rulePK: 2 }
    ]
]) {
    test(`${name} puts the whole course`, () =>
        withGarmin(
            {
                'GET /course-service/course/3': {
                    courseId: 3,
                    courseName: 'old',
                    rulePK: 2
                },
                'PUT /course-service/course/3': { ok: true }
            },
            async ({ gc, calls }) => {
                await call(gc);
                assert.deepStrictEqual(calls().pop().body, expected);
            }
        ));
}

sends('exportCourseAsGpx', {
    route: 'GET /course-service/course/gpx/3',
    reply: () => ({ body: '<gpx/>' }),
    call: (gc) => gc.exportCourseAsGpx(3),
    result: '<gpx/>'
});

test('tokens survive an export and a load', () =>
    withGarmin({}, async ({ gc }) => {
        gc.client.oauth1Token = { oauth_token: 'a', oauth_token_secret: 'b' };
        const dir = path.join(tmp(), 'tokens');
        gc.exportTokenToFile(dir);
        const exported = gc.exportToken();
        gc.client.oauth1Token = undefined;
        gc.client.oauth2Token = undefined;
        assert.throws(() => gc.exportToken(), /Token not found/);
        gc.loadTokenByFile(dir);
        assert.deepStrictEqual(gc.exportToken(), exported);
    }));

test('required arguments are checked before any request', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getActivity({}), /Missing activityId/);
        await assert.rejects(gc.deleteActivity({}), /Missing activityId/);
        await assert.rejects(gc.renameActivity(1, ''), /Missing newName/);
        await assert.rejects(gc.getWorkoutDetail({}), /Missing workoutId/);
        assert.strictEqual(requests.length, 0);
    }));
