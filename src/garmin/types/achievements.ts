import type { GCBadgeId, GCUserHash, GCUserProfileId } from './index';

/**
 * A personal record of the user. Only empty lists have been observed, so the
 * fields are unknown.
 */
export type PersonalRecord = Record<string, unknown>;

export interface PersonalRecordType {
    id: number;
    key: string;
    visible: boolean;
    sport: string;
    minValue: number;
    maxValue: number;
}

export type GoalStatus = 'active' | 'future' | 'past';

export interface GoalListOptions {
    start?: number;
    limit?: number;
    sortOrder?: string;
}

/** A goal of the goal service. Its fields are unverified. */
export type GoalEntry = Record<string, unknown>;

/** A daily wellness goal (e.g. steps). Its fields are unverified. */
export type DailyWellnessGoal = Record<string, unknown>;

/** A daily goal in effect on a day */
export interface EffectiveGoal {
    goalType: string;
    goalValue: number;
    [field: string]: unknown;
}

/** Fields shared by the badge lists */
export interface BadgeSummary {
    badgeId: GCBadgeId;
    badgeKey: string;
    badgeName: string;
    /** Only null has been observed */
    badgeUuid: unknown;
    badgeCategoryId: number;
    badgeDifficultyId: number;
    badgePoints: number;
    badgeTypeIds: number[];
}

/** A badge the user earned. The response holds more fields than listed here. */
export interface EarnedBadge extends BadgeSummary {
    badgeSeriesId: number | null;
    badgeStartDate: string;
    badgeEndDate: string | null;
    userProfileId: GCUserProfileId;
    fullName: string;
    displayName: GCUserHash;
    badgeEarnedDate: string;
    badgeEarnedNumber: number;
    premium: boolean;
    reprocessable: boolean;
    badgeProgressValue: number;
    badgeTargetValue: number | null;
    badgeAssocTypeId: number;
    badgeAssocType: string;
    badgeAssocDataId: string | null;
    earnedByMe: boolean;
    createDate: string;
}

/**
 * A badge that can be earned. Same family as `EarnedBadge`, but which of the
 * other fields are present is unverified.
 */
export interface AvailableBadge
    extends BadgeSummary,
        Partial<Omit<EarnedBadge, keyof BadgeSummary>> {}

/**
 * A badge or virtual challenge. The response holds more fields than listed
 * here.
 */
export interface BadgeChallenge {
    uuid: string;
    badgeChallengeName: string;
    challengeCategoryId: number;
    badgeChallengeStatusId: number;
    startDate: string | null;
    endDate: string | null;
    createDate: string;
    updateDate: string;
    badgeId: GCBadgeId;
    badgeKey: string;
    badgeUuid: string;
    badgePoints: number;
    badgeUnitId: number;
    badgeProgressValue: number | null;
    badgeEarnedDate: string | null;
    badgeTargetValue: number;
    badgeTypeIds: number[];
    userJoined: boolean;
    joinable: boolean;
    premium: boolean;
}

/**
 * A challenge between the user and invited people. Only empty lists have been
 * observed, so the fields are unknown.
 */
export type AdHocChallenge = Record<string, unknown>;

/** A multi-day event ("Epic"). Its fields are unverified. */
export type MultiDayActivityData = Record<string, unknown>;

/**
 * A new multi-day event. The field names come from Garmin's web code; their
 * formats are unverified.
 */
export interface MultiDayActivityInput {
    name: string;
    startDate: Date;
    endDate: Date;
    /**
     * Who can see the event, sent as given. The accepted values are unknown,
     * so there is no default.
     */
    accessControlRule: unknown;
    summary?: string;
    /** Defaults to false */
    shareLiveTrack?: boolean;
    courseIds?: Array<number | string>;
    activityIds?: Array<number | string>;
}
