import { SwimInstruction, SwimStroke } from './swim';

export abstract class Target {
    abstract build(): any;
}

export class NoTarget extends Target {
    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 1,
                workoutTargetTypeKey: 'no.target',
                displayOrder: 1
            }
        };
    }
}

export class PaceTarget extends Target {
    /**
     * Create a pace target
     * @param minPace - in seconds per meter
     * @param maxPace - in seconds per meter
     */
    constructor(private minPace: number, private maxPace: number) {
        super();
    }

    static pace(paceMinutes: number, paceSeconds: number, margin: number = 0) {
        const minPace = paceMinutes * 60 + paceSeconds + margin;
        const maxPace = paceMinutes * 60 + paceSeconds - margin;
        return new PaceTarget(1000 / minPace, 1000 / maxPace);
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 6,
                workoutTargetTypeKey: 'pace.zone',
                displayOrder: 6
            },
            targetValueOne: this.minPace, // slowest pace
            targetValueTwo: this.maxPace, // fastest pace
            targetValueUnit: null
        };
    }
}

export class CadenceTarget extends Target {
    constructor(private minCadence: number, private maxCadence: number) {
        super();
    }

    static cadence(cadence: number, margin: number) {
        return new CadenceTarget(cadence - margin, cadence + margin);
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 3,
                workoutTargetTypeKey: 'cadence',
                displayOrder: 3
            },
            targetValueOne: this.minCadence,
            targetValueTwo: this.maxCadence,
            targetValueUnit: null
        };
    }
}

export class HrmZoneTarget extends Target {
    constructor(private hrmZone: number) {
        super();
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 4,
                workoutTargetTypeKey: 'heart.rate.zone',
                displayOrder: 4
            },
            zoneNumber: this.hrmZone
        };
    }
}

export class HrmTarget extends Target {
    constructor(private minHrm: number, private maxHrm: number) {
        super();
    }

    static hrm(hrm: number, margin: number) {
        return new HrmTarget(hrm - margin, hrm + margin);
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 4,
                workoutTargetTypeKey: 'heart.rate.zone',
                displayOrder: 4
            },
            targetValueOne: this.minHrm,
            targetValueTwo: this.maxHrm,
            targetValueUnit: null
        };
    }
}

export class PowerZoneTarget extends Target {
    constructor(private powerZone: number) {
        super();
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 2,
                workoutTargetTypeKey: 'power.zone',
                displayOrder: 2
            },
            zoneNumber: this.powerZone
        };
    }
}

export class PowerZone extends Target {
    constructor(private minPower: number, private maxPower: number) {
        super();
    }

    static power(power: number, margin: number) {
        return new PowerZone(power - margin, power + margin);
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: 2,
                workoutTargetTypeKey: 'power.zone',
                displayOrder: 2
            },
            targetValueOne: this.minPower,
            targetValueTwo: this.maxPower
        };
    }
}

/**
 * Garmin target types, with the ids and keys of `workout-service/workout/types`.
 * Use with {@link CustomTarget}.
 */
export class TargetKind {
    private constructor(readonly id: number, readonly key: string) {}

    static NoTarget = new TargetKind(1, 'no.target');
    static PowerZone = new TargetKind(2, 'power.zone');
    static Cadence = new TargetKind(3, 'cadence');
    static HeartRateZone = new TargetKind(4, 'heart.rate.zone');
    static SpeedZone = new TargetKind(5, 'speed.zone');
    static PaceZone = new TargetKind(6, 'pace.zone');
    static Grade = new TargetKind(7, 'grade');
    static HeartRateLap = new TargetKind(8, 'heart.rate.lap');
    static PowerLap = new TargetKind(9, 'power.lap');
    static Power3s = new TargetKind(10, 'power.3s');
    static Power10s = new TargetKind(11, 'power.10s');
    static Power30s = new TargetKind(12, 'power.30s');
    static SpeedLap = new TargetKind(13, 'speed.lap');
    static SwimStroke = new TargetKind(14, 'swim.stroke');
    static Resistance = new TargetKind(15, 'resistance');
    static PowerCurve = new TargetKind(16, 'power.curve');
    static SwimCssOffset = new TargetKind(17, 'swim.css.offset');
    static SwimInstruction = new TargetKind(18, 'swim.instruction');
    static Instruction = new TargetKind(19, 'instruction');
    static VelocityLoss = new TargetKind(20, 'velocity.loss');
    static CustomVelocity = new TargetKind(21, 'custom.velocity');
    static VbtVelocityZone = new TargetKind(22, 'vbt.velocity.zone');
    static PowerLoss = new TargetKind(23, 'power.loss');
    static VelocityMin = new TargetKind(24, 'velocity.min');
    static PeakVelocityMin = new TargetKind(25, 'peak.velocity.min');
    static PeakVelocityLoss = new TargetKind(26, 'peak.velocity.loss');
    static CustomPeakVelocity = new TargetKind(27, 'custom.peak.velocity');
}

export interface TargetValues {
    /** Sent as `targetValueOne` */
    valueOne?: number;
    /** Sent as `targetValueTwo` */
    valueTwo?: number;
    /** Sent as `zoneNumber` */
    zoneNumber?: number;
}

/**
 * Any Garmin target type.
 *
 * The type ids and keys come from Garmin, but which value fields each type
 * expects, and their units, are unverified.
 */
export class CustomTarget extends Target {
    constructor(
        private readonly kind: TargetKind,
        private readonly values: TargetValues = {}
    ) {
        super();
    }

    build(): any {
        return {
            targetType: {
                workoutTargetTypeId: this.kind.id,
                workoutTargetTypeKey: this.kind.key,
                displayOrder: this.kind.id
            },
            targetValueOne: this.values.valueOne ?? null,
            targetValueTwo: this.values.valueTwo ?? null,
            targetValueUnit: null,
            zoneNumber: this.values.zoneNumber ?? null
        };
    }
}

/** Speed range. The payload format is unverified. */
export class SpeedTarget extends CustomTarget {
    /**
     * @param minSpeed - in meters per second
     * @param maxSpeed - in meters per second
     */
    constructor(minSpeed: number, maxSpeed: number) {
        super(TargetKind.SpeedZone, {
            valueOne: minSpeed,
            valueTwo: maxSpeed
        });
    }

    static kilometersPerHour(speed: number, margin: number = 0) {
        return new SpeedTarget((speed - margin) / 3.6, (speed + margin) / 3.6);
    }
}

/** Grade range, assumed to be in percent. The payload format is unverified. */
export class GradeTarget extends CustomTarget {
    constructor(minGrade: number, maxGrade: number) {
        super(TargetKind.Grade, { valueOne: minGrade, valueTwo: maxGrade });
    }
}

/** Lap heart rate range in bpm. The payload format is unverified. */
export class HeartRateLapTarget extends CustomTarget {
    constructor(minHrm: number, maxHrm: number) {
        super(TargetKind.HeartRateLap, { valueOne: minHrm, valueTwo: maxHrm });
    }
}

/** Lap power range in watts. The payload format is unverified. */
export class PowerLapTarget extends CustomTarget {
    constructor(minPower: number, maxPower: number) {
        super(TargetKind.PowerLap, { valueOne: minPower, valueTwo: maxPower });
    }
}

/**
 * Range in watts for the 3, 10 or 30 second average power.
 * The payload format is unverified.
 */
export class AveragePowerTarget extends CustomTarget {
    constructor(seconds: 3 | 10 | 30, minPower: number, maxPower: number) {
        super(
            seconds === 3
                ? TargetKind.Power3s
                : seconds === 10
                ? TargetKind.Power10s
                : TargetKind.Power30s,
            { valueOne: minPower, valueTwo: maxPower }
        );
    }
}

/** Lap speed range in meters per second. The payload format is unverified. */
export class SpeedLapTarget extends CustomTarget {
    constructor(minSpeed: number, maxSpeed: number) {
        super(TargetKind.SpeedLap, { valueOne: minSpeed, valueTwo: maxSpeed });
    }
}

/**
 * Swim stroke target, sending the stroke type id as `targetValueOne`.
 * The payload format is unverified. To set the stroke of a step, use
 * `Step.withStroke`.
 */
export class SwimStrokeTarget extends CustomTarget {
    constructor(stroke: SwimStroke) {
        super(TargetKind.SwimStroke, { valueOne: stroke.id });
    }
}

/**
 * Swim pace relative to the Critical Swim Speed (CSS), sending the offset in
 * seconds as `targetValueOne`. The payload format is unverified.
 */
export class SwimCssOffsetTarget extends CustomTarget {
    constructor(offsetSeconds: number) {
        super(TargetKind.SwimCssOffset, { valueOne: offsetSeconds });
    }
}

/**
 * Swim effort instruction, sending the instruction id as `targetValueOne`.
 * The payload format is unverified.
 */
export class SwimInstructionTarget extends CustomTarget {
    constructor(instruction: SwimInstruction) {
        super(TargetKind.SwimInstruction, { valueOne: instruction.id });
    }
}
