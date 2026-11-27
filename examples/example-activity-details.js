const { GarminConnect } = require('@flow-js/garmin-connect');

// Reads the details of your latest activity. Nothing is changed on the account.
const main = async () => {
    // Uses credentials from garmin.config.json or uses supplied params
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });
    await GCClient.login();

    // Search the activities of the last 30 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [activity] = await GCClient.searchActivities({
        startDate,
        endDate,
        start: 0,
        limit: 1
    });
    if (!activity) {
        console.log('No activity in the last 30 days');
        return;
    }
    const { activityId } = activity;

    const details = await GCClient.getActivityDetails(activityId, {
        maxChartSize: 200,
        maxPolylineSize: 200
    });
    console.log(details.metricDescriptors.map((metric) => metric.key));

    const splits = await GCClient.getActivitySplits(activityId);
    console.log(`${splits.lapDTOs.length} laps`);

    console.log(await GCClient.getActivityHeartRateZones(activityId));
    console.log(await GCClient.getActivityWeather(activityId));

    const polyline = await GCClient.getActivityPolyline(activityId);
    console.log(polyline);

    // Reference data
    const activityTypes = await GCClient.getActivityTypes();
    console.log(`${activityTypes.length} activity types`);
    console.log(await GCClient.getPowerCurve());
};

// Run the code
main();
