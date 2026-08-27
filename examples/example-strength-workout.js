const {
    GarminConnect,
    WorkoutBuilder,
    Step,
    StepType,
    WorkoutType,
    LapPressDuration,
    RepsDuration,
    NoTarget,
    Exercise,
    Weight
} = require('@flow-js/garmin-connect');

(async function () {
    const GARMIN_USERNAME = process.env.GARMIN_USERNAME;
    const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

    if (!GARMIN_USERNAME || !GARMIN_PASSWORD) {
        throw new Error(
            'GARMIN_USERNAME and GARMIN_PASSWORD must be set in the environment variables'
        );
    }

    const wb = new WorkoutBuilder(
        WorkoutType.Strength,
        'Power lifting ' + new Date().toISOString()
    );

    wb.addStep(
        new Step(
            StepType.WarmUp,
            new LapPressDuration(10),
            new NoTarget(),
            'Prepare',
            Exercise.cardio()
        )
    );

    wb.addStep(
        new Step(
            StepType.WarmUp,
            new LapPressDuration(10),
            new NoTarget(),
            'Prepare',
            Exercise.cardio()
        )
    );

    wb.addStep(
        new Step(
            StepType.Exercise,
            RepsDuration.fromReps(12),
            new NoTarget(),
            '',
            Exercise.barbellDeadlift(Weight.kilograms(50))
        )
    );

    wb.addStep(
        new Step(
            StepType.Exercise,
            RepsDuration.fromReps(10),
            new NoTarget(),
            '',
            Exercise.barbellDeadlift(Weight.kilograms(60))
        )
    );

    wb.addStep(
        new Step(
            StepType.Exercise,
            RepsDuration.fromReps(8),
            new NoTarget(),
            '',
            Exercise.barbellDeadlift(Weight.kilograms(70))
        )
    );

    const workout = wb.build();

    const GCClient = new GarminConnect({
        username: GARMIN_USERNAME,
        password: GARMIN_PASSWORD
    });

    await GCClient.login();
    await GCClient.createWorkout(workout);
})();
