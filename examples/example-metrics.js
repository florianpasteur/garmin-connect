const { GarminConnect } = require('@flow-js/garmin-connect');

// Has to be run in an async function to be able to use the await keyword
const main = async () => {
    // Create a new Garmin Connect Client
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });

    await GCClient.login();

    const today = new Date();
    const fourWeeksAgo = new Date(today.getTime() - 27 * 24 * 60 * 60 * 1000);

    // Training metrics of a day, null or empty without device data
    console.log(await GCClient.getTrainingReadiness(today));
    console.log(await GCClient.getTrainingStatus(today));
    console.log(await GCClient.getVo2Max(today));
    console.log(await GCClient.getRacePredictions());
    console.log(await GCClient.getEnduranceScore(today));
    console.log(await GCClient.getHillScore(today));
    console.log(await GCClient.getHeatAltitudeAcclimation(today));
    console.log(await GCClient.getFitnessAge(today));

    // The same over a date range
    console.log(await GCClient.getVo2MaxRange(fourWeeksAgo, today));
    console.log(await GCClient.getRacePredictionsRange(fourWeeksAgo, today));
    console.log(
        await GCClient.getRunningTolerance(fourWeeksAgo, today, 'weekly')
    );

    // Thresholds and zones
    console.log(await GCClient.getLactateThreshold());
    console.log(await GCClient.getFtp('CYCLING'));
    console.log(await GCClient.getHeartRateZones());
    console.log(await GCClient.getPowerZones());
    console.log(await GCClient.getCriticalSwimSpeed(today));

    // User statistics and details
    console.log(await GCClient.getUserStatistics());
    console.log(await GCClient.getUserWellnessStatistics(fourWeeksAgo, today));
    console.log(await GCClient.getPersonalInformation());
};

// Run the code
main();
