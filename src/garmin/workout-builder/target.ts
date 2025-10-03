export abstract class Target {}

export class NoTarget {}

export class PaceTarget extends Target {
    constructor(private minPace: number, private maxPace: number) {
        super();
    }

    static pace(paceMinutes: number, paceSeconds: number, margin: number = 0) {
        const pace = paceMinutes * 60 + paceSeconds;
        return new PaceTarget(pace - margin, pace + margin);
    }
}

export class CadenceTarget extends Target {
    constructor(private minCadence: number, private maxCadence: number) {
        super();
    }

    static cadence(cadence: number, margin: number) {
        return new CadenceTarget(cadence - margin, cadence + margin);
    }
}

export class HrmZoneTarget extends Target {
    constructor(private hrmZone: number) {
        super();
    }
}

export class HrmTarget extends Target {
    constructor(private minHrm: number, private maxHrm: number) {
        super();
    }

    static hrm(hrm: number, margin: number) {
        return new HrmTarget(hrm - margin, hrm + margin);
    }
}

export class PowerZoneTarget extends Target {
    constructor(private powerZone: number) {
        super();
    }
}

export class PowerZone extends Target {
    constructor(private minPower: number, private maxPower: number) {
        super();
    }

    static power(power: number, margin: number) {
        return new PowerZone(power - margin, power + margin);
    }
}
