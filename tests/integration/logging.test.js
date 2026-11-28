// A fixed zone away from UTC, so that mixing up local and GMT times shows
process.env.TZ = 'America/Los_Angeles';

const test = require('node:test');
const assert = require('node:assert');
const { withGarmin } = require('../helpers/fake-garmin');

// 18:30 on 4 March in Los Angeles, already 5 March in GMT
const EVENING = new Date('2024-03-05T02:30:00.123Z');
const NOON = new Date('2024-03-05T20:00:00.000Z');
const DAY = '2024-03-05';

const HYDRATION = '/usersummary-service/usersummary/hydration/log';
const BP = '/bloodpressure-service/bloodpressure';
const SLEEP = '/sleep-service/sleep';
const NUTRITION = '/nutrition-service';
const CYCLE = '/periodichealth-service/menstrualcycle';
const GLUCOSE = '/biometric-service/biometric/glucose';

const MEASUREMENT = {
    version: 111,
    systolic: 118,
    diastolic: 76,
    pulse: 61,
    multiMeasurement: false,
    notes: 'invented',
    sourceType: 'MANUAL',
    measurementTimestampLocal: '2024-03-05T08:00:00.0',
    measurementTimestampGMT: '2024-03-05T16:00:00.0',
    category: 'NORMAL',
    categoryName: 'Normal'
};
const READING = { systolic: 118, diastolic: 76, pulse: 61 };

const sent = (request) => ({
    method: request.method,
    path: request.path,
    query: request.query,
    body: request.body
});

/** Runs `body` with another system timezone */
async function inTimezone(timezone, body) {
    const previous = process.env.TZ;
    process.env.TZ = timezone;
    try {
        await body();
    } finally {
        process.env.TZ = previous;
    }
}

/**
 * Calls one read method and checks the request, the returned data and, unless
 * `optional` is false, that 204 becomes null
 */
async function checkRead({ call, path, query = {}, reply, optional = true }) {
    await withGarmin({ [`GET ${path}`]: reply }, async ({ gc, calls }) => {
        assert.deepStrictEqual(await call(gc), reply);
        assert.deepStrictEqual(sent(calls()[0]), {
            method: 'GET',
            path,
            query,
            body: undefined
        });
    });
    if (optional) {
        await withGarmin(
            { [`GET ${path}`]: () => ({ body: undefined }) },
            async ({ gc }) => assert.strictEqual(await call(gc), null)
        );
    }
}

/** Calls one write method and returns the single request it sent */
async function writeRequest(key, call, reply) {
    let request;
    await withGarmin({ [key]: reply }, async ({ gc, calls }) => {
        await call(gc);
        assert.strictEqual(calls().length, 1);
        request = calls()[0];
    });
    return sent(request);
}

/** Every call must throw `message` without sending anything */
async function checkRejected(cases) {
    await withGarmin({}, async ({ gc, requests }) => {
        for (const [call, message] of cases) {
            await assert.rejects(call(gc), message);
        }
        assert.strictEqual(requests.length, 0);
    });
}

// Weight

test('updateWeight posts pounds by default', () =>
    inTimezone('America/Los_Angeles', async () => {
        const request = await writeRequest(
            'POST /weight-service/user-weight',
            (gc) => gc.updateWeight(NOON, 180.4, 'Europe/Paris')
        );
        assert.deepStrictEqual(request.body, {
            dateTimestamp: '2024-03-05T21:00:00.000',
            gmtTimestamp: '2024-03-05T20:00:00.000',
            unitKey: 'lbs',
            value: 180.4
        });
    }));

test('updateWeight accepts kilograms', () =>
    inTimezone('UTC', async () => {
        const request = await writeRequest(
            'POST /weight-service/user-weight',
            (gc) => gc.updateWeight(NOON, 81.5, 'UTC', 'kg')
        );
        assert.strictEqual(request.body.unitKey, 'kg');
        assert.strictEqual(request.body.value, 81.5);
        assert.strictEqual(
            request.body.dateTimestamp,
            '2024-03-05T20:00:00.000'
        );
    }));

test('updateWeight keeps its error message', () =>
    withGarmin({}, async ({ gc }) => {
        await assert.rejects(
            gc.updateWeight(NOON, 180, 'UTC'),
            /Error in updateWeight: .*404/
        );
    }));

test('deleteWeight deletes by local day and samplePk', async () => {
    const request = await writeRequest(
        'DELETE /weight-service/weight/2024-03-04/byversion/1700000000001',
        (gc) => gc.deleteWeight(EVENING, 1700000000001)
    );
    assert.strictEqual(request.method, 'DELETE');
    assert.strictEqual(request.body, undefined);
});

test('deleteWeight needs a date and a samplePk', () =>
    checkRejected([
        [(gc) => gc.deleteWeight(undefined, 1), /Missing date/],
        [(gc) => gc.deleteWeight(NOON), /Missing samplePk/]
    ]));

// Hydration

test('updateHydrationLogMl sends the local day and time', () =>
    withGarmin(
        { [`PUT ${HYDRATION}`]: { valueInML: 750 } },
        async ({ gc, calls, requests }) => {
            assert.deepStrictEqual(
                await gc.updateHydrationLogMl(EVENING, 250),
                { valueInML: 750 }
            );
            await gc.updateHydrationLogMl(EVENING, -250);
            assert.deepStrictEqual(calls()[0].body, {
                calendarDate: '2024-03-04',
                valueInML: 250,
                userProfileId: 1,
                timestampLocal: '2024-03-04T18:30:00.123'
            });
            assert.strictEqual(calls()[1].body.valueInML, -250);
            // the profile is fetched once
            assert.strictEqual(requests.length, 3);
        }
    ));

test('updateHydrationLogOunces converts and uses the cached profile', () =>
    withGarmin(
        { [`PUT ${HYDRATION}`]: {} },
        async ({ gc, calls, requests }) => {
            await gc.updateHydrationLogOunces(EVENING, 10);
            await gc.updateHydrationLogOunces(EVENING, 0);
            assert.deepStrictEqual(calls()[0].body, {
                calendarDate: '2024-03-04',
                valueInML: 295.735,
                userProfileId: 1,
                timestampLocal: '2024-03-04T18:30:00.123'
            });
            assert.strictEqual(calls()[1].body.valueInML, 0);
            assert.strictEqual(requests.length, 3);
        }
    ));

test('hydration writes need a number', async () => {
    await checkRejected([
        [(gc) => gc.updateHydrationLogMl(NOON), /Missing valueInML/],
        [(gc) => gc.updateHydrationLogMl(NOON, NaN), /Missing valueInML/],
        [
            (gc) => gc.updateHydrationLogOunces(NOON),
            /Error in updateHydrationLogOunces: Missing valueInML/
        ]
    ]);
});

// Blood pressure

test('getBloodPressureRange asks for all measurements', () =>
    checkRead({
        call: (gc) => gc.getBloodPressureRange(EVENING, NOON),
        path: `${BP}/range/2024-03-04/${DAY}`,
        query: { includeAll: 'true' },
        reply: {
            from: '2024-03-04',
            until: DAY,
            measurementSummaries: [
                {
                    startDate: DAY,
                    endDate: DAY,
                    highSystolic: 118,
                    highDiastolic: 76,
                    lowSystolic: 118,
                    lowDiastolic: 76,
                    numOfMeasurements: 1,
                    category: 'NORMAL',
                    categoryName: 'Normal',
                    measurements: [MEASUREMENT]
                }
            ],
            categoryStats: {
                from: '2024-03-04',
                until: DAY,
                noOfDaysNormal: 1,
                noOfDaysElevated: 0,
                noOfDaysStage1: 0,
                noOfDaysStage2: 0,
                noOfDaysCritical: 0,
                categoryCounts: { NORMAL: 1 }
            }
        }
    }));

test('getBloodPressureDay reads one local day', () =>
    checkRead({
        call: (gc) => gc.getBloodPressureDay(EVENING),
        path: `${BP}/dayview/2024-03-04`,
        reply: {
            startDate: '2024-03-04',
            endDate: '2024-03-04',
            bloodPressureMeasurements: [MEASUREMENT],
            totalMeasurementCount: null,
            elevatedMeasurementCount: null
        }
    }));

test('logBloodPressure writes timestamps in the system zone', async () => {
    const request = await writeRequest(
        `POST ${BP}`,
        (gc) => gc.logBloodPressure(READING, EVENING),
        MEASUREMENT
    );
    assert.deepStrictEqual(request, {
        method: 'POST',
        path: BP,
        query: {},
        body: {
            ...READING,
            sourceType: 'MANUAL',
            measurementTimestampLocal: '2024-03-04T18:30:00.123',
            measurementTimestampGMT: '2024-03-05T02:30:00.123',
            notes: ''
        }
    });
});

test('logBloodPressure writes timestamps in the given zone', async () => {
    const cases = [
        // half hour offset
        [EVENING, 'Asia/Kolkata', '2024-03-05T08:00:00.123'],
        // winter and summer time
        [EVENING, 'Europe/Paris', '2024-03-05T03:30:00.123'],
        [
            new Date('2024-07-05T02:30:00.000Z'),
            'Europe/Paris',
            '2024-07-05T04:30:00.000'
        ],
        // midnight is hour 00 of the new day
        [
            new Date('2024-03-04T23:00:00.000Z'),
            'Europe/Paris',
            '2024-03-05T00:00:00.000'
        ],
        [EVENING, 'UTC', '2024-03-05T02:30:00.123']
    ];
    for (const [date, timezone, local] of cases) {
        const { body } = await writeRequest(`POST ${BP}`, (gc) =>
            gc.logBloodPressure({ ...READING, notes: 'n' }, date, timezone)
        );
        assert.strictEqual(body.measurementTimestampLocal, local, timezone);
        assert.strictEqual(
            body.measurementTimestampGMT,
            date.toISOString().slice(0, 23)
        );
        assert.strictEqual(body.notes, 'n');
    }
});

test('updateBloodPressure puts the version', async () => {
    const request = await writeRequest(`PUT ${BP}`, (gc) =>
        gc.updateBloodPressure(
            111,
            { ...READING, notes: 'edited' },
            EVENING,
            'Asia/Kolkata'
        )
    );
    assert.strictEqual(request.method, 'PUT');
    assert.deepStrictEqual(request.body, {
        ...READING,
        sourceType: 'MANUAL',
        measurementTimestampLocal: '2024-03-05T08:00:00.123',
        measurementTimestampGMT: '2024-03-05T02:30:00.123',
        notes: 'edited',
        version: 111
    });
});

test('deleteBloodPressure deletes by local day and version', async () => {
    const request = await writeRequest(`DELETE ${BP}/2024-03-04/111`, (gc) =>
        gc.deleteBloodPressure(EVENING, 111)
    );
    assert.strictEqual(request.method, 'DELETE');
});

test('blood pressure writes validate their arguments', () =>
    checkRejected([
        [(gc) => gc.logBloodPressure(), /Missing systolic/],
        [
            (gc) => gc.logBloodPressure({ systolic: 1, diastolic: 1 }),
            /Missing systolic, diastolic or pulse/
        ],
        [
            (gc) => gc.logBloodPressure(READING, NOON, 'Nowhere/City'),
            /Invalid date or timezone/
        ],
        [
            (gc) => gc.logBloodPressure(READING, new Date('nope')),
            /Invalid date or timezone/
        ],
        [(gc) => gc.updateBloodPressure(0, READING, NOON), /Missing version/],
        [(gc) => gc.updateBloodPressure(1, READING), /Missing date/],
        [(gc) => gc.deleteBloodPressure(undefined, 1), /Missing date/],
        [(gc) => gc.deleteBloodPressure(NOON), /Missing version/]
    ]));

// Sleep

test('sleep writes send the payload as given', async () => {
    const payload = { calendarDate: DAY, invented: 1 };
    const cases = [
        ['POST', `${SLEEP}/dailySleep`, (gc) => gc.createManualSleep(payload)],
        [
            'PUT',
            `${SLEEP}/dailySleep/42`,
            (gc) => gc.updateManualSleep(42, payload)
        ],
        [
            'PUT',
            `${SLEEP}/dailySleep/42/note`,
            (gc) => gc.updateSleepNote(42, payload)
        ],
        ['POST', `${SLEEP}/nap`, (gc) => gc.logNap(payload)]
    ];
    for (const [method, path, call] of cases) {
        assert.deepStrictEqual(await writeRequest(`${method} ${path}`, call), {
            method,
            path,
            query: {},
            body: payload
        });
    }
});

test('sleep ids are encoded', async () => {
    await withGarmin({}, async ({ gc, calls }) => {
        await assert.rejects(gc.updateManualSleep('a/b?c', {}));
        assert.strictEqual(calls()[0].path, `${SLEEP}/dailySleep/a/b?c`);
        assert.deepStrictEqual(calls()[0].query, {});
    });
});

test('sleep writes validate their arguments', () =>
    checkRejected([
        [(gc) => gc.createManualSleep(), /Missing sleep/],
        [(gc) => gc.updateManualSleep(undefined, {}), /Missing sleepId/],
        [(gc) => gc.updateManualSleep(1), /Missing sleep/],
        [(gc) => gc.updateSleepNote(undefined, {}), /Missing sleepId/],
        [(gc) => gc.updateSleepNote(1), /Missing note/],
        [(gc) => gc.logNap(), /Missing nap/]
    ]));

// Nutrition

test('getNutritionDailyLog reads one day', () =>
    checkRead({
        call: (gc) => gc.getNutritionDailyLog(EVENING),
        path: `${NUTRITION}/food/logs/2024-03-04`,
        reply: {
            mealDate: '2024-03-04',
            dayStartTime: '00:00:00',
            dayEndTime: '23:59:59',
            dailyViewType: 'INVENTED',
            mealDetails: [],
            loggedFoodsWithServingSizes: [],
            micronutrientsSettings: {
                isTrackingEnabled: false,
                micronutrients: []
            }
        }
    }));

test('getNutritionMeals reads one day', () =>
    checkRead({
        call: (gc) => gc.getNutritionMeals(NOON),
        path: `${NUTRITION}/meals/${DAY}`,
        reply: { meals: [], dailyViewType: 'INVENTED' }
    }));

test('getNutritionSettings reads one day, null when unset', () =>
    checkRead({
        call: (gc) => gc.getNutritionSettings(NOON),
        path: `${NUTRITION}/settings/${DAY}`,
        reply: { invented: true }
    }));

test('getNutritionStatus reads the status', () =>
    checkRead({
        call: (gc) => gc.getNutritionStatus(),
        path: `${NUTRITION}/user/nutritionCurrentStatus`,
        reply: {
            currentStatus: 'INVENTED',
            hasUsedNutrition: false,
            hasUsedMFP: false
        },
        optional: false
    }));

test('searchFoods sends its defaults', () =>
    checkRead({
        call: (gc) => gc.searchFoods('rye bread & jam'),
        path: `${NUTRITION}/food/search`,
        query: {
            searchExpression: 'rye bread & jam',
            start: '0',
            limit: '20',
            regionCode: 'US',
            languageCode: 'en'
        },
        reply: { moreDataAvailable: false },
        optional: false
    }));

test('searchFoods normalises region and language', () =>
    checkRead({
        call: (gc) =>
            gc.searchFoods('oats', {
                start: 40,
                limit: 10,
                regionCode: 'fr',
                languageCode: 'FR'
            }),
        path: `${NUTRITION}/food/search`,
        query: {
            searchExpression: 'oats',
            start: '40',
            limit: '10',
            regionCode: 'FR',
            languageCode: 'fr'
        },
        reply: { moreDataAvailable: true },
        optional: false
    }));

test('getCustomFoods lists custom foods', () =>
    checkRead({
        call: (gc) => gc.getCustomFoods(),
        path: `${NUTRITION}/customFood`,
        query: {
            searchExpression: '',
            start: '0',
            limit: '20',
            includeContent: 'true'
        },
        reply: { invented: [] }
    }));

test('getCustomFood asks for one uuid', () =>
    checkRead({
        call: (gc) => gc.getCustomFood('abc-123'),
        path: `${NUTRITION}/customFood`,
        query: { customFoodUuid: 'abc-123' },
        reply: { invented: 1 }
    }));

test('food log writes send the day and the items', async () => {
    const items = [{ invented: 1 }];
    assert.deepStrictEqual(
        await writeRequest(`PUT ${NUTRITION}/food/logs`, (gc) =>
            gc.logFoods(EVENING, items)
        ),
        {
            method: 'PUT',
            path: `${NUTRITION}/food/logs`,
            query: {},
            body: { mealDate: '2024-03-04', foodLogItems: items }
        }
    );
    assert.deepStrictEqual(
        await writeRequest(`PUT ${NUTRITION}/food/logs/quickAdd`, (gc) =>
            gc.quickAddFoods(EVENING, items)
        ),
        {
            method: 'PUT',
            path: `${NUTRITION}/food/logs/quickAdd`,
            query: {},
            body: { mealDate: '2024-03-04', quickAddItems: items }
        }
    );
});

test('deleteFoodLogs sends a DELETE with the ids in the body', async () => {
    const path = `${NUTRITION}/food/logs/2024-03-04`;
    await withGarmin({ [`DELETE ${path}`]: undefined }, async (fake) => {
        await fake.gc.deleteFoodLogs(EVENING, ['a', 2]);
        const [request] = fake.calls();
        assert.deepStrictEqual(sent(request), {
            method: 'DELETE',
            path,
            query: {},
            body: { logIds: ['a', 2] }
        });
        assert.strictEqual(request.headers['x-http-method-override'], 'DELETE');
        assert.match(request.headers['content-type'], /application\/json/);
    });
});

test('custom foods are saved with PUT and deleted by id', async () => {
    const food = { invented: 'food' };
    assert.deepStrictEqual(
        await writeRequest(`PUT ${NUTRITION}/customFood`, (gc) =>
            gc.saveCustomFood(food)
        ),
        {
            method: 'PUT',
            path: `${NUTRITION}/customFood`,
            query: {},
            body: food
        }
    );
    const request = await writeRequest(
        `DELETE ${NUTRITION}/customFood/77`,
        (gc) => gc.deleteCustomFood(77)
    );
    assert.strictEqual(request.method, 'DELETE');
});

test('nutrition methods validate their arguments', () =>
    checkRejected([
        [(gc) => gc.searchFoods(''), /Missing searchExpression/],
        [(gc) => gc.getCustomFood(''), /Missing customFoodUuid/],
        [(gc) => gc.logFoods(undefined, [{}]), /Missing date/],
        [(gc) => gc.logFoods(NOON, []), /Missing foodLogItems/],
        [(gc) => gc.quickAddFoods(undefined, [{}]), /Missing date/],
        [(gc) => gc.quickAddFoods(NOON), /Missing quickAddItems/],
        [(gc) => gc.deleteFoodLogs(undefined, [1]), /Missing date/],
        [(gc) => gc.deleteFoodLogs(NOON, []), /Missing logIds/],
        [(gc) => gc.saveCustomFood(), /Missing customFood/],
        [(gc) => gc.deleteCustomFood(), /Missing customFoodId/]
    ]));

// Cycle tracking

const CYCLE_SUMMARY = {
    startDate: '2024-03-01',
    dayInCycle: 5,
    periodLength: 4,
    currentPhase: 2,
    lengthOfCurrentPhase: 6,
    daysUntilNextPhase: 3,
    predictedCycleLength: 28,
    educationContentMod: 1,
    cycleType: 'INVENTED',
    feedbackPhrase: 'INVENTED',
    predictedCycle: false
};

test('getMenstrualCycleDayView sends the current day', () =>
    checkRead({
        call: (gc) => gc.getMenstrualCycleDayView(EVENING, NOON),
        path: `${CYCLE}/dayview/2024-03-04`,
        query: { todayDate: DAY },
        reply: { daySummary: CYCLE_SUMMARY, dayLog: null }
    }));

test('getMenstrualCycleSummary reads one day', () =>
    checkRead({
        call: (gc) => gc.getMenstrualCycleSummary(NOON),
        path: `${CYCLE}/summary/${DAY}`,
        reply: CYCLE_SUMMARY
    }));

test('getMenstrualCycleCalendar reads a range', () =>
    checkRead({
        call: (gc) => gc.getMenstrualCycleCalendar(EVENING, NOON),
        path: `${CYCLE}/calendar/2024-03-04/${DAY}`,
        reply: {
            cycleSummaries: [
                {
                    startDate: '2024-03-04',
                    periodLength: 4,
                    educationContentMod: 1,
                    predictedCycle: true
                }
            ],
            loggedSymptomDays: [],
            loggedOvulationDays: [],
            loggedNoteDays: []
        }
    }));

test('getLastConfirmedMenstrualCycle reads one day', () =>
    checkRead({
        call: (gc) => gc.getLastConfirmedMenstrualCycle(NOON),
        path: `${CYCLE}/lastconfirmed/${DAY}`,
        reply: {
            userProfilePk: 1,
            periodStartDate: '2024-03-01',
            periodLength: 4,
            cycleLength: 28,
            reportTimestamp: '2024-03-01T10:00:00.0',
            educationContentMod: 1,
            hasSpecifiedCycleLength: null,
            hasSpecifiedPeriodLength: null,
            cycleType: 'INVENTED',
            cycleStatus: null,
            predictedCycle: false
        }
    }));

test('logMenstrualCycleDay sets calendarDate from the date', async () => {
    const request = await writeRequest(
        `POST ${CYCLE}/dailylog/2024-03-04`,
        (gc) =>
            gc.logMenstrualCycleDay(EVENING, {
                invented: 1,
                calendarDate: '1999-01-01'
            })
    );
    assert.deepStrictEqual(request.body, {
        invented: 1,
        calendarDate: '2024-03-04'
    });
});

test('logMenstrualCycleDay validates its arguments', () =>
    checkRejected([
        [(gc) => gc.logMenstrualCycleDay(undefined, {}), /Missing date/],
        [(gc) => gc.logMenstrualCycleDay(NOON), /Missing dailyLog/]
    ]));

// Glucose

test('getGlucoseDay reads one day', () =>
    checkRead({
        call: (gc) => gc.getGlucoseDay(EVENING),
        path: `${GLUCOSE}/2024-03-04`,
        reply: { glucoseList: [] }
    }));

test('getGlucoseRange reads a range', () =>
    checkRead({
        call: (gc) => gc.getGlucoseRange(EVENING, NOON),
        path: `${GLUCOSE}/2024-03-04/${DAY}`,
        reply: { invented: [] }
    }));

test('glucose entries are posted as given and deleted by id', async () => {
    const entry = { invented: 5.5 };
    assert.deepStrictEqual(
        await writeRequest(`POST ${GLUCOSE}`, (gc) => gc.logGlucose(entry)),
        { method: 'POST', path: GLUCOSE, query: {}, body: entry }
    );
    const request = await writeRequest(`DELETE ${GLUCOSE}/9`, (gc) =>
        gc.deleteGlucose(9)
    );
    assert.strictEqual(request.method, 'DELETE');
});

test('glucose writes validate their arguments', () =>
    checkRejected([
        [(gc) => gc.logGlucose(), /Missing entry/],
        [(gc) => gc.deleteGlucose(), /Missing glucoseId/]
    ]));

test('single day reads default to today', () =>
    withGarmin({}, async ({ gc, calls }) => {
        const today = () => {
            const now = new Date();
            const local = new Date(
                now.getTime() - now.getTimezoneOffset() * 60000
            );
            return local.toISOString().slice(0, 10);
        };
        const before = today();
        const reads = [
            'getBloodPressureDay',
            'getNutritionDailyLog',
            'getNutritionMeals',
            'getNutritionSettings',
            'getMenstrualCycleDayView',
            'getMenstrualCycleSummary',
            'getLastConfirmedMenstrualCycle',
            'getGlucoseDay'
        ];
        for (const method of reads) {
            await assert.rejects(gc[method](), /404/);
        }
        const days = [before, today()];
        for (const request of calls()) {
            assert.ok(days.includes(request.path.slice(-10)), request.path);
        }
        assert.strictEqual(calls().length, reads.length);
    }));
