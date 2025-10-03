import { Step } from './step';

export class WorkoutBuilder {
    private steps: Step[] = [];

    addStep(step: Step) {
        this.steps.push(step);
    }

    build() {
        return this.steps.map((step, index) => step.build(index + 1));
    }
}
