export abstract class Duration {
    abstract build(): any;
}

export class NoDuration extends Duration {
    build() {
        throw new Error(
            'Please provide an duration for this step (Other than NoDuration).'
        );
    }
}

export class TimeDuration extends Duration {
    constructor(private durationInSeconds: number) {
        super();
    }

    static hhmmss(h: number, m: number, s: number) {
        return new TimeDuration(h * 3600 + m * 60 + s);
    }

    static fromHours(h: number) {
        return new TimeDuration(h * 3600);
    }

    static fromMinutes(m: number) {
        return new TimeDuration(m * 60);
    }

    static fromSeconds(s: number) {
        return new TimeDuration(s);
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 2,
                conditionTypeKey: 'time',
                displayable: true,
                displayOrder: 1
            },
            endConditionCompare: null,
            endConditionValue: this.durationInSeconds,
            endConditionZone: null
        };
    }
}

export class DistanceDuration extends Duration {
    constructor(private meters: number) {
        super();
    }

    static fromKilometers(km: number) {
        return new DistanceDuration(km * 1000);
    }

    static fromMeters(m: number) {
        return new DistanceDuration(m);
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 3,
                conditionTypeKey: 'distance',
                displayOrder: 3,
                displayable: true
            },
            endConditionValue: this.meters,
            preferredEndConditionUnit: {
                unitKey: 'kilometer'
            },
            endConditionCompare: null
        };
    }
}

export class LapPressDuration extends Duration {
    constructor(private readonly endConditionValue: number | null = null) {
        super();
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 1,
                conditionTypeKey: 'lap.button',
                displayOrder: 1,
                displayable: true
            },
            endConditionValue: this.endConditionValue,
            preferredEndConditionUnit: null,
            endConditionCompare: null
        };
    }
}

export class RepsDuration extends Duration {
    constructor(private readonly reps: number) {
        super();
    }

    static fromReps(reps: number) {
        return new RepsDuration(reps);
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 10,
                conditionTypeKey: 'reps',
                displayOrder: 10,
                displayable: true
            },
            endConditionValue: this.reps,
            preferredEndConditionUnit: null,
            endConditionCompare: null
        };
    }
}

export class CaloriesDuration extends Duration {
    constructor(private calories: number) {
        super();
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 4,
                conditionTypeKey: 'calories',
                displayOrder: 4,
                displayable: true
            },
            endConditionValue: this.calories
        };
    }
}

export class HeartRateDuration extends Duration {
    constructor(private bpm: number, private compare: 'gt' | 'lt') {
        super();
    }

    static greaterThan(bpm: number) {
        return new HeartRateDuration(bpm, 'gt');
    }

    static lessThan(bpm: number) {
        return new HeartRateDuration(bpm, 'lt');
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: 6,
                conditionTypeKey: 'heart.rate',
                displayOrder: 6,
                displayable: true
            },
            endConditionValue: this.bpm,
            endConditionCompare: this.compare
        };
    }
}

/**
 * Garmin end conditions, with the ids and keys of
 * `workout-service/workout/types`. Use with {@link ConditionDuration}.
 */
export class EndConditionType {
    private constructor(readonly id: number, readonly key: string) {}

    static LapButton = new EndConditionType(1, 'lap.button');
    static Time = new EndConditionType(2, 'time');
    static Distance = new EndConditionType(3, 'distance');
    static Calories = new EndConditionType(4, 'calories');
    static Power = new EndConditionType(5, 'power');
    static HeartRate = new EndConditionType(6, 'heart.rate');
    /** Used by {@link RepeatGroup} */
    static Iterations = new EndConditionType(7, 'iterations');
    static FixedRest = new EndConditionType(8, 'fixed.rest');
    static FixedRepetition = new EndConditionType(9, 'fixed.repetition');
    static Reps = new EndConditionType(10, 'reps');
    static TrainingPeaksTss = new EndConditionType(11, 'training.peaks.tss');
    static RepetitionTime = new EndConditionType(12, 'repetition.time');
    static TimeAtValidCda = new EndConditionType(13, 'time.at.valid.cda');
    static PowerLastLap = new EndConditionType(14, 'power.last.lap');
    static MaxPowerLastLap = new EndConditionType(15, 'max.power.last.lap');
    static RepetitionSwimCssOffset = new EndConditionType(
        16,
        'repetition.swim.css.offset'
    );
    static VelocityLoss = new EndConditionType(17, 'velocity.loss');
    static CustomVelocity = new EndConditionType(18, 'custom.velocity');
    static VbtVelocityZone = new EndConditionType(19, 'vbt.velocity.zone');
    static VelocityMin = new EndConditionType(20, 'velocity.min');
    static PeakVelocityMin = new EndConditionType(21, 'peak.velocity.min');
    static PeakVelocityLoss = new EndConditionType(22, 'peak.velocity.loss');
    static CustomPeakVelocity = new EndConditionType(
        23,
        'custom.peak.velocity'
    );
    static PowerLoss = new EndConditionType(24, 'power.loss');
}

/**
 * A step ending on any Garmin end condition.
 *
 * The condition ids and keys come from Garmin, but the unit and meaning of the
 * value (and whether a comparison is needed) are unverified.
 */
export class ConditionDuration extends Duration {
    /**
     * @param condition - the end condition
     * @param value - sent as `endConditionValue`
     * @param compare - sent as `endConditionCompare`
     */
    constructor(
        private readonly condition: EndConditionType,
        private readonly value: number | null = null,
        private readonly compare: 'gt' | 'lt' | null = null
    ) {
        super();
    }

    build() {
        return {
            endCondition: {
                conditionTypeId: this.condition.id,
                conditionTypeKey: this.condition.key,
                displayOrder: this.condition.id,
                displayable: true
            },
            endConditionValue: this.value,
            endConditionCompare: this.compare
        };
    }
}

/**
 * Ends the step when power goes above or below a value in watts.
 * The payload format is unverified.
 */
export class PowerDuration extends ConditionDuration {
    constructor(watts: number, compare: 'gt' | 'lt') {
        super(EndConditionType.Power, watts, compare);
    }

    static greaterThan(watts: number) {
        return new PowerDuration(watts, 'gt');
    }

    static lessThan(watts: number) {
        return new PowerDuration(watts, 'lt');
    }
}

/**
 * A rest of a fixed time, as used between swim intervals.
 * The value is assumed to be in seconds (unverified).
 */
export class FixedRestDuration extends ConditionDuration {
    constructor(seconds: number) {
        super(EndConditionType.FixedRest, seconds);
    }

    static fromSeconds(seconds: number) {
        return new FixedRestDuration(seconds);
    }
}

/**
 * A repetition on a fixed time ("send-off"), as used in swim workouts.
 * The value is assumed to be in seconds (unverified).
 */
export class RepetitionTimeDuration extends ConditionDuration {
    constructor(seconds: number) {
        super(EndConditionType.RepetitionTime, seconds);
    }

    static fromSeconds(seconds: number) {
        return new RepetitionTimeDuration(seconds);
    }
}

/**
 * A swim send-off relative to the Critical Swim Speed (CSS).
 * The value is assumed to be an offset in seconds (unverified).
 */
export class SwimCssOffsetDuration extends ConditionDuration {
    constructor(offsetSeconds: number) {
        super(EndConditionType.RepetitionSwimCssOffset, offsetSeconds);
    }
}
