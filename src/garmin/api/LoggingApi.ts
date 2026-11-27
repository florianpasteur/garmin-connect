import { DateTime } from 'luxon';
import { getLocalTimestamp, toDateString } from '../common/DateUtils';
import { convertOuncesToML } from '../common/HydrationUtils';
import { WaterIntake } from '../types/hydration';
import {
    BloodPressureDay,
    BloodPressureRange,
    BloodPressureReading,
    GlucoseDay,
    MenstrualCycleCalendar,
    MenstrualCycleDaySummary,
    MenstrualCycleDayView,
    MenstrualCycleLastConfirmed,
    NutritionDailyLog,
    NutritionFoodSearchOptions,
    NutritionFoodSearchResult,
    NutritionMeals,
    NutritionStatus,
    WeightUnitKey
} from '../types/logging';
import { UpdateWeight } from '../types/weight';
import { LoggingUrls } from '../urls/logging';
import { TrainingApi } from './TrainingApi';

/**
 * `YYYY-MM-DDTHH:mm:ss.SSS` timestamps of one instant, as wall clock time in
 * `timezone` (the system's when omitted) and in GMT
 */
function toLoggingTimestamps(date: Date, timezone?: string) {
    const system = DateTime.fromJSDate(date);
    const local = timezone ? system.setZone(timezone) : system;
    if (!local.isValid) {
        throw new Error('Invalid date or timezone');
    }
    return {
        local: local.toISO({ includeOffset: false }) as string,
        gmt: date.toISOString().substring(0, 23)
    };
}

function toBloodPressurePayload(
    reading: BloodPressureReading,
    date: Date,
    timezone?: string
) {
    if (!reading?.systolic || !reading.diastolic || !reading.pulse) {
        throw new Error('Missing systolic, diastolic or pulse');
    }
    const timestamps = toLoggingTimestamps(date, timezone);
    return {
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        pulse: reading.pulse,
        sourceType: 'MANUAL',
        measurementTimestampLocal: timestamps.local,
        measurementTimestampGMT: timestamps.gmt,
        notes: reading.notes || ''
    };
}

export class LoggingApi extends TrainingApi {
    protected readonly loggingUrls = new LoggingUrls(this.url);

    /**
     * Adds a weight entry. Modifies the account.
     * @param date - The date for the weight data, defaults to current date
     * @param weight - Weight value, in pounds unless `unit` says otherwise
     * @param timezone - Timezone string for correct timestamp conversion
     * @param unit - Unit of `weight`, `lbs` (default) or `kg`
     * @returns Response from the weight update operation
     * @throws Error if update fails
     */
    async updateWeight(
        date = new Date(),
        weight: number,
        timezone: string,
        unit: WeightUnitKey = 'lbs'
    ): Promise<UpdateWeight> {
        try {
            const weightData = await this.client.post<UpdateWeight>(
                `${this.url.UPDATE_WEIGHT}`,
                {
                    dateTimestamp: getLocalTimestamp(date, timezone),
                    gmtTimestamp: date.toISOString().substring(0, 23),
                    unitKey: unit,
                    value: weight
                }
            );

            return weightData;
        } catch (error: any) {
            throw new Error(`Error in updateWeight: ${error.message}`);
        }
    }

    /**
     * Deletes one weight entry. Modifies the account.
     * @param date - Day of the entry. From its `calendarDate`, use
     * `new Date(calendarDate + 'T00:00:00')` to stay on that day in any timezone
     * @param samplePk - `samplePk` of the entry, as listed by
     * `getDailyWeightData` (the latest weight response calls it `version`)
     */
    async deleteWeight(date: Date, samplePk: number): Promise<void> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!samplePk) {
            throw new Error('Missing samplePk');
        }
        await this.client.delete(
            this.loggingUrls.WEIGHT_ENTRY(toDateString(date), samplePk)
        );
    }

    /**
     * Updates hydration log with fluid ounces for a specific date. Modifies the
     * account.
     * @param date - The date for the hydration data, defaults to current date
     * @param valueInOz - Hydration value in fluid ounces, added to the day's
     * total. A negative value subtracts
     * @returns Response from the hydration update operation
     * @throws Error if update fails
     */
    async updateHydrationLogOunces(
        date = new Date(),
        valueInOz: number
    ): Promise<WaterIntake> {
        try {
            return await this.updateHydrationLogMl(
                date,
                convertOuncesToML(valueInOz)
            );
        } catch (error: any) {
            throw new Error(
                `Error in updateHydrationLogOunces: ${error.message}`
            );
        }
    }

    /**
     * Updates hydration log with millilitres for a specific date. Modifies the
     * account.
     * @param date - Time of the drink, defaults to now. Its day and time are
     * taken in the system timezone
     * @param valueInML - Millilitres added to the day's total. A negative value
     * subtracts
     * @returns The hydration totals of the day
     */
    async updateHydrationLogMl(
        date = new Date(),
        valueInML: number
    ): Promise<WaterIntake> {
        if (typeof valueInML !== 'number' || !isFinite(valueInML)) {
            throw new Error('Missing valueInML');
        }
        const timestamps = toLoggingTimestamps(date);
        return this.client.put<WaterIntake>(this.url.HYDRATION_LOG, {
            calendarDate: toDateString(date),
            valueInML,
            userProfileId: await this.getProfileId(),
            timestampLocal: timestamps.local
        });
    }

    /**
     * Retrieves blood pressure measurements between two days, both included.
     * Ranges of 13 months are accepted
     * @param start - First day
     * @param end - Last day
     * @returns Measurements grouped by day with category counts, or null
     */
    async getBloodPressureRange(
        start: Date,
        end: Date
    ): Promise<BloodPressureRange | null> {
        return this.getOptional<BloodPressureRange>(
            this.loggingUrls.BLOOD_PRESSURE_RANGE(
                toDateString(start),
                toDateString(end)
            ),
            { params: { includeAll: true } }
        );
    }

    /**
     * Retrieves the blood pressure measurements of one day
     * @param date - The day, defaults to today
     * @returns The measurements of the day, or null
     */
    async getBloodPressureDay(
        date = new Date()
    ): Promise<BloodPressureDay | null> {
        return this.getOptional<BloodPressureDay>(
            this.loggingUrls.BLOOD_PRESSURE_DAY(toDateString(date))
        );
    }

    /**
     * Adds a manual blood pressure measurement. Modifies the account.
     * @param reading - Systolic, diastolic, pulse and optional notes
     * @param date - Time of the measurement, defaults to now
     * @param timezone - IANA zone of the local timestamp, defaults to the
     * system timezone
     * @returns The response of Garmin, its shape is unverified
     */
    async logBloodPressure(
        reading: BloodPressureReading,
        date = new Date(),
        timezone?: string
    ): Promise<unknown> {
        return this.client.post<unknown>(
            this.loggingUrls.BLOOD_PRESSURE,
            toBloodPressurePayload(reading, date, timezone)
        );
    }

    /**
     * Replaces a blood pressure measurement. Omitted notes are cleared.
     * Modifies the account.
     * @param version - `version` of the measurement to replace
     * @param reading - Systolic, diastolic, pulse and optional notes
     * @param date - Time of the measurement
     * @param timezone - IANA zone of the local timestamp, defaults to the
     * system timezone
     * @returns The response of Garmin, its shape is unverified
     */
    async updateBloodPressure(
        version: number,
        reading: BloodPressureReading,
        date: Date,
        timezone?: string
    ): Promise<unknown> {
        if (!version) {
            throw new Error('Missing version');
        }
        if (!date) {
            throw new Error('Missing date');
        }
        return this.client.put<unknown>(this.loggingUrls.BLOOD_PRESSURE, {
            ...toBloodPressurePayload(reading, date, timezone),
            version
        });
    }

    /**
     * Deletes a blood pressure measurement. Modifies the account.
     * @param date - Local day of the measurement, e.g.
     * `new Date(measurement.measurementTimestampLocal)`
     * @param version - `version` of the measurement
     */
    async deleteBloodPressure(date: Date, version: number): Promise<void> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!version) {
            throw new Error('Missing version');
        }
        await this.client.delete(
            this.loggingUrls.BLOOD_PRESSURE_ENTRY(toDateString(date), version)
        );
    }

    /**
     * Adds a manual sleep entry. Modifies the account.
     * @param sleep - Request body. Its shape is unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async createManualSleep(sleep: Record<string, unknown>): Promise<unknown> {
        if (!sleep) {
            throw new Error('Missing sleep');
        }
        return this.client.post<unknown>(this.loggingUrls.MANUAL_SLEEP, sleep);
    }

    /**
     * Edits a sleep entry. Modifies the account.
     * @param sleepId - `id` of the sleep entry (`dailySleepDTO.id`)
     * @param sleep - Request body. Its shape is unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async updateManualSleep(
        sleepId: number | string,
        sleep: Record<string, unknown>
    ): Promise<unknown> {
        if (!sleepId) {
            throw new Error('Missing sleepId');
        }
        if (!sleep) {
            throw new Error('Missing sleep');
        }
        return this.client.put<unknown>(
            this.loggingUrls.MANUAL_SLEEP_ENTRY(sleepId),
            sleep
        );
    }

    /**
     * Writes the note of a sleep entry. Modifies the account.
     * @param sleepId - `id` of the sleep entry (`dailySleepDTO.id`)
     * @param note - Request body. Its shape is unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async updateSleepNote(
        sleepId: number | string,
        note: Record<string, unknown>
    ): Promise<unknown> {
        if (!sleepId) {
            throw new Error('Missing sleepId');
        }
        if (!note) {
            throw new Error('Missing note');
        }
        return this.client.put<unknown>(
            this.loggingUrls.SLEEP_NOTE(sleepId),
            note
        );
    }

    /**
     * Adds a nap. Modifies the account.
     * @param nap - Nap object. Its fields are unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async logNap(nap: Record<string, unknown>): Promise<unknown> {
        if (!nap) {
            throw new Error('Missing nap');
        }
        return this.client.post<unknown>(this.loggingUrls.NAP, nap);
    }

    /**
     * Retrieves the food log of one day
     * @param date - The day, defaults to today
     * @returns Meals, logged foods and micronutrient settings, or null
     */
    async getNutritionDailyLog(
        date = new Date()
    ): Promise<NutritionDailyLog | null> {
        return this.getOptional<NutritionDailyLog>(
            this.loggingUrls.FOOD_LOGS(toDateString(date))
        );
    }

    /**
     * Retrieves the meals of one day
     * @param date - The day, defaults to today
     * @returns The meals, or null
     */
    async getNutritionMeals(date = new Date()): Promise<NutritionMeals | null> {
        return this.getOptional<NutritionMeals>(
            this.loggingUrls.NUTRITION_MEALS(toDateString(date))
        );
    }

    /**
     * Retrieves the nutrition settings in effect on one day
     * @param date - The day, defaults to today
     * @returns The settings, their shape is unverified, or null when none are set
     */
    async getNutritionSettings(
        date = new Date()
    ): Promise<Record<string, unknown> | null> {
        return this.getOptional<Record<string, unknown>>(
            this.loggingUrls.NUTRITION_SETTINGS(toDateString(date))
        );
    }

    /**
     * Retrieves whether and how the account uses nutrition tracking
     * @returns The nutrition status
     */
    async getNutritionStatus(): Promise<NutritionStatus> {
        return this.client.get<NutritionStatus>(
            this.loggingUrls.NUTRITION_STATUS
        );
    }

    /**
     * Searches the food database
     * @param searchExpression - Text to search for
     * @param options - Paging, region and language
     * @returns One page of results. Only `moreDataAvailable` is typed
     */
    async searchFoods(
        searchExpression: string,
        options: NutritionFoodSearchOptions = {}
    ): Promise<NutritionFoodSearchResult> {
        if (!searchExpression) {
            throw new Error('Missing searchExpression');
        }
        const {
            start = 0,
            limit = 20,
            regionCode = 'US',
            languageCode = 'en'
        } = options;
        return this.client.get<NutritionFoodSearchResult>(
            this.loggingUrls.FOOD_SEARCH,
            {
                params: {
                    searchExpression,
                    start,
                    limit,
                    regionCode: regionCode.toUpperCase(),
                    languageCode: languageCode.toLowerCase()
                }
            }
        );
    }

    /**
     * Retrieves the custom foods of the user
     * @param options - Optional search text, paging and `includeContent`
     * @returns The response of Garmin, its shape is unverified, or null
     */
    async getCustomFoods(
        options: {
            searchExpression?: string;
            start?: number;
            limit?: number;
            includeContent?: boolean;
        } = {}
    ): Promise<unknown> {
        const {
            searchExpression = '',
            start = 0,
            limit = 20,
            includeContent = true
        } = options;
        return this.getOptional<unknown>(this.loggingUrls.CUSTOM_FOOD, {
            params: { searchExpression, start, limit, includeContent }
        });
    }

    /**
     * Retrieves one custom food
     * @param customFoodUuid - UUID of the custom food
     * @returns The response of Garmin, its shape is unverified, or null
     */
    async getCustomFood(customFoodUuid: string): Promise<unknown> {
        if (!customFoodUuid) {
            throw new Error('Missing customFoodUuid');
        }
        return this.getOptional<unknown>(this.loggingUrls.CUSTOM_FOOD, {
            params: { customFoodUuid }
        });
    }

    /**
     * Adds foods to the log of one day. Modifies the account.
     * @param date - Day of the meals
     * @param foodLogItems - Items to log. Their shape is unverified and sent as
     * given
     * @returns The response of Garmin, its shape is unverified
     */
    async logFoods(
        date: Date,
        foodLogItems: Array<Record<string, unknown>>
    ): Promise<unknown> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!foodLogItems?.length) {
            throw new Error('Missing foodLogItems');
        }
        return this.client.put<unknown>(this.loggingUrls.LOG_FOODS, {
            mealDate: toDateString(date),
            foodLogItems
        });
    }

    /**
     * Quick adds entries to the food log of one day. Modifies the account.
     * @param date - Day of the meals
     * @param quickAddItems - Items to add. Their shape is unverified and sent as
     * given
     * @returns The response of Garmin, its shape is unverified
     */
    async quickAddFoods(
        date: Date,
        quickAddItems: Array<Record<string, unknown>>
    ): Promise<unknown> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!quickAddItems?.length) {
            throw new Error('Missing quickAddItems');
        }
        return this.client.put<unknown>(this.loggingUrls.QUICK_ADD_FOOD, {
            mealDate: toDateString(date),
            quickAddItems
        });
    }

    /**
     * Removes entries from the food log of one day. Modifies the account.
     * @param date - Day of the entries
     * @param logIds - Ids of the log entries
     */
    async deleteFoodLogs(
        date: Date,
        logIds: Array<number | string>
    ): Promise<void> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!logIds?.length) {
            throw new Error('Missing logIds');
        }
        // client.delete() cannot send a body
        await this.client.post(
            this.loggingUrls.FOOD_LOGS(toDateString(date)),
            { logIds },
            { headers: { 'X-Http-Method-Override': 'DELETE' } }
        );
    }

    /**
     * Creates or updates a custom food. Modifies the account.
     * @param customFood - Request body. Its shape is unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async saveCustomFood(
        customFood: Record<string, unknown>
    ): Promise<unknown> {
        if (!customFood) {
            throw new Error('Missing customFood');
        }
        return this.client.put<unknown>(
            this.loggingUrls.CUSTOM_FOOD,
            customFood
        );
    }

    /**
     * Deletes a custom food. Modifies the account.
     * @param customFoodId - Id of the custom food
     */
    async deleteCustomFood(customFoodId: number | string): Promise<void> {
        if (!customFoodId) {
            throw new Error('Missing customFoodId');
        }
        await this.client.delete(
            this.loggingUrls.CUSTOM_FOOD_ENTRY(customFoodId)
        );
    }

    /**
     * Retrieves the cycle tracking view of one day. Sensitive health data, only
     * available when the user opted in to cycle tracking
     * @param date - The day, defaults to today
     * @param today - The current day, which Garmin asks for separately
     * @returns Cycle summary and log of the day, or null
     */
    async getMenstrualCycleDayView(
        date = new Date(),
        today = new Date()
    ): Promise<MenstrualCycleDayView | null> {
        return this.getOptional<MenstrualCycleDayView>(
            this.loggingUrls.MENSTRUAL_CYCLE_DAY_VIEW(toDateString(date)),
            { params: { todayDate: toDateString(today) } }
        );
    }

    /**
     * Retrieves the cycle summary of one day. Sensitive health data
     * @param date - The day, defaults to today
     * @returns The summary, or null
     */
    async getMenstrualCycleSummary(
        date = new Date()
    ): Promise<MenstrualCycleDaySummary | null> {
        return this.getOptional<MenstrualCycleDaySummary>(
            this.loggingUrls.MENSTRUAL_CYCLE_SUMMARY(toDateString(date))
        );
    }

    /**
     * Retrieves the cycle calendar between two days. Sensitive health data
     * @param start - First day
     * @param end - Last day
     * @returns Cycles and logged days, or null
     */
    async getMenstrualCycleCalendar(
        start: Date,
        end: Date
    ): Promise<MenstrualCycleCalendar | null> {
        return this.getOptional<MenstrualCycleCalendar>(
            this.loggingUrls.MENSTRUAL_CYCLE_CALENDAR(
                toDateString(start),
                toDateString(end)
            )
        );
    }

    /**
     * Retrieves the last confirmed cycle as of one day. Sensitive health data
     * @param date - The day, defaults to today
     * @returns The cycle, or null
     */
    async getLastConfirmedMenstrualCycle(
        date = new Date()
    ): Promise<MenstrualCycleLastConfirmed | null> {
        return this.getOptional<MenstrualCycleLastConfirmed>(
            this.loggingUrls.MENSTRUAL_CYCLE_LAST_CONFIRMED(toDateString(date))
        );
    }

    /**
     * Writes the cycle tracking log of one day. Modifies the account. Sensitive
     * health data
     * @param date - Day of the log
     * @param dailyLog - Log fields. Their shape is unverified and sent as given,
     * `calendarDate` is set from `date`
     * @returns The response of Garmin, its shape is unverified
     */
    async logMenstrualCycleDay(
        date: Date,
        dailyLog: Record<string, unknown>
    ): Promise<unknown> {
        if (!date) {
            throw new Error('Missing date');
        }
        if (!dailyLog) {
            throw new Error('Missing dailyLog');
        }
        const calendarDate = toDateString(date);
        return this.client.post<unknown>(
            this.loggingUrls.MENSTRUAL_CYCLE_DAILY_LOG(calendarDate),
            { ...dailyLog, calendarDate }
        );
    }

    /**
     * Retrieves the glucose entries of one day
     * @param date - The day, defaults to today
     * @returns The entries under `glucoseList` (their shape is unverified), or
     * null
     */
    async getGlucoseDay(date = new Date()): Promise<GlucoseDay | null> {
        return this.getOptional<GlucoseDay>(
            this.loggingUrls.GLUCOSE_DAY(toDateString(date))
        );
    }

    /**
     * Retrieves glucose entries between two days
     * @param start - First day
     * @param end - Last day
     * @returns The response of Garmin, its shape is unverified, or null
     */
    async getGlucoseRange(start: Date, end: Date): Promise<unknown> {
        return this.getOptional<unknown>(
            this.loggingUrls.GLUCOSE_RANGE(
                toDateString(start),
                toDateString(end)
            )
        );
    }

    /**
     * Adds a glucose entry. Modifies the account.
     * @param entry - Request body. Its shape is unverified and sent as given
     * @returns The response of Garmin, its shape is unverified
     */
    async logGlucose(entry: Record<string, unknown>): Promise<unknown> {
        if (!entry) {
            throw new Error('Missing entry');
        }
        return this.client.post<unknown>(this.loggingUrls.GLUCOSE, entry);
    }

    /**
     * Deletes a glucose entry. Modifies the account.
     * @param glucoseId - Id of the entry. Which field of the list holds it is
     * unverified
     */
    async deleteGlucose(glucoseId: number | string): Promise<void> {
        if (!glucoseId) {
            throw new Error('Missing glucoseId');
        }
        await this.client.delete(this.loggingUrls.GLUCOSE_ENTRY(glucoseId));
    }
}
