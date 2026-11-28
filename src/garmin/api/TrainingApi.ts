import * as path from 'path';
import { checkIsDirectory, createDirectory, writeToFile } from '../../utils';
import { toDateString } from '../common/DateUtils';
import { IWorkout, IWorkoutDetail } from '../types';
import { Workout } from '../types/workout';
import { MonthCalendar, YearCalendar } from '../types/calendar';
import {
    CalendarEvent,
    CalendarNote,
    ScheduledWorkout,
    ScheduledWorkoutSummary,
    TrainingPlanDetail,
    TrainingPlanList,
    WorkoutFileType,
    WorkoutTypes
} from '../types/training';
import { TrainingUrls } from '../urls/training';
import { MetricsApi } from './MetricsApi';

export class TrainingApi extends MetricsApi {
    protected readonly trainingUrls = new TrainingUrls(this.url);

    /**
     * Gets the list of workouts
     * @param start
     * @param limit
     */
    async getWorkouts(start: number, limit: number): Promise<IWorkout[]> {
        return this.client.get<IWorkout[]>(this.url.WORKOUTS, {
            params: {
                start,
                limit
            }
        });
    }

    /**
     * Gets the workout detail by workoutId
     * @param workout
     * @returns workout detail - IWorkoutDetail
     */
    async getWorkoutDetail(workout: {
        workoutId: string;
    }): Promise<IWorkoutDetail> {
        if (!workout.workoutId) throw new Error('Missing workoutId');
        return this.client.get<IWorkoutDetail>(
            this.url.WORKOUT(workout.workoutId)
        );
    }

    /**
     * Creates a new workout
     *
     * Use workoutBuilder to create the workout object. See the example in the examples/example-workout.js for more complex workouts.
     *
     * @param workout - workout detail
     * @returns Response from the workout creation operation
     *
     * @example
     * ```js
     * const wb = new WorkoutBuilder(
     *     WorkoutType.Running,
     *     'Workout running ' + new Date().toISOString()
     * );
     *
     * wb.addStep(
     *     new Step(
     *         StepType.Run,
     *         TimeDuration.fromSeconds(45),
     *         new NoTarget(),
     *         'Comment for the step: Run for 45 seconds'
     *     )
     * );
     *
     * GCClient.createWorkout(wb.build());
     * ```
     */
    async createWorkout(workout: IWorkoutDetail) {
        return this.client.post<Workout>(this.url.WORKOUT(), workout);
    }

    /**
     * Deletes a workout by workoutId
     * @param workout - with workoutId
     *
     * @example
     * ```js
     * const workouts = await GCClient.getWorkouts();
     * const id = workouts[0].workoutId;
     * GCClient.deleteWorkout({ workoutId: id });
     * ```
     */
    async deleteWorkout(workout: { workoutId: string }) {
        if (!workout.workoutId) throw new Error('Missing workout');
        return this.client.delete(this.url.WORKOUT(workout.workoutId));
    }

    /**
     * Schedule a workout by workoutId to a specific date
     *
     * To add a workout to your calendar, provide the workout id and the date to schedule it on.
     *
     * @param workout - with workoutId
     * @param scheduleDate - 'YYYY-MM-DD' format date string
     *
     * @example
     * ```js
     * const workouts = await GCClient.getWorkouts();
     * const id = workouts[0].workoutId;
     * GCClient.scheduleWorkout({ workoutId: id }, new Date('2025-12-01'));
     * ```
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

    /**
     * Replaces a saved workout. This modifies the account.
     *
     * Send the whole workout, as returned by `getWorkoutDetail`, with your
     * changes applied. The endpoint is unverified.
     *
     * @param workout - complete workout detail, including its `workoutId`
     * @returns The response body, whose shape is unverified
     */
    async updateWorkout(workout: IWorkoutDetail): Promise<unknown> {
        if (!workout?.workoutId) throw new Error('Missing workoutId');
        return this.client.put<unknown>(
            this.url.WORKOUT(String(workout.workoutId)),
            workout
        );
    }

    /**
     * Copies a workout under a new name. This modifies the account.
     * The endpoint is unverified.
     *
     * @param workoutId - workout to copy
     * @param name - name of the new workout
     * @returns The response body, whose shape is unverified
     */
    async copyWorkout(
        workoutId: number | string,
        name: string
    ): Promise<unknown> {
        if (!workoutId) throw new Error('Missing workoutId');
        if (!name) throw new Error('Missing name');
        return this.client.post<unknown>(
            this.trainingUrls.WORKOUT_COPY(workoutId),
            name,
            { headers: { 'Content-Type': 'text/plain' } }
        );
    }

    /**
     * Downloads a workout as a file named `<workoutId>.fit`
     * The endpoint is unverified.
     *
     * @param workoutId - workout to download
     * @param dir - directory to save the file in, created when missing if its
     * parent exists
     * @param type - only 'FIT' is known
     * @returns Path of the written file
     */
    async downloadWorkout(
        workoutId: number | string,
        dir: string,
        type: WorkoutFileType = 'FIT'
    ): Promise<string> {
        if (!workoutId) throw new Error('Missing workoutId');
        if (!dir) throw new Error('Missing dir');
        if (type !== 'FIT') {
            throw new Error('downloadWorkout - Invalid type: ' + type);
        }
        const file = await this.client.get<Buffer>(
            this.trainingUrls.WORKOUT_FILE(type, workoutId),
            { responseType: 'arraybuffer' }
        );
        if (!checkIsDirectory(dir)) {
            createDirectory(dir);
        }
        const filePath = path.join(
            dir,
            `${encodeURIComponent(workoutId)}.${type.toLowerCase()}`
        );
        writeToFile(filePath, file);
        return filePath;
    }

    /**
     * Gets the sport, step, condition, target and other types workouts are made of
     * @returns The lookup tables
     */
    async getWorkoutTypes(): Promise<WorkoutTypes> {
        return this.client.get<WorkoutTypes>(this.trainingUrls.WORKOUT_TYPES);
    }

    /**
     * Gets the workouts scheduled on the calendar between two days
     * @param start - first day
     * @param end - last day
     * @returns Scheduled workouts, whose fields are unverified
     */
    async getScheduledWorkouts(
        start: Date,
        end: Date
    ): Promise<ScheduledWorkoutSummary[]> {
        if (!start || !end) throw new Error('Missing date range');
        return this.client.get<ScheduledWorkoutSummary[]>(
            this.trainingUrls.SCHEDULED_WORKOUTS,
            {
                params: {
                    startDate: toDateString(start),
                    endDate: toDateString(end)
                }
            }
        );
    }

    /**
     * Gets one scheduled workout. The response shape is unverified.
     * @param scheduleId - id of the calendar entry, not of the workout
     * @returns The scheduled workout, or null when the response is empty
     */
    async getScheduledWorkout(
        scheduleId: number | string
    ): Promise<ScheduledWorkout | null> {
        if (!scheduleId) throw new Error('Missing scheduleId');
        return this.getOptional<ScheduledWorkout>(
            this.trainingUrls.SCHEDULED_WORKOUT(scheduleId)
        );
    }

    /**
     * Removes a workout from the calendar, keeping the workout itself. This
     * modifies the account. The endpoint is unverified.
     *
     * @param scheduleId - id of the calendar entry, not of the workout
     */
    async unscheduleWorkout(scheduleId: number | string): Promise<void> {
        if (!scheduleId) throw new Error('Missing scheduleId');
        await this.client.delete(
            this.trainingUrls.SCHEDULED_WORKOUT(scheduleId)
        );
    }

    /**
     * Moves a scheduled workout to another day. This modifies the account.
     *
     * Reads the calendar entry, then writes it back with the new date. The
     * request shape comes from Garmin's web code and is unverified.
     *
     * @param scheduleId - id of the calendar entry, not of the workout
     * @param date - new day
     * @returns The response body, whose shape is unverified
     */
    async rescheduleWorkout(
        scheduleId: number | string,
        date: Date
    ): Promise<unknown> {
        if (!date) throw new Error('Missing date');
        const schedule = await this.getScheduledWorkout(scheduleId);
        const workoutId = schedule?.workout?.workoutId;
        if (!workoutId) {
            throw new Error('rescheduleWorkout - Schedule has no workoutId');
        }
        return this.client.put<unknown>(
            this.trainingUrls.SCHEDULED_WORKOUT(scheduleId),
            {
                ...schedule,
                calendarDate: toDateString(date),
                workout: { workoutId }
            }
        );
    }

    /**
     * Queues a workout for delivery to a device. This modifies the account and
     * changes what is on the device.
     *
     * The request comes from Garmin's web code and has never been sent. In
     * particular, wrapping the message in an array is an assumption.
     *
     * @param workoutId - workout to send
     * @param deviceId - receiving device
     * @param messageName - title of the message, defaults to the workout name
     * @returns The response body, whose shape is unverified
     */
    async sendWorkoutToDevice(
        workoutId: number | string,
        deviceId: number | string,
        messageName?: string
    ): Promise<unknown> {
        if (!Number(workoutId)) throw new Error('Missing workoutId');
        if (!Number(deviceId)) throw new Error('Missing deviceId');
        const name =
            messageName ||
            (await this.getWorkoutDetail({ workoutId: String(workoutId) }))
                .workoutName;
        return this.client.post<unknown>(this.trainingUrls.DEVICE_MESSAGES, [
            {
                deviceId: Number(deviceId),
                messageUrl: `workout-service/workout/FIT/${Number(workoutId)}`,
                messageType: 'workouts',
                messageName: name,
                groupName: null,
                priority: 1,
                fileType: 'FIT',
                metaDataId: Number(workoutId)
            }
        ]);
    }

    /**
     * Retrieves all workouts
     * @returns List of workouts
     */
    async workouts(): Promise<Workout[]> {
        return this.client.get(this.url.WORKOUTS_LIST());
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
     * Adds a note to the calendar. This modifies the account.
     * The endpoint is unverified.
     *
     * @param noteName - title of the note
     * @param content - text of the note
     * @param date - day the note is shown on
     * @returns The response body, whose shape is unverified
     */
    async createNote(
        noteName: string,
        content: string,
        date: Date = new Date()
    ): Promise<CalendarNote> {
        if (!noteName) throw new Error('Missing noteName');
        return this.client.post<CalendarNote>(
            this.trainingUrls.CALENDAR_NOTES,
            { noteName, content, date: toDateString(date), id: null }
        );
    }

    /**
     * Gets a calendar note. The response shape is unverified.
     * @param noteId
     * @returns The note, or null when the response is empty
     */
    async getNote(noteId: number | string): Promise<CalendarNote | null> {
        if (!noteId) throw new Error('Missing noteId');
        return this.getOptional<CalendarNote>(
            this.trainingUrls.CALENDAR_NOTE(noteId)
        );
    }

    /**
     * Deletes a calendar note. This modifies the account.
     * The endpoint is unverified.
     *
     * @param noteId
     */
    async deleteNote(noteId: number | string): Promise<void> {
        if (!noteId) throw new Error('Missing noteId');
        await this.client.delete(this.trainingUrls.CALENDAR_NOTE(noteId));
    }

    /**
     * Gets the calendar events of the coming days
     * @param days - how many days ahead to look
     * @param limit - largest number of events to return
     * @param startDate - day to start from
     * @returns Events, whose fields are unverified
     */
    async getUpcomingEvents(
        days: number = 30,
        limit: number = 10,
        startDate: Date = new Date()
    ): Promise<CalendarEvent[]> {
        return this.client.get<CalendarEvent[]>(
            this.trainingUrls.UPCOMING_EVENTS,
            {
                params: {
                    numDaysForward: days,
                    limit,
                    startDate: toDateString(startDate)
                }
            }
        );
    }

    /**
     * Gets calendar events. Neither the query parameters nor the response of
     * this endpoint are verified.
     *
     * @param params - query parameters, sent as they are
     * @returns The response body, or null when it is empty
     */
    async getEvents(params?: Record<string, unknown>): Promise<unknown> {
        return this.getOptional<unknown>(this.trainingUrls.CALENDAR_EVENTS, {
            params
        });
    }

    /**
     * Gets the primary event, the one training is aimed at. The response shape
     * is unverified.
     *
     * @returns The event, or null when the response is empty
     */
    async getPrimaryEvent(): Promise<CalendarEvent | null> {
        return this.getOptional<CalendarEvent>(this.trainingUrls.PRIMARY_EVENT);
    }

    /**
     * Gets a calendar event. The response shape is unverified.
     * @param eventId
     * @returns The event, or null when the response is empty
     */
    async getEvent(eventId: number | string): Promise<CalendarEvent | null> {
        if (!eventId) throw new Error('Missing eventId');
        return this.getOptional<CalendarEvent>(
            this.trainingUrls.CALENDAR_EVENT(eventId)
        );
    }

    /**
     * Replaces a calendar event. This modifies the account.
     *
     * The request shape is unverified. Start from the result of `getEvent` and
     * apply your changes.
     *
     * @param eventId
     * @param event - request body, sent as it is
     * @returns The response body, whose shape is unverified
     */
    async updateEvent(
        eventId: number | string,
        event: Record<string, unknown>
    ): Promise<unknown> {
        if (!eventId) throw new Error('Missing eventId');
        if (!event) throw new Error('Missing event');
        return this.client.put<unknown>(
            this.trainingUrls.CALENDAR_EVENT(eventId),
            event
        );
    }

    /**
     * Deletes a calendar event. This modifies the account.
     * The endpoint is unverified.
     *
     * @param eventId
     */
    async deleteEvent(eventId: number | string): Promise<void> {
        if (!eventId) throw new Error('Missing eventId');
        await this.client.delete(this.trainingUrls.CALENDAR_EVENT(eventId));
    }

    /**
     * Gets the training plans
     * @param limit - largest number of plans to return
     * @returns The plans and the filter Garmin applied
     */
    async getTrainingPlans(limit: number = 100): Promise<TrainingPlanList> {
        return this.client.get<TrainingPlanList>(
            this.trainingUrls.TRAINING_PLANS,
            { params: { limit } }
        );
    }

    /**
     * Gets a training plan. The response shape is unverified.
     * @param planId
     * @returns The plan, or null when the response is empty
     */
    async getTrainingPlan(
        planId: number | string
    ): Promise<TrainingPlanDetail | null> {
        if (!planId) throw new Error('Missing planId');
        return this.getOptional<TrainingPlanDetail>(
            this.trainingUrls.TRAINING_PLAN(planId)
        );
    }

    /**
     * Gets an adaptive training plan. The response shape is unverified.
     * @param planId
     * @returns The plan, or null when the response is empty
     */
    async getAdaptiveTrainingPlan(
        planId: number | string
    ): Promise<TrainingPlanDetail | null> {
        if (!planId) throw new Error('Missing planId');
        return this.getOptional<TrainingPlanDetail>(
            this.trainingUrls.ADAPTIVE_TRAINING_PLAN(planId)
        );
    }

    /**
     * Gets a phased training plan. The response shape is unverified.
     * @param planId
     * @returns The plan, or null when the response is empty
     */
    async getPhasedTrainingPlan(
        planId: number | string
    ): Promise<TrainingPlanDetail | null> {
        if (!planId) throw new Error('Missing planId');
        return this.getOptional<TrainingPlanDetail>(
            this.trainingUrls.PHASED_TRAINING_PLAN(planId)
        );
    }
}
