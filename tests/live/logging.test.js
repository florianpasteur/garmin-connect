// Only weight and blood pressure are written, on days long past, and each test
// deletes what it created. Hydration has no write test because a total cannot be
// restored exactly (an empty day would stay at 0). Sleep, nutrition and glucose
// payloads are unverified. Cycle tracking is never written.
const assert = require('node:assert');
const { liveTest, liveWriteTest } = require('../helpers/live');

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
// Local midnight of a YYYY-MM-DD day, or of a local timestamp
const localDay = (value) => new Date(value.slice(0, 10) + 'T00:00:00');

const isObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const assertOptionalObject = (value) =>
    assert.ok(value === null || isObject(value), 'expected object or null');

/** Reads until `done` accepts the result, Garmin can lag behind a write */
async function until(read, done) {
    let result = await read();
    for (let attempt = 0; attempt < 5 && !done(result); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await read();
    }
    return result;
}

// Blood pressure

liveTest('getBloodPressureRange', async (gc) => {
    const range = await gc.getBloodPressureRange(daysAgo(90), new Date());
    assertOptionalObject(range);
    if (range) {
        assert.ok(Array.isArray(range.measurementSummaries));
    }
});

liveTest('getBloodPressureDay', async (gc) => {
    const day = await gc.getBloodPressureDay();
    assertOptionalObject(day);
    if (day) {
        assert.ok(Array.isArray(day.bloodPressureMeasurements));
    }
});

// Nutrition

liveTest('getNutritionDailyLog', async (gc) => {
    const log = await gc.getNutritionDailyLog();
    assertOptionalObject(log);
    if (log) {
        assert.strictEqual(typeof log.mealDate, 'string');
    }
});

liveTest('getNutritionMeals', async (gc) => {
    const meals = await gc.getNutritionMeals();
    assertOptionalObject(meals);
    if (meals) {
        assert.ok(Array.isArray(meals.meals));
    }
});

liveTest('getNutritionSettings', async (gc) => {
    assertOptionalObject(await gc.getNutritionSettings());
});

liveTest('getNutritionStatus', async (gc) => {
    const status = await gc.getNutritionStatus();
    assert.strictEqual(typeof status.currentStatus, 'string');
    assert.strictEqual(typeof status.hasUsedNutrition, 'boolean');
});

liveTest('searchFoods', async (gc) => {
    const result = await gc.searchFoods('apple', { limit: 5 });
    assert.strictEqual(typeof result.moreDataAvailable, 'boolean');
});

liveTest('getCustomFoods', async (gc) => {
    const foods = await gc.getCustomFoods();
    assert.ok(foods === null || typeof foods === 'object');
});

liveTest('getCustomFood', async (gc, t) => {
    // The list shape is unverified: look for a uuid anywhere in it
    const findUuid = (value) => {
        if (value === null || typeof value !== 'object') {
            return undefined;
        }
        if (typeof value.customFoodUuid === 'string') {
            return value.customFoodUuid;
        }
        for (const child of Object.values(value)) {
            const found = findUuid(child);
            if (found) {
                return found;
            }
        }
        return undefined;
    };
    const uuid = findUuid(await gc.getCustomFoods());
    if (!uuid) {
        return t.skip('no custom food');
    }
    const food = await gc.getCustomFood(uuid);
    assert.ok(food === null || typeof food === 'object');
});

// Cycle tracking, reads only

liveTest('getMenstrualCycleDayView', async (gc) => {
    assertOptionalObject(await gc.getMenstrualCycleDayView());
});

liveTest('getMenstrualCycleSummary', async (gc) => {
    assertOptionalObject(await gc.getMenstrualCycleSummary());
});

liveTest('getMenstrualCycleCalendar', async (gc) => {
    const calendar = await gc.getMenstrualCycleCalendar(
        daysAgo(60),
        new Date()
    );
    assertOptionalObject(calendar);
    if (calendar) {
        assert.ok(Array.isArray(calendar.cycleSummaries));
    }
});

liveTest('getLastConfirmedMenstrualCycle', async (gc) => {
    assertOptionalObject(await gc.getLastConfirmedMenstrualCycle());
});

// Glucose

liveTest('getGlucoseDay', async (gc) => {
    assertOptionalObject(await gc.getGlucoseDay());
});

liveTest('getGlucoseRange', async (gc) => {
    const range = await gc.getGlucoseRange(daysAgo(7), new Date());
    assert.ok(range === null || typeof range === 'object');
});

// Writes

liveWriteTest('updateWeight in kg, then deleteWeight', async (gc, t) => {
    const date = new Date('2001-03-04T12:00:00.000Z');
    // The neighbouring days are watched too, in case Garmin files the entry
    // under another day
    const days = [-1, 0, 1].map(
        (offset) => new Date(date.getTime() + offset * DAY_MS)
    );
    const kilograms = 71.3;
    const readEntries = async () => {
        const entries = [];
        for (const day of days) {
            const data = await gc.getDailyWeightData(day);
            entries.push(...data.dateWeightList);
        }
        return entries;
    };
    // weights are returned in grams
    const isOurs = (entry) => Math.abs(entry.weight - kilograms * 1000) < 100;

    if ((await readEntries()).length) {
        return t.skip('the test days already have weight entries');
    }
    // An old entry must not become the current weight of the account
    const latest = await gc.get(
        `${gc.url.GC_API}/weight-service/weight/latest`,
        { params: { date: new Date().toISOString().slice(0, 10) } }
    );
    if (!(new Date(latest?.date).getTime() > days[2].getTime())) {
        return t.skip('the account has no newer weight entry');
    }

    const remove = async (entries) => {
        for (const entry of entries.filter(isOurs)) {
            await gc.deleteWeight(localDay(entry.calendarDate), entry.samplePk);
        }
    };
    let seen = false;
    try {
        await gc.updateWeight(date, kilograms, 'UTC', 'kg');
        const created = await until(readEntries, (list) => list.some(isOurs));
        seen = created.some(isOurs);
        assert.ok(seen, 'the new entry is listed with its weight in kg');
        await remove(created);
        const left = await until(readEntries, (list) => !list.some(isOurs));
        assert.ok(!left.some(isOurs), 'the entry is deleted');
    } finally {
        const left = await readEntries();
        await remove(left);
        if (!seen && !left.length) {
            t.diagnostic('check the weight entries around 2001-03-04');
        }
    }
});

liveWriteTest('log, update and delete a blood pressure', async (gc) => {
    const date = new Date('2001-03-04T12:00:00.000Z');
    const day = localDay('2001-03-04');
    const notes = `garmin-connect test ${Date.now()}`;
    const readOurs = async () => {
        const data = await gc.getBloodPressureDay(day);
        return (data?.bloodPressureMeasurements || []).filter(
            (measurement) => measurement.notes === notes
        );
    };
    const remove = async (measurements) => {
        for (const measurement of measurements) {
            await gc.deleteBloodPressure(
                localDay(measurement.measurementTimestampLocal),
                measurement.version
            );
        }
    };
    try {
        await gc.logBloodPressure(
            { systolic: 118, diastolic: 76, pulse: 61, notes },
            date,
            'UTC'
        );
        const created = await until(readOurs, (list) => list.length > 0);
        assert.strictEqual(created.length, 1);
        assert.strictEqual(created[0].systolic, 118);
        assert.ok(
            created[0].measurementTimestampLocal.startsWith('2001-03-04T12:00'),
            'the local timestamp is kept'
        );

        const range = await gc.getBloodPressureRange(day, day);
        assert.ok(range.measurementSummaries.length > 0);

        await gc.updateBloodPressure(
            created[0].version,
            { systolic: 121, diastolic: 77, pulse: 62, notes },
            date,
            'UTC'
        );
        const updated = await until(
            readOurs,
            (list) => list.length === 1 && list[0].systolic === 121
        );
        assert.strictEqual(updated.length, 1);
        assert.strictEqual(updated[0].systolic, 121);

        await remove(updated);
        const left = await until(readOurs, (list) => list.length === 0);
        assert.strictEqual(left.length, 0);
    } finally {
        await remove(await readOurs());
    }
});
