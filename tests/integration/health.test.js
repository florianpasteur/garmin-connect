const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withGarmin } = require('../helpers/fake-garmin');

// Local noon, so that the calendar day is the same in every time zone
const date = (day) => new Date(day + 'T12:00:00');
const DAY = '2026-01-15';

// 60 days, in the three chunks of at most 28 days that Garmin accepts
const FROM = date('2026-01-01');
const TO = date('2026-03-01');
const CHUNKS = [
    ['2026-01-01', '2026-01-28'],
    ['2026-01-29', '2026-02-25'],
    ['2026-02-26', '2026-03-01']
];

const summary = (call) => ({
    method: call.method,
    path: call.path,
    query: call.query,
    body: call.body
});
const get = (url, query = {}) => ({
    method: 'GET',
    path: url,
    query,
    body: undefined
});
const routesFor = (paths, reply) =>
    paths.reduce((routes, url) => {
        routes['GET ' + url] = reply;
        return routes;
    }, {});

// --- single day and single request reads ------------------------------------

const reads = [
    {
        name: 'getDailySummary',
        args: [date(DAY)],
        path: '/usersummary-service/usersummary/daily/tester',
        query: { calendarDate: DAY },
        reply: { calendarDate: DAY, totalSteps: 12, restingHeartRate: null }
    },
    {
        name: 'getStress',
        args: [date(DAY)],
        path: `/wellness-service/wellness/dailyStress/${DAY}`,
        reply: { calendarDate: DAY, stressValuesArray: [] }
    },
    {
        name: 'getBodyBatteryEvents',
        args: [date(DAY)],
        path: `/wellness-service/wellness/bodyBattery/events/${DAY}`,
        reply: [{ made: 'up' }],
        empty: []
    },
    {
        name: 'getRespiration',
        args: [date(DAY)],
        path: `/wellness-service/wellness/daily/respiration/${DAY}`,
        reply: { calendarDate: DAY, respirationVersion: 1 }
    },
    {
        name: 'getSpO2',
        args: [date(DAY)],
        path: `/wellness-service/wellness/daily/spo2acclimation/${DAY}`,
        reply: { calendarDate: DAY, averageSpO2: null }
    },
    {
        name: 'getIntensityMinutes',
        args: [date(DAY)],
        path: `/wellness-service/wellness/daily/im/${DAY}`,
        reply: { calendarDate: DAY, weekGoal: 150 }
    },
    {
        name: 'getFloors',
        args: [date(DAY)],
        path: `/wellness-service/wellness/floorsChartData/daily/${DAY}`,
        reply: { floorValuesArray: [] }
    },
    {
        name: 'getStepsChart',
        args: [date(DAY)],
        path: '/wellness-service/wellness/dailySummaryChart/',
        query: { date: DAY },
        reply: [{ made: 'up' }],
        empty: []
    },
    {
        name: 'getDailyEvents',
        args: [date(DAY)],
        path: '/wellness-service/wellness/dailyEvents/tester',
        query: { calendarDate: DAY },
        reply: [{ made: 'up' }],
        empty: []
    },
    {
        name: 'getHrv',
        args: [date(DAY)],
        path: `/hrv-service/hrv/${DAY}`,
        reply: { made: 'up' },
        empty: null
    },
    {
        name: 'getHealthStatus',
        args: [date(DAY)],
        path: `/healthstatus-service/healthstatus/summary/${DAY}`,
        reply: { made: 'up' },
        empty: null
    },
    {
        name: 'getSleep',
        args: [date(DAY)],
        path: '/sleep-service/sleep/dailySleep',
        query: { date: DAY },
        reply: { calendarDate: DAY, sleepTimeSeconds: 100 },
        empty: null
    },
    {
        name: 'getNaps',
        args: [date(DAY)],
        path: `/sleep-service/sleep/naps/${DAY}`,
        reply: [{ made: 'up' }],
        empty: []
    },
    {
        name: 'getWeightRange',
        args: [date('2025-01-01'), date('2026-01-31')],
        path: '/weight-service/weight/range/2025-01-01/2026-01-31',
        query: { includeAll: 'true' },
        reply: {
            dailyWeightSummaries: [
                {
                    summaryDate: DAY,
                    numOfWeightEntries: 1,
                    minWeight: 70000,
                    maxWeight: 70000,
                    latestWeight: { weight: 70000 },
                    allWeightMetrics: [{ weight: 70000 }]
                }
            ],
            totalAverage: { weight: 70000 },
            previousDateWeight: null,
            nextDateWeight: null
        }
    },
    {
        name: 'getLatestWeight',
        args: [date(DAY)],
        path: '/weight-service/weight/latest',
        query: { date: DAY, ignorePriority: 'true' },
        reply: { weight: 70000, sourceType: 'MANUAL' },
        empty: null
    },
    {
        name: 'getFirstWeight',
        args: [],
        path: '/weight-service/weight/first',
        reply: { weight: 71000, sourceType: 'MANUAL' },
        empty: null
    },
    {
        name: 'getWeightGoals',
        args: [date('2025-01-01'), date('2026-01-31')],
        path: '/goal-service/goal/user/effective/weightgoal/2025-01-01/2026-01-31',
        reply: {
            userGoals: [{ userGoalPk: 1, goalValue: 68000 }],
            userGoalRanges: null
        }
    },
    {
        name: 'getHydrationSummary',
        args: [date(DAY)],
        path: `/usersummary-service/usersummary/hydration/daily/${DAY}`,
        reply: { calendarDate: DAY, valueInML: null, goalInML: 2000 }
    },
    {
        name: 'getWellnessActivities',
        args: [3, 5, date(DAY)],
        path: '/wellnessactivity-service/activity/summary/list',
        query: { start: '3', limit: '5', until: DAY },
        reply: [{ made: 'up' }],
        empty: []
    },
    {
        name: 'getLifestyleLog',
        args: [date(DAY)],
        path: `/lifestylelogging-service/dailyLog/${DAY}`,
        reply: { calendarDate: DAY, completionStats: [] }
    }
];

for (const read of reads) {
    test(`${read.name} reads ${read.path}`, () =>
        withGarmin(
            { ['GET ' + read.path]: read.reply },
            async ({ gc, calls }) => {
                assert.deepStrictEqual(
                    await gc[read.name](...read.args),
                    read.reply
                );
                assert.deepStrictEqual(calls().map(summary), [
                    get(read.path, read.query)
                ]);
            }
        ));

    if ('empty' in read) {
        test(`${read.name} returns ${JSON.stringify(read.empty)} for 204`, () =>
            withGarmin({ ['GET ' + read.path]: () => ({}) }, async ({ gc }) => {
                assert.deepStrictEqual(
                    await gc[read.name](...read.args),
                    read.empty
                );
            }));
    }
}

test('single day reads default to today', () =>
    withGarmin({}, async ({ gc, calls }) => {
        const now = new Date();
        const two = (n) => (n < 10 ? '0' + n : '' + n);
        const today = [
            now.getFullYear(),
            two(now.getMonth() + 1),
            two(now.getDate())
        ].join('-');
        await assert.rejects(gc.getStress(), /\(404\)/);
        await assert.rejects(gc.getWellnessActivities(), /\(404\)/);
        const [stress, activities] = calls();
        assert.ok(stress.path.endsWith('/dailyStress/' + today), stress.path);
        assert.deepStrictEqual(activities.query, {
            start: '1',
            limit: '20',
            until: today
        });
    }));

test('the display name is encoded in the path', () =>
    withGarmin(
        {
            'GET /userprofile-service/socialProfile': {
                profileId: 1,
                displayName: 'a b?c'
            },
            'GET /usersummary-service/usersummary/daily/a b?c': {}
        },
        async ({ gc, calls }) => {
            await gc.getDailySummary(date(DAY));
            assert.deepStrictEqual(calls()[0].query, { calendarDate: DAY });
        }
    ));

// --- ranges returning lists -------------------------------------------------

const pathRange = (prefix) => ({
    request: ([from, to]) => get(`${prefix}/${from}/${to}`),
    routes: (reply) =>
        routesFor(
            CHUNKS.map(([from, to]) => `${prefix}/${from}/${to}`),
            reply
        )
});
const queryRange = (url) => ({
    request: ([startDate, endDate]) => get(url, { startDate, endDate }),
    routes: (reply) => routesFor([url], reply)
});
const stats = (metric) =>
    pathRange(`/usersummary-service/stats/${metric}/daily`);

const lists = {
    getBodyBattery: queryRange(
        '/wellness-service/wellness/bodyBattery/reports/daily'
    ),
    getSleepSummaries: queryRange(
        '/sleep-service/sleep/dailySleepSummariesByDate'
    ),
    getSleepScores: pathRange('/wellness-service/stats/daily/sleep/score'),
    getStepsRange: stats('steps'),
    getStressRange: stats('stress'),
    getRestingHeartRateRange: stats('heartRate'),
    getIntensityMinutesRange: stats('im'),
    getFloorsRange: stats('floors'),
    getHydrationRange: stats('hydration'),
    getRespirationRange: stats('respiration'),
    getBodyBatteryRange: stats('bodybattery')
};

for (const name of Object.keys(lists)) {
    const { request, routes } = lists[name];

    test(`${name} requests 28 days at a time and concatenates`, () => {
        let count = 0;
        // The middle chunk has no content
        const reply = () => {
            count += 1;
            return count === 2 ? {} : { body: [{ n: count }, { n: -count }] };
        };
        return withGarmin(routes(reply), async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc[name](FROM, TO), [
                { n: 1 },
                { n: -1 },
                { n: 3 },
                { n: -3 }
            ]);
            assert.deepStrictEqual(calls().map(summary), CHUNKS.map(request));
        });
    });

    test(`${name} is empty without data`, () =>
        withGarmin(
            routes(() => ({})),
            async ({ gc }) => {
                assert.deepStrictEqual(await gc[name](FROM, TO), []);
            }
        ));
}

test('a range of 28 days is one request and 29 days are two', () => {
    const { routes } = lists.getBodyBattery;
    return withGarmin(
        routes(() => ({ body: [] })),
        async ({ gc, calls }) => {
            await gc.getBodyBattery(date('2026-01-01'), date('2026-01-28'));
            assert.strictEqual(calls().length, 1);
            await gc.getBodyBattery(date('2026-01-01'), date('2026-01-29'));
            assert.strictEqual(calls().length, 3);
            assert.deepStrictEqual(calls()[2].query, {
                startDate: '2026-01-29',
                endDate: '2026-01-29'
            });
        }
    );
});

test('chunked ranges reject a start after the end', () =>
    withGarmin({}, async ({ gc, calls }) => {
        const names = Object.keys(lists).concat('getSleepStats', 'getHrvRange');
        for (const name of names) {
            await assert.rejects(
                gc[name](TO, FROM),
                /start date is after end date/,
                name
            );
        }
        assert.strictEqual(calls().length, 0);
    }));

test('a failing chunk rejects the whole range', () => {
    const prefix = '/usersummary-service/stats/stress/daily';
    return withGarmin(
        { [`GET ${prefix}/2026-01-01/2026-01-28`]: [] },
        async ({ gc, calls }) => {
            await assert.rejects(gc.getStressRange(FROM, TO), /\(404\)/);
            assert.strictEqual(calls().length, 2);
        }
    );
});

test('getSteps picks the day out of getStepsRange', () => {
    const url = `/usersummary-service/stats/steps/daily/${DAY}/${DAY}`;
    return withGarmin(
        { ['GET ' + url]: [{ calendarDate: DAY, totalSteps: 42 }] },
        async ({ gc, calls }) => {
            assert.strictEqual(await gc.getSteps(date(DAY)), 42);
            assert.deepStrictEqual(calls().map(summary), [get(url)]);
        }
    );
});

test('getSteps rejects a day without content', () =>
    withGarmin(
        {
            [`GET /usersummary-service/stats/steps/daily/${DAY}/${DAY}`]:
                () => ({})
        },
        async ({ gc }) => {
            await assert.rejects(gc.getSteps(date(DAY)), /Can't find/);
        }
    ));

// --- sleep statistics and HRV -----------------------------------------------

const sleepStats = pathRange('/sleep-service/stats/sleep/daily');

test('getSleepStats concatenates nights and keeps averages per period', () => {
    let count = 0;
    const reply = () => {
        count += 1;
        if (count === 2) return {};
        return {
            body: {
                overallStats: { averageSleepSeconds: count * 100 },
                individualStats: [
                    {
                        calendarDate: CHUNKS[count - 1][0],
                        values: { totalSleepTimeInSeconds: count }
                    }
                ]
            }
        };
    };
    return withGarmin(sleepStats.routes(reply), async ({ gc, calls }) => {
        assert.deepStrictEqual(await gc.getSleepStats(FROM, TO), {
            individualStats: [
                {
                    calendarDate: '2026-01-01',
                    values: { totalSleepTimeInSeconds: 1 }
                },
                {
                    calendarDate: '2026-02-26',
                    values: { totalSleepTimeInSeconds: 3 }
                }
            ],
            periods: [
                {
                    startDate: '2026-01-01',
                    endDate: '2026-01-28',
                    overallStats: { averageSleepSeconds: 100 }
                },
                {
                    startDate: '2026-02-26',
                    endDate: '2026-03-01',
                    overallStats: { averageSleepSeconds: 300 }
                }
            ]
        });
        assert.deepStrictEqual(
            calls().map(summary),
            CHUNKS.map(sleepStats.request)
        );
    });
});

test('getSleepStats is empty without data', () =>
    withGarmin(
        sleepStats.routes(() => ({})),
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getSleepStats(FROM, TO), {
                individualStats: [],
                periods: []
            });
        }
    ));

const hrvRange = pathRange('/hrv-service/hrv/daily');

test('getHrvRange returns each response with its period', () => {
    let count = 0;
    const reply = () => {
        count += 1;
        return count === 2 ? {} : { body: { made: count } };
    };
    return withGarmin(hrvRange.routes(reply), async ({ gc, calls }) => {
        assert.deepStrictEqual(await gc.getHrvRange(FROM, TO), [
            {
                startDate: '2026-01-01',
                endDate: '2026-01-28',
                data: { made: 1 }
            },
            {
                startDate: '2026-02-26',
                endDate: '2026-03-01',
                data: { made: 3 }
            }
        ]);
        assert.deepStrictEqual(
            calls().map(summary),
            CHUNKS.map(hrvRange.request)
        );
    });
});

test('getHrvRange is empty for 204', () =>
    withGarmin(
        hrvRange.routes(() => ({})),
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getHrvRange(FROM, TO), []);
        }
    ));

// --- wellness file download -------------------------------------------------

const FILE_PATH = `/download-service/files/wellness/${DAY}`;
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gc-health-'));

test('downloadDailyWellnessFile saves the bytes unchanged', async () => {
    // Not valid UTF-8, so text decoding would corrupt it
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff, 0xfe, 0x80]);
    const root = tempDir();
    const dir = path.join(root, 'new');
    try {
        await withGarmin(
            { ['GET ' + FILE_PATH]: () => ({ body: zip }) },
            async ({ gc, calls }) => {
                const file = await gc.downloadDailyWellnessFile(date(DAY), dir);
                assert.strictEqual(file, path.join(dir, `wellness-${DAY}.zip`));
                assert.deepStrictEqual(fs.readFileSync(file), zip);
                assert.deepStrictEqual(calls().map(summary), [get(FILE_PATH)]);
            }
        );
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('downloadDailyWellnessFile writes nothing for 204', async () => {
    const dir = tempDir();
    try {
        await withGarmin(
            { ['GET ' + FILE_PATH]: () => ({}) },
            async ({ gc }) => {
                assert.strictEqual(
                    await gc.downloadDailyWellnessFile(date(DAY), dir),
                    null
                );
                assert.deepStrictEqual(fs.readdirSync(dir), []);
            }
        );
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('downloadDailyWellnessFile requires a date and a directory', () =>
    withGarmin({}, async ({ gc, calls }) => {
        await assert.rejects(
            gc.downloadDailyWellnessFile(undefined, 'x'),
            /Missing date/
        );
        await assert.rejects(
            gc.downloadDailyWellnessFile(date(DAY)),
            /Missing dir/
        );
        assert.strictEqual(calls().length, 0);
    }));
