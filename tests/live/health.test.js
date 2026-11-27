// Read-only checks against real Garmin. Only types and shapes are asserted, so
// that no personal data ends up in the output.
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { liveTest } = require('../helpers/live');

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const YESTERDAY = daysAgo(1);
// Longer than the 28 days of one request
const RANGE_START = daysAgo(35);
// About 13 months
const LONG_RANGE_START = daysAgo(395);

const isObject = (value) =>
    assert.ok(
        value !== null && typeof value === 'object' && !Array.isArray(value),
        'expected an object'
    );
const isObjectOrNull = (value) => {
    if (value !== null) isObject(value);
};
const isList = (value) => {
    assert.ok(Array.isArray(value), 'expected an array');
    value.forEach(isObject);
};
const isNumberOrNull = (value) =>
    assert.ok(
        value === null || typeof value === 'number',
        'expected a number or null'
    );
const isString = (value) => assert.strictEqual(typeof value, 'string');

liveTest('getDailySummary', async (gc) => {
    const summary = await gc.getDailySummary(YESTERDAY);
    isObject(summary);
    isString(summary.calendarDate);
    isNumberOrNull(summary.totalSteps);
    isNumberOrNull(summary.restingHeartRate);
});

for (const name of [
    'getStress',
    'getRespiration',
    'getSpO2',
    'getIntensityMinutes',
    'getFloors',
    'getLifestyleLog',
    'getHydrationSummary'
]) {
    liveTest(name, async (gc) => {
        isObject(await gc[name](YESTERDAY));
    });
}

for (const name of [
    'getBodyBatteryEvents',
    'getStepsChart',
    'getDailyEvents',
    'getNaps'
]) {
    liveTest(name, async (gc) => {
        isList(await gc[name](YESTERDAY));
    });
}

for (const name of ['getHrv', 'getHealthStatus', 'getSleep']) {
    liveTest(name, async (gc) => {
        isObjectOrNull(await gc[name](YESTERDAY));
    });
}

liveTest('getLatestWeight', async (gc) => {
    const sample = await gc.getLatestWeight(YESTERDAY);
    isObjectOrNull(sample);
    if (sample) isNumberOrNull(sample.weight);
});

liveTest('getFirstWeight', async (gc) => {
    const sample = await gc.getFirstWeight();
    isObjectOrNull(sample);
    if (sample) isNumberOrNull(sample.weight);
});

liveTest('getSteps', async (gc) => {
    isNumberOrNull(await gc.getSteps(YESTERDAY));
});

for (const name of [
    'getBodyBattery',
    'getSleepSummaries',
    'getSleepScores',
    'getStepsRange',
    'getStressRange',
    'getRestingHeartRateRange',
    'getIntensityMinutesRange',
    'getFloorsRange',
    'getHydrationRange',
    'getRespirationRange',
    'getBodyBatteryRange'
]) {
    liveTest(name, async (gc) => {
        isList(await gc[name](RANGE_START, YESTERDAY));
    });
}

liveTest('getSleepStats', async (gc) => {
    const report = await gc.getSleepStats(RANGE_START, YESTERDAY);
    isList(report.individualStats);
    isList(report.periods);
    report.individualStats.forEach((night) => {
        isString(night.calendarDate);
        isObject(night.values);
    });
    report.periods.forEach((period) => isObject(period.overallStats));
});

liveTest('getHrvRange', async (gc) => {
    const periods = await gc.getHrvRange(RANGE_START, YESTERDAY);
    isList(periods);
    periods.forEach((period) => isString(period.startDate));
});

liveTest('getWeightRange', async (gc) => {
    const range = await gc.getWeightRange(LONG_RANGE_START, YESTERDAY);
    isObject(range);
    isList(range.dailyWeightSummaries);
    isObject(range.totalAverage);
});

liveTest('getWeightGoals', async (gc) => {
    const goals = await gc.getWeightGoals(LONG_RANGE_START, YESTERDAY);
    isObject(goals);
    isList(goals.userGoals);
});

liveTest('getWellnessActivities', async (gc) => {
    isList(await gc.getWellnessActivities(1, 5));
});

liveTest('downloadDailyWellnessFile', async (gc, t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-live-health-'));
    try {
        let file;
        try {
            file = await gc.downloadDailyWellnessFile(YESTERDAY, dir);
        } catch (error) {
            // An account without a device may have no file at all
            if (!/\(404\)/.test(error.message)) throw error;
            return t.skip('no wellness file for the day');
        }
        if (file === null) return t.skip('no wellness file for the day');
        // Zip files start with "PK"
        assert.strictEqual(fs.readFileSync(file).slice(0, 2).toString(), 'PK');
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
