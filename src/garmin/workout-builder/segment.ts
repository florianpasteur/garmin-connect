import { buildWorkoutSteps, StepNumbering, WorkoutStepNode } from './repeat';
import { WorkoutType } from './workout-type';

/**
 * One sport of a multisport workout, see `WorkoutBuilder.addSegment`
 */
export class WorkoutSegment {
    private readonly steps: WorkoutStepNode[] = [];

    /** @param sportType - sport of the segment, not MultiSport */
    constructor(private readonly sportType: WorkoutType) {
        if (!sportType) {
            throw new Error('Missing sport type');
        }
        if (sportType === WorkoutType.MultiSport) {
            throw new Error('A segment needs a single sport');
        }
    }

    /**
     * @param step - a step or a repeat group
     * @returns this segment
     */
    addStep(step: WorkoutStepNode) {
        this.steps.push(step);
        return this;
    }

    /**
     * @param segmentOrder - position of the segment, starting at 1
     * @param numbering - step counters shared with the other segments
     */
    build(
        segmentOrder: number,
        numbering: StepNumbering = new StepNumbering()
    ) {
        if (this.steps.length === 0) {
            throw new Error('Missing steps in workout segment');
        }
        return {
            segmentOrder,
            ...this.sportType.build(),
            workoutSteps: buildWorkoutSteps(this.steps, numbering)
        };
    }
}
