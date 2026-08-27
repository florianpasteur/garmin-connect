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
} = require('../dist/index');

/**
 * Add a 12 / 10 / 8 rep pyramid with a cardio "Prepare" step before each set.
 */
function addPyramid(wb, exercise, weightsKg, reps = [12, 10, 8]) {
    for (let i = 0; i < reps.length; i++) {
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
                RepsDuration.fromReps(reps[i]),
                new NoTarget(),
                '',
                exercise(Weight.kilograms(weightsKg[i]))
            )
        );
    }
}

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

    // Deadlift: 50 / 60 / 70 kg
    addPyramid(wb, (weight) => Exercise.barbellDeadlift(weight), [50, 60, 70]);

    // Bench press: 30 / 40 / 45 kg
    addPyramid(
        wb,
        (weight) => Exercise.barbellBenchPress(weight),
        [30, 40, 45]
    );

    // Squats: 65 / 70 / 75 kg
    addPyramid(wb, (weight) => Exercise.barbellSquat(weight), [65, 70, 75]);

    // Barbell row + Push-ups: 30 / 35 / 40 kg (+5 kg per set)
    for (let [rep, weight] of [
        [12, 30],
        [10, 35],
        [8, 40]
    ]) {
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
                RepsDuration.fromReps(rep),
                new NoTarget(),
                '',
                Exercise.of('ROW', 'BARBELL_ROW', Weight.kilograms(weight))
            )
        );

        wb.addStep(
            new Step(
                StepType.Exercise,
                RepsDuration.fromReps(8),
                new NoTarget(),
                '',
                Exercise.of('PUSH_UP', 'WEIGHTED_PUSH_UP', Weight.kilograms(5))
            )
        );
    }

    // Hip thrust: 40 / 50 / 60 kg
    addPyramid(
        wb,
        (weight) =>
            Exercise.of('HIP_RAISE', 'BARBELL_HIP_THRUST_WITH_BENCH', weight),
        [40, 50, 60]
    );

    // Shoulder press: 10 kg (12 / 10 / 8) + Pull ups
    for (let i = 0; i < 3; i++) {
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
                RepsDuration.fromReps(8),
                new NoTarget(),
                '',
                Exercise.of(
                    'SHOULDER_PRESS',
                    'SHOULDER_PRESS',
                    Weight.kilograms(10)
                )
            )
        );

        wb.addStep(
            new Step(
                StepType.Exercise,
                RepsDuration.fromReps(5),
                new NoTarget(),
                '',
                Exercise.of('PULL_UP', 'WEIGHTED_PULL_UP', Weight.kilograms(0))
            )
        );
    }

    const workout = wb.build();

    const GCClient = new GarminConnect({
        username: GARMIN_USERNAME,
        password: GARMIN_PASSWORD
    });

    await GCClient.login();
    await GCClient.createWorkout(workout);
})();
