const { GarminConnect } = require('@flow-js/garmin-connect');

// Has to be run in an async function to be able to use the await keyword
const main = async () => {
    // Create a new Garmin Connect Client
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });

    // Uses credentials from garmin.config.json or uses supplied params
    await GCClient.login();

    const today = new Date();
    const inAMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // The sports, steps and targets workouts are made of
    const types = await GCClient.getWorkoutTypes();
    console.log(types.workoutSportTypes);

    // Saved workouts, and the first one as a FIT file
    const [workout] = await GCClient.getWorkouts(0, 10);
    if (workout) {
        const file = await GCClient.downloadWorkout(
            workout.workoutId,
            './workouts'
        );
        console.log('Saved', file);
    }

    // What is planned for the coming month
    console.log(await GCClient.getScheduledWorkouts(today, inAMonth));
    console.log(await GCClient.getUpcomingEvents(30, 10));
    console.log(await GCClient.getPrimaryEvent());

    // Training plans
    const { trainingPlanList } = await GCClient.getTrainingPlans();
    console.log(trainingPlanList);
};

// Run the code
main();
