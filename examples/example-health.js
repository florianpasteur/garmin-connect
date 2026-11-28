const { GarminConnect } = require('@flow-js/garmin-connect');

// Reads daily health and wellness data. Nothing in the account is changed.
const main = async () => {
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });
    await GCClient.login();

    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    // One day. Metrics are null when no device recorded them.
    const summary = await GCClient.getDailySummary(today);
    console.log(summary.totalSteps, summary.restingHeartRate);

    console.log(await GCClient.getStress(today));
    console.log(await GCClient.getSleep(today));
    // null when there is no data
    console.log(await GCClient.getHrv(today));

    // Long ranges are requested in chunks for you
    const steps = await GCClient.getStepsRange(threeMonthsAgo, today);
    console.log(steps);

    const sleep = await GCClient.getSleepStats(threeMonthsAgo, today);
    console.log(sleep.individualStats.length, sleep.periods);

    const weight = await GCClient.getWeightRange(threeMonthsAgo, today);
    console.log(weight.dailyWeightSummaries);
};

// Run the code
main();
