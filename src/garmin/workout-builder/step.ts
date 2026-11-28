import { Duration, NoDuration } from './duration';
import { Exercise } from './exercise';
import { NoTarget, Target } from './target';
import { SwimDrill, SwimEquipment, SwimStroke } from './swim';

export class Step {
    private optionalFields: Record<string, unknown> = {};

    constructor(
        private stepType: StepType,
        private duration: Duration = new NoDuration(),
        private target: Target = new NoTarget(),
        private notes: string = '',
        private exercise?: Exercise
    ) {
        if (stepType === StepType.Repeat) {
            throw new Error('Use RepeatGroup to create a repeat step');
        }
    }

    /**
     * Add a second target to the step, e.g. cadence next to a power target.
     * The `secondary*` field names are Garmin's, but which combinations of
     * targets Garmin accepts is unverified.
     *
     * @returns this step
     */
    withSecondaryTarget(target: Target) {
        const built = target.build();
        return this.addFields({
            secondaryTargetType: built.targetType,
            secondaryTargetValueOne: built.targetValueOne ?? null,
            secondaryTargetValueTwo: built.targetValueTwo ?? null,
            secondaryTargetValueUnit: built.targetValueUnit ?? null,
            secondaryZoneNumber: built.zoneNumber ?? null
        });
    }

    /**
     * Set the swim stroke of the step
     * @returns this step
     */
    withStroke(stroke: SwimStroke) {
        return this.addFields(stroke.build());
    }

    /**
     * Set the swim equipment of the step
     * @returns this step
     */
    withEquipment(equipment: SwimEquipment) {
        return this.addFields(equipment.build());
    }

    /**
     * Set the swim drill type of the step. The `drillType` field format is
     * unverified.
     * @returns this step
     */
    withDrill(drill: SwimDrill) {
        return this.addFields(drill.build());
    }

    /**
     * Set the intensity of the step. The `intensityType` field name and format
     * are unverified.
     * @returns this step
     */
    withIntensity(intensity: StepIntensity) {
        return this.addFields(intensity.build());
    }

    private addFields(fields: Record<string, unknown>) {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this;
    }

    /**
     * @param index - position of the step in the workout, starting at 1
     * @param childStepId - id shared by the steps of a repeat group
     */
    build(index: number, childStepId: number | null = null) {
        return {
            childStepId,
            description: this.notes,
            equipmentType: {
                displayOrder: null,
                equipmentTypeId: null,
                equipmentTypeKey: null
            },
            preferredEndConditionUnit: null,
            providerExerciseSourceId: null,
            secondaryTargetType: null,
            secondaryTargetValueOne: null,
            secondaryTargetValueTwo: null,
            secondaryTargetValueUnit: null,
            secondaryZoneNumber: null,
            stepAudioNote: null,
            stepId: index,
            stepOrder: index,
            strokeType: {},
            targetValueOne: null,
            targetValueTwo: null,
            targetValueUnit: null,
            type: 'ExecutableStepDTO',
            workoutProvider: null,
            zoneNumber: null,

            ...this.stepType.build(),
            ...this.duration.build(),
            ...this.target.build(),
            ...(this.exercise?.build() ?? {
                category: null,
                exerciseName: null,
                weightValue: null,
                weightUnit: null
            }),
            ...this.optionalFields
        };
    }
}

export class StepType {
    private constructor(private type: string, private stepId: number) {}

    build() {
        return {
            stepType: {
                stepTypeId: this.stepId,
                stepTypeKey: this.type,
                displayOrder: this.stepId
            }
        };
    }

    static WarmUp = new StepType('warmup', 1);
    static Run = new StepType('interval', 3);
    static Exercise = new StepType('interval', 3);
    static Recovery = new StepType('recovery', 4);
    static Rest = new StepType('rest', 5);
    static Cooldown = new StepType('cooldown', 2);
    static Other = new StepType('other', 7);
    static Main = new StepType('main', 8);
    /** Step type of a {@link RepeatGroup}, not usable in a {@link Step} */
    static Repeat = new StepType('repeat', 6);
}

export class StepIntensity {
    private constructor(readonly id: number, readonly key: string) {}

    build() {
        return {
            intensityType: {
                intensityTypeId: this.id,
                intensityTypeKey: this.key,
                displayOrder: this.id
            }
        };
    }

    static Active = new StepIntensity(1, 'active');
    static Rest = new StepIntensity(2, 'rest');
    static WarmUp = new StepIntensity(3, 'warmup');
    static Cooldown = new StepIntensity(4, 'cooldown');
}
