import appRoot from 'app-root-path';

import FormData from 'form-data';
import _ from 'lodash';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';
import { HttpClient } from '../common/HttpClient';
import { checkIsDirectory, createDirectory, writeToFile } from '../utils';
import { UrlClass } from './UrlClass';
import {
    ExportFileTypeValue,
    GarminDomain,
    GCGearId,
    GCUserHash,
    ICountActivities,
    IDailyStepsType,
    IGarminTokens,
    IOauth1Token,
    IOauth2Token,
    ISocialProfile,
    IUserSettings,
    IWorkout,
    IWorkoutDetail,
    ListCoursesResponse,
    UploadFileType,
    UploadFileTypeTypeValue
} from './types';
import Running from './workouts/Running';
import {
    calculateTimeDifference,
    getLocalTimestamp,
    toDateString
} from './common/DateUtils';
import { SleepData } from './types/sleep';
import { gramsToPounds } from './common/WeightUtils';
import { convertMLToOunces, convertOuncesToML } from './common/HydrationUtils';
import {
    ActivitySubType,
    ActivityType,
    GCActivityId,
    IActivity
} from './types/activity';
import { GearData } from './types/gear';
import { Workout } from './types/workout';
import {
    CoursePoint,
    GeoPoint,
    GpxActivityType,
    ImportedGpxResponse
} from './types/gpx';
import { courseRequestTemplate } from './common/GpxUtils';
import { MonthCalendar, YearCalendar } from './types/calendar';

let config: GCCredentials | undefined = undefined;

try {
    config = appRoot.require('/garmin.config.json');
} catch (e) {
    // Do nothing
}

export type EventCallback<T> = (data: T) => void;

export interface GCCredentials {
    username: string;
    password: string;
}
export interface Listeners {
    [event: string]: EventCallback<any>[];
}

export enum Event {
    sessionChange = 'sessionChange'
}

export interface Session {}

export default class GarminConnect {
    client: HttpClient;
    private _userHash: GCUserHash | undefined;
    private credentials: GCCredentials;
    private listeners: Listeners;
    private url: UrlClass;
    // private oauth1: OAuth;
    constructor(
        credentials: GCCredentials | undefined = config,
        domain: GarminDomain = 'garmin.com'
    ) {
        if (!credentials) {
            throw new Error('Missing credentials');
        }
        this.credentials = credentials;
        this.url = new UrlClass(domain);
        this.client = new HttpClient(this.url);
        this._userHash = undefined;
        this.listeners = {};
    }

    async login(username?: string, password?: string): Promise<GarminConnect> {
        if (username && password) {
            this.credentials.username = username;
            this.credentials.password = password;
        }
        await this.client.login(
            this.credentials.username,
            this.credentials.password
        );
        return this;
    }
    exportTokenToFile(dirPath: string): void {
        if (!checkIsDirectory(dirPath)) {
            createDirectory(dirPath);
        }
        // save oauth1 to json
        if (this.client.oauth1Token) {
            writeToFile(
                path.join(dirPath, 'oauth1_token.json'),
                JSON.stringify(this.client.oauth1Token)
            );
        }
        if (this.client.oauth2Token) {
            writeToFile(
                path.join(dirPath, 'oauth2_token.json'),
                JSON.stringify(this.client.oauth2Token)
            );
        }
    }
    loadTokenByFile(dirPath: string): void {
        if (!checkIsDirectory(dirPath)) {
            throw new Error('loadTokenByFile: Directory not found: ' + dirPath);
        }
        let oauth1Data = fs.readFileSync(
            path.join(dirPath, 'oauth1_token.json')
        ) as unknown as string;
        const oauth1 = JSON.parse(oauth1Data);
        this.client.oauth1Token = oauth1;

        let oauth2Data = fs.readFileSync(
            path.join(dirPath, 'oauth2_token.json')
        ) as unknown as string;
        const oauth2 = JSON.parse(oauth2Data);
        this.client.oauth2Token = oauth2;
    }
    exportToken(): IGarminTokens {
        if (!this.client.oauth1Token || !this.client.oauth2Token) {
            throw new Error('exportToken: Token not found');
        }
        return {
            oauth1: this.client.oauth1Token,
            oauth2: this.client.oauth2Token
        };
    }
    // from db or localstorage etc
    loadToken(oauth1: IOauth1Token, oauth2: IOauth2Token): void {
        this.client.oauth1Token = oauth1;
        this.client.oauth2Token = oauth2;
    }

    async getUserSettings(): Promise<IUserSettings> {
        return this.client.get<IUserSettings>(this.url.USER_SETTINGS);
    }

    async getUserProfile(): Promise<ISocialProfile> {
        return this.client.get<ISocialProfile>(this.url.USER_PROFILE);
    }

    async getActivities(
        start?: number,
        limit?: number,
        activityType?: ActivityType,
        subActivityType?: ActivitySubType
    ): Promise<IActivity[]> {
        return this.client.get<IActivity[]>(this.url.ACTIVITIES, {
            params: { start, limit, activityType, subActivityType }
        });
    }

    async getActivity(activity: {
        activityId: GCActivityId;
    }): Promise<IActivity> {
        if (!activity.activityId) throw new Error('Missing activityId');
        return this.client.get<IActivity>(
            this.url.ACTIVITY + activity.activityId
        );
    }

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

    async uploadActivity(
        file: string,
        format: UploadFileTypeTypeValue = 'fit'
    ) {
        const detectedFormat = (format || path.extname(file))?.toLowerCase();
        if (!_.includes(UploadFileType, detectedFormat)) {
            throw new Error('uploadActivity - Invalid format: ' + format);
        }

        const fileBuffer = fs.createReadStream(file);
        const form = new FormData();
        form.append('userfile', fileBuffer);
        const response = await this.client.post(
            this.url.UPLOAD + '.' + format,
            form,
            {
                headers: {
                    'Content-Type': form.getHeaders()['content-type']
                }
            }
        );
        return response;
    }

    async deleteActivity(activity: {
        activityId: GCActivityId;
    }): Promise<void> {
        if (!activity.activityId) throw new Error('Missing activityId');
        await this.client.delete<void>(this.url.ACTIVITY + activity.activityId);
    }

    async getWorkouts(start: number, limit: number): Promise<IWorkout[]> {
        return this.client.get<IWorkout[]>(this.url.WORKOUTS, {
            params: {
                start,
                limit
            }
        });
    }
    async getWorkoutDetail(workout: {
        workoutId: string;
    }): Promise<IWorkoutDetail> {
        if (!workout.workoutId) throw new Error('Missing workoutId');
        return this.client.get<IWorkoutDetail>(
            this.url.WORKOUT(workout.workoutId)
        );
    }

    async createWorkout(workout: IWorkoutDetail) {
        return this.client.post<Workout>(this.url.WORKOUT(), workout);
    }

    async addWorkout(
        workout: IWorkoutDetail | Running
    ): Promise<IWorkoutDetail> {
        if (!workout) throw new Error('Missing workout');

        if (workout instanceof Running) {
            if (workout.isValid()) {
                const data = { ...workout.toJson() };
                if (!data.description) {
                    data.description = 'Added by garmin-connect for Node.js';
                }
                return this.client.post<IWorkoutDetail>(
                    this.url.WORKOUT(),
                    data
                );
            }
        }

        const newWorkout = _.omit(workout, [
            'workoutId',
            'ownerId',
            'updatedDate',
            'createdDate',
            'author'
        ]);
        if (!newWorkout.description) {
            newWorkout.description = 'Added by garmin-connect for Node.js';
        }
        // console.log('addWorkout - newWorkout:', newWorkout)
        return this.client.post<IWorkoutDetail>(this.url.WORKOUT(), newWorkout);
    }

    async addRunningWorkout(
        name: string,
        meters: number,
        description: string
    ): Promise<IWorkoutDetail> {
        const running = new Running();
        running.name = name;
        running.distance = meters;
        running.description = description;
        return this.addWorkout(running);
    }

    async deleteWorkout(workout: { workoutId: string }) {
        if (!workout.workoutId) throw new Error('Missing workout');
        return this.client.delete(this.url.WORKOUT(workout.workoutId));
    }

    /**
     * Schedule a workout by workoutId to a specific date
     * @param workout - with workoutId
     * @param scheduleDate - 'YYYY-MM-DD'
     */
    async scheduleWorkout(
        workout: { workoutId: string },
        scheduleDate: string
    ) {
        return this.client.post(
            this.url.SCHEDULE_WORKOUT(parseInt(workout.workoutId)),
            { date: scheduleDate }
        );
    }

    async getSteps(date = new Date()): Promise<number> {
        const dateString = toDateString(date);

        const days = await this.client.get<IDailyStepsType[]>(
            `${this.url.DAILY_STEPS}${dateString}/${dateString}`
        );
        const dayStats = days.find(
            ({ calendarDate }) => calendarDate === dateString
        );

        if (!dayStats) {
            throw new Error("Can't find daily steps for this date.");
        }

        return dayStats.totalSteps;
    }

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

    async getSleepDuration(
        date = new Date()
    ): Promise<{ hours: number; minutes: number }> {
        try {
            const sleepData = await this.getSleepData(date);

            if (
                !sleepData ||
                !sleepData.dailySleepDTO ||
                sleepData.dailySleepDTO.sleepStartTimestampGMT === undefined ||
                sleepData.dailySleepDTO.sleepEndTimestampGMT === undefined
            ) {
                throw new Error(
                    'Invalid or missing sleep data for the specified date.'
                );
            }

            const sleepStartTimestampGMT =
                sleepData.dailySleepDTO.sleepStartTimestampGMT;
            const sleepEndTimestampGMT =
                sleepData.dailySleepDTO.sleepEndTimestampGMT;

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

    async getDailyHydration(date = new Date()): Promise<number> {
        try {
            const dateString = toDateString(date);
            const hydrationData = await this.client.get<HydrationData>(
                `${this.url.DAILY_HYDRATION}/${dateString}`
            );

            if (!hydrationData || !hydrationData.valueInML) {
                throw new Error('Invalid or empty hydration data response.');
            }

            return convertMLToOunces(hydrationData.valueInML);
        } catch (error: any) {
            throw new Error(`Error in getDailyHydration: ${error.message}`);
        }
    }

    async updateWeight(
        date = new Date(),
        lbs: number,
        timezone: string
    ): Promise<UpdateWeight> {
        try {
            const weightData = await this.client.post<UpdateWeight>(
                `${this.url.UPDATE_WEIGHT}`,
                {
                    dateTimestamp: getLocalTimestamp(date, timezone),
                    gmtTimestamp: date.toISOString().substring(0, 23),
                    unitKey: 'lbs',
                    value: lbs
                }
            );

            return weightData;
        } catch (error: any) {
            throw new Error(`Error in updateWeight: ${error.message}`);
        }
    }

    async updateHydrationLogOunces(
        date = new Date(),
        valueInOz: number
    ): Promise<WaterIntake> {
        try {
            const dateString = toDateString(date);
            const hydrationData = await this.client.put<WaterIntake>(
                `${this.url.HYDRATION_LOG}`,
                {
                    calendarDate: dateString,
                    valueInML: convertOuncesToML(valueInOz),
                    userProfileId: (await this.getUserProfile()).profileId,
                    timestampLocal: date.toISOString().substring(0, 23)
                }
            );

            return hydrationData;
        } catch (error: any) {
            throw new Error(
                `Error in updateHydrationLogOunces: ${error.message}`
            );
        }
    }

    async getGolfSummary(): Promise<GolfSummary> {
        try {
            const golfSummary = await this.client.get<GolfSummary>(
                `${this.url.GOLF_SCORECARD_SUMMARY}`
            );

            if (!golfSummary) {
                throw new Error('Invalid or empty golf summary data response.');
            }

            return golfSummary;
        } catch (error: any) {
            throw new Error(`Error in getGolfSummary: ${error.message}`);
        }
    }

    async getGolfScorecard(scorecardId: number): Promise<GolfScorecard> {
        try {
            const golfScorecard = await this.client.get<GolfScorecard>(
                `${this.url.GOLF_SCORECARD_DETAIL}`,
                { params: { 'scorecard-ids': scorecardId } }
            );

            if (!golfScorecard) {
                throw new Error(
                    'Invalid or empty golf scorecard data response.'
                );
            }

            return golfScorecard;
        } catch (error: any) {
            throw new Error(`Error in getGolfScorecard: ${error.message}`);
        }
    }

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
     * Returns the gear data for the user.
     * @param availableGearDate - Optional date to filter the gear available at the date (format: 'YYYY-MM-DD').
     */
    async getGear(availableGearDate?: string): Promise<GearData[]> {
        const id = (await this.getUserProfile()).profileId;
        return this.client.get(this.url.GEAR(id, availableGearDate));
    }

    /**
     * Returns the gear data assigned with a specific activity.
     * @param activityId
     */
    async getGearsForActivity(activityId: GCActivityId): Promise<GearData[]> {
        return this.client.get(this.url.GEAR_OF_ACTIVITY(activityId));
    }

    /**
     * Links a gear item to an activity.
     * @param activityId
     * @param gearId - uuid field from GearData
     * @return GearData - the linked gear item data
     */
    async linkGearToActivity(
        activityId: GCActivityId,
        gearId: GCGearId
    ): Promise<GearData> {
        return this.client.put(
            this.url.LINK_GEAR_TO_ACTIVITY(activityId, gearId),
            {}
        );
    }

    /**
     * Unlinks a gear item from an activity.
     * @param activityId
     * @param gearId - uuid field from GearData
     * @return GearData - the unlinked gear item data
     */
    async unlinkGearFromActivity(
        activityId: GCActivityId,
        gearId: GCGearId
    ): Promise<GearData> {
        return this.client.put(
            this.url.UNLINK_GEAR_FROM_ACTIVITY(activityId, gearId),
            {}
        );
    }

    async workouts(): Promise<Workout[]> {
        return this.client.get(this.url.WORKOUTS_LIST());
    }

    async importGpx(
        fileName: string,
        fileContent: string
    ): Promise<ImportedGpxResponse> {
        const form = new FormData();
        form.append('file', fileContent, {
            filename: fileName,
            contentType: 'application/octet-stream'
        });

        return await this.client.post(this.url.IMPORT_GPX_FILE, form, {
            headers: {
                'Content-Type': form.getHeaders()['content-type'],
                'Content-Length': form.getLengthSync()
            }
        });
    }

    async createCourse(
        activityType: GpxActivityType,
        courseName: string,
        geoPoints: GeoPoint[],
        coursePoints: CoursePoint[] = []
    ) {
        return await this.client.post(
            this.url.CREATE_COURSE_GPX_FILE,
            courseRequestTemplate(
                activityType,
                courseName,
                geoPoints,
                coursePoints
            ),
            {}
        );
    }

    async listCourses(): Promise<ListCoursesResponse> {
        return this.client.get<ListCoursesResponse>(this.url.LIST_COURSES);
    }

    async exportCourseAsGpx(courseId: number): Promise<string> {
        return this.client.get<string>(
            this.url.EXPORT_COURSE_GPX_FILE(courseId),
            {
                responseType: 'text'
            }
        );
    }

    /**
     * Retrieves calendar events for a specific year.
     * @param year {number} - The year for which to retrieve calendar events.
     */
    async getYearCalendarEvents(year: number): Promise<YearCalendar> {
        return this.client.get<any>(this.url.CALENDAR_YEAR(year));
    }

    /**
     * Retrieves calendar events for a specific month and year.
     * @param year {number} - The year for which to retrieve calendar events.
     * @param month {number} - The month (0-11) for which to retrieve calendar events.
     */
    async getMonthCalendarEvents(
        year: number,
        month: number
    ): Promise<MonthCalendar> {
        return this.client.get<any>(this.url.CALENDAR_MONTH(year, month));
    }

    /**
     * Retrieves calendar events for a specific week containing the given date.
     * @param year {number} - The year of the date.
     * @param month {number} - The month (0-11) of the date.
     * @param day {number} - The day of the first day of the week.
     * @param firstDayOfWeek {number} - Optional first day of the week, default is 1
     */
    async getWeekCalendarEvents(
        year: number,
        month: number,
        day: number,
        firstDayOfWeek?: number
    ): Promise<any> {
        return this.client.get<any>(
            this.url.CALENDAR_WEEK(year, month, day, firstDayOfWeek)
        );
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

    async get<T>(url: string, data?: any) {
        const response = await this.client.get(url, data);
        return response as T;
    }

    async post<T>(url: string, data: any) {
        const response = await this.client.post<T>(url, data, {});
        return response as T;
    }

    async put<T>(url: string, data: any) {
        const response = await this.client.put<T>(url, data, {});
        return response as T;
    }
}
