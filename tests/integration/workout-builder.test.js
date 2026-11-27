const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { withGarmin } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const lib = load();
const {
    AveragePowerTarget,
    CadenceTarget,
    CaloriesDuration,
    ConditionDuration,
    CustomTarget,
    DistanceDuration,
    EndConditionType,
    Exercise,
    FixedRestDuration,
    GradeTarget,
    HeartRateDuration,
    HeartRateLapTarget,
    HrmTarget,
    HrmZoneTarget,
    LapPressDuration,
    NoTarget,
    PaceTarget,
    PowerDuration,
    PowerLapTarget,
    PowerZone,
    PowerZoneTarget,
    RepeatGroup,
    RepetitionTimeDuration,
    RepsDuration,
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
    SwimStrokeTarget,
    TargetKind,
    TimeDuration,
    Weight,
    WorkoutBuilder,
    WorkoutSegment,
    WorkoutType,
    toIntervalsIcuDescription
} = lib;

const run = (seconds = 30, target = new NoTarget(), notes = '') =>
    new Step(StepType.Run, TimeDuration.fromSeconds(seconds), target, notes);

const stepsOf = (workout, segment = 0) =>
    workout.workoutSegments[segment].workoutSteps;

const flatten = (steps) =>
    steps.reduce(
        (all, step) => all.concat(step, flatten(step.workoutSteps || [])),
        []
    );

// --- Output of the builder as it was before repeat groups, swim fields etc. ---

const sha = (value) =>
    crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function legacyWorkout(sport) {
    const wb = new WorkoutBuilder(
        WorkoutType[sport],
        'Legacy',
        'Existing features'
    );
    const time = TimeDuration.fromSeconds(30);
    [
        'WarmUp',
        'Run',
        'Exercise',
        'Recovery',
        'Rest',
        'Cooldown',
        'Other'
    ].forEach((type) => wb.addStep(new Step(StepType[type], time)));
    [
        TimeDuration.hhmmss(1, 2, 3),
        TimeDuration.fromHours(1),
        TimeDuration.fromMinutes(5),
        DistanceDuration.fromKilometers(2),
        DistanceDuration.fromMeters(400),
        new LapPressDuration(),
        new LapPressDuration(10),
        RepsDuration.fromReps(12),
        new CaloriesDuration(200),
        HeartRateDuration.greaterThan(130),
        HeartRateDuration.lessThan(120)
    ].forEach((duration) =>
        wb.addStep(new Step(StepType.Run, duration, new NoTarget(), 'note'))
    );
    [
        PaceTarget.pace(5, 30, 10),
        CadenceTarget.cadence(80, 5),
        new HrmZoneTarget(5),
        HrmTarget.hrm(150, 10),
        new PowerZoneTarget(3),
        PowerZone.power(250, 20)
    ].forEach((target) => wb.addStep(new Step(StepType.Run, time, target)));
    wb.addStep(
        new Step(
            StepType.Exercise,
            RepsDuration.fromReps(8),
            new NoTarget(),
            '',
            Exercise.barbellDeadlift(Weight.kilograms(100))
        )
    );
    wb.addStep(
        new Step(
            StepType.Exercise,
            RepsDuration.fromReps(8),
            new NoTarget(),
            '',
            Exercise.barbellSquat(Weight.pounds(135))
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
    return wb.build();
}

test('existing features build the same bytes as before', () => {
    // sha256 of JSON.stringify, captured from the build of release 1.7.0
    const workouts = {
        Running:
            '68df6d05d20f662d1dc5850e8f487d6e942f3ffa2f247c961c3b03168cf5fefd',
        Cycling:
            '0fbc5664331b1e78794eb51d8f834b0e4d9276a6fd324ee3f84150cbea23f0f9',
        Swimming:
            '73d8883a481c9250e13d8f883dc2bd71fdc444f71982dbecdb0404dd214ecedf',
        Strength:
            '4580f79e9c57814595fe91abe2704cb2b9a9e56c61adac3905adafe2ba929584',
        Cardio: '2db8f8ea6fd4d280359fd4c2a203b55c983500821216d8f04b0f9a4b76634a82'
    };
    Object.keys(workouts).forEach((sport) =>
        assert.strictEqual(sha(legacyWorkout(sport)), workouts[sport], sport)
    );
    assert.strictEqual(
        sha(new WorkoutBuilder(WorkoutType.Running, 'Empty').build()),
        '3192270a1701c8467a47dff5ca0d0aa3eb69d36986c24a3c9a3c1197d1be765a'
    );
});

test('a basic workout is serialised exactly as before', () => {
    const workout = new WorkoutBuilder(WorkoutType.Running, 'Minimal')
        .addStep(run(45))
        .build();
    assert.strictEqual(
        JSON.stringify(workout),
        '{"sportType":{"sportTypeId":1,"sportTypeKey":"running","displayOrder":1},"subSportType":null,"workoutName":"Minimal","description":"","estimatedDistanceUnit":{"unitKey":null},"workoutSegments":[{"segmentOrder":1,"sportType":{"sportTypeId":1,"sportTypeKey":"running","displayOrder":1},"workoutSteps":[{"childStepId":null,"description":"","equipmentType":{"displayOrder":null,"equipmentTypeId":null,"equipmentTypeKey":null},"preferredEndConditionUnit":null,"providerExerciseSourceId":null,"secondaryTargetType":null,"secondaryTargetValueOne":null,"secondaryTargetValueTwo":null,"secondaryTargetValueUnit":null,"secondaryZoneNumber":null,"stepAudioNote":null,"stepId":1,"stepOrder":1,"strokeType":{},"targetValueOne":null,"targetValueTwo":null,"targetValueUnit":null,"type":"ExecutableStepDTO","workoutProvider":null,"zoneNumber":null,"stepType":{"stepTypeId":3,"stepTypeKey":"interval","displayOrder":3},"endCondition":{"conditionTypeId":2,"conditionTypeKey":"time","displayable":true,"displayOrder":1},"endConditionCompare":null,"endConditionValue":45,"endConditionZone":null,"targetType":{"workoutTargetTypeId":1,"workoutTargetTypeKey":"no.target","displayOrder":1},"category":null,"exerciseName":null,"weightValue":null,"weightUnit":null}]}],"avgTrainingSpeed":null,"estimatedDurationInSecs":0,"estimatedDistanceInMeters":0,"estimateType":null,"isWheelchair":false}'
    );
});

test('the intervals.icu text of existing features is unchanged', () => {
    assert.strictEqual(
        toIntervalsIcuDescription(legacyWorkout('Running')),
        'Warmup\n- 30s\n\nMain Set\n- 30s\n- 30s\n- 30s\n- 30s\n\nCooldown\n- 30s\n\nMain Set\n- 30s\n- note 1h2m3s\n- note 1h\n- note 5m\n- note 2km\n- note 400mtr\n- note lap press\n- note lap press\n- note 12 reps\n- note 200 calories\n- note HR >130 bpm\n- note HR <120 bpm\n- 30s 5:40-5:20/km Pace\n- 30s 75-85rpm\n- 30s Z5 HR\n- 30s 140-160bpm\n- 30s Z3\n- 30s 230-270w\n- DEADLIFT BARBELL_DEADLIFT 100 kilogram 8 reps\n- SQUAT BARBELL_BACK_SQUAT 135 pound 8 reps\n\nWarmup\n- Prepare CARDIO CARDIO lap press'
    );
});

// --- Repeat groups ---

const intervals = () =>
    new WorkoutBuilder(WorkoutType.Running, 'Intervals')
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
        .addStep(new Step(StepType.Cooldown, TimeDuration.fromMinutes(5)));

test('a repeat group is a RepeatGroupDTO with nested steps', () => {
    const [warmUp, group, coolDown] = stepsOf(intervals().build());
    const { workoutSteps, ...fields } = group;

    assert.deepStrictEqual(fields, {
        type: 'RepeatGroupDTO',
        stepId: 2,
        stepOrder: 2,
        stepType: {
            stepTypeId: 6,
            stepTypeKey: 'repeat',
            displayOrder: 6
        },
        childStepId: 1,
        numberOfIterations: 4,
        endCondition: {
            conditionTypeId: 7,
            conditionTypeKey: 'iterations',
            displayOrder: 7,
            displayable: false
        },
        endConditionValue: 4,
        smartRepeat: false
    });
    assert.deepStrictEqual(
        workoutSteps.map((s) => [s.type, s.stepId, s.stepOrder, s.childStepId]),
        [
            ['ExecutableStepDTO', 3, 3, 1],
            ['ExecutableStepDTO', 4, 4, 1]
        ]
    );
    assert.deepStrictEqual([warmUp.stepOrder, warmUp.childStepId], [1, null]);
    assert.deepStrictEqual(
        [coolDown.stepOrder, coolDown.childStepId],
        [5, null]
    );
});

test('nested repeat groups keep stepOrder increasing', () => {
    const workout = new WorkoutBuilder(WorkoutType.Cycling, 'Nested')
        .addStep(
            new RepeatGroup(2, [], true)
                .addStep(run(60))
                .addStep(new RepeatGroup(3, [run(20), run(10)]))
                .addStep(run(30))
        )
        .addStep(new RepeatGroup(5, [run(15)]))
        .build();
    const all = flatten(stepsOf(workout));

    assert.deepStrictEqual(
        all.map((s) => s.stepOrder),
        [1, 2, 3, 4, 5, 6, 7, 8]
    );
    assert.deepStrictEqual(
        all.map((s) => s.childStepId),
        [1, 1, 2, 2, 2, 1, 3, 3]
    );
    assert.strictEqual(all[0].smartRepeat, true);
});

test('building twice gives the same result', () => {
    const builder = intervals();
    assert.deepStrictEqual(builder.build(), builder.build());
});

test('the list given to a repeat group is copied', () => {
    const list = [run()];
    const group = new RepeatGroup(2, list).addStep(run());
    assert.strictEqual(list.length, 1);
    assert.strictEqual(group.build().workoutSteps.length, 2);
});

test('invalid repeat groups and repeat steps are rejected', () => {
    [0, -1, 1.5, NaN, undefined].forEach((iterations) =>
        assert.throws(
            () => new RepeatGroup(iterations, [run()]),
            /Invalid number of iterations/
        )
    );
    assert.throws(() => new RepeatGroup(2).build(), /Missing steps/);
    assert.throws(
        () => new Step(StepType.Repeat, TimeDuration.fromSeconds(1)),
        /Use RepeatGroup/
    );
});

// --- intervals.icu export ---

test('repeat groups are exported to intervals.icu', () => {
    assert.strictEqual(
        toIntervalsIcuDescription(intervals().build()),
        'Warmup\n- 10m\n\nMain Set 4x\n- 400mtr 4:05-3:55/km Pace\n- 1m30s\n\nCooldown\n- 5m'
    );
});

test('nested repeats are unrolled in the intervals.icu text', () => {
    const workout = new WorkoutBuilder(WorkoutType.Running, 'Nested')
        .addStep(
            new RepeatGroup(3, [
                run(60),
                new RepeatGroup(2, [run(20), run(10)])
            ])
        )
        .build();
    assert.strictEqual(
        toIntervalsIcuDescription(workout),
        'Main Set 3x\n- 1m\n- 20s\n- 10s\n- 20s\n- 10s'
    );
});

test('secondary targets and fixed rests are exported', () => {
    const workout = new WorkoutBuilder(WorkoutType.Cycling, 'Secondary')
        .addStep(
            run(60, PowerZone.power(250, 20)).withSecondaryTarget(
                CadenceTarget.cadence(90, 5)
            )
        )
        .addStep(new Step(StepType.Rest, FixedRestDuration.fromSeconds(20)))
        .build();
    assert.strictEqual(
        toIntervalsIcuDescription(workout),
        'Main Set\n- 1m 230-270w 85-95rpm\n- 20s'
    );
});

test('a workout read back from Garmin exports the same text', () => {
    let saved;
    return withGarmin(
        {
            'POST /workout-service/workout': (r) => {
                saved = { ...r.body, workoutId: 7 };
                return { body: saved };
            },
            'GET /workout-service/workout/7': () => ({ body: saved }),
            'DELETE /workout-service/workout/7': undefined
        },
        async ({ gc, calls }) => {
            const workout = intervals().build();
            const created = await gc.createWorkout(workout);
            const workoutId = String(created.workoutId);
            const detail = await gc.getWorkoutDetail({ workoutId });
            await gc.deleteWorkout({ workoutId });

            assert.deepStrictEqual(
                calls().map((r) => `${r.method} ${r.path}`),
                [
                    'POST /workout-service/workout',
                    'GET /workout-service/workout/7',
                    'DELETE /workout-service/workout/7'
                ]
            );
            assert.deepStrictEqual(calls()[0].query, {});
            assert.deepStrictEqual(
                calls()[0].body,
                JSON.parse(JSON.stringify(workout))
            );
            assert.strictEqual(
                toIntervalsIcuDescription(detail),
                toIntervalsIcuDescription(workout)
            );
        }
    );
});

// --- Secondary targets, swim fields, intensity ---

const built = (step) => step.build(1);

test('a secondary target fills the secondary fields only', () => {
    const step = built(
        run(30, PowerZone.power(250, 20)).withSecondaryTarget(
            CadenceTarget.cadence(90, 5)
        )
    );
    assert.strictEqual(step.targetType.workoutTargetTypeKey, 'power.zone');
    assert.strictEqual(step.targetValueOne, 230);
    assert.strictEqual(step.zoneNumber, null);
    assert.deepStrictEqual(step.secondaryTargetType, {
        workoutTargetTypeId: 3,
        workoutTargetTypeKey: 'cadence',
        displayOrder: 3
    });
    assert.strictEqual(step.secondaryTargetValueOne, 85);
    assert.strictEqual(step.secondaryTargetValueTwo, 95);
    assert.strictEqual(step.secondaryTargetValueUnit, null);
    assert.strictEqual(step.secondaryZoneNumber, null);
});

test('a secondary zone target uses secondaryZoneNumber', () => {
    const step = built(run().withSecondaryTarget(new HrmZoneTarget(2)));
    assert.strictEqual(step.secondaryZoneNumber, 2);
    assert.strictEqual(step.secondaryTargetValueOne, null);
    assert.strictEqual(step.zoneNumber, null);
    assert.strictEqual(step.targetType.workoutTargetTypeKey, 'no.target');
});

test('the last secondary target wins', () => {
    const step = built(
        run()
            .withSecondaryTarget(new HrmZoneTarget(2))
            .withSecondaryTarget(CadenceTarget.cadence(90, 5))
    );
    assert.strictEqual(step.secondaryZoneNumber, null);
    assert.strictEqual(step.secondaryTargetValueOne, 85);
});

test('swim steps carry stroke, equipment, drill and intensity', () => {
    const step = built(
        new Step(StepType.Main, DistanceDuration.fromMeters(100))
            .withStroke(SwimStroke.Free)
            .withEquipment(SwimEquipment.PullBuoy)
            .withDrill(SwimDrill.Pull)
            .withIntensity(StepIntensity.Active)
    );
    assert.deepStrictEqual(step.stepType, {
        stepTypeId: 8,
        stepTypeKey: 'main',
        displayOrder: 8
    });
    assert.deepStrictEqual(step.strokeType, {
        strokeTypeId: 6,
        strokeTypeKey: 'free',
        displayOrder: 6
    });
    assert.deepStrictEqual(step.equipmentType, {
        equipmentTypeId: 4,
        equipmentTypeKey: 'pull_buoy',
        displayOrder: 4
    });
    assert.deepStrictEqual(step.drillType, {
        drillTypeId: 2,
        drillTypeKey: 'pull',
        displayOrder: 2
    });
    assert.deepStrictEqual(step.intensityType, {
        intensityTypeId: 1,
        intensityTypeKey: 'active',
        displayOrder: 1
    });
});

test('optional step fields are absent unless set', () => {
    const step = built(run());
    assert.ok(!('drillType' in step));
    assert.ok(!('intensityType' in step));
});

test('the pool length is set on the workout', () => {
    const builder = new WorkoutBuilder(WorkoutType.Swimming, 'Swim').addStep(
        run()
    );
    assert.ok(!('poolLength' in builder.build()));

    const metric = builder.setPoolLength(25).build();
    assert.strictEqual(metric.poolLength, 25);
    assert.deepStrictEqual(metric.poolLengthUnit, { unitKey: 'meter' });

    const yards = builder.setPoolLength(25, 'yard').build();
    assert.deepStrictEqual(yards.poolLengthUnit, { unitKey: 'yard' });

    [0, -25, NaN, undefined].forEach((length) =>
        assert.throws(
            () => builder.setPoolLength(length),
            /Invalid pool length/
        )
    );
});

const idsAndKeys = (catalog) =>
    Object.keys(catalog).map((name) => [catalog[name].id, catalog[name].key]);

const numbered = (keys) =>
    keys.split(' ').map((key, index) => [index + 1, key]);

test('swim and intensity ids and keys match Garmin', () => {
    assert.deepStrictEqual(
        idsAndKeys(SwimStroke),
        numbered(
            'any_stroke backstroke breaststroke drill fly free individual_medley mixed individual_medley_by_round reverse_individual_medley_by_round'
        )
    );
    assert.deepStrictEqual(
        idsAndKeys(SwimEquipment),
        numbered('fins kickboard paddles pull_buoy snorkel')
    );
    assert.deepStrictEqual(idsAndKeys(SwimDrill), numbered('kick pull drill'));
    assert.deepStrictEqual(
        idsAndKeys(SwimInstruction),
        numbered(
            'recovery very_easy easy moderate hard very_hard all_out fast ascend descend'
        )
    );
    assert.deepStrictEqual(
        idsAndKeys(StepIntensity),
        numbered('active rest warmup cooldown')
    );
});

// --- Sports and step types ---

test('every sport has the Garmin id and key', () => {
    const sports = [
        ['Running', 1, 'running'],
        ['Cycling', 2, 'cycling'],
        ['Other', 3, 'other'],
        ['Swimming', 4, 'swimming'],
        ['Strength', 5, 'strength_training'],
        ['Cardio', 6, 'cardio_training'],
        ['Yoga', 7, 'yoga'],
        ['Pilates', 8, 'pilates'],
        ['Hiit', 9, 'hiit'],
        ['MultiSport', 10, 'multi_sport'],
        ['Mobility', 11, 'mobility'],
        ['Rucking', 13, 'rucking']
    ];
    sports.forEach(([name, id, key]) =>
        assert.deepStrictEqual(WorkoutType[name].build(), {
            sportType: {
                sportTypeId: id,
                sportTypeKey: key,
                displayOrder: id
            }
        })
    );
});

test('every step type has the Garmin id and key', () => {
    const types = [
        ['WarmUp', 1, 'warmup'],
        ['Cooldown', 2, 'cooldown'],
        ['Run', 3, 'interval'],
        ['Exercise', 3, 'interval'],
        ['Recovery', 4, 'recovery'],
        ['Rest', 5, 'rest'],
        ['Repeat', 6, 'repeat'],
        ['Other', 7, 'other'],
        ['Main', 8, 'main']
    ];
    types.forEach(([name, id, key]) =>
        assert.deepStrictEqual(StepType[name].build().stepType, {
            stepTypeId: id,
            stepTypeKey: key,
            displayOrder: id
        })
    );
});

// --- End conditions ---

test('end condition ids and keys match Garmin', () => {
    assert.deepStrictEqual(
        idsAndKeys(EndConditionType),
        numbered(
            'lap.button time distance calories power heart.rate iterations fixed.rest fixed.repetition reps training.peaks.tss repetition.time time.at.valid.cda power.last.lap max.power.last.lap repetition.swim.css.offset velocity.loss custom.velocity vbt.velocity.zone velocity.min peak.velocity.min peak.velocity.loss custom.peak.velocity power.loss'
        )
    );
});

test('new durations set the end condition, value and comparison', () => {
    const cases = [
        [PowerDuration.greaterThan(200), 5, 'power', 200, 'gt'],
        [PowerDuration.lessThan(150), 5, 'power', 150, 'lt'],
        [FixedRestDuration.fromSeconds(20), 8, 'fixed.rest', 20, null],
        [
            RepetitionTimeDuration.fromSeconds(105),
            12,
            'repetition.time',
            105,
            null
        ],
        [
            new SwimCssOffsetDuration(5),
            16,
            'repetition.swim.css.offset',
            5,
            null
        ],
        [
            new ConditionDuration(EndConditionType.TrainingPeaksTss, 50),
            11,
            'training.peaks.tss',
            50,
            null
        ],
        [
            new ConditionDuration(EndConditionType.VelocityLoss, 10, 'gt'),
            17,
            'velocity.loss',
            10,
            'gt'
        ],
        [
            new ConditionDuration(EndConditionType.FixedRepetition),
            9,
            'fixed.repetition',
            null,
            null
        ]
    ];
    cases.forEach(([duration, id, key, value, compare]) => {
        const step = built(new Step(StepType.Run, duration));
        assert.deepStrictEqual(step.endCondition, {
            conditionTypeId: id,
            conditionTypeKey: key,
            displayOrder: id,
            displayable: true
        });
        assert.strictEqual(step.endConditionValue, value, key);
        assert.strictEqual(step.endConditionCompare, compare, key);
    });
});

// --- Targets ---

test('target ids and keys match Garmin', () => {
    const expected = numbered(
        'no.target power.zone cadence heart.rate.zone speed.zone pace.zone grade heart.rate.lap power.lap power.3s power.10s power.30s speed.lap swim.stroke resistance power.curve swim.css.offset swim.instruction instruction velocity.loss custom.velocity vbt.velocity.zone power.loss velocity.min peak.velocity.min peak.velocity.loss custom.peak.velocity'
    );
    assert.deepStrictEqual(
        idsAndKeys(TargetKind).sort((a, b) => a[0] - b[0]),
        expected
    );
});

test('new targets set the target type and values', () => {
    const cases = [
        [new SpeedTarget(3, 4), 'speed.zone', 3, 4],
        [SpeedTarget.kilometersPerHour(36, 3.6), 'speed.zone', 9, 11],
        [SpeedTarget.kilometersPerHour(36), 'speed.zone', 10, 10],
        [new GradeTarget(2, 6), 'grade', 2, 6],
        [new HeartRateLapTarget(130, 150), 'heart.rate.lap', 130, 150],
        [new PowerLapTarget(200, 220), 'power.lap', 200, 220],
        [new AveragePowerTarget(3, 200, 220), 'power.3s', 200, 220],
        [new AveragePowerTarget(10, 200, 220), 'power.10s', 200, 220],
        [new AveragePowerTarget(30, 200, 220), 'power.30s', 200, 220],
        [new SpeedLapTarget(5, 6), 'speed.lap', 5, 6],
        [new SwimStrokeTarget(SwimStroke.Fly), 'swim.stroke', 5, null],
        [new SwimCssOffsetTarget(-2), 'swim.css.offset', -2, null],
        [
            new SwimInstructionTarget(SwimInstruction.Hard),
            'swim.instruction',
            5,
            null
        ],
        [
            new CustomTarget(TargetKind.Resistance, { valueOne: 0 }),
            'resistance',
            0,
            null
        ],
        [new CustomTarget(TargetKind.Instruction), 'instruction', null, null]
    ];
    cases.forEach(([target, key, one, two]) => {
        const step = built(run(30, target));
        assert.strictEqual(step.targetType.workoutTargetTypeKey, key);
        assert.strictEqual(
            step.targetType.displayOrder,
            step.targetType.workoutTargetTypeId
        );
        assert.strictEqual(step.targetValueOne, one, key);
        assert.strictEqual(step.targetValueTwo, two, key);
        assert.strictEqual(step.targetValueUnit, null);
        assert.strictEqual(step.zoneNumber, null);
    });
});

test('a custom target can set a zone number', () => {
    const step = built(
        run(30, new CustomTarget(TargetKind.SpeedZone, { zoneNumber: 3 }))
    );
    assert.strictEqual(step.zoneNumber, 3);
    assert.strictEqual(step.targetValueOne, null);
});

// --- Multisport ---

const triathlon = () =>
    new WorkoutBuilder(WorkoutType.MultiSport, 'Triathlon')
        .addSegment(new WorkoutSegment(WorkoutType.Swimming).addStep(run()))
        .addSegment(
            new WorkoutSegment(WorkoutType.Cycling).addStep(
                new RepeatGroup(2, [run(), run()])
            )
        )
        .addSegment(
            new WorkoutSegment(WorkoutType.Running)
                .addStep(new RepeatGroup(2, [run()]))
                .addStep(run())
        );

test('a multisport workout has one segment per sport', () => {
    const workout = triathlon().build();

    assert.strictEqual(workout.sportType.sportTypeKey, 'multi_sport');
    assert.deepStrictEqual(
        workout.workoutSegments.map((s) => [
            s.segmentOrder,
            s.sportType.sportTypeKey
        ]),
        [
            [1, 'swimming'],
            [2, 'cycling'],
            [3, 'running']
        ]
    );
    const all = flatten(
        [].concat(...workout.workoutSegments.map((s) => s.workoutSteps))
    );
    assert.deepStrictEqual(
        all.map((s) => s.stepOrder),
        [1, 2, 3, 4, 5, 6, 7]
    );
    assert.deepStrictEqual(
        all.map((s) => s.childStepId),
        [null, 1, 1, 1, 2, 2, null]
    );
    assert.deepStrictEqual(triathlon().build(), workout);
});

test('all segments are exported to intervals.icu', () => {
    assert.strictEqual(
        toIntervalsIcuDescription(triathlon().build()),
        'Main Set\n- 30s\n\nMain Set 2x\n- 30s\n- 30s\n\nMain Set 2x\n- 30s\n\nMain Set\n- 30s'
    );
});

test('invalid segment use is rejected', () => {
    const multi = () => new WorkoutBuilder(WorkoutType.MultiSport, 'M');
    const segment = () =>
        new WorkoutSegment(WorkoutType.Running).addStep(run());

    assert.throws(() => new WorkoutSegment(), /Missing sport type/);
    assert.throws(
        () => new WorkoutSegment(WorkoutType.MultiSport),
        /single sport/
    );
    assert.throws(
        () =>
            new WorkoutBuilder(WorkoutType.Running, 'R').addSegment(segment()),
        /require WorkoutType\.MultiSport/
    );
    assert.throws(() => multi().build(), /Missing workout segments/);
    assert.throws(
        () => multi().addStep(run()).addSegment(segment()).build(),
        /Add multisport steps to a WorkoutSegment/
    );
    assert.throws(
        () =>
            multi().addSegment(new WorkoutSegment(WorkoutType.Running)).build(),
        /Missing steps in workout segment/
    );
});
