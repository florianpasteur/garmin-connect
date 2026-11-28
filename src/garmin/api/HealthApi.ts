import _ from 'lodash';
import * as path from 'path';
import { checkIsDirectory, createDirectory, writeToFile } from '../../utils';
import { IDailyStepsType } from '../types';
import { calculateTimeDifference, toDateString } from '../common/DateUtils';
import { SleepData, SleepDTO } from '../types/sleep';
import { gramsToPounds } from '../common/WeightUtils';
import { convertMLToOunces } from '../common/HydrationUtils';
import { HeartRate } from '../types/heartrate';
import { HydrationData, WaterIntake } from '../types/hydration';
import { WeightData } from '../types/weight';
import {
    BodyBatteryDailyStat,
    BodyBatteryEvent,
    BodyBatteryReport,
    FloorsChart,
    FloorsDailyStat,
    HealthStatusSummary,
    HrvDay,
    HrvRangePeriod,
    HydrationDailyStat,
    IntensityMinutesDailyStat,
    IntensityMinutesDay,
    LifestyleLog,
    RespirationDailyStat,
    RespirationDay,
    RestingHeartRateDailyStat,
    SleepNap,
    SleepScoreStat,
    SleepStatsReport,
    SleepStatsResponse,
    SpO2Day,
    StepsChartEntry,
    StressDailyStat,
    StressDay,
    UserDailySummary,
    WeightGoals,
    WeightRange,
    WeightSample,
    WellnessActivitySummary,
    WellnessDailyEvent
} from '../types/wellness';
import { HealthUrls } from '../urls/health';
import { ActivityApi } from './ActivityApi';

// Longest range accepted by the daily statistics endpoints (29 days is a 400).
// Also used where the limit is unknown.
const HEALTH_RANGE_MAX_DAYS = 28;

export class HealthApi extends ActivityApi {
    protected readonly healthUrls = new HealthUrls(this.url);

    /**
     * Retrieves step count for a specific date
     * @param date - The date to get step count for, defaults to current date
     * @returns Total step count for the specified date, or null when Garmin has
     * a record for the date without a step count (e.g. no device data)
     * @throws Error if steps data not found for the date
     */
    async getSteps(date = new Date()): Promise<number | null> {
        const dateString = toDateString(date);

        const days = await this.getStepsRange(date, date);
        const dayStats = days.find(
            ({ calendarDate }) => calendarDate === dateString
        );

        if (!dayStats) {
            throw new Error("Can't find daily steps for this date.");
        }

        return dayStats.totalSteps;
    }

    /**
     * Retrieves sleep data for a specific date
     * @param date - The date to get sleep data for, defaults to current date
     * @returns Sleep data for the specified date
     * @throws Error if sleep data is invalid or empty
     */
    async getSleepData(date = new Date()): Promise<SleepData> {
        try {
            const dateString = toDateString(date);

            const sleepData = await this.client.get<SleepData>(
                `${this.url.DAILY_SLEEP}`,
                { params: { date: dateString } }
            );

            if (!sleepData) {
                throw new Error('Invalid or empty sleep data response.');
            }

            return sleepData;
        } catch (error: any) {
            throw new Error(`Error in getSleepData: ${error.message}`);
        }
    }

    /**
     * Calculates sleep duration for a specific date
     *
     * Retrieves hours and minutes slept for a given date.
     *
     * @param date - The date to get sleep duration for, defaults to current date
     * @returns Object with hours and minutes of sleep
     * @throws Error if sleep data is missing or invalid
     *
     * @example
     * ```js
     * const detailedSleep = await GCClient.getSleepDuration(new Date('2020-03-24'));
     * console.log(`Hours: ${detailedSleep.hours}, Minutes: ${detailedSleep.minutes}`);
     * ```
     */
    async getSleepDuration(
        date = new Date()
    ): Promise<{ hours: number; minutes: number }> {
        try {
            const sleepData = await this.getSleepData(date);

            const sleepStartTimestampGMT =
                sleepData?.dailySleepDTO?.sleepStartTimestampGMT;
            const sleepEndTimestampGMT =
                sleepData?.dailySleepDTO?.sleepEndTimestampGMT;

            // Both are null for a night without data.
            if (
                sleepStartTimestampGMT == null ||
                sleepEndTimestampGMT == null
            ) {
                throw new Error(
                    'Invalid or missing sleep data for the specified date.'
                );
            }

            const { hours, minutes } = calculateTimeDifference(
                sleepStartTimestampGMT,
                sleepEndTimestampGMT
            );

            return {
                hours,
                minutes
            };
        } catch (error: any) {
            throw new Error(`Error in getSleepDuration: ${error.message}`);
        }
    }

    /**
     * Retrieves weight data for a specific date
     * @param date - The date to get weight data for, defaults to current date
     * @returns Weight data for the specified date
     * @throws Error if weight data is invalid or empty
     */
    async getDailyWeightData(date = new Date()): Promise<WeightData> {
        try {
            const dateString = toDateString(date);
            const weightData = await this.client.get<WeightData>(
                `${this.url.DAILY_WEIGHT}/${dateString}`
            );

            if (!weightData) {
                throw new Error('Invalid or empty weight data response.');
            }

            return weightData;
        } catch (error: any) {
            throw new Error(`Error in getDailyWeightData: ${error.message}`);
        }
    }

    /**
     * Retrieves weight data in pounds for a specific date
     * @param date - The date to get weight data for, defaults to current date
     * @returns Weight in pounds for the specified date
     * @throws Error if valid weight data not found for the date
     */
    async getDailyWeightInPounds(date = new Date()): Promise<number> {
        const weightData = await this.getDailyWeightData(date);

        if (
            weightData.totalAverage &&
            typeof weightData.totalAverage.weight === 'number'
        ) {
            return gramsToPounds(weightData.totalAverage.weight);
        } else {
            throw new Error("Can't find valid daily weight for this date.");
        }
    }

    /**
     * Retrieves hydration data in fluid ounces for a specific date
     * @param date - The date to get hydration data for, defaults to current date
     * @returns Hydration value in fluid ounces for the specified date, 0 when
     * nothing is logged
     * @throws Error if hydration data is invalid or empty
     */
    async getDailyHydration(date = new Date()): Promise<number> {
        try {
            const dateString = toDateString(date);
            const hydrationData = await this.client.get<HydrationData>(
                `${this.url.DAILY_HYDRATION}/${dateString}`
            );

            if (!hydrationData || hydrationData.valueInML === undefined) {
                throw new Error('Invalid or empty hydration data response.');
            }

            // Garmin returns null when nothing is logged for the date.
            return convertMLToOunces(hydrationData.valueInML ?? 0);
        } catch (error: any) {
            throw new Error(`Error in getDailyHydration: ${error.message}`);
        }
    }

    /**
     * Retrieves heart rate data for a specific date
     * @param date - The date to get heart rate data for, defaults to current date
     * @returns Heart rate data for the specified date
     * @throws Error if the operation fails
     */
    async getHeartRate(date = new Date()): Promise<HeartRate> {
        try {
            const dateString = toDateString(date);
            const heartRate = await this.client.get<HeartRate>(
                `${this.url.DAILY_HEART_RATE}`,
                { params: { date: dateString } }
            );

            return heartRate;
        } catch (error: any) {
            throw new Error(`Error in getHeartRate: ${error.message}`);
        }
    }

    /**
     * Retrieves the summary of a day: calories, steps, intensity, heart rate,
     * stress, Body Battery and SpO2
     * @param date - Defaults to current date
     * @returns The daily summary. Metrics without data are null.
     */
    async getDailySummary(date = new Date()): Promise<UserDailySummary> {
        const displayName = await this.getDisplayName();
        return this.client.get<UserDailySummary>(
            this.healthUrls.USER_DAILY_SUMMARY(displayName),
            { params: { calendarDate: toDateString(date) } }
        );
    }

    /**
     * Retrieves the stress levels of a day
     * @param date - Defaults to current date
     * @returns Stress summary and values
     */
    async getStress(date = new Date()): Promise<StressDay> {
        return this.client.get<StressDay>(
            this.healthUrls.DAILY_STRESS(toDateString(date))
        );
    }

    /**
     * Retrieves the daily Body Battery reports of a date range, requested 28
     * days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One report per day Garmin answers with, oldest request first
     * @throws Error when `start` is after `end`
     */
    async getBodyBattery(start: Date, end: Date): Promise<BodyBatteryReport[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<BodyBatteryReport[]>(
                this.healthUrls.BODY_BATTERY_REPORTS,
                { params: { startDate, endDate } }
            )
        );
    }

    /**
     * Retrieves the events that charged or drained Body Battery on a day
     * @param date - Defaults to current date
     * @returns The events, empty when there are none
     */
    async getBodyBatteryEvents(date = new Date()): Promise<BodyBatteryEvent[]> {
        const events = await this.getOptional<BodyBatteryEvent[]>(
            this.healthUrls.BODY_BATTERY_EVENTS(toDateString(date))
        );
        return events || [];
    }

    /**
     * Retrieves the respiration data of a day
     * @param date - Defaults to current date
     * @returns Respiration summary and values
     */
    async getRespiration(date = new Date()): Promise<RespirationDay> {
        return this.client.get<RespirationDay>(
            this.healthUrls.DAILY_RESPIRATION(toDateString(date))
        );
    }

    /**
     * Retrieves the blood oxygen (SpO2) data of a day
     * @param date - Defaults to current date
     * @returns SpO2 summary and values
     */
    async getSpO2(date = new Date()): Promise<SpO2Day> {
        return this.client.get<SpO2Day>(
            this.healthUrls.DAILY_SPO2(toDateString(date))
        );
    }

    /**
     * Retrieves the intensity minutes of a day and of its week
     * @param date - Defaults to current date
     * @returns Intensity minutes and weekly goal
     */
    async getIntensityMinutes(date = new Date()): Promise<IntensityMinutesDay> {
        return this.client.get<IntensityMinutesDay>(
            this.healthUrls.DAILY_INTENSITY_MINUTES(toDateString(date))
        );
    }

    /**
     * Retrieves the floors climbed during a day, as chart data
     * @param date - Defaults to current date
     * @returns Floors chart data
     */
    async getFloors(date = new Date()): Promise<FloorsChart> {
        return this.client.get<FloorsChart>(
            this.healthUrls.DAILY_FLOORS(toDateString(date))
        );
    }

    /**
     * Retrieves the steps chart of a day
     * @param date - Defaults to current date
     * @returns Chart entries, empty when there is no data
     */
    async getStepsChart(date = new Date()): Promise<StepsChartEntry[]> {
        const entries = await this.getOptional<StepsChartEntry[]>(
            this.healthUrls.DAILY_SUMMARY_CHART,
            { params: { date: toDateString(date) } }
        );
        return entries || [];
    }

    /**
     * Retrieves the wellness events of a day
     * @param date - Defaults to current date
     * @returns The events, empty when there are none
     */
    async getDailyEvents(date = new Date()): Promise<WellnessDailyEvent[]> {
        const displayName = await this.getDisplayName();
        const events = await this.getOptional<WellnessDailyEvent[]>(
            this.healthUrls.DAILY_EVENTS(displayName),
            { params: { calendarDate: toDateString(date) } }
        );
        return events || [];
    }

    /**
     * Retrieves the heart rate variability (HRV) of a night
     * @param date - Defaults to current date
     * @returns HRV data, or null when there is none. The shape is unverified.
     */
    async getHrv(date = new Date()): Promise<HrvDay | null> {
        return this.getOptional<HrvDay>(
            this.healthUrls.HRV(toDateString(date))
        );
    }

    /**
     * Retrieves heart rate variability over a date range, requested 28 days at
     * a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns The response of each request that had data, oldest first, not
     * merged because the shape is unverified. Empty when there is no data.
     * @throws Error when `start` is after `end`
     */
    async getHrvRange(start: Date, end: Date): Promise<HrvRangePeriod[]> {
        return this.requestByDateRange(
            start,
            end,
            HEALTH_RANGE_MAX_DAYS,
            async (startDate, endDate) => {
                const data = await this.getOptional<unknown>(
                    this.healthUrls.HRV_RANGE(startDate, endDate)
                );
                return data === null ? null : { startDate, endDate, data };
            }
        );
    }

    /**
     * Retrieves the health status summary of a day
     * @param date - Defaults to current date
     * @returns Health status, or null when there is none. The shape is
     * unverified.
     */
    async getHealthStatus(
        date = new Date()
    ): Promise<HealthStatusSummary | null> {
        return this.getOptional<HealthStatusSummary>(
            this.healthUrls.HEALTH_STATUS(toDateString(date))
        );
    }

    /**
     * Retrieves nightly sleep statistics over a date range, requested 28 days
     * at a time
     *
     * The nights of all requests are concatenated. Garmin's `overallStats`
     * averages cover one request only, so they are returned per period and never
     * combined: a range of up to 28 days has a single period.
     *
     * @param start - First day, included
     * @param end - Last day, included
     * @returns All nights, and the averages of each requested period
     * @throws Error when `start` is after `end`
     */
    async getSleepStats(start: Date, end: Date): Promise<SleepStatsReport> {
        const chunks = await this.requestByDateRange(
            start,
            end,
            HEALTH_RANGE_MAX_DAYS,
            async (startDate, endDate) => {
                const stats = await this.getOptional<SleepStatsResponse>(
                    this.healthUrls.SLEEP_STATS(startDate, endDate)
                );
                return stats && { startDate, endDate, stats };
            }
        );
        return {
            individualStats: _.flatten(
                chunks.map(({ stats }) => stats.individualStats || [])
            ),
            periods: chunks.map(({ startDate, endDate, stats }) => ({
                startDate,
                endDate,
                overallStats: stats.overallStats
            }))
        };
    }

    /**
     * Retrieves the sleep summary of a night, without the movement, stage and
     * sensor series returned by `getSleepData`
     * @param date - Defaults to current date
     * @returns The sleep summary, or null when the response is empty
     */
    async getSleep(date = new Date()): Promise<SleepDTO | null> {
        return this.getOptional<SleepDTO>(this.healthUrls.SLEEP_SUMMARY, {
            params: { date: toDateString(date) }
        });
    }

    /**
     * Retrieves the sleep summaries of a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns Sleep summaries, oldest request first
     * @throws Error when `start` is after `end`
     */
    async getSleepSummaries(start: Date, end: Date): Promise<SleepDTO[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<SleepDTO[]>(this.healthUrls.SLEEP_SUMMARIES, {
                params: { startDate, endDate }
            })
        );
    }

    /**
     * Retrieves the daily sleep scores of a date range, requested 28 days at a
     * time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns Sleep scores, oldest request first. The item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getSleepScores(start: Date, end: Date): Promise<SleepScoreStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<SleepScoreStat[]>(
                this.healthUrls.SLEEP_SCORES(startDate, endDate)
            )
        );
    }

    /**
     * Retrieves the naps of a day
     * @param date - Defaults to current date
     * @returns The naps, empty when there are none. The item shape is
     * unverified.
     */
    async getNaps(date = new Date()): Promise<SleepNap[]> {
        const naps = await this.getOptional<SleepNap[]>(
            this.healthUrls.SLEEP_NAPS(toDateString(date))
        );
        return naps || [];
    }

    /**
     * Retrieves daily step totals over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns Steps, distance and goal per day, oldest request first
     * @throws Error when `start` is after `end`
     */
    async getStepsRange(start: Date, end: Date): Promise<IDailyStepsType[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<IDailyStepsType[]>(
                `${this.url.DAILY_STEPS}${startDate}/${endDate}`
            )
        );
    }

    /**
     * Retrieves daily stress statistics over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first. The
     * item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getStressRange(start: Date, end: Date): Promise<StressDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<StressDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS('stress', startDate, endDate)
            )
        );
    }

    /**
     * Retrieves daily resting heart rate over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first. The
     * item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getRestingHeartRateRange(
        start: Date,
        end: Date
    ): Promise<RestingHeartRateDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<RestingHeartRateDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS(
                    'heartRate',
                    startDate,
                    endDate
                )
            )
        );
    }

    /**
     * Retrieves daily intensity minutes over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first.
     * @throws Error when `start` is after `end`
     */
    async getIntensityMinutesRange(
        start: Date,
        end: Date
    ): Promise<IntensityMinutesDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<IntensityMinutesDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS('im', startDate, endDate)
            )
        );
    }

    /**
     * Retrieves daily floors climbed over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first.
     * @throws Error when `start` is after `end`
     */
    async getFloorsRange(start: Date, end: Date): Promise<FloorsDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<FloorsDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS('floors', startDate, endDate)
            )
        );
    }

    /**
     * Retrieves daily hydration statistics over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first. The
     * item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getHydrationRange(
        start: Date,
        end: Date
    ): Promise<HydrationDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<HydrationDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS(
                    'hydration',
                    startDate,
                    endDate
                )
            )
        );
    }

    /**
     * Retrieves daily respiration statistics over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first. The
     * item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getRespirationRange(
        start: Date,
        end: Date
    ): Promise<RespirationDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<RespirationDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS(
                    'respiration',
                    startDate,
                    endDate
                )
            )
        );
    }

    /**
     * Retrieves daily Body Battery statistics over a date range, requested 28 days at a time
     * @param start - First day, included
     * @param end - Last day, included
     * @returns One entry per day Garmin answers with, oldest request first. The
     * item shape is unverified.
     * @throws Error when `start` is after `end`
     */
    async getBodyBatteryRange(
        start: Date,
        end: Date
    ): Promise<BodyBatteryDailyStat[]> {
        return this.getHealthDailyList(start, end, (startDate, endDate) =>
            this.getOptional<BodyBatteryDailyStat[]>(
                this.healthUrls.USER_DAILY_STATS(
                    'bodybattery',
                    startDate,
                    endDate
                )
            )
        );
    }

    /**
     * Retrieves weigh-ins over a date range, in a single request (ranges of 13
     * months are accepted)
     * @param start - First day, included
     * @param end - Last day, included
     * @returns Weigh-ins grouped by day, and their averages
     */
    async getWeightRange(start: Date, end: Date): Promise<WeightRange> {
        return this.client.get<WeightRange>(
            this.healthUrls.WEIGHT_RANGE(
                toDateString(start),
                toDateString(end)
            ),
            { params: { includeAll: true } }
        );
    }

    /**
     * Retrieves the latest weigh-in as of a date
     * @param date - Defaults to current date
     * @returns The weigh-in, or null when there is none
     */
    async getLatestWeight(date = new Date()): Promise<WeightSample | null> {
        return this.getOptional<WeightSample>(this.healthUrls.LATEST_WEIGHT, {
            params: { date: toDateString(date), ignorePriority: true }
        });
    }

    /**
     * Retrieves the first weigh-in of the account
     * @returns The weigh-in, or null when there is none
     */
    async getFirstWeight(): Promise<WeightSample | null> {
        return this.getOptional<WeightSample>(this.healthUrls.FIRST_WEIGHT);
    }

    /**
     * Retrieves the weight goals in effect during a date range, in a single
     * request
     * @param start - First day, included
     * @param end - Last day, included
     * @returns The weight goals
     */
    async getWeightGoals(start: Date, end: Date): Promise<WeightGoals> {
        return this.client.get<WeightGoals>(
            this.healthUrls.WEIGHT_GOALS(toDateString(start), toDateString(end))
        );
    }

    /**
     * Retrieves the hydration total and goal of a day, in millilitres
     * @param date - Defaults to current date
     * @returns Hydration summary. `valueInML` is null when nothing is logged.
     */
    async getHydrationSummary(date = new Date()): Promise<WaterIntake> {
        return this.client.get<WaterIntake>(
            this.healthUrls.HYDRATION_SUMMARY(toDateString(date))
        );
    }

    /**
     * Retrieves wellness activities, such as breathwork sessions
     * @param start - Index of the first result, starting at 1
     * @param limit - Largest number of results
     * @param until - Latest date to include, defaults to current date
     * @returns The activities, empty when there are none. The item shape is
     * unverified.
     */
    async getWellnessActivities(
        start = 1,
        limit = 20,
        until = new Date()
    ): Promise<WellnessActivitySummary[]> {
        const activities = await this.getOptional<WellnessActivitySummary[]>(
            this.healthUrls.WELLNESS_ACTIVITIES,
            { params: { limit, start, until: toDateString(until) } }
        );
        return activities || [];
    }

    /**
     * Retrieves the lifestyle log of a day
     * @param date - Defaults to current date
     * @returns Logged behaviours and completion statistics
     */
    async getLifestyleLog(date = new Date()): Promise<LifestyleLog> {
        return this.client.get<LifestyleLog>(
            this.healthUrls.LIFESTYLE_LOG(toDateString(date))
        );
    }

    /**
     * Downloads the original wellness files of a day as `wellness-{date}.zip`
     * @param date - The day to download
     * @param dir - Directory to save the file in, created when missing
     * @returns Path of the saved file, or null when Garmin sends no content
     * @throws Error if date or dir is missing
     */
    async downloadDailyWellnessFile(
        date: Date,
        dir: string
    ): Promise<string | null> {
        if (!date) throw new Error('Missing date');
        if (!dir) throw new Error('Missing dir');
        const dateString = toDateString(date);
        const file = await this.client.get<Buffer>(
            this.healthUrls.DOWNLOAD_WELLNESS(dateString),
            { responseType: 'arraybuffer' }
        );
        if (!file || !file.length) {
            return null;
        }
        if (!checkIsDirectory(dir)) {
            createDirectory(dir);
        }
        const filePath = path.join(dir, `wellness-${dateString}.zip`);
        writeToFile(filePath, file);
        return filePath;
    }

    /** Concatenates the lists of a date range requested in chunks */
    private async getHealthDailyList<T>(
        start: Date,
        end: Date,
        request: (start: string, end: string) => Promise<T[] | null>
    ): Promise<T[]> {
        const chunks = await this.requestByDateRange(
            start,
            end,
            HEALTH_RANGE_MAX_DAYS,
            request
        );
        return _.flatten(chunks);
    }
}
