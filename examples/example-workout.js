const {
    GarminConnect,
    CadenceTarget,
    CaloriesDuration,
    DistanceDuration,
    HeartRateDuration,
    HrmTarget,
    HrmZoneTarget,
    LapPressDuration,
    PaceTarget,
    PowerZone,
    PowerZoneTarget,
    TimeDuration,
    WorkoutBuilder,
    Step,
    NoTarget,
    StepType,
    WorkoutType
} = require('garmin-connect');

(async function () {
    const GARMIN_USERNAME = process.env.GARMIN_USERNAME;
    const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

    if (!GARMIN_USERNAME || !GARMIN_PASSWORD) {
        throw new Error(
            'GARMIN_USERNAME and GARMIN_PASSWORD must be set in the environment variables'
        );
    }

    const wb = new WorkoutBuilder(
        WorkoutType.Running,
        'Workout running ' + new Date().toISOString()
    );

    /**
     * There are multiple StepTypes: WarmUp, Run, Recovery, Rest, Cooldown, Other
     */
    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(45),
            new NoTarget(),
            'Comment for the step: Run for 45 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Recovery,
            TimeDuration.hhmmss(0, 1, 30),
            new NoTarget(),
            'Comment for the step: Run for 1 minute 30 seconds'
        )
    );

    /** There are multiple durations: TimeDuration, DistanceDuration, HeartRateDuration, CaloriesDuration, LapPressDuration */
    wb.addStep(
        new Step(
            StepType.Run,
            DistanceDuration.fromKilometers(2),
            new NoTarget(),
            'Run for 2km'
        )
    );

    wb.addStep(
        new Step(
            StepType.WarmUp,
            HeartRateDuration.greaterThan(130),
            new NoTarget(),
            'Warm up until HR > 130 bpm'
        )
    );

    wb.addStep(
        new Step(
            StepType.Cooldown,
            new LapPressDuration(),
            new NoTarget(),
            'Cooldown for as long as you need'
        )
    );

    wb.addStep(
        new Step(
            StepType.Rest,
            new CaloriesDuration(200),
            new NoTarget(),
            'Rest until you burned 200 calories'
        )
    );

    /**
     * There are multiple targets: PaceTarget, HrmZoneTarget, HrmTarget, PowerZoneTarget, PowerZone, CadenceTarget, NoTarget
     */
    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            PaceTarget.pace(5, 30, 10),
            'Run at 5:30 min/km pace (+- 10 sec) for 30 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            new HrmZoneTarget(5),
            'Run at HR zone 5 for 30 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            HrmTarget.hrm(150, 10),
            'Run at HR 150 bpm (+- 10 bpm) for 30 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            new PowerZoneTarget(3),
            'Run at Power zone 3 for 30 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            PowerZone.power(250, 20),
            'Run at Power 250 watts (+- 20 watts) for 30 seconds'
        )
    );

    wb.addStep(
        new Step(
            StepType.Run,
            TimeDuration.fromSeconds(30),
            CadenceTarget.cadence(80, 5),
            'Run at Cadence 80 rpm (+- 5 rpm) for 30 seconds'
        )
    );

    const workout = wb.build();

    // Save workout to Garmin Connect
    const GCClient = new GarminConnect({
        username: GARMIN_USERNAME,
        password: GARMIN_PASSWORD
    });

    await GCClient.login();

    await GCClient.createWorkout(workout);
})();
