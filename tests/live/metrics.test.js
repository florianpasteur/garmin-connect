const assert = require('node:assert');
const { liveTest } = require('../helpers/live');

const END = new Date();
const START = new Date(END.getTime() - 27 * 24 * 60 * 60 * 1000);

const isObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

// Only types are asserted, so that failures never print personal data.
function assertList(value) {
    assert.ok(Array.isArray(value), 'expected a list');
    value.forEach((entry) => assert.ok(isObject(entry), 'expected objects'));
}

const assertObject = (value) =>
    assert.ok(isObject(value), 'expected an object');

const assertOptionalObject = (value) =>
    assert.ok(value === null || isObject(value), 'expected an object or null');

liveTest('getTrainingReadiness returns a list', async (gc) => {
    assertList(await gc.getTrainingReadiness());
});

liveTest('getTrainingStatus identifies the user', async (gc) => {
    const status = await gc.getTrainingStatus();
    assertObject(status);
    assert.strictEqual(typeof status.userId, 'number');
});

liveTest('getVo2Max identifies the user', async (gc) => {
    const vo2Max = await gc.getVo2Max();
    assertObject(vo2Max);
    assert.strictEqual(typeof vo2Max.userId, 'number');
});

liveTest('getVo2MaxRange returns a list', async (gc) => {
    assertList(await gc.getVo2MaxRange(START, END));
});

liveTest('getRacePredictions returns predictions or null', async (gc) => {
    assertOptionalObject(await gc.getRacePredictions());
});

liveTest('getRacePredictionsRange returns a list', async (gc) => {
    assertList(await gc.getRacePredictionsRange(START, END));
});

liveTest('getEnduranceScore returns a score or null', async (gc) => {
    assertOptionalObject(await gc.getEnduranceScore());
});

liveTest('getHillScore returns a score or null', async (gc) => {
    assertOptionalObject(await gc.getHillScore());
});

liveTest('getRunningTolerance returns daily and weekly lists', async (gc) => {
    assertList(await gc.getRunningTolerance(START, END));
    assertList(await gc.getRunningTolerance(START, END, 'weekly'));
});

liveTest('getHeatAltitudeAcclimation returns data or null', async (gc) => {
    assertOptionalObject(await gc.getHeatAltitudeAcclimation());
});

liveTest('getFitnessAge returns its components', async (gc) => {
    const fitnessAge = await gc.getFitnessAge();
    assertObject(fitnessAge);
    assert.strictEqual(typeof fitnessAge.chronologicalAge, 'number');
    assertObject(fitnessAge.components);
});

liveTest('getLactateThreshold returns a list', async (gc) => {
    assertList(await gc.getLactateThreshold());
});

liveTest('getFtp answers for cycling', async (gc) => {
    const ftp = await gc.getFtp('CYCLING');
    assertObject(ftp);
    assert.strictEqual(typeof ftp.userProfilePK, 'number');
});

liveTest('getHeartRateZones returns zone floors', async (gc) => {
    const zones = await gc.getHeartRateZones();
    assertList(zones);
    zones.forEach((zone) => {
        assert.strictEqual(typeof zone.sport, 'string');
        assert.strictEqual(typeof zone.zone1Floor, 'number');
    });
});

liveTest('getPowerZones returns zone floors', async (gc) => {
    const zones = await gc.getPowerZones();
    assertList(zones);
    zones.forEach((zone) => {
        assert.strictEqual(typeof zone.sport, 'string');
        assert.strictEqual(typeof zone.zone1Floor, 'number');
    });
});

liveTest('getCriticalSwimSpeed returns data or null', async (gc) => {
    assertOptionalObject(await gc.getCriticalSwimSpeed());
});

liveTest('getUserStatistics returns totals', async (gc) => {
    const statistics = await gc.getUserStatistics();
    assertObject(statistics);
    assertList(statistics.userMetrics);
});

liveTest('getUserWellnessStatistics returns a metrics map', async (gc) => {
    const statistics = await gc.getUserWellnessStatistics(START, END);
    assertObject(statistics);
    assertObject(statistics.allMetrics);
    assertObject(statistics.allMetrics.metricsMap);
});

liveTest('getPersonalInformation returns the profiles', async (gc) => {
    const information = await gc.getPersonalInformation();
    assertObject(information);
    assertObject(information.userInfo);
    assertObject(information.biometricProfile);
});
