const test = require('node:test');
const assert = require('node:assert');
const { withGarmin, PROFILE } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const { toDateString } = load('garmin/common/DateUtils');

const date = (day) => new Date(day + 'T12:00:00Z');
const DAY = date('2026-03-15');
const START = date('2026-01-01');
const END = date('2026-03-15');

const METRICS = '/metrics-service/metrics';
const BIOMETRIC = '/biometric-service';

/** Calls one method and checks the single GET it sends and what it returns */
function readTest(name, { call, path, query = {}, reply, expected }) {
    test(name, () =>
        withGarmin({ [`GET ${path}`]: reply }, async ({ gc, calls }) => {
            assert.deepStrictEqual(
                await call(gc),
                expected === undefined ? reply : expected
            );
            assert.strictEqual(calls().length, 1);
            const [request] = calls();
            assert.strictEqual(request.method, 'GET');
            assert.strictEqual(request.path, path);
            assert.deepStrictEqual(request.query, query);
            assert.strictEqual(request.rawBody, '');
        })
    );
}

readTest('getTrainingReadiness reads the day', {
    call: (gc) => gc.getTrainingReadiness(DAY),
    path: `${METRICS}/trainingreadiness/2026-03-15`,
    reply: []
});

readTest('getTrainingStatus reads the aggregated status', {
    call: (gc) => gc.getTrainingStatus(DAY),
    path: `${METRICS}/trainingstatus/aggregated/2026-03-15`,
    reply: {
        userId: 1,
        mostRecentVO2Max: null,
        mostRecentTrainingLoadBalance: null,
        mostRecentTrainingStatus: null,
        heatAltitudeAcclimationDTO: null
    }
});

readTest('getVo2Max reads the latest values', {
    call: (gc) => gc.getVo2Max(DAY),
    path: `${METRICS}/maxmet/latest/2026-03-15`,
    reply: {
        userId: 1,
        generic: null,
        cycling: null,
        heatAltitudeAcclimation: null
    }
});

readTest('getVo2MaxRange puts both dates in the path', {
    call: (gc) => gc.getVo2MaxRange(START, END),
    path: `${METRICS}/maxmet/daily/2026-01-01/2026-03-15`,
    reply: []
});

readTest('getRacePredictions reads the latest predictions', {
    call: (gc) => gc.getRacePredictions(),
    path: `${METRICS}/racepredictions/latest/tester`,
    reply: { invented: 1 }
});

readTest('getRacePredictions returns null on 204', {
    call: (gc) => gc.getRacePredictions(),
    path: `${METRICS}/racepredictions/latest/tester`,
    reply: undefined,
    expected: null
});

readTest('getRacePredictionsRange sends the calendar dates', {
    call: (gc) => gc.getRacePredictionsRange(START, END),
    path: `${METRICS}/racepredictions/daily/tester`,
    query: { fromCalendarDate: '2026-01-01', toCalendarDate: '2026-03-15' },
    reply: []
});

[
    ['getEnduranceScore', 'endurancescore'],
    ['getHillScore', 'hillscore']
].forEach(([method, segment]) => {
    const request = {
        call: (gc) => gc[method](DAY),
        path: `${METRICS}/${segment}`,
        query: { calendarDate: '2026-03-15' }
    };
    readTest(`${method} sends the calendar date`, {
        ...request,
        reply: { invented: 1 }
    });
    readTest(`${method} returns null on 204`, {
        ...request,
        reply: undefined,
        expected: null
    });
});

readTest('getRunningTolerance aggregates daily by default', {
    call: (gc) => gc.getRunningTolerance(START, END),
    path: `${METRICS}/runningtolerance/stats`,
    query: {
        startDate: '2026-01-01',
        endDate: '2026-03-15',
        aggregation: 'daily'
    },
    reply: []
});

readTest('getRunningTolerance can aggregate weekly', {
    call: (gc) => gc.getRunningTolerance(START, END, 'weekly'),
    path: `${METRICS}/runningtolerance/stats`,
    query: {
        startDate: '2026-01-01',
        endDate: '2026-03-15',
        aggregation: 'weekly'
    },
    reply: []
});

readTest('getHeatAltitudeAcclimation reads the day', {
    call: (gc) => gc.getHeatAltitudeAcclimation(DAY),
    path: `${METRICS}/heataltitudeacclimation/latest/2026-03-15`,
    reply: { invented: 1 }
});

readTest('getHeatAltitudeAcclimation returns null on 204', {
    call: (gc) => gc.getHeatAltitudeAcclimation(DAY),
    path: `${METRICS}/heataltitudeacclimation/latest/2026-03-15`,
    reply: undefined,
    expected: null
});

const component = { stale: true, staleInputs: ['invented'] };

readTest('getFitnessAge reads the day', {
    call: (gc) => gc.getFitnessAge(DAY),
    path: '/fitnessage-service/fitnessage/2026-03-15',
    reply: {
        chronologicalAge: 40,
        components: {
            vigorousDaysAvg: component,
            rhr: component,
            vigorousMinutesAvg: component,
            bmi: { ...component, lastMeasurementDate: '2026-03-01' }
        },
        lastUpdated: '2026-03-15T00:00:00.0'
    }
});

readTest('getLactateThreshold reads the latest threshold', {
    call: (gc) => gc.getLactateThreshold(),
    path: `${BIOMETRIC}/biometric/latestLactateThreshold`,
    reply: []
});

readTest('getFtp reads the threshold power of a sport', {
    call: (gc) => gc.getFtp('CYCLING'),
    path: `${BIOMETRIC}/biometric/latestFunctionalThresholdPower/CYCLING`,
    reply: {
        userProfilePK: 1,
        version: null,
        calendarDate: null,
        isStale: null,
        sequence: null,
        sport: null,
        functionalThresholdPower: null,
        biometricSourceType: null
    }
});

readTest('getFtp encodes the sport', {
    call: (gc) => gc.getFtp('A?b=#c'),
    path: `${BIOMETRIC}/biometric/latestFunctionalThresholdPower/A?b=#c`,
    reply: { userProfilePK: 1 }
});

test('getFtp requires a sport', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getFtp(), /Missing sport/);
        await assert.rejects(gc.getFtp(''), /Missing sport/);
        assert.strictEqual(requests.length, 0);
    }));

readTest('getHeartRateZones reads the zones, with the trailing slash', {
    call: (gc) => gc.getHeartRateZones(),
    path: `${BIOMETRIC}/heartRateZones/`,
    reply: [
        {
            trainingMethod: 'HR_MAX',
            restingHeartRateUsed: null,
            lactateThresholdHeartRateUsed: null,
            zone1Floor: 90,
            zone2Floor: 108,
            zone3Floor: 126,
            zone4Floor: 144,
            zone5Floor: 162,
            maxHeartRateUsed: 180,
            restingHrAutoUpdateUsed: false,
            sport: 'DEFAULT',
            changeState: 'UNCHANGED'
        }
    ]
});

readTest('getPowerZones reads the zones of all sports', {
    call: (gc) => gc.getPowerZones(),
    path: `${BIOMETRIC}/powerZones/sports/all`,
    reply: [
        {
            sport: 'CYCLING',
            functionalThresholdPower: 200,
            zone1Floor: 1,
            zone2Floor: 110,
            zone3Floor: 150,
            zone4Floor: 180,
            zone5Floor: 210,
            zone6Floor: 240,
            zone7Floor: 300,
            userLocalTime: null
        }
    ]
});

readTest('getCriticalSwimSpeed reads the day', {
    call: (gc) => gc.getCriticalSwimSpeed(DAY),
    path: `${BIOMETRIC}/criticalSwimSpeed/latest/2026-03-15`,
    reply: { invented: 1 }
});

readTest('getCriticalSwimSpeed returns null on 204', {
    call: (gc) => gc.getCriticalSwimSpeed(DAY),
    path: `${BIOMETRIC}/criticalSwimSpeed/latest/2026-03-15`,
    reply: undefined,
    expected: null
});

const activityType = { typeId: 1, typeKey: 'running' };

readTest('getUserStatistics reads the totals of the user', {
    call: (gc) => gc.getUserStatistics(),
    path: '/userstats-service/statistics/tester',
    reply: {
        userProfileId: 1,
        statisticsStartDate: null,
        statisticsEndDate: null,
        userMetrics: [
            {
                userProfileId: null,
                activityType,
                parentActivityType: activityType,
                totalActivities: 2,
                totalDistance: 1000,
                totalDuration: 600,
                totalCalories: 100,
                totalElevationGain: 10,
                visibleCount: 2
            }
        ]
    }
});

const wellness = {
    userProfileId: 1,
    statisticsStartDate: '2026-01-01',
    statisticsEndDate: '2026-03-15',
    allMetrics: {
        metricsMap: { WELLNESS_RESTING_HEART_RATE: [{ value: 50 }] }
    },
    groupedMetrics: null
};

readTest('getUserWellnessStatistics reads resting heart rate by default', {
    call: (gc) => gc.getUserWellnessStatistics(START, END),
    path: '/userstats-service/wellness/daily/tester',
    query: {
        fromDate: '2026-01-01',
        untilDate: '2026-03-15',
        metricId: '60'
    },
    reply: wellness
});

readTest('getUserWellnessStatistics accepts another metric', {
    call: (gc) => gc.getUserWellnessStatistics(START, END, 7),
    path: '/userstats-service/wellness/daily/tester',
    query: { fromDate: '2026-01-01', untilDate: '2026-03-15', metricId: '7' },
    reply: wellness
});

readTest('getPersonalInformation reads the details of the user', {
    call: (gc) => gc.getPersonalInformation(),
    path: '/userprofile-service/userprofile/personal-information/tester',
    reply: {
        userInfo: {
            birthDate: '1990-01-01',
            genderType: null,
            email: 'someone@example.com',
            locale: 'en',
            timeZone: 'Etc/UTC',
            age: 36,
            countryCode: 'XX'
        },
        biometricProfile: {
            userId: 1,
            height: null,
            weight: 70000,
            vo2Max: null,
            vo2MaxCycling: null,
            vo2MaxRowing: null,
            lactateThresholdHeartRate: null,
            activityClass: null,
            functionalThresholdPower: null,
            criticalSwimSpeed: null
        },
        timeZone: 'Etc/UTC',
        locale: 'en',
        birthDate: '1990-01-01',
        gender: null
    }
});

test('the display name is encoded in paths', () =>
    withGarmin(
        {
            'GET /userprofile-service/socialProfile': {
                ...PROFILE,
                displayName: 'a?b#c'
            },
            'GET /userstats-service/statistics/a?b#c': {},
            'GET /userstats-service/wellness/daily/a?b#c': {},
            'GET /userprofile-service/userprofile/personal-information/a?b#c':
                {},
            [`GET ${METRICS}/racepredictions/latest/a?b#c`]: {},
            [`GET ${METRICS}/racepredictions/daily/a?b#c`]: []
        },
        async ({ gc, calls }) => {
            await gc.getUserStatistics();
            await gc.getUserWellnessStatistics(START, END);
            await gc.getPersonalInformation();
            await gc.getRacePredictions();
            await gc.getRacePredictionsRange(START, END);
            assert.strictEqual(calls().length, 5);
        }
    ));

test('single day reads default to today', () =>
    withGarmin({}, async ({ gc, calls }) => {
        const methods = [
            'getTrainingReadiness',
            'getTrainingStatus',
            'getVo2Max',
            'getEnduranceScore',
            'getHillScore',
            'getHeatAltitudeAcclimation',
            'getFitnessAge',
            'getCriticalSwimSpeed'
        ];
        const before = toDateString(new Date());
        // The fake server has no routes, so every call is rejected.
        for (let i = 0; i < methods.length; i++) {
            await assert.rejects(gc[methods[i]]());
        }
        const today = [before, toDateString(new Date())];
        assert.strictEqual(calls().length, methods.length);
        calls().forEach((request) => {
            const day =
                request.query.calendarDate || request.path.split('/').pop();
            assert.ok(today.indexOf(day) >= 0, request.path);
        });
    }));
