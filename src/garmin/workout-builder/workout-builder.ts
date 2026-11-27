import { buildWorkoutSteps, StepNumbering, WorkoutStepNode } from './repeat';
import { WorkoutSegment } from './segment';
import { WorkoutType } from './workout-type';
import { IWorkoutDetail } from '../types';

export class WorkoutBuilder {
    private steps: WorkoutStepNode[] = [];
    private segments: WorkoutSegment[] = [];
    private poolFields: Record<string, unknown> = {};

    constructor(
        private readonly workoutType: WorkoutType,
        private workoutName: string,
        private workoutDescription: string = ''
    ) {}

    /**
     * @param step - a step or a repeat group
     * @returns this builder
     */
    addStep(step: WorkoutStepNode) {
        this.steps.push(step);
        return this;
    }

    /**
     * Add one sport to a multisport workout. Only for `WorkoutType.MultiSport`,
     * whose steps all go into segments. The format of multisport workouts is
     * unverified.
     *
     * @param segment - the next sport of the workout
     * @returns this builder
     */
    addSegment(segment: WorkoutSegment) {
        if (this.workoutType !== WorkoutType.MultiSport) {
            throw new Error('Segments require WorkoutType.MultiSport');
        }
        this.segments.push(segment);
        return this;
    }

    /**
     * Set the pool length of a swim workout. The `poolLength` and
     * `poolLengthUnit` format is unverified.
     *
     * @param length - length of the pool in `unit`
     * @param unit - unit of the length
     * @returns this builder
     */
    setPoolLength(length: number, unit: 'meter' | 'yard' = 'meter') {
        if (!(length > 0)) {
            throw new Error('Invalid pool length');
        }
        this.poolFields = {
            poolLength: length,
            poolLengthUnit: { unitKey: unit }
        };
        return this;
    }

    build(): IWorkoutDetail {
        return {
            ...this.workoutType.build(),
            subSportType: null,
            workoutName: this.workoutName,
            description: this.workoutDescription,
            estimatedDistanceUnit: { unitKey: null },
            workoutSegments: this.buildSegments(),
            avgTrainingSpeed: null,
            estimatedDurationInSecs: 0,
            estimatedDistanceInMeters: 0,
            estimateType: null,
            isWheelchair: false,
            ...this.poolFields
        };
    }

    private buildSegments() {
        const numbering = new StepNumbering();

        if (this.workoutType === WorkoutType.MultiSport) {
            if (this.steps.length > 0) {
                throw new Error('Add multisport steps to a WorkoutSegment');
            }
            if (this.segments.length === 0) {
                throw new Error('Missing workout segments');
            }
            return this.segments.map((segment, index) =>
                segment.build(index + 1, numbering)
            );
        }

        return [
            {
                segmentOrder: 1,
                ...this.workoutType.build(),
                workoutSteps: buildWorkoutSteps(this.steps, numbering)
            }
        ];
    }
}
