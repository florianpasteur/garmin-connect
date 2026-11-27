const test = require('node:test');
const assert = require('node:assert');
const { withGarmin } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const { ActivityType, ActivitySubType } = load();

const date = (day) => new Date(day + 'T12:00:00Z');

const LIST = '/activitylist-service/activities/search/activities';
const ACTIVITY = '/activity-service/activity';

/** Checks that `method(id)` is a plain GET of the resource returning its body */
function readsActivityResource(method, resource, fixture) {
    const path = `${ACTIVITY}/101/${resource}`;
    test(`${method} reads ${resource}`, () =>
        withGarmin({ [`GET ${path}`]: fixture }, async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc[method](101), fixture);
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'GET');
            assert.strictEqual(calls()[0].path, path);
            assert.deepStrictEqual(calls()[0].query, {});
            assert.strictEqual(calls()[0].body, undefined);
        }));

    test(`${method} requires an activityId`, () =>
        withGarmin({}, async ({ gc, requests }) => {
            await assert.rejects(gc[method](), /Missing activityId/);
            assert.strictEqual(requests.length, 0);
        }));
}

readsActivityResource('getActivitySplits', 'splits', {
    activityId: 101,
    lapDTOs: [
        {
            startTimeGMT: '2026-01-02T07:00:00.0',
            distance: 1000,
            duration: 300,
            movingDuration: 298,
            elapsedDuration: 301,
            averageSpeed: 3.3,
            calories: 60,
            averageHR: 140,
            maxHR: 150,
            averagePower: 200,
            lapIndex: 1,
            intensityType: 'ACTIVE',
            messageIndex: 0,
            lengthDTOs: []
        }
    ],
    eventDTOs: [
        {
            startTimeGMT: '2026-01-02T07:00:00.0',
            startTimeGMTDoubleValue: 1767337200000,
            sectionTypeDTO: { id: 1, key: 'start', sectionTypeKey: 'timer' }
        }
    ]
});

readsActivityResource('getActivityTypedSplits', 'typedsplits', {
    activityId: 101,
    activityUUID: { uuid: 'uuid-1' },
    splits: []
});

readsActivityResource('getActivitySplitSummaries', 'split_summaries', {
    activityId: 101,
    activityUUID: { uuid: 'uuid-1' },
    splitSummaries: []
});

readsActivityResource('getActivityWeather', 'weather', {
    issueDate: null,
    temp: null,
    latitude: 1.5,
    longitude: 2.5,
    weatherStationDTO: null,
    weatherTypeDTO: null
});

readsActivityResource('getActivityHeartRateZones', 'hrTimeInZones', [
    { zoneNumber: 1, secsInZone: 120, zoneLowBoundary: 100 }
]);

readsActivityResource('getActivityPowerZones', 'powerTimeInZones', [
    { zoneNumber: 1, secsInZone: 90, zoneLowBoundary: 150 }
]);

readsActivityResource('getActivityExerciseSets', 'exerciseSets', {
    activityId: 101,
    exerciseSets: null
});

readsActivityResource('getActivityWorkouts', 'workouts', []);

readsActivityResource('getActivityPolyline', 'polyline/full-resolution', {
    polyline: [
        [1.5, 2.5],
        [1.6, 2.6]
    ],
    minLat: 1.5,
    maxLat: 1.6,
    minLon: 2.5,
    maxLon: 2.6
});

const DETAILS = {
    activityId: 101,
    measurementCount: 1,
    metricsCount: 1,
    totalMetricsCount: 1,
    metricDescriptors: [
        {
            metricsIndex: 0,
            key: 'directSpeed',
            unit: { id: 1, key: 'mps', factor: 1 }
        }
    ],
    activityDetailMetrics: [{ metrics: [null] }],
    geoPolylineDTO: null,
    heartRateDTOs: null,
    pendingData: null,
    detailsAvailable: true
};

test('getActivityDetails sends no query by default', () =>
    withGarmin(
        { [`GET ${ACTIVITY}/101/details`]: DETAILS },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getActivityDetails(101), DETAILS);
            assert.deepStrictEqual(calls()[0].query, {});
        }
    ));

test('getActivityDetails sends the chart and polyline limits', () =>
    withGarmin(
        { [`GET ${ACTIVITY}/101/details`]: DETAILS },
        async ({ gc, calls }) => {
            await gc.getActivityDetails(101, {
                maxChartSize: 100,
                maxPolylineSize: 0
            });
            assert.deepStrictEqual(calls()[0].query, {
                maxChartSize: '100',
                maxPolylineSize: '0'
            });
        }
    ));

test('getActivityDetails requires an activityId', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getActivityDetails(), /Missing activityId/);
        assert.strictEqual(requests.length, 0);
    }));

test('searchActivities sends every filter, with dates as YYYY-MM-DD', () =>
    withGarmin(
        { [`GET ${LIST}`]: [{ activityId: 101 }] },
        async ({ gc, calls }) => {
            const found = await gc.searchActivities({
                start: 0,
                limit: 5,
                activityType: 'trail_running',
                subActivityType: ActivitySubType.TrailRunning,
                startDate: date('2026-01-01'),
                endDate: date('2026-01-31'),
                search: 'hills & dales'
            });
            assert.deepStrictEqual(found, [{ activityId: 101 }]);
            assert.strictEqual(calls()[0].method, 'GET');
            assert.deepStrictEqual(calls()[0].query, {
                start: '0',
                limit: '5',
                activityType: 'trail_running',
                subActivityType: 'trail_running',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
                search: 'hills & dales'
            });
        }
    ));

test('searchActivities without options sends no query', () =>
    withGarmin({ [`GET ${LIST}`]: [] }, async ({ gc, calls }) => {
        assert.deepStrictEqual(await gc.searchActivities(), []);
        assert.deepStrictEqual(calls()[0].query, {});
    }));

test('getActivities accepts any activity type key', () =>
    withGarmin({ [`GET ${LIST}`]: [] }, async ({ gc, calls }) => {
        await gc.getActivities(0, 2, 'some_new_type');
        await gc.getActivities(0, 2, ActivityType.Running);
        assert.deepStrictEqual(
            calls().map((c) => c.query),
            [
                { start: '0', limit: '2', activityType: 'some_new_type' },
                { start: '0', limit: '2', activityType: 'street_running' }
            ]
        );
    }));

test('the original activity type values are unchanged', () => {
    assert.strictEqual(ActivityType.Cycling, 'cycling');
    assert.strictEqual(ActivityType.FitnessEquipment, 'fitness_equipment');
    assert.strictEqual(ActivityType.Walking, 'walking');
    assert.strictEqual(ActivityType.Hiking, 'hiking');
    assert.strictEqual(ActivityType.Other, 'other');
    assert.strictEqual(ActivityType.WaterSport, 'water_sports');
    assert.strictEqual(ActivityType.Running, 'street_running');
    assert.strictEqual(ActivityType.AllRunning, 'running');
});

/** Checks that `method()` is a plain GET of `path` returning its body */
function reads(method, path, fixture) {
    test(`${method} reads ${path}`, () =>
        withGarmin({ [`GET ${path}`]: fixture }, async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc[method](), fixture);
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'GET');
            assert.strictEqual(calls()[0].path, path);
            assert.deepStrictEqual(calls()[0].query, {});
        }));
}

reads(
    'getFirstAndLastActivity',
    '/activitylist-service/activities/first-last',
    {
        firstActivityId: 100,
        lastActivityId: 101
    }
);

reads('getActivityTypes', `${ACTIVITY}/activityTypes`, [
    {
        typeId: 1,
        typeKey: 'running',
        parentTypeId: 17,
        isHidden: false,
        restricted: false,
        trimmable: true
    }
]);

reads('getEventTypes', `${ACTIVITY}/eventTypes`, [
    { typeId: 9, typeKey: 'uncategorized', sortOrder: 10 }
]);

reads('getPowerCurve', '/fitnessstats-service/powerCurve', {
    startDate: null,
    endDate: null,
    entries: [
        {
            duration: 60,
            power: 250,
            activityId: 101,
            activityDate: '2026-01-02'
        }
    ]
});

const STATS = {
    startDate: date('2026-01-01'),
    endDate: date('2026-02-01'),
    aggregation: 'lifetime',
    metric: 'distance'
};

test('getActivityStats sends the range, aggregation and metric', () =>
    withGarmin(
        { 'GET /fitnessstats-service/activity': [] },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getActivityStats(STATS), []);
            assert.strictEqual(calls()[0].method, 'GET');
            assert.deepStrictEqual(calls()[0].query, {
                aggregation: 'lifetime',
                startDate: '2026-01-01',
                endDate: '2026-02-01',
                metric: 'distance'
            });
        }
    ));

test('getActivityStats requires every option', () =>
    withGarmin({}, async ({ gc, requests }) => {
        for (const key of Object.keys(STATS)) {
            await assert.rejects(
                gc.getActivityStats({ ...STATS, [key]: undefined }),
                new RegExp(`Missing ${key}`)
            );
        }
        assert.strictEqual(requests.length, 0);
    }));

const MANUAL = {
    activityName: 'Test walk',
    activityType: ActivityType.Walking,
    startTime: new Date('2026-03-10T06:30:15.250Z'),
    timezone: 'Asia/Kolkata',
    durationInSeconds: 600
};

test('createManualActivity posts the minimal payload, private by default', () =>
    withGarmin(
        { [`POST ${ACTIVITY}`]: { activityId: 555 } },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.createManualActivity(MANUAL), {
                activityId: 555
            });
            assert.strictEqual(calls()[0].method, 'POST');
            assert.strictEqual(calls()[0].path, ACTIVITY);
            assert.deepStrictEqual(calls()[0].query, {});
            assert.deepStrictEqual(calls()[0].body, {
                accessControlRuleDTO: { typeKey: 'private' },
                activityName: 'Test walk',
                activityTypeDTO: { typeKey: 'walking' },
                eventTypeDTO: { typeKey: 'uncategorized' },
                metadataDTO: { autoCalcCalories: true },
                summaryDTO: {
                    duration: 600,
                    startTimeLocal: '2026-03-10T12:00:15.250'
                },
                timeZoneUnitDTO: { unitKey: 'Asia/Kolkata' },
                isWheelchair: false
            });
        }
    ));

test('createManualActivity posts the optional values', () =>
    withGarmin(
        { [`POST ${ACTIVITY}`]: { activityId: 555 } },
        async ({ gc, calls }) => {
            await gc.createManualActivity({
                ...MANUAL,
                timezone: 'America/New_York',
                distanceInMeters: 1200,
                calories: 80,
                description: 'Invented',
                privacy: 'public',
                eventType: 'race'
            });
            assert.deepStrictEqual(calls()[0].body, {
                accessControlRuleDTO: { typeKey: 'public' },
                activityName: 'Test walk',
                activityTypeDTO: { typeKey: 'walking' },
                eventTypeDTO: { typeKey: 'race' },
                metadataDTO: { autoCalcCalories: false },
                summaryDTO: {
                    calories: 80,
                    duration: 600,
                    startTimeLocal: '2026-03-10T02:30:15.250',
                    distance: 1200
                },
                timeZoneUnitDTO: { unitKey: 'America/New_York' },
                description: 'Invented',
                isWheelchair: false
            });
        }
    ));

test('createManualActivity keeps an explicit autoCalcCalories', () =>
    withGarmin({ [`POST ${ACTIVITY}`]: {} }, async ({ gc, calls }) => {
        await gc.createManualActivity({ ...MANUAL, autoCalcCalories: false });
        assert.deepStrictEqual(calls()[0].body.metadataDTO, {
            autoCalcCalories: false
        });
    }));

test('createManualActivity validates its input before sending', () =>
    withGarmin({}, async ({ gc, requests }) => {
        const required = [
            'activityName',
            'activityType',
            'startTime',
            'timezone',
            'durationInSeconds'
        ];
        for (const key of required) {
            await assert.rejects(
                gc.createManualActivity({ ...MANUAL, [key]: undefined }),
                new RegExp(`Missing ${key}`)
            );
        }
        await assert.rejects(
            gc.createManualActivity({ ...MANUAL, timezone: 'Not/AZone' }),
            /Invalid startTime or timezone/
        );
        await assert.rejects(
            gc.createManualActivity({ ...MANUAL, startTime: new Date('x') }),
            /Invalid startTime or timezone/
        );
        assert.strictEqual(requests.length, 0);
    }));

test('updateActivity puts only the changed fields and the activityId', () =>
    withGarmin(
        { [`PUT ${ACTIVITY}/101`]: undefined },
        async ({ gc, calls }) => {
            const changes = {
                activityName: 'New name',
                description: '',
                activityTypeDTO: { typeKey: 'hiking' },
                eventTypeDTO: { typeKey: 'race' },
                accessControlRuleDTO: { typeKey: 'groups' }
            };
            await gc.updateActivity(101, changes);
            assert.strictEqual(calls()[0].method, 'PUT');
            assert.strictEqual(calls()[0].path, `${ACTIVITY}/101`);
            assert.deepStrictEqual(calls()[0].query, {});
            assert.deepStrictEqual(calls()[0].body, {
                ...changes,
                activityId: 101
            });
        }
    ));

test('updateActivity always sends the activityId of its first argument', () =>
    withGarmin(
        { [`PUT ${ACTIVITY}/101`]: undefined },
        async ({ gc, calls }) => {
            await gc.updateActivity(101, { description: 'd', activityId: 999 });
            assert.strictEqual(calls()[0].body.activityId, 101);
        }
    ));

test('updateActivity requires an activityId and changes', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(
            gc.updateActivity(undefined, { description: 'd' }),
            /Missing activityId/
        );
        await assert.rejects(gc.updateActivity(101), /Missing changes/);
        await assert.rejects(gc.updateActivity(101, {}), /Missing changes/);
        assert.strictEqual(requests.length, 0);
    }));

test('deleteActivityPhoto deletes the encoded image', () =>
    withGarmin(
        { [`DELETE ${ACTIVITY}/101/image/a b/c`]: undefined },
        async ({ gc, calls }) => {
            await gc.deleteActivityPhoto(101, 'a b/c');
            assert.strictEqual(calls()[0].method, 'DELETE');
            assert.strictEqual(
                calls()[0].headers['x-http-method-override'],
                'DELETE'
            );
            assert.strictEqual(calls()[0].rawBody, '');
            assert.deepStrictEqual(calls()[0].query, {});
        }
    ));

test('deleteActivityPhoto requires both ids', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(
            gc.deleteActivityPhoto(undefined, 'a'),
            /Missing activityId/
        );
        await assert.rejects(gc.deleteActivityPhoto(101), /Missing imageId/);
        assert.strictEqual(requests.length, 0);
    }));
