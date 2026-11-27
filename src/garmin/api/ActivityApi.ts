import FormData from 'form-data';
import _ from 'lodash';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';
import { checkIsDirectory, createDirectory, writeToFile } from '../../utils';
import { toDateString } from '../common/DateUtils';
import {
    ExportFileTypeValue,
    ICountActivities,
    UploadFileType,
    UploadFileTypeTypeValue
} from '../types';
import { GCActivityId, IActivity } from '../types/activity';
import {
    ActivityChartDetails,
    ActivityChartOptions,
    ActivityEventType,
    ActivityExerciseSets,
    ActivityFirstAndLast,
    ActivityManualInput,
    ActivityPolyline,
    ActivityPowerCurve,
    ActivitySearchOptions,
    ActivitySplits,
    ActivitySplitSummaries,
    ActivityStatsOptions,
    ActivityTypedSplits,
    ActivityTypeDefinition,
    ActivityTypeKey,
    ActivityUpdate,
    ActivityWeather,
    ActivityZone
} from '../types/activity-details';
import { ActivityUrls } from '../urls/activity';
import { BaseApi } from './BaseApi';

export class ActivityApi extends BaseApi {
    protected readonly activityUrls = new ActivityUrls(this.url);

    /**
     * Retrieves a list of activities matching the specified criteria
     * @param start - Optional starting index for pagination
     * @param limit - Optional limit for pagination
     * @param activityType - Optional activity type filter, any Garmin type key
     * @param subActivityType - Optional activity subtype filter
     * @returns Array of activities matching the criteria
     */
    async getActivities(
        start?: number,
        limit?: number,
        activityType?: ActivityTypeKey,
        subActivityType?: ActivityTypeKey
    ): Promise<IActivity[]> {
        return this.client.get<IActivity[]>(this.url.ACTIVITIES, {
            params: { start, limit, activityType, subActivityType }
        });
    }

    /**
     * Retrieves a specific activity by its ID
     * @param activity - Object containing activityId
     * @returns Details of the specified activity
     * @throws Error if activityId is missing
     */
    async getActivity(activity: {
        activityId: GCActivityId;
    }): Promise<IActivity> {
        if (!activity.activityId) throw new Error('Missing activityId');
        return this.client.get<IActivity>(
            this.url.ACTIVITY + activity.activityId
        );
    }

    /**
     * Counts lifetime activities
     * @returns Activity statistics including counts by type
     */
    async countActivities(): Promise<ICountActivities> {
        return this.client.get<ICountActivities>(this.url.STAT_ACTIVITIES, {
            params: {
                aggregation: 'lifetime',
                startDate: '1970-01-01',
                endDate: DateTime.now().toFormat('yyyy-MM-dd'),
                metric: 'duration'
            }
        });
    }

    /**
     * Download activity original data file
     *
     * Use the activityId to download the original activity data. Usually this is supplied as a .zip file.
     *
     * @example
     * ```js
     * const [activity] = await GCClient.getActivities(0, 1);
     * // Directory path is optional and defaults to the current working directory.
     * // Downloads filename will be supplied by Garmin.
     * GCClient.downloadOriginalActivityData(activity, './some/path/that/exists');
     * ```
     *
     * @param activity - with activityId
     * @param dir - directory to save the file
     * @param type - 'zip' | 'gpx' | 'tcx' | 'kml' (default: 'zip')
     */
    async downloadOriginalActivityData(
        activity: { activityId: GCActivityId },
        dir: string,
        type: ExportFileTypeValue = 'zip'
    ): Promise<void> {
        if (!activity.activityId) throw new Error('Missing activityId');
        if (!checkIsDirectory(dir)) {
            createDirectory(dir);
        }
        let fileBuffer: Buffer;
        if (type === 'tcx') {
            fileBuffer = await this.client.get(
                this.url.DOWNLOAD_TCX + activity.activityId
            );
        } else if (type === 'gpx') {
            fileBuffer = await this.client.get(
                this.url.DOWNLOAD_GPX + activity.activityId
            );
        } else if (type === 'kml') {
            fileBuffer = await this.client.get(
                this.url.DOWNLOAD_KML + activity.activityId
            );
        } else if (type === 'zip') {
            fileBuffer = await this.client.get<Buffer>(
                this.url.DOWNLOAD_ZIP + activity.activityId,
                {
                    responseType: 'arraybuffer'
                }
            );
        } else {
            throw new Error(
                'downloadOriginalActivityData - Invalid type: ' + type
            );
        }
        writeToFile(
            path.join(dir, `${activity.activityId}.${type}`),
            fileBuffer
        );
    }

    /**
     * Uploads an activity file
     * @param file
     * @param format - 'fit' | 'gpx' | 'tcx', defaults to the file extension,
     * or 'fit' when the file has none
     */
    async uploadActivity(file: string, format?: UploadFileTypeTypeValue) {
        const detectedFormat = (
            format ||
            path.extname(file).slice(1) ||
            'fit'
        ).toLowerCase();
        if (!_.includes(UploadFileType, detectedFormat)) {
            throw new Error(
                'uploadActivity - Invalid format: ' + detectedFormat
            );
        }

        const fileBuffer = fs.createReadStream(file);
        const form = new FormData();
        form.append('userfile', fileBuffer);
        const response = await this.client.post(
            this.url.UPLOAD + '.' + detectedFormat,
            form,
            {
                headers: {
                    'Content-Type': form.getHeaders()['content-type']
                }
            }
        );
        return response;
    }

    /**
     * Uploads a photo to an activity
     * @param activityId - The ID of the activity to attach the photo to
     * @param filePath - Path to the image file to upload
     * @returns Response from the photo upload operation
     */
    async uploadActivityPhoto(
        activityId: GCActivityId,
        filePath: string
    ): Promise<unknown> {
        if (!activityId) throw new Error('Missing activityId');
        if (!filePath) throw new Error('Missing filePath');

        const fileBuffer = fs.createReadStream(filePath);
        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: path.basename(filePath)
        });

        return this.client.post(this.url.ACTIVITY_IMAGE(activityId), form, {
            headers: {
                'Content-Type': form.getHeaders()['content-type']
            }
        });
    }

    /**
     * Searches activities by date, text and type
     * @param options - Optional filters and pagination
     * @returns Array of activities matching the filters
     */
    async searchActivities(
        options: ActivitySearchOptions = {}
    ): Promise<IActivity[]> {
        const { startDate, endDate, ...filters } = options;
        return this.client.get<IActivity[]>(this.url.ACTIVITIES, {
            params: {
                ...filters,
                startDate: startDate && toDateString(startDate),
                endDate: endDate && toDateString(endDate)
            }
        });
    }

    /**
     * Retrieves the IDs of the oldest and the newest activity
     * @returns First and last activity IDs
     */
    async getFirstAndLastActivity(): Promise<ActivityFirstAndLast> {
        return this.client.get<ActivityFirstAndLast>(
            this.activityUrls.FIRST_AND_LAST_ACTIVITY
        );
    }

    /**
     * Retrieves the chart samples and the track of an activity
     * @param activityId - The ID of the activity
     * @param options - Optional limits on the number of samples and points
     * @returns Metric descriptors, samples and polyline
     * @throws Error if activityId is missing
     */
    async getActivityDetails(
        activityId: GCActivityId,
        options: ActivityChartOptions = {}
    ): Promise<ActivityChartDetails> {
        if (!activityId) throw new Error('Missing activityId');
        const { maxChartSize, maxPolylineSize } = options;
        return this.client.get<ActivityChartDetails>(
            this.activityUrls.ACTIVITY_DETAILS(activityId),
            { params: { maxChartSize, maxPolylineSize } }
        );
    }

    /**
     * Retrieves the laps of an activity
     * @param activityId - The ID of the activity
     * @returns Laps and timer events
     * @throws Error if activityId is missing
     */
    async getActivitySplits(activityId: GCActivityId): Promise<ActivitySplits> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivitySplits>(
            this.activityUrls.ACTIVITY_SPLITS(activityId)
        );
    }

    /**
     * Retrieves the typed splits of an activity
     * @param activityId - The ID of the activity
     * @returns Typed splits, their fields are not typed
     * @throws Error if activityId is missing
     */
    async getActivityTypedSplits(
        activityId: GCActivityId
    ): Promise<ActivityTypedSplits> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityTypedSplits>(
            this.activityUrls.ACTIVITY_TYPED_SPLITS(activityId)
        );
    }

    /**
     * Retrieves the split summaries of an activity
     * @param activityId - The ID of the activity
     * @returns Split summaries, their fields are not typed
     * @throws Error if activityId is missing
     */
    async getActivitySplitSummaries(
        activityId: GCActivityId
    ): Promise<ActivitySplitSummaries> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivitySplitSummaries>(
            this.activityUrls.ACTIVITY_SPLIT_SUMMARIES(activityId)
        );
    }

    /**
     * Retrieves the weather recorded for an activity
     * @param activityId - The ID of the activity
     * @returns Weather observation, fields may be null
     * @throws Error if activityId is missing
     */
    async getActivityWeather(
        activityId: GCActivityId
    ): Promise<ActivityWeather> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityWeather>(
            this.activityUrls.ACTIVITY_WEATHER(activityId)
        );
    }

    /**
     * Retrieves the time spent in each heart rate zone during an activity
     * @param activityId - The ID of the activity
     * @returns One entry per zone
     * @throws Error if activityId is missing
     */
    async getActivityHeartRateZones(
        activityId: GCActivityId
    ): Promise<ActivityZone[]> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityZone[]>(
            this.activityUrls.ACTIVITY_HEART_RATE_ZONES(activityId)
        );
    }

    /**
     * Retrieves the time spent in each power zone during an activity
     * @param activityId - The ID of the activity
     * @returns One entry per zone
     * @throws Error if activityId is missing
     */
    async getActivityPowerZones(
        activityId: GCActivityId
    ): Promise<ActivityZone[]> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityZone[]>(
            this.activityUrls.ACTIVITY_POWER_ZONES(activityId)
        );
    }

    /**
     * Retrieves the exercise sets of a strength training activity
     * @param activityId - The ID of the activity
     * @returns Exercise sets, null for other activity types
     * @throws Error if activityId is missing
     */
    async getActivityExerciseSets(
        activityId: GCActivityId
    ): Promise<ActivityExerciseSets> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityExerciseSets>(
            this.activityUrls.ACTIVITY_EXERCISE_SETS(activityId)
        );
    }

    /**
     * Retrieves the workouts linked to an activity
     * @param activityId - The ID of the activity
     * @returns Workouts, their fields are not typed
     * @throws Error if activityId is missing
     */
    async getActivityWorkouts(activityId: GCActivityId): Promise<unknown[]> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<unknown[]>(
            this.activityUrls.ACTIVITY_WORKOUTS(activityId)
        );
    }

    /**
     * Retrieves the full resolution track of an activity
     * @param activityId - The ID of the activity
     * @returns Track points and bounding box
     * @throws Error if activityId is missing
     */
    async getActivityPolyline(
        activityId: GCActivityId
    ): Promise<ActivityPolyline> {
        if (!activityId) throw new Error('Missing activityId');
        return this.client.get<ActivityPolyline>(
            this.activityUrls.ACTIVITY_POLYLINE(activityId)
        );
    }

    /**
     * Retrieves every activity type known to Garmin Connect
     * @returns Activity type definitions
     */
    async getActivityTypes(): Promise<ActivityTypeDefinition[]> {
        return this.client.get<ActivityTypeDefinition[]>(
            this.activityUrls.ACTIVITY_TYPES
        );
    }

    /**
     * Retrieves the event types an activity can be tagged with
     * @returns Event types
     */
    async getEventTypes(): Promise<ActivityEventType[]> {
        return this.client.get<ActivityEventType[]>(
            this.activityUrls.EVENT_TYPES
        );
    }

    /**
     * Retrieves the power curve: the best power held for each duration
     * @returns Power curve entries
     */
    async getPowerCurve(): Promise<ActivityPowerCurve> {
        return this.client.get<ActivityPowerCurve>(
            this.activityUrls.POWER_CURVE
        );
    }

    /**
     * Retrieves activity statistics aggregated over a date range
     * @param options - Date range, aggregation and metric
     * @returns Statistics, their fields are not typed
     * @throws Error if an option is missing
     */
    async getActivityStats(
        options: ActivityStatsOptions
    ): Promise<Record<string, unknown>[]> {
        const { startDate, endDate, aggregation, metric } = options;
        if (!startDate) throw new Error('Missing startDate');
        if (!endDate) throw new Error('Missing endDate');
        if (!aggregation) throw new Error('Missing aggregation');
        if (!metric) throw new Error('Missing metric');
        return this.client.get<Record<string, unknown>[]>(
            this.url.STAT_ACTIVITIES,
            {
                params: {
                    aggregation,
                    startDate: toDateString(startDate),
                    endDate: toDateString(endDate),
                    metric
                }
            }
        );
    }

    /**
     * Creates an activity from manually entered values. Modifies the account.
     *
     * The payload was read from the Garmin Connect web app and has not been
     * verified against the API, and neither has the response.
     *
     * @param activity - Name, type, start time, time zone, duration and
     * optional values. The privacy defaults to `private`.
     * @returns The response of Garmin Connect, its fields are not typed
     * @throws Error if a required value is missing or the time zone is invalid
     *
     * @example
     * ```js
     * await GCClient.createManualActivity({
     *     activityName: 'Evening walk',
     *     activityType: ActivityType.Walking,
     *     startTime: new Date(),
     *     timezone: 'Europe/Paris',
     *     durationInSeconds: 1800,
     *     distanceInMeters: 2000
     * });
     * ```
     */
    async createManualActivity(
        activity: ActivityManualInput
    ): Promise<Record<string, unknown>> {
        const {
            activityName,
            activityType,
            startTime,
            timezone,
            durationInSeconds,
            distanceInMeters,
            calories,
            autoCalcCalories = calories === undefined,
            description,
            privacy = 'private',
            eventType = 'uncategorized'
        } = activity;
        if (!activityName) throw new Error('Missing activityName');
        if (!activityType) throw new Error('Missing activityType');
        if (!startTime) throw new Error('Missing startTime');
        if (!timezone) throw new Error('Missing timezone');
        if (!durationInSeconds) throw new Error('Missing durationInSeconds');

        const localStartTime = DateTime.fromJSDate(startTime).setZone(timezone);
        if (!localStartTime.isValid) {
            throw new Error(
                'createManualActivity - Invalid startTime or timezone'
            );
        }

        return this.client.post<Record<string, unknown>>(
            this.activityUrls.CREATE_ACTIVITY,
            {
                accessControlRuleDTO: { typeKey: privacy },
                activityName,
                activityTypeDTO: { typeKey: activityType },
                eventTypeDTO: { typeKey: eventType },
                metadataDTO: { autoCalcCalories },
                summaryDTO: {
                    calories,
                    duration: durationInSeconds,
                    startTimeLocal: localStartTime.toFormat(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS"
                    ),
                    distance: distanceInMeters
                },
                timeZoneUnitDTO: { unitKey: timezone },
                description,
                isWheelchair: false
            }
        );
    }

    /**
     * Changes the name, description, type, event type or privacy of an
     * activity. Modifies the account.
     *
     * The payload was read from the Garmin Connect web app and has not been
     * verified against the API.
     *
     * @param activityId - The ID of the activity
     * @param changes - Fields to change
     * @throws Error if activityId or changes are missing
     *
     * @example
     * ```js
     * await GCClient.updateActivity(activityId, {
     *     description: 'Felt good',
     *     accessControlRuleDTO: { typeKey: 'private' }
     * });
     * ```
     */
    async updateActivity(
        activityId: GCActivityId,
        changes: ActivityUpdate
    ): Promise<void> {
        if (!activityId) throw new Error('Missing activityId');
        if (_.isEmpty(changes)) throw new Error('Missing changes');
        await this.client.put<void>(this.url.ACTIVITY_BY_ID(activityId), {
            ...changes,
            activityId
        });
    }

    /**
     * Deletes a photo of an activity. Modifies the account.
     *
     * The endpoint was read from the Garmin Connect web app and has not been
     * verified against the API.
     *
     * @param activityId - The ID of the activity
     * @param imageId - The ID of the photo, found in the activity metadata
     * @throws Error if activityId or imageId is missing
     */
    async deleteActivityPhoto(
        activityId: GCActivityId,
        imageId: string
    ): Promise<void> {
        if (!activityId) throw new Error('Missing activityId');
        if (!imageId) throw new Error('Missing imageId');
        await this.client.delete<void>(
            this.activityUrls.ACTIVITY_PHOTO(activityId, imageId)
        );
    }

    /**
     * Deletes an activity by activityId
     * @param activity - with activityId
     * @returns void
     *
     * @example
     * ```js
     * const activities = await GCClient.getActivities(0, 1);
     * const activity = activities[0];
     * await GCClient.deleteActivity(activity);
     * ```
     */
    async deleteActivity(activity: {
        activityId: GCActivityId;
    }): Promise<void> {
        if (!activity.activityId) throw new Error('Missing activityId');
        await this.client.delete<void>(this.url.ACTIVITY + activity.activityId);
    }

    /**
     * Renames an activity with the given activityId to the newName.
     * @param activityId
     * @param newName
     */
    async renameActivity(
        activityId: GCActivityId,
        newName: string
    ): Promise<void> {
        if (!activityId) throw new Error('Missing activityId');
        if (!newName) throw new Error('Missing newName');

        await this.client.put<void>(this.url.ACTIVITY_BY_ID(activityId), {
            activityName: newName
        });
    }
}
