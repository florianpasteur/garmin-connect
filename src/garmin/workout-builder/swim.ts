/*
 * Swim step fields. Ids and keys come from `workout-service/workout/types`; the
 * `displayOrder` values are assumed to equal the ids.
 */

/** Swim stroke of a step, see `Step.withStroke` */
export class SwimStroke {
    private constructor(readonly id: number, readonly key: string) {}

    build() {
        return {
            strokeType: {
                strokeTypeId: this.id,
                strokeTypeKey: this.key,
                displayOrder: this.id
            }
        };
    }

    static AnyStroke = new SwimStroke(1, 'any_stroke');
    static Backstroke = new SwimStroke(2, 'backstroke');
    static Breaststroke = new SwimStroke(3, 'breaststroke');
    static Drill = new SwimStroke(4, 'drill');
    static Fly = new SwimStroke(5, 'fly');
    static Free = new SwimStroke(6, 'free');
    static IndividualMedley = new SwimStroke(7, 'individual_medley');
    static Mixed = new SwimStroke(8, 'mixed');
    static IndividualMedleyByRound = new SwimStroke(
        9,
        'individual_medley_by_round'
    );
    static ReverseIndividualMedleyByRound = new SwimStroke(
        10,
        'reverse_individual_medley_by_round'
    );
}

/** Swim equipment of a step, see `Step.withEquipment` */
export class SwimEquipment {
    private constructor(readonly id: number, readonly key: string) {}

    build() {
        return {
            equipmentType: {
                equipmentTypeId: this.id,
                equipmentTypeKey: this.key,
                displayOrder: this.id
            }
        };
    }

    static Fins = new SwimEquipment(1, 'fins');
    static Kickboard = new SwimEquipment(2, 'kickboard');
    static Paddles = new SwimEquipment(3, 'paddles');
    static PullBuoy = new SwimEquipment(4, 'pull_buoy');
    static Snorkel = new SwimEquipment(5, 'snorkel');
}

/** Swim drill type of a step, see `Step.withDrill` */
export class SwimDrill {
    private constructor(readonly id: number, readonly key: string) {}

    build() {
        return {
            drillType: {
                drillTypeId: this.id,
                drillTypeKey: this.key,
                displayOrder: this.id
            }
        };
    }

    static Kick = new SwimDrill(1, 'kick');
    static Pull = new SwimDrill(2, 'pull');
    static Drill = new SwimDrill(3, 'drill');
}

/** Swim effort instruction, used by `SwimInstructionTarget` */
export class SwimInstruction {
    private constructor(readonly id: number, readonly key: string) {}

    static Recovery = new SwimInstruction(1, 'recovery');
    static VeryEasy = new SwimInstruction(2, 'very_easy');
    static Easy = new SwimInstruction(3, 'easy');
    static Moderate = new SwimInstruction(4, 'moderate');
    static Hard = new SwimInstruction(5, 'hard');
    static VeryHard = new SwimInstruction(6, 'very_hard');
    static AllOut = new SwimInstruction(7, 'all_out');
    static Fast = new SwimInstruction(8, 'fast');
    static Ascend = new SwimInstruction(9, 'ascend');
    static Descend = new SwimInstruction(10, 'descend');
}
