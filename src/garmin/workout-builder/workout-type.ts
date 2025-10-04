export class WorkoutType {
    private constructor(
        private readonly sportTypeKey: string,
        private readonly sportTypeId: number
    ) {}

    build(): any {
        return {
            sportType: {
                sportTypeId: this.sportTypeId,
                sportTypeKey: this.sportTypeKey,
                displayOrder: this.sportTypeId
            }
        };
    }

    static Running = new WorkoutType('running', 1);
    static Cycling = new WorkoutType('cycling', 2);
    static Swimming = new WorkoutType('swimming', 4);
    static Strength = new WorkoutType('strength_training', 5);
    static Cardio = new WorkoutType('cardio_training', 6);
}
