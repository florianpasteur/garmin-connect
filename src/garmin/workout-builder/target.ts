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
