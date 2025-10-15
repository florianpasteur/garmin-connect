import { Step, StepRepeat } from './step';
import { WorkoutType } from './workout-type';
import { IWorkoutDetail } from '../types';

export class WorkoutBuilder {
    private steps: (Step | StepRepeat)[] = [];

    constructor(
        private readonly workoutType: WorkoutType,
        private workoutName: string,
        private workoutDescription: string = ''
    ) {}

    addStep(step: Step | StepRepeat) {
        this.steps.push(step);
        return this;
    }

    build(): IWorkoutDetail {
        return {
            ...this.workoutType.build(),
            subSportType: null,
            workoutName: this.workoutName,
            description: this.workoutDescription,
            estimatedDistanceUnit: { unitKey: null },
            workoutSegments: [
                {
                    segmentOrder: 1,
                    ...this.workoutType.build(),
                    workoutSteps: this.steps.map((step, index) =>
                        step.build(index + 1)
                    )
                }
            ],
            avgTrainingSpeed: null,
            estimatedDurationInSecs: 0,
            estimatedDistanceInMeters: 0,
            estimateType: null,
            isWheelchair: false
        };
    }
}
