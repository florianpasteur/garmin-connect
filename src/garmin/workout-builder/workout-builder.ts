import { Step } from './step';
import { WorkoutType } from './workout-type';

export class WorkoutBuilder {
    private steps: Step[] = [];

    private constructor(
        private readonly workoutType: WorkoutType,
        private workoutName: string
    ) {}

    addStep(step: Step) {
        this.steps.push(step);
    }

    build() {
        return {
            ...this.workoutType.build(),
            subSportType: null,
            workoutName: this.workoutName,
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
