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
    build() {
        return {
            endCondition: {
                conditionTypeId: 1,
                conditionTypeKey: 'lap.button',
                displayOrder: 1,
                displayable: true
            },
            endConditionValue: null,
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
