// Each test creates a workout of its own, reads it back and deletes it. A
// failure here means Garmin rejects or changes something the builder assumes.
const assert = require('node:assert');
const { liveWriteTest } = require('../helpers/live');
const { load } = require('../helpers/dist');

const lib = load();
const {
    AveragePowerTarget,
    CadenceTarget,
    DistanceDuration,
    EndConditionType,
    ConditionDuration,
    FixedRestDuration,
    GradeTarget,
    HeartRateLapTarget,
    HrmZoneTarget,
    PaceTarget,
    PowerDuration,
    PowerLapTarget,
    PowerZone,
    RepeatGroup,
    RepetitionTimeDuration,
    SpeedLapTarget,
    SpeedTarget,
    Step,
    StepIntensity,
    StepType,
    SwimCssOffsetDuration,
    SwimCssOffsetTarget,
    SwimDrill,
    SwimEquipment,
    SwimInstruction,
    SwimInstructionTarget,
    SwimStroke,
    TimeDuration,
    WorkoutBuilder,
    WorkoutSegment,
    WorkoutType,
    toIntervalsIcuDescription
} = lib;

const name = (label) => `garmin-connect test ${label} ${Date.now()}`;

const builder = (sport, label) => new WorkoutBuilder(sport, name(label));

const time = (seconds = 60) => TimeDuration.fromSeconds(seconds);

const run = (seconds, target) => new Step(StepType.Run, time(seconds), target);

/** Fields of a step that Garmin has to keep, as [path, value] pairs */
const FIELDS = [
    'type',
    'stepOrder',
    'childStepId',
    'stepType.stepTypeKey',
    'endCondition.conditionTypeKey',
    'endConditionValue',
    'endConditionCompare',
    'targetType.workoutTargetTypeKey',
    'targetValueOne',
    'targetValueTwo',
    'zoneNumber',
    'secondaryTargetType.workoutTargetTypeKey',
    'secondaryTargetValueOne',
    'secondaryTargetValueTwo',
    'secondaryZoneNumber',
    'strokeType.strokeTypeKey',
    'equipmentType.equipmentTypeKey',
    'drillType.drillTypeKey',
    'intensityType.intensityTypeKey',
    'numberOfIterations'
];

const read = (object, path) =>
    path
        .split('.')
        .reduce((value, key) => (value == null ? value : value[key]), object);

/** Everything that was set in `sent` must be in `received` */
function assertSteps(sent, received) {
    assert.strictEqual(received.length, sent.length, 'number of steps');
    sent.forEach((step, index) => {
        FIELDS.forEach((field) => {
            const expected = read(step, field);
            if (expected === null || expected === undefined) return;
            const actual = read(received[index], field);
            const label = `step ${step.stepOrder}: ${field}`;
            if (typeof expected === 'number') {
                assert.ok(
                    Math.abs(actual - expected) < 0.01,
                    `${label} is ${actual}, sent ${expected}`
                );
            } else {
                assert.strictEqual(actual, expected, label);
            }
        });
        if (step.workoutSteps) {
            assertSteps(step.workoutSteps, received[index].workoutSteps);
        }
    });
}

/** Creates the workout, reads it back, checks it and always deletes it */
async function roundTrip(gc, workout, check = () => {}) {
    const created = await gc.createWorkout(workout);
    assert.ok(created.workoutId, 'no workoutId in the response');
    const workoutId = String(created.workoutId);
    try {
        const detail = await gc.getWorkoutDetail({ workoutId });
        assert.strictEqual(
            detail.sportType.sportTypeKey,
            workout.sportType.sportTypeKey
        );
        assert.strictEqual(
            detail.workoutSegments.length,
            workout.workoutSegments.length
        );
        workout.workoutSegments.forEach((segment, index) => {
            const received = detail.workoutSegments[index];
            assert.strictEqual(
                received.sportType.sportTypeKey,
                segment.sportType.sportTypeKey
            );
            assertSteps(segment.workoutSteps, received.workoutSteps);
        });
        check(detail);
    } finally {
        await gc.deleteWorkout({ workoutId });
    }
}

liveWriteTest('a workout with repeat groups', async (gc) => {
    const workout = builder(WorkoutType.Running, 'repeat')
        .addStep(new Step(StepType.WarmUp, time(600)))
        .addStep(
            new RepeatGroup(4, [
                new Step(
                    StepType.Run,
                    DistanceDuration.fromMeters(400),
                    PaceTarget.pace(4, 0, 5)
                ),
                new Step(StepType.Recovery, time(90))
            ])
        )
        .addStep(new RepeatGroup(2, [run(30)]))
        .addStep(new Step(StepType.Cooldown, time(300)))
        .build();
    await roundTrip(gc, workout, (detail) =>
        assert.strictEqual(
            toIntervalsIcuDescription(detail),
            toIntervalsIcuDescription(workout)
        )
    );
});

liveWriteTest('a workout with nested repeat groups', async (gc) => {
    const workout = builder(WorkoutType.Running, 'nested repeat')
        .addStep(
            new RepeatGroup(
                2,
                [run(60), new RepeatGroup(3, [run(20), run(10)])],
                true
            )
        )
        .build();
    await roundTrip(gc, workout);
});

liveWriteTest('a workout with secondary targets', async (gc) => {
    const workout = builder(WorkoutType.Cycling, 'secondary target')
        .addStep(
            run(60, PowerZone.power(200, 10)).withSecondaryTarget(
                CadenceTarget.cadence(90, 5)
            )
        )
        .addStep(
            run(60, CadenceTarget.cadence(90, 5)).withSecondaryTarget(
                new HrmZoneTarget(2)
            )
        )
        .build();
    await roundTrip(gc, workout);
});

liveWriteTest('a pool swim workout', async (gc) => {
    const lengths = () => DistanceDuration.fromMeters(100);
    const workout = builder(WorkoutType.Swimming, 'swim')
        .setPoolLength(25, 'meter')
        .addStep(
            new Step(StepType.WarmUp, lengths()).withStroke(
                SwimStroke.AnyStroke
            )
        )
        .addStep(
            new RepeatGroup(4, [
                new Step(StepType.Run, lengths())
                    .withStroke(SwimStroke.Free)
                    .withEquipment(SwimEquipment.PullBuoy),
                new Step(StepType.Rest, FixedRestDuration.fromSeconds(20))
            ])
        )
        .addStep(
            new Step(StepType.Run, lengths())
                .withStroke(SwimStroke.Drill)
                .withDrill(SwimDrill.Kick)
                .withEquipment(SwimEquipment.Kickboard)
        )
        .build();
    await roundTrip(gc, workout, (detail) => {
        assert.strictEqual(detail.poolLength, 25);
        assert.strictEqual(detail.poolLengthUnit.unitKey, 'meter');
    });
});

liveWriteTest('swim targets and send-off conditions', async (gc) => {
    const workout = builder(WorkoutType.Swimming, 'swim targets')
        .setPoolLength(25, 'yard')
        .addStep(
            new Step(
                StepType.Run,
                DistanceDuration.fromMeters(100)
            ).withSecondaryTarget(
                new SwimInstructionTarget(SwimInstruction.Easy)
            )
        )
        .addStep(
            new Step(
                StepType.Run,
                DistanceDuration.fromMeters(100)
            ).withSecondaryTarget(new SwimCssOffsetTarget(2))
        )
        .addStep(
            new Step(StepType.Run, RepetitionTimeDuration.fromSeconds(120))
        )
        .addStep(new Step(StepType.Run, new SwimCssOffsetDuration(5)))
        .build();
    await roundTrip(gc, workout);
});

liveWriteTest('a workout with step intensities', async (gc) => {
    const workout = builder(WorkoutType.Running, 'intensity')
        .addStep(run(60).withIntensity(StepIntensity.Active))
        .addStep(run(60).withIntensity(StepIntensity.Rest))
        .build();
    await roundTrip(gc, workout);
});

['Other', 'Yoga', 'Pilates', 'Hiit', 'Mobility', 'Rucking'].forEach((sport) =>
    liveWriteTest(`a ${sport} workout`, async (gc) => {
        const workout = builder(WorkoutType[sport], sport)
            .addStep(new Step(StepType.Main, time()))
            .build();
        await roundTrip(gc, workout);
    })
);

liveWriteTest('power and other end conditions', async (gc) => {
    const workout = builder(WorkoutType.Cycling, 'end conditions')
        .addStep(new Step(StepType.Run, PowerDuration.greaterThan(200)))
        .addStep(new Step(StepType.Recovery, PowerDuration.lessThan(150)))
        .addStep(
            new Step(
                StepType.Run,
                new ConditionDuration(EndConditionType.PowerLastLap, 200, 'gt')
            )
        )
        .build();
    await roundTrip(gc, workout);
});

[
    ['speed', new SpeedTarget(5, 6)],
    ['grade', new GradeTarget(2, 6)],
    ['lap heart rate', new HeartRateLapTarget(130, 150)],
    ['lap power', new PowerLapTarget(200, 220)],
    ['3 second power', new AveragePowerTarget(3, 200, 220)],
    ['10 second power', new AveragePowerTarget(10, 200, 220)],
    ['30 second power', new AveragePowerTarget(30, 200, 220)],
    ['lap speed', new SpeedLapTarget(5, 6)]
].forEach(([label, target]) =>
    liveWriteTest(`a workout with a ${label} target`, async (gc) => {
        const workout = builder(WorkoutType.Cycling, label)
            .addStep(run(60, target))
            .build();
        await roundTrip(gc, workout);
    })
);

liveWriteTest('a multisport workout', async (gc) => {
    const segment = (sport) =>
        new WorkoutSegment(sport).addStep(new Step(StepType.Run, time()));
    const workout = builder(WorkoutType.MultiSport, 'multisport')
        .addSegment(segment(WorkoutType.Swimming))
        .addSegment(segment(WorkoutType.Cycling))
        .addSegment(
            new WorkoutSegment(WorkoutType.Running).addStep(
                new RepeatGroup(2, [run(30), run(30)])
            )
        )
        .setPoolLength(25)
        .build();
    await roundTrip(gc, workout);
});
