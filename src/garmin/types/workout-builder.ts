export class WorkoutBuilder {}

export class Step {
    constructor(
        private type: StepType,
        private duration?: Duration,
        private target?: Target,
        private notes?: string
    ) {}
}

export class StepType {
    private constructor(private type: string) {}

    static WarmUp = new StepType('warmup');
    static Interval = new StepType('interval');
    static Recovery = new StepType('recovery');
    static Rest = new StepType('rest');
    static Cooldown = new StepType('cooldown');
    static Other = new StepType('other');
}

export abstract class Duration {}

export class TimeDuration extends Duration {
    constructor(private seconds: number) {}

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
}

export class DistanceDuration extends Duration {
    constructor(private meters: number) {}

    static fromKilometers(km: number) {
        return new DistanceDuration(km * 1000);
    }

    static fromMeters(m: number) {
        return new DistanceDuration(m);
    }
}

export class LapPressDuration extends Duration {}

export class CaloriesDuration extends Duration {
    constructor(private calories: number) {}
}

export class HeartRateDuration extends Duration {
    constructor(private bpm: number, private compare: 'gt' | 'lt') {}

    static greaterThan(bpm: number) {
        return new HeartRateDuration(bpm, 'gt');
    }

    static lessThan(bpm: number) {
        return new HeartRateDuration(bpm, 'lt');
    }
}

export abstract class Target {}

export class NoTarget {}

export class PaceTarget extends Target {
    constructor(private minPace: number, private maxPace: number) {}

    static pace(paceMinutes: number, paceSeconds: number, margin: number = 0) {
        const pace = paceMinutes * 60 + paceSeconds;
        return new PaceTarget(pace - margin, pace + margin);
    }
}

export class CadenceTarget extends Target {
    constructor(private minCadence: number, private maxCadence: number) {}

    static cadence(cadence: number, margin: number) {
        return new CadenceTarget(cadence - margin, cadence + margin);
    }
}

export class HrmZoneTarget extends Target {
    constructor(private hrmZone: number) {}
}

export class HrmTarget extends Target {
    constructor(private minHrm: number, private maxHrm: number) {}

    static hrm(hrm: number, margin: number) {
        return new HrmTarget(hrm - margin, hrm + margin);
    }
}

export class PowerZoneTarget extends Target {
    constructor(private powerZone: number) {}
}

export class PowerZone extends Target {
    constructor(private minPower: number, private maxPower: number) {}

    static power(power: number, margin: number) {
        return new PowerZone(power - margin, power + margin);
    }
}
