const {
    GarminConnect,
    CadenceTarget,
    DistanceDuration,
    FixedRestDuration,
    PaceTarget,
    PowerZone,
    RepeatGroup,
    Step,
    StepType,
    SwimEquipment,
    SwimStroke,
    TimeDuration,
    WorkoutBuilder,
    WorkoutSegment,
    WorkoutType,
    toIntervalsIcuDescription
} = require('@flow-js/garmin-connect');

// 10 min warm up, 4 x (400 m at 4:00 min/km, 90 s recovery), 5 min cool down
const running = new WorkoutBuilder(WorkoutType.Running, '4 x 400 m')
    .addStep(new Step(StepType.WarmUp, TimeDuration.fromMinutes(10)))
    .addStep(
        new RepeatGroup(4, [
            new Step(
                StepType.Run,
                DistanceDuration.fromMeters(400),
                PaceTarget.pace(4, 0, 5)
            ),
            new Step(StepType.Recovery, TimeDuration.fromSeconds(90))
        ])
    )
    .addStep(new Step(StepType.Cooldown, TimeDuration.fromMinutes(5)))
    .build();

// Pool swim with strokes, equipment and fixed rests
const swimming = new WorkoutBuilder(WorkoutType.Swimming, '8 x 100 m')
    .setPoolLength(25, 'meter')
    .addStep(
        new RepeatGroup(8, [
            new Step(StepType.Run, DistanceDuration.fromMeters(100))
                .withStroke(SwimStroke.Free)
                .withEquipment(SwimEquipment.PullBuoy),
            new Step(StepType.Rest, FixedRestDuration.fromSeconds(20))
        ])
    )
    .build();

// Multisport: one segment per sport, with a power and a cadence target
const brick = new WorkoutBuilder(WorkoutType.MultiSport, 'Bike and run')
    .addSegment(
        new WorkoutSegment(WorkoutType.Cycling).addStep(
            new Step(
                StepType.Run,
                TimeDuration.fromMinutes(40),
                PowerZone.power(220, 10)
            ).withSecondaryTarget(CadenceTarget.cadence(90, 5))
        )
    )
    .addSegment(
        new WorkoutSegment(WorkoutType.Running).addStep(
            new Step(StepType.Run, TimeDuration.fromMinutes(20))
        )
    )
    .build();

// Has to be run in an async function to be able to use the await keyword
const main = async () => {
    for (const workout of [running, swimming, brick]) {
        console.log(workout.workoutName);
        console.log(toIntervalsIcuDescription(workout));
    }

    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });

    await GCClient.login();

    // The workouts already saved in your account
    const workouts = await GCClient.getWorkouts(0, 10);
    console.log(workouts.map((workout) => workout.workoutName));

    // Uncomment to save a workout to your account
    // await GCClient.createWorkout(running);
};

// Run the code
main();
