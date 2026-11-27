import { Step, StepType } from './step';
import { EndConditionType } from './duration';

export type WorkoutStepNode = Step | RepeatGroup;

/**
 * Counters shared by all the steps of one workout: `stepOrder` increases across
 * nested steps and segments, and every repeat group gets its own `childStepId`.
 */
export class StepNumbering {
    private stepOrder = 0;
    private childStepId = 0;

    nextStepOrder() {
        return ++this.stepOrder;
    }

    nextChildStepId() {
        return ++this.childStepId;
    }
}

export function buildWorkoutSteps(
    steps: WorkoutStepNode[],
    numbering: StepNumbering,
    childStepId: number | null = null
): any[] {
    return steps.map((step) =>
        step instanceof RepeatGroup
            ? step.build(numbering)
            : step.build(numbering.nextStepOrder(), childStepId)
    );
}

/**
 * Steps repeated a number of times. Groups can be nested.
 *
 * The resulting `RepeatGroupDTO` follows Garmin's format as far as it is known;
 * the numbering of `childStepId`, nesting and `smartRepeat` are unverified.
 *
 * @example
 * new RepeatGroup(4, [
 *     new Step(StepType.Run, DistanceDuration.fromMeters(400)),
 *     new Step(StepType.Recovery, TimeDuration.fromSeconds(90))
 * ]);
 */
export class RepeatGroup {
    private readonly steps: WorkoutStepNode[];

    /**
     * @param iterations - number of times the steps are done, at least 1
     * @param steps - steps of the group, more can be added with `addStep`
     * @param smartRepeat - sent as `smartRepeat`
     */
    constructor(
        private readonly iterations: number,
        steps: WorkoutStepNode[] = [],
        private readonly smartRepeat: boolean = false
    ) {
        if (!(iterations >= 1) || Math.floor(iterations) !== iterations) {
            throw new Error('Invalid number of iterations');
        }
        this.steps = steps.slice();
    }

    /**
     * @param step - a step or a nested repeat group
     * @returns this group
     */
    addStep(step: WorkoutStepNode) {
        this.steps.push(step);
        return this;
    }

    /**
     * @param numbering - step counters of the workout
     * @returns the repeat group DTO with its nested steps
     */
    build(numbering: StepNumbering = new StepNumbering()) {
        if (this.steps.length === 0) {
            throw new Error('Missing steps in repeat group');
        }
        const stepOrder = numbering.nextStepOrder();
        const childStepId = numbering.nextChildStepId();

        return {
            type: 'RepeatGroupDTO',
            stepId: stepOrder,
            stepOrder,
            ...StepType.Repeat.build(),
            childStepId,
            numberOfIterations: this.iterations,
            workoutSteps: buildWorkoutSteps(this.steps, numbering, childStepId),
            endCondition: {
                conditionTypeId: EndConditionType.Iterations.id,
                conditionTypeKey: EndConditionType.Iterations.key,
                displayOrder: EndConditionType.Iterations.id,
                displayable: false
            },
            endConditionValue: this.iterations,
            smartRepeat: this.smartRepeat
        };
    }
}
