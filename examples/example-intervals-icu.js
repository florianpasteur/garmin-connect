const { GarminConnect, toIntervalsIcuDescription } = require('../dist/index');

(async function () {
    const GARMIN_USERNAME = process.env.GARMIN_USERNAME;
    const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

    if (!GARMIN_USERNAME || !GARMIN_PASSWORD) {
        throw new Error(
            'GARMIN_USERNAME and GARMIN_PASSWORD must be set in the environment variables'
        );
    }

    const GCClient = new GarminConnect({
        username: GARMIN_USERNAME,
        password: GARMIN_PASSWORD
    });

    await GCClient.login();

    const workouts = await GCClient.getWorkouts(0, 10);
    if (!workouts.length) {
        console.log('No workouts found.');
        return;
    }

    const workoutId = String(workouts[0].workoutId);
    const detail = await GCClient.getWorkoutDetail({ workoutId });

    console.log('Workout:', detail.workoutName);
    console.log('--- intervals.icu description ---');
    console.log(toIntervalsIcuDescription(detail));
})();
