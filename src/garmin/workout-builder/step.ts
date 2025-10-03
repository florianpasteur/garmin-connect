import { Duration, NoDuration } from './duration';
import { NoTarget, Target } from './target';

export class Step {
    constructor(
        private type: StepType,
        private duration: Duration = new NoDuration(),
        private target: Target = new NoTarget(),
        private notes: string = ''
    ) {}

    build(stepId: number) {
        return {
            category: null,
            childStepId: null,
            description: this.notes,
            endCondition: {
                conditionTypeId: 3,
                conditionTypeKey: 'distance',
                displayable: true,
                displayOrder: 3
            },
            endConditionCompare: null,
            endConditionValue: null,
            endConditionZone: null,
            equipmentType: {
                displayOrder: null,
                equipmentTypeId: null,
                equipmentTypeKey: null
            },
            exerciseName: null,
            preferredEndConditionUnit: null,
            providerExerciseSourceId: null,
            secondaryTargetType: null,
            secondaryTargetValueOne: null,
            secondaryTargetValueTwo: null,
            secondaryTargetValueUnit: null,
            secondaryZoneNumber: null,
            stepAudioNote: null,
            stepId: this.type.stepId,
            stepOrder: stepId,
            stepType: {
                displayOrder: 3,
                stepTypeId: 3,
                stepTypeKey: 'interval'
            },
            strokeType: {},
            targetType: {
                displayOrder: 6,
                workoutTargetTypeId: 6,
                workoutTargetTypeKey: 'pace.zone'
            },
            targetValueOne: null,
            targetValueTwo: null,
            targetValueUnit: null,
            type: 'ExecutableStepDTO',
            weightUnit: null,
            weightValue: null,
            workoutProvider: null,
            zoneNumber: null,

            ...this.duration.build(),
            ...this.target.build()
        };
    }
}

export class StepType {
    private constructor(private type: string) {}

    get stepId() {
        switch (this.type) {
            case 'warmup':
                return 1;
            case 'interval':
                return 2;
            case 'recovery':
                return 3;
            case 'rest':
                return 4;
            case 'cooldown':
                return 5;
            case 'other':
                return 6;
            default:
                throw new Error(`Unknown type ${this.type}`);
        }
    }

    static WarmUp = new StepType('warmup');
    static Run = new StepType('interval');
    static Recovery = new StepType('recovery');
    static Rest = new StepType('rest');
    static Cooldown = new StepType('cooldown');
    static Other = new StepType('other');
}
