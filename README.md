# Garmin Connect

This is a fork of https://github.com/Pythe1337N/garmin-connect which was inspired by [https://github.com/matin/garth](https://github.com/matin/garth). Many thanks to contributors.

---

A JavaScript library for accessing and managing your Garmin Connect data. It comes with methods to get and set information in your Garmin account, and also supports [custom requests](#custom-requests) using `GET`, `POST`, and `PUT` so you can cover additional needs.

This document provides detailed information about the public API methods available in the `@flow-js/garmin-connect` library.

## Table of Contents

-   [Authentication](#authentication)
    -   [Constructor](#constructor)
    -   [Login](#login)
    -   [Session Management](#session-management)
-   [User Data](#user-data)
    -   [User Profile](#user-profile)
    -   [User Settings](#user-settings)
-   [Activities](#activities)
    -   [Getting Activities](#getting-activities)
    -   [Individual Activity Operations](#individual-activity-operations)
    -   [Activity Files](#activity-files)
-   [Workouts](#workouts)
    -   [Managing Workouts](#managing-workouts)
    -   [Workout Scheduling](#workout-scheduling)
-   [Health Data](#health-data)
    -   [Steps](#steps)
    -   [Sleep](#sleep)
    -   [Weight](#weight)
    -   [Hydration](#hydration)
    -   [Heart Rate](#heart-rate)
-   [Golf](#golf)
-   [Gear](#gear)
-   [GPX and Courses](#gpx-and-courses)
-   [Calendar](#calendar)
-   [Custom Requests](#custom-requests)

## Authentication

### Constructor

Create a new instance of the Garmin Connect client.

```js
const { GarminConnect } = require('@flow-js/garmin-connect');

// Create a new Garmin Connect Client with credentials
const GCClient = new GarminConnect({
    username: 'my.email@example.com',
    password: 'MySecretPassword'
});

// Alternatively, create a client using credentials from garmin.config.json
const GCClient = new GarminConnect();
```

You can also provide a configuration file named `garmin.config.json` at your project root:

```json
{
    "username": "my.email@example.com",
    "password": "MySecretPassword"
}
```

### Login

```js
/**
 * Login to Garmin Connect with provided credentials or those set during construction
 * @param username - Optional username to override the one in credentials
 * @param password - Optional password to override the one in credentials
 * @returns The GarminConnect instance for chaining
 */
async login(username?: string, password?: string): Promise<GarminConnect>
```

Example:

```js
await GCClient.login();
// Or with specific credentials
await GCClient.login('my.email@example.com', 'MySecretPassword');
```

### Session Management

#### Export Tokens

```js
/**
 * Exports OAuth tokens to files in the specified directory
 * @param dirPath - Directory path where token files will be saved
 */
exportTokenToFile(dirPath: string): void
```

Example:

```js
GCClient.exportTokenToFile('/path/to/save/tokens');
// Creates oauth1_token.json and oauth2_token.json in the specified directory
```

#### Load Tokens from Files

```js
/**
 * Loads OAuth tokens from files in the specified directory
 * @param dirPath - Directory path where token files are stored
 * @throws Error if directory not found
 */
loadTokenByFile(dirPath: string): void
```

Example:

```js
GCClient.loadTokenByFile('/path/to/save/tokens');
```

#### Export Tokens as Object

```js
/**
 * Exports OAuth tokens as an object
 * @returns Object containing OAuth1 and OAuth2 tokens
 * @throws Error if tokens are not found
 */
exportToken(): IGarminTokens
```

#### Load Tokens from Objects

```js
/**
 * Loads OAuth tokens from provided token objects (e.g., from DB or localStorage)
 * @param oauth1 - OAuth1 token object
 * @param oauth2 - OAuth2 token object
 */
loadToken(oauth1: IOauth1Token, oauth2: IOauth2Token): void
```

Example:

```js
const oauth1 = GCClient.client.oauth1Token;
const oauth2 = GCClient.client.oauth2Token;
// Later, use these to restore the session
GCClient.loadToken(oauth1, oauth2);
```

## User Data

### User Profile

```js
/**
 * Retrieves the user's social profile from Garmin Connect
 * @returns User's social profile data
 */
async getUserProfile(): Promise<ISocialProfile>
```

Example:

```js
const userProfile = await GCClient.getUserProfile();
console.log(userProfile.userName); // Verify login was successful
```

### User Settings

```js
/**
 * Retrieves the user's settings from Garmin Connect
 * @returns User settings data
 */
async getUserSettings(): Promise<IUserSettings>
```

## Activities

### Getting Activities

```js
/**
 * Retrieves a list of activities matching the specified criteria
 * @param start - Optional starting index for pagination
 * @param limit - Optional limit for pagination
 * @param activityType - Optional activity type filter
 * @param subActivityType - Optional activity subtype filter
 * @returns Array of activities matching the criteria
 */
async getActivities(
    start?: number,
    limit?: number,
    activityType?: ActivityType,
    subActivityType?: ActivitySubType
): Promise<IActivity[]>
```

Example:

```js
const activities = await GCClient.getActivities(
    0,
    10,
    ActivityType.Running,
    ActivitySubType.Outdoor
);
```

```js
/**
 * Counts lifetime activities
 * @returns Activity statistics including counts by type
 */
async countActivities(): Promise<ICountActivities>
```

### Individual Activity Operations

```js
/**
 * Retrieves a specific activity by its ID
 * @param activity - Object containing activityId
 * @returns Details of the specified activity
 * @throws Error if activityId is missing
 */
async getActivity(activity: {
    activityId: GCActivityId;
}): Promise<IActivity>
```

Example:

```js
const activityDetails = await GCClient.getActivity({
    activityId: 'exampleActivityId'
});
```

```js
/**
 * Deletes an activity by activityId
 * @param activity - with activityId
 * @returns void
 *
 */
async deleteActivity(activity: {
    activityId: GCActivityId;
}): Promise<void>
```

```js
/**
 * Renames an activity with the given activityId to the newName.
 * @param activityId
 * @param newName
 */
async renameActivity(
    activityId: GCActivityId,
    newName: string
): Promise<void>
```

### Activity Files

`````ts
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
): Promise<void>
``` `

```js
/**
 * Uploads an activity file
 *
 * Uploads an activity file as a new Activity. The file can be a 'gpx', 'tcx', or 'fit' file.
 * If the activity already exists, the result will have a status code of 409.
 * Note: Garmin changed the upload API in v1.4.4, the response `detailedImportResult` no longer contains the new activityId.
 *
 * @param file - Path to the activity file
 * @param format - 'fit' | 'gpx' | 'tcx'
 * @returns Response from the upload operation
 */
async uploadActivity(
    file: string,
    format: UploadFileTypeTypeValue = 'fit'
)
```

Example:

```js
const upload = await GCClient.uploadActivity('./some/path/to/file.fit');
// Note: Garmin changed the upload API in v1.4.4
// const activityId = upload.detailedImportResult.successes[0].internalId; // Not working
// const uploadId = upload.detailedImportResult.uploadId;
```

## Workouts

### Managing Workouts

```js
/**
 * Gets the list of workouts
 * @param start
 * @param limit
 */
async getWorkouts(start: number, limit: number): Promise<IWorkout[]>
```

```js
/**
 * Gets the workout detail by workoutId
 * @param workout
 * @returns workout detail - IWorkoutDetail
 */
async getWorkoutDetail(workout: {
    workoutId: string;
}): Promise<IWorkoutDetail>
```

````js
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
async createWorkout(workout: IWorkoutDetail)
`````

````js
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
async deleteWorkout(workout: { workoutId: string })
````

```js
/**
 * Retrieves all workouts
 * @returns List of workouts
 */
async workouts(): Promise<Workout[]>
```

### Workout Scheduling

````js
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
)
````

## Health Data

### Steps

```js
/**
 * Retrieves step count for a specific date
 * @param date - The date to get step count for, defaults to current date
 * @returns Total step count for the specified date
 * @throws Error if steps data not found for the date
 */
async getSteps(date = new Date()): Promise<number>
```

Example:

```js
const totalSteps = await GCClient.getSteps(new Date('2020-03-24'));
```

### Sleep

```js
/**
 * Retrieves sleep data for a specific date
 * @param date - The date to get sleep data for, defaults to current date
 * @returns Sleep data for the specified date
 * @throws Error if sleep data is invalid or empty
 */
async getSleepData(date = new Date()): Promise<SleepData>
```

````js
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
): Promise<{ hours: number; minutes: number }>
````

### Weight

```js
/**
 * Retrieves weight data for a specific date
 * @param date - The date to get weight data for, defaults to current date
 * @returns Weight data for the specified date
 * @throws Error if weight data is invalid or empty
 */
async getDailyWeightData(date = new Date()): Promise<WeightData>
```

```js
/**
 * Retrieves weight data in pounds for a specific date
 * @param date - The date to get weight data for, defaults to current date
 * @returns Weight in pounds for the specified date
 * @throws Error if valid weight data not found for the date
 */
async getDailyWeightInPounds(date = new Date()): Promise<number>
```

````js
/**
 * Updates weight data for a specific date
 *
 * Updates weight information for the specified date.
 *
 * @param date - The date for the weight data, defaults to current date
 * @param lbs - Weight value in pounds
 * @param timezone - Timezone string for correct timestamp conversion
 * @returns Response from the weight update operation
 * @throws Error if update fails
 *
 * @example
 * ```js
 * await GCClient.updateWeight(undefined, 202.9, 'America/Los_Angeles');
 * ```
 */
async updateWeight(
    date = new Date(),
    lbs: number,
    timezone: string
): Promise<UpdateWeight>
````

### Hydration

```js
/**
 * Retrieves hydration data in fluid ounces for a specific date
 * @param date - The date to get hydration data for, defaults to current date
 * @returns Hydration value in fluid ounces for the specified date
 * @throws Error if hydration data is invalid or empty
 */
async getDailyHydration(date = new Date()): Promise<number>
```

````js
/**
 * Updates hydration log with fluid ounces for a specific date
 *
 * Adds a hydration log entry in ounces for a given date.
 *
 * @param date - The date for the hydration data, defaults to current date
 * @param valueInOz - Hydration value in fluid ounces. Accepts negative number.
 * @returns Response from the hydration update operation
 * @throws Error if update fails
 *
 * @example
 * ```js
 * const hydrationLogEntry = await GCClient.updateHydrationLogOunces(
 *     new Date('2020-03-24'),
 *     16
 * );
 * ```
 */
async updateHydrationLogOunces(
    date = new Date(),
    valueInOz: number
): Promise<WaterIntake>
````

### Heart Rate

````js
/**
 * Retrieves heart rate data for a specific date
 *
 * Retrieves daily heart rate data for a given date.
 *
 * @param date - The date to get heart rate data for, defaults to current date
 * @returns Heart rate data for the specified date
 * @throws Error if the operation fails
 *
 * @example
 * ```js
 * const heartRateData = await GCClient.getHeartRate(new Date('2020-03-24'));
 * ```
 */
async getHeartRate(date = new Date()): Promise<HeartRate>
````

## Golf

```js
/**
 * Retrieves golf summary data
 * @returns Summary of golf activities
 * @throws Error if golf summary data is invalid or empty
 */
async getGolfSummary(): Promise<GolfSummary>
```

```js
/**
 * Retrieves golf scorecard for a specific round
 * @param scorecardId - ID of the scorecard to retrieve
 * @returns Golf scorecard data
 * @throws Error if golf scorecard data is invalid or empty
 */
async getGolfScorecard(scorecardId: number): Promise<GolfScorecard>
```

## Gear

```js
/**
 * Returns the gear data for the user.
 * @param availableGearDate - Optional date to filter the gear available at the date (format: 'YYYY-MM-DD').
 */
async getGear(availableGearDate?: string): Promise<GearData[]>
```

```js
/**
 * Returns the gear data assigned with a specific activity.
 * @param activityId
 */
async getGearsForActivity(activityId: GCActivityId): Promise<GearData[]>
```

```js
/**
 * Links a gear item to an activity.
 * @param activityId
 * @param gearId - uuid field from GearData
 * @return GearData - the linked gear item data
 */
async linkGearToActivity(
    activityId: GCActivityId,
    gearId: GCGearId
): Promise<GearData>
```

```js
/**
 * Unlinks a gear item from an activity.
 * @param activityId
 * @param gearId - uuid field from GearData
 * @return GearData - the unlinked gear item data
 */
async unlinkGearFromActivity(
    activityId: GCActivityId,
    gearId: GCGearId
): Promise<GearData>
```

## GPX and Courses

````js
/**
 * Imports GPX file content
 *
 * @example ./examples/example-gpx-file.js
 * @param fileName - Name of the GPX file
 * @param fileContent - Content of the GPX file as string
 * @returns Response from the GPX import operation containing courseName, geoPoints, and coursePoints
 *
 * @example
 * ```js
 * const fileContent = await fs.readFile('paris-marathon.gpx', 'utf8');
 * const response = await GCClient.importGpx('paris-marathon.gpx', fileContent);
 * // The response contains courseName, geoPoints, and coursePoints that can be used with createCourse
 * ```
 */
async importGpx(
    fileName: string,
    fileContent: string
): Promise<ImportedGpxResponse>
````

````js
/**
 * Creates a course from GPX data
 * You can get geoPoints and coursePoints from the imported GPX file response.
 *
 * @example ./examples/example-gpx-file.js
 * @param activityType - Type of activity for the course
 * @param courseName - Name of the course
 * @param geoPoints - Array of geographical points making up the course
 * @param coursePoints - Optional array of course points (waypoints)
 * @returns Response from the course creation operation containing the courseId
 *
 * @example
 * ```js
 * // First import GPX to get geoPoints and coursePoints
 * const response = await GCClient.importGpx('course.gpx', gpxFileContent);
 *
 * // Then create the course
 * const createCourseResponse = await GCClient.createCourse(
 *     1,  // activityType (1 = running)
 *     response.courseName,
 *     response.geoPoints,
 *     response.coursePoints
 * );
 *
 * console.log('Course created with id:', createCourseResponse.courseId);
 * ```
 */
async createCourse(
    activityType: GpxActivityType,
    courseName: string,
    geoPoints: GeoPoint[],
    coursePoints: CoursePoint[] = []
)
````

````js
/**
 * Lists all courses
 * @returns List of courses in ListCoursesResponse format
 *
 * @example
 * ```js
 * const listCourses = await GCClient.listCourses();
 * console.log(
 *     'Last course:',
 *     listCourses.coursesForUser[0].courseId,
 *     listCourses.coursesForUser[0].courseName
 * );
 * ```
 */
async listCourses(): Promise<ListCoursesResponse>
````

````js
/**
 * Exports a course as GPX file content
 * @param courseId - ID of the course to export
 * @returns GPX file content as string
 *
 * @example
 * ```js
 * const downloadGpx = await GCClient.exportCourseAsGpx(courseId);
 * console.log('Downloaded GPX size:', downloadGpx.length);
 * ```
 */
async exportCourseAsGpx(courseId: number): Promise<string>
````

## Calendar

```js
/**
 * Retrieves calendar events for a specific year.
 * @param year {number} - The year for which to retrieve calendar events.
 */
async getYearCalendarEvents(year: number): Promise<YearCalendar>
```

```js
/**
 * Retrieves calendar events for a specific month and year.
 * @param year {number} - The year for which to retrieve calendar events.
 * @param month {number} - The month (0-11) for which to retrieve calendar events.
 */
async getMonthCalendarEvents(
    year: number,
    month: number
): Promise<MonthCalendar>
```

```js
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
): Promise<any>
```

## Custom Requests

The library provides methods for making custom requests to the Garmin Connect API:

```js
/**
 * Performs a GET request to the specified URL
 * @param url - URL to send the request to
 * @param data - Optional query parameters or request configuration
 * @returns Response data of type T
 */
async get<T>(url: string, data?: any)
```

```js
/**
 * Performs a POST request to the specified URL
 * @param url - URL to send the request to
 * @param data - Data to send in the request body
 * @returns Response data of type T
 */
async post<T>(url: string, data: any)
```

```js
/**
 * Performs a PUT request to the specified URL
 * @param url - URL to send the request to
 * @param data - Data to send in the request body
 * @returns Response data of type T
 */
async put<T>(url: string, data: any)
```
