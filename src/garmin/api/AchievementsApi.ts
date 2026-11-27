import { toDateString } from '../common/DateUtils';
import {
    AdHocChallenge,
    AvailableBadge,
    BadgeChallenge,
    DailyWellnessGoal,
    EarnedBadge,
    EffectiveGoal,
    GoalEntry,
    GoalListOptions,
    GoalStatus,
    MultiDayActivityData,
    MultiDayActivityInput,
    PersonalRecord,
    PersonalRecordType
} from '../types/achievements';
import { AchievementsUrls } from '../urls/achievements';
import { EquipmentApi } from './EquipmentApi';

export class AchievementsApi extends EquipmentApi {
    protected readonly achievementsUrls = new AchievementsUrls(this.url);

    /**
     * Retrieves the personal records of the signed in user
     * @returns Personal records, their fields are unverified
     */
    async getPersonalRecords(): Promise<PersonalRecord[]> {
        const displayName = await this.getDisplayName();
        return this.client.get<PersonalRecord[]>(
            this.achievementsUrls.PERSONAL_RECORDS(displayName)
        );
    }

    /**
     * Retrieves the kinds of personal records Garmin tracks
     * @returns Personal record types
     */
    async getPersonalRecordTypes(): Promise<PersonalRecordType[]> {
        const displayName = await this.getDisplayName();
        return this.client.get<PersonalRecordType[]>(
            this.achievementsUrls.PERSONAL_RECORD_TYPES(displayName)
        );
    }

    /**
     * Lists the user's goals
     * @param status - `active` (default), `future` or `past`
     * @param options - Optional paging and sorting, sent only when given
     * @returns Goals, their fields are unverified
     */
    async getGoals(
        status: GoalStatus = 'active',
        options: GoalListOptions = {}
    ): Promise<GoalEntry[]> {
        return this.client.get<GoalEntry[]>(this.achievementsUrls.GOALS, {
            params: { ...options, status }
        });
    }

    /**
     * Creates a goal. This modifies the account.
     * @param goal - Request body, sent as given. Its shape is unverified.
     * @returns The response of Garmin, its shape is unverified
     */
    async createGoal(goal: Record<string, unknown>): Promise<unknown> {
        if (!goal) {
            throw new Error('Missing goal');
        }
        return this.client.post<unknown>(
            this.achievementsUrls.CREATE_GOAL,
            goal
        );
    }

    /**
     * Deletes a goal. This modifies the account.
     * @param goalId - Id of the goal
     */
    async deleteGoal(goalId: number | string): Promise<void> {
        if (!goalId) {
            throw new Error('Missing goalId');
        }
        await this.client.delete(this.achievementsUrls.GOAL(goalId));
    }

    /**
     * Retrieves the step goal of a day
     * @param date - Day to read, defaults to today
     * @returns The goal (fields unverified), or null when Garmin has none
     */
    async getDailyStepGoal(
        date: Date = new Date()
    ): Promise<DailyWellnessGoal | null> {
        return this.getOptional<DailyWellnessGoal>(
            this.achievementsUrls.DAILY_STEP_GOAL(toDateString(date))
        );
    }

    /**
     * Changes a daily wellness goal. This modifies the account.
     * @param date - Day sent in the URL
     * @param goal - Request body, sent as given. Its shape is unverified.
     * @returns The response of Garmin, its shape is unverified
     */
    async updateDailyWellnessGoal(
        date: Date,
        goal: Record<string, unknown>
    ): Promise<unknown> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!goal) {
            throw new Error('Missing goal');
        }
        return this.client.put<unknown>(
            this.achievementsUrls.DAILY_WELLNESS_GOAL(toDateString(date)),
            goal
        );
    }

    /**
     * Retrieves the daily goals that are in effect on a day
     * @param date - Day to read, defaults to today
     * @returns One entry per goal type
     */
    async getEffectiveGoals(date: Date = new Date()): Promise<EffectiveGoal[]> {
        return this.client.get<EffectiveGoal[]>(
            this.achievementsUrls.EFFECTIVE_GOALS(toDateString(date))
        );
    }

    /**
     * Sets the weight goal. This modifies the account.
     * @param goalInGrams - Target weight in grams
     * @param startDate - First day of the goal, defaults to today
     * @returns The response of Garmin, its shape is unverified
     */
    async setWeightGoal(
        goalInGrams: number,
        startDate: Date = new Date()
    ): Promise<unknown> {
        if (!(goalInGrams > 0)) {
            throw new Error('Missing goalInGrams');
        }
        const goalType = 'WEIGHT_GRAMS';
        return this.client.put<unknown>(
            this.achievementsUrls.EFFECTIVE_GOAL(
                goalType,
                toDateString(startDate)
            ),
            { goalValue: goalInGrams, goalType }
        );
    }

    /**
     * Lists the badges the user earned
     * @returns Earned badges
     */
    async getEarnedBadges(): Promise<EarnedBadge[]> {
        return this.client.get<EarnedBadge[]>(
            this.achievementsUrls.EARNED_BADGES
        );
    }

    /**
     * Lists the badges that can be earned
     * @returns Available badges
     */
    async getAvailableBadges(): Promise<AvailableBadge[]> {
        return this.client.get<AvailableBadge[]>(
            this.achievementsUrls.AVAILABLE_BADGES
        );
    }

    /**
     * Lists the badge challenges that are available
     * @returns Badge challenges
     */
    async getAvailableBadgeChallenges(): Promise<BadgeChallenge[]> {
        return this.client.get<BadgeChallenge[]>(
            this.achievementsUrls.BADGE_CHALLENGES('available')
        );
    }

    /**
     * Lists the badge challenges the user completed
     * @returns Badge challenges
     */
    async getCompletedBadgeChallenges(): Promise<BadgeChallenge[]> {
        return this.client.get<BadgeChallenge[]>(
            this.achievementsUrls.BADGE_CHALLENGES('completed')
        );
    }

    /**
     * Lists the badge challenges that are not completed
     * @returns Badge challenges
     */
    async getNonCompletedBadgeChallenges(): Promise<BadgeChallenge[]> {
        return this.client.get<BadgeChallenge[]>(
            this.achievementsUrls.BADGE_CHALLENGES('non-completed')
        );
    }

    /**
     * Lists the virtual challenges that are available
     * @returns Virtual challenges
     */
    async getAvailableVirtualChallenges(): Promise<BadgeChallenge[]> {
        return this.client.get<BadgeChallenge[]>(
            this.achievementsUrls.AVAILABLE_VIRTUAL_CHALLENGES
        );
    }

    /**
     * Joins a badge challenge. This modifies the account. The request was never
     * tried against Garmin, and this library cannot leave a challenge.
     * @param challengeUuid - `uuid` of a BadgeChallenge
     * @param date - Day sent in the URL, defaults to today
     * @returns The response of Garmin, its shape is unverified
     */
    async joinBadgeChallenge(
        challengeUuid: string,
        date: Date = new Date()
    ): Promise<unknown> {
        if (!challengeUuid) {
            throw new Error('Missing challengeUuid');
        }
        return this.client.post<unknown, null>(
            this.achievementsUrls.JOIN_BADGE_CHALLENGE(
                challengeUuid,
                toDateString(date)
            ),
            null,
            // The content type the web app sends
            { headers: { 'Content-Type': 'text/html' } }
        );
    }

    /**
     * Lists the past ad hoc challenges of the user
     * @returns Challenges, their fields are unverified
     */
    async getHistoricalAdHocChallenges(): Promise<AdHocChallenge[]> {
        return this.client.get<AdHocChallenge[]>(
            this.achievementsUrls.AD_HOC_CHALLENGES('historical')
        );
    }

    /**
     * Lists the ad hoc challenges of the user that are not completed
     * @returns Challenges, their fields are unverified
     */
    async getNonCompletedAdHocChallenges(): Promise<AdHocChallenge[]> {
        return this.client.get<AdHocChallenge[]>(
            this.achievementsUrls.AD_HOC_CHALLENGES('nonCompleted')
        );
    }

    /**
     * Creates an ad hoc challenge. This modifies the account and can send
     * invitations to other people.
     * @param challenge - Request body, sent as given. Its shape is unverified.
     * @returns The response of Garmin, its shape is unverified
     */
    async createAdHocChallenge(
        challenge: Record<string, unknown>
    ): Promise<unknown> {
        if (!challenge) {
            throw new Error('Missing challenge');
        }
        return this.client.post<unknown>(
            this.achievementsUrls.CREATE_AD_HOC_CHALLENGE,
            challenge
        );
    }

    /**
     * Lists the multi-day events ("Epics") of the user
     * @returns The response (shape unverified), or null when there are none
     */
    async getMultiDayActivities(): Promise<
        MultiDayActivityData | MultiDayActivityData[] | null
    > {
        return this.getOptional<MultiDayActivityData | MultiDayActivityData[]>(
            this.achievementsUrls.MULTI_DAY_ACTIVITIES
        );
    }

    /**
     * Retrieves a multi-day event
     * @param multiDayActivityId - Id of the event
     * @returns The event (fields unverified), or null when the response is empty
     */
    async getMultiDayActivity(
        multiDayActivityId: number | string
    ): Promise<MultiDayActivityData | null> {
        if (!multiDayActivityId) {
            throw new Error('Missing multiDayActivityId');
        }
        return this.getOptional<MultiDayActivityData>(
            this.achievementsUrls.MULTI_DAY_ACTIVITY(multiDayActivityId)
        );
    }

    /**
     * Retrieves the activities of a multi-day event
     * @param multiDayActivityId - Id of the event
     * @returns The response (shape unverified), or null when it is empty
     */
    async getActivitiesOfMultiDayActivity(
        multiDayActivityId: number | string
    ): Promise<MultiDayActivityData | MultiDayActivityData[] | null> {
        if (!multiDayActivityId) {
            throw new Error('Missing multiDayActivityId');
        }
        return this.getOptional<MultiDayActivityData | MultiDayActivityData[]>(
            this.achievementsUrls.MULTI_DAY_ACTIVITY_ACTIVITIES(
                multiDayActivityId
            )
        );
    }

    /**
     * Creates a multi-day event. This modifies the account. The value formats
     * of the request are unverified.
     * @param multiDayActivity - The event to create, owned by the signed in user
     * @returns The response of Garmin, its shape is unverified
     */
    async createMultiDayActivity(
        multiDayActivity: MultiDayActivityInput
    ): Promise<unknown> {
        const {
            name,
            startDate,
            endDate,
            accessControlRule,
            summary = '',
            shareLiveTrack = false,
            courseIds = [],
            activityIds = []
        } = multiDayActivity;
        if (!name) {
            throw new Error('Missing name');
        }
        if (!startDate || !endDate) {
            throw new Error('Missing startDate or endDate');
        }
        if (accessControlRule === undefined) {
            throw new Error('Missing accessControlRule');
        }
        const start = toDateString(startDate);
        const end = toDateString(endDate);
        if (start > end) {
            throw new Error('startDate is after endDate');
        }
        const userId = await this.getProfileId();
        return this.client.post<unknown>(
            this.achievementsUrls.CREATE_MULTI_DAY_ACTIVITY,
            {
                userId,
                name,
                summary,
                startDate: start,
                endDate: end,
                accessControlRule,
                shareLiveTrack,
                courseIds,
                activityIds
            }
        );
    }

    /**
     * Deletes a multi-day event. This modifies the account.
     * @param multiDayActivityId - Id of the event
     */
    async deleteMultiDayActivity(
        multiDayActivityId: number | string
    ): Promise<void> {
        if (!multiDayActivityId) {
            throw new Error('Missing multiDayActivityId');
        }
        await this.client.delete(
            this.achievementsUrls.MULTI_DAY_ACTIVITY(multiDayActivityId)
        );
    }
}
