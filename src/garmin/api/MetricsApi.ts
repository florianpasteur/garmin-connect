import { toDateString } from '../common/DateUtils';
import {
    BiometricHeartRateZones,
    BiometricPowerZones,
    CriticalSwimSpeed,
    EnduranceScore,
    FitnessAge,
    FunctionalThresholdPower,
    HeatAltitudeAcclimation,
    HillScore,
    LactateThresholdEntry,
    PersonalInformation,
    RacePrediction,
    RunningToleranceAggregation,
    RunningToleranceStat,
    TrainingReadinessEntry,
    TrainingStatusAggregate,
    UserStatistics,
    UserWellnessStatistics,
    Vo2MaxDailyEntry,
    Vo2MaxLatest
} from '../types/metrics';
import { MetricsUrls } from '../urls/metrics';
import { HealthApi } from './HealthApi';

export class MetricsApi extends HealthApi {
    protected readonly metricsUrls = new MetricsUrls(this.url);

    /**
     * Retrieves the training readiness entries of a day
     * @param date - The day to read, defaults to today
     * @returns Readiness entries, empty without data. Their shape is unverified
     */
    async getTrainingReadiness(
        date = new Date()
    ): Promise<TrainingReadinessEntry[]> {
        return this.client.get<TrainingReadinessEntry[]>(
            this.metricsUrls.TRAINING_READINESS(toDateString(date))
        );
    }

    /**
     * Retrieves the aggregated training status (status, load balance, VO2 max
     * and acclimation) as of a day
     * @param date - The day to read, defaults to today
     * @returns Training status, with null members when there is no data
     */
    async getTrainingStatus(
        date = new Date()
    ): Promise<TrainingStatusAggregate> {
        return this.client.get<TrainingStatusAggregate>(
            this.metricsUrls.TRAINING_STATUS(toDateString(date))
        );
    }

    /**
     * Retrieves the latest VO2 max values as of a day
     * @param date - The day to read, defaults to today
     * @returns VO2 max data, with null members when there is no data
     */
    async getVo2Max(date = new Date()): Promise<Vo2MaxLatest> {
        return this.client.get<Vo2MaxLatest>(
            this.metricsUrls.VO2_MAX_LATEST(toDateString(date))
        );
    }

    /**
     * Retrieves daily VO2 max values over a date range
     * @param start - First day of the range
     * @param end - Last day of the range
     * @returns Daily entries, empty without data. Their shape is unverified
     */
    async getVo2MaxRange(start: Date, end: Date): Promise<Vo2MaxDailyEntry[]> {
        return this.client.get<Vo2MaxDailyEntry[]>(
            this.metricsUrls.VO2_MAX_DAILY(
                toDateString(start),
                toDateString(end)
            )
        );
    }

    /**
     * Retrieves the latest race time predictions
     * @returns The predictions, or null without data. Their shape is unverified
     */
    async getRacePredictions(): Promise<RacePrediction | null> {
        const displayName = await this.getDisplayName();
        return this.getOptional<RacePrediction>(
            this.metricsUrls.RACE_PREDICTIONS_LATEST(displayName)
        );
    }

    /**
     * Retrieves daily race time predictions over a date range
     * @param start - First day of the range
     * @param end - Last day of the range
     * @returns Daily predictions, empty without data. Their shape is unverified
     */
    async getRacePredictionsRange(
        start: Date,
        end: Date
    ): Promise<RacePrediction[]> {
        const displayName = await this.getDisplayName();
        return this.client.get<RacePrediction[]>(
            this.metricsUrls.RACE_PREDICTIONS_DAILY(displayName),
            {
                params: {
                    fromCalendarDate: toDateString(start),
                    toCalendarDate: toDateString(end)
                }
            }
        );
    }

    /**
     * Retrieves the endurance score of a day
     * @param date - The day to read, defaults to today
     * @returns The score, or null without data. Its shape is unverified
     */
    async getEnduranceScore(date = new Date()): Promise<EnduranceScore | null> {
        return this.getOptional<EnduranceScore>(
            this.metricsUrls.ENDURANCE_SCORE,
            { params: { calendarDate: toDateString(date) } }
        );
    }

    /**
     * Retrieves the hill score of a day
     * @param date - The day to read, defaults to today
     * @returns The score, or null without data. Its shape is unverified
     */
    async getHillScore(date = new Date()): Promise<HillScore | null> {
        return this.getOptional<HillScore>(this.metricsUrls.HILL_SCORE, {
            params: { calendarDate: toDateString(date) }
        });
    }

    /**
     * Retrieves running tolerance statistics over a date range
     * @param start - First day of the range
     * @param end - Last day of the range
     * @param aggregation - `daily` (default) or `weekly`
     * @returns Statistics, empty without data. Their shape is unverified
     */
    async getRunningTolerance(
        start: Date,
        end: Date,
        aggregation: RunningToleranceAggregation = 'daily'
    ): Promise<RunningToleranceStat[]> {
        return this.client.get<RunningToleranceStat[]>(
            this.metricsUrls.RUNNING_TOLERANCE,
            {
                params: {
                    startDate: toDateString(start),
                    endDate: toDateString(end),
                    aggregation
                }
            }
        );
    }

    /**
     * Retrieves the latest heat and altitude acclimation as of a day
     * @param date - The day to read, defaults to today
     * @returns Acclimation data, or null without data. Its shape is unverified
     */
    async getHeatAltitudeAcclimation(
        date = new Date()
    ): Promise<HeatAltitudeAcclimation | null> {
        return this.getOptional<HeatAltitudeAcclimation>(
            this.metricsUrls.HEAT_ALTITUDE_ACCLIMATION(toDateString(date))
        );
    }

    /**
     * Retrieves the fitness age and its components as of a day
     * @param date - The day to read, defaults to today
     * @returns Fitness age data; the age itself needs device data
     */
    async getFitnessAge(date = new Date()): Promise<FitnessAge> {
        return this.client.get<FitnessAge>(
            this.metricsUrls.FITNESS_AGE(toDateString(date))
        );
    }

    /**
     * Retrieves the latest lactate threshold
     * @returns Threshold entries, empty without data. Their shape is unverified
     */
    async getLactateThreshold(): Promise<LactateThresholdEntry[]> {
        return this.client.get<LactateThresholdEntry[]>(
            this.metricsUrls.LACTATE_THRESHOLD
        );
    }

    /**
     * Retrieves the latest functional threshold power (FTP) of a sport
     * @param sport - Sport key, e.g. `CYCLING`
     * @returns FTP data, with null members when there is no data
     * @throws Error if sport is missing
     */
    async getFtp(sport: string): Promise<FunctionalThresholdPower> {
        if (!sport) throw new Error('Missing sport');
        return this.client.get<FunctionalThresholdPower>(
            this.metricsUrls.FUNCTIONAL_THRESHOLD_POWER(sport)
        );
    }

    /**
     * Retrieves the configured heart rate zones
     * @returns One set of zones per configured sport
     */
    async getHeartRateZones(): Promise<BiometricHeartRateZones[]> {
        return this.client.get<BiometricHeartRateZones[]>(
            this.metricsUrls.HEART_RATE_ZONES
        );
    }

    /**
     * Retrieves the configured power zones of all sports
     * @returns One set of zones per sport
     */
    async getPowerZones(): Promise<BiometricPowerZones[]> {
        return this.client.get<BiometricPowerZones[]>(
            this.metricsUrls.POWER_ZONES
        );
    }

    /**
     * Retrieves the latest critical swim speed as of a day
     * @param date - The day to read, defaults to today
     * @returns Swim speed data, or null without data. Its shape is unverified
     */
    async getCriticalSwimSpeed(
        date = new Date()
    ): Promise<CriticalSwimSpeed | null> {
        return this.getOptional<CriticalSwimSpeed>(
            this.metricsUrls.CRITICAL_SWIM_SPEED(toDateString(date))
        );
    }

    /**
     * Retrieves activity totals of the signed in user, per activity type
     * @returns Totals such as distance, duration and activity count
     */
    async getUserStatistics(): Promise<UserStatistics> {
        const displayName = await this.getDisplayName();
        return this.client.get<UserStatistics>(
            this.metricsUrls.USER_STATISTICS(displayName)
        );
    }

    /**
     * Retrieves a daily wellness metric of the signed in user over a date range
     * @param start - First day of the range
     * @param end - Last day of the range
     * @param metricId - Garmin metric id, defaults to 60 (resting heart rate),
     * the only id that has been verified
     * @returns Values keyed by metric name
     */
    async getUserWellnessStatistics(
        start: Date,
        end: Date,
        metricId = 60
    ): Promise<UserWellnessStatistics> {
        const displayName = await this.getDisplayName();
        return this.client.get<UserWellnessStatistics>(
            this.metricsUrls.USER_WELLNESS_STATISTICS(displayName),
            {
                params: {
                    fromDate: toDateString(start),
                    untilDate: toDateString(end),
                    metricId
                }
            }
        );
    }

    /**
     * Retrieves personal and biometric details of the signed in user
     * @returns Age, locale, height, weight and related profile values
     */
    async getPersonalInformation(): Promise<PersonalInformation> {
        const displayName = await this.getDisplayName();
        return this.client.get<PersonalInformation>(
            this.metricsUrls.PERSONAL_INFORMATION(displayName)
        );
    }
}
