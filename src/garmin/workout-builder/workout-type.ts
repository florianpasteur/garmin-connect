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
    static Other = new WorkoutType('other', 3);
    static Yoga = new WorkoutType('yoga', 7);
    static Pilates = new WorkoutType('pilates', 8);
    static Hiit = new WorkoutType('hiit', 9);
    /** Needs one {@link WorkoutSegment} per sport, see `WorkoutBuilder.addSegment` */
    static MultiSport = new WorkoutType('multi_sport', 10);
    static Mobility = new WorkoutType('mobility', 11);
    static Rucking = new WorkoutType('rucking', 13);
}
