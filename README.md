# Garmin Connect

This is a fork of https://github.com/Pythe1337N/garmin-connect which was inspired by [https://github.com/matin/garth](https://github.com/matin/garth). Many thanks to contributors.

---

A JavaScript library for accessing and managing your Garmin Connect data. It comes with methods to get and set information in your Garmin account, and also supports [custom requests](#custom-requests) using `GET`, `POST`, `PUT`, `PATCH`, `DELETE` and GraphQL so you can cover additional needs.

This document provides detailed information about the public API methods available in the `@flow-js/garmin-connect` library.

## Table of Contents

-   [Authentication](#authentication)
    -   [Constructor](#constructor)
    -   [Login](#login)
    -   [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
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
    -   [Export to intervals.icu](#export-to-intervalsicu)
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
-   [Activity Details](#activity-details)
-   [Daily Health and Wellness](#daily-health-and-wellness)
-   [Training Metrics and Biometrics](#training-metrics-and-biometrics)
-   [Workouts, calendar and training plans](#workouts-calendar-and-training-plans)
-   [Workout builder](#workout-builder)
-   [Logging and body data](#logging-and-body-data)
-   [Gear, devices, courses and segments](#gear-devices-courses-and-segments)
-   [Records, Goals, Badges and Challenges](#records-goals-badges-and-challenges)
-   [Custom Requests](#custom-requests)
-   [Testing](#testing)

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
 * @param options - Optional login options (see MFA below)
 * @returns The GarminConnect instance for chaining
 */
async
login(
    username ? : string,
    password ? : string,
    options ? : LoginOptions
)
:
Promise < GarminConnect >
```

Example:

```js
await GCClient.login();
// Or with specific credentials
await GCClient.login('my.email@example.com', 'MySecretPassword');
```

Full example: [`examples/example.js`](examples/example.js)

### Multi-Factor Authentication (MFA)

If your Garmin account has 2FA / MFA enabled, login will fail unless you supply an
`mfaHandler` callback. When Garmin responds with `MFA_REQUIRED`, the library calls your handler, waits for the
verification code (email or authenticator app), and completes the login.

```js
/**
 * @property mfaHandler - Async function that resolves to the MFA verification code.
 *   Required for accounts with 2FA enabled. If MFA is required and this is omitted,
 *   login throws: "MFA required but no mfaHandler provided".
 */
interface LoginOptions {
    mfaHandler?: () => Promise<string>;
}
```

Example (prompt for the code in a Node.js CLI):

```js
const readline = require('readline');
const { GarminConnect } = require('@flow-js/garmin-connect');

const promptMfaCode = () =>
    new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter MFA code: ', (code) => {
            rl.close();
            resolve(code);
        });
    });

const GCClient = new GarminConnect({
    username: 'my.email@example.com',
    password: 'MySecretPassword'
});

await GCClient.login(undefined, undefined, {
    mfaHandler: promptMfaCode
});
```

You can also pass credentials and the MFA handler together:

```js
await GCClient.login('my.email@example.com', 'MySecretPassword', {
    mfaHandler: async () => {
        // Fetch or prompt for the code (email / authenticator app)
        return '123456';
    }
});
```

After a successful MFA login, export the OAuth tokens (see [Session Management](#session-management))
and reuse them with `loadToken` / `loadTokenByFile` on later runs so you do not need to enter an MFA code every time.
Tokens obtained via MFA may include `mfa_token` and
`mfa_expiration_timestamp` on the OAuth1 token; these are preserved across
`exportToken()` / `loadToken()` round-trips.

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

Full example: [`examples/example.js`](examples/example.js)

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
    activityType?: ActivityTypeKey,
    subActivityType?: ActivityTypeKey
): Promise<IActivity[]>
```

Example:

```js
const activities = await GCClient.getActivities(
    0,
    10,
    ActivityType.Running,
    ActivitySubType.TrailRunning
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

````ts
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
````

```js
/**
 * Uploads an activity file
 *
 * Uploads an activity file as a new Activity. The file can be a 'gpx', 'tcx', or 'fit' file.
 * If the activity already exists, the result will have a status code of 409.
 * Note: Garmin changed the upload API in v1.4.4, the response `detailedImportResult` no longer contains the new activityId.
 *
 * @param file - Path to the activity file
 * @param format - 'fit' | 'gpx' | 'tcx', defaults to the file extension,
 * or 'fit' when the file has none
 * @returns Response from the upload operation
 */
async uploadActivity(file: string, format?: UploadFileTypeTypeValue)
```

Example:

```js
const upload = await GCClient.uploadActivity('./some/path/to/file.fit');
// Note: Garmin changed the upload API in v1.4.4
// const activityId = upload.detailedImportResult.successes[0].internalId; // Not working
// const uploadId = upload.detailedImportResult.uploadId;
```

```js
/**
 * Uploads a photo to an activity
 * @param activityId - The ID of the activity to attach the photo to
 * @param filePath - Path to the image file to upload
 * @returns Response from the photo upload operation
 */
async uploadActivityPhoto(
    activityId: GCActivityId,
    filePath: string
): Promise<unknown>
```

Example:

```js
await GCClient.uploadActivityPhoto(12345678, './my-run-photo.jpg');
```

Full example: [`examples/example-image.js`](examples/example-image.js)

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

Full example: [`examples/example-intervals-icu.js`](examples/example-intervals-icu.js)

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

Full example: [`examples/example-intervals-icu.js`](examples/example-intervals-icu.js)

````js
/**
 * Creates a new workout
 *
 * Use workoutBuilder to create the workout object. See the example in [examples/example-workout.js](examples/example-workout.js) for more complex workouts.
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
````

Full example: [`examples/example-workout.js`](examples/example-workout.js), [`examples/example-strength-workout.js`](examples/example-strength-workout.js)

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

### Export to intervals.icu

Convert a Garmin workout detail into a plain-text description compatible with
the [intervals.icu workout builder](https://forum.intervals.icu/t/workout-builder/1163). The workout name is omitted so
you can set it separately on the intervals.icu event.

```js
/**
 * Convert a Garmin workout detail into an intervals.icu workout description string.
 * @param workout - workout detail from getWorkoutDetail() or WorkoutBuilder.build()
 * @returns intervals.icu description (sections, steps, targets, repeats)
 */
toIntervalsIcuDescription(workout
:
IWorkoutDetail
):
string
```

Example:

```js
const {
    GarminConnect,
    toIntervalsIcuDescription
} = require('@flow-js/garmin-connect');

const detail = await GCClient.getWorkoutDetail({ workoutId });
const description = toIntervalsIcuDescription(detail);
console.log(description);
// Warmup
// - Easy 10m Z2 HR
//
// Main Set 4x
// - 800mtr 5:00/km Pace
// - 400mtr Z1 HR
//
// Cooldown
// - 10m Z1 HR
```

See [`examples/example-intervals-icu.js`](examples/example-intervals-icu.js) for a full fetch-and-convert example.

Supported mappings include time and distance durations, lap press, pace / HR / power / cadence targets, section headers
(`Warmup`, `Main Set`, `Cooldown`), and repeat groups (`Main Set Nx`). Strength steps and unsupported end conditions
(calories, HR threshold, reps) are emitted as descriptive cue text.

## Health Data

### Steps

```js
/**
 * Retrieves step count for a specific date
 * @param date - The date to get step count for, defaults to current date
 * @returns Total step count for the specified date, or null when Garmin has
 * a record for the date without a step count (e.g. no device data)
 * @throws Error if steps data not found for the date
 */
async getSteps(date = new Date()): Promise<number | null>
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
 * @returns Hydration value in fluid ounces for the specified date, 0 when
 * nothing is logged
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

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

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

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

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

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

````js
/**
 * Get the details of a course
 * @param courseId - Course id
 * @returns Course details
 *
 * @example
 * ```js
 * const course = await GCClient.getCourseDetails(123456789);
 * console.log('Course name', course.courseName);
 * ```
 */
async getCourseDetails(
    courseId: string | number
): Promise<CourseDetailsResponse>
````

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

````js
/**
 * Edit course privacy
 * @param courseId - Course Id
 * @param privacy - Privacy setting for the course, use CoursePrivacyRule.PUBLIC (1) for public courses
 *                  or CoursePrivacyRule.PRIVATE (2) for private courses. Defaults to PRIVATE.
 * @returns Course details
 *
 * @example
 * ```js
 * // Make a course public
 * await GCClient.updateCoursePrivacy(courseId, 1);
 * ```
 */
async updateCoursePrivacy(
    courseId: string | number,
    privacy: CoursePrivacyRule = CoursePrivacyRule.PRIVATE
): Promise<CourseDetailsResponse>
````

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

````js
/**
 * Rename a course
 * @param courseId - Course Id
 * @param courseName - The new course name
 * @returns Course details
 *
 * @example
 * ```js
 * await GCClient.renameCourse(courseId, 'My new course name');
 * ```
 */
async renameCourse(
    courseId: string | number,
    courseName: string
): Promise<CourseDetailsResponse>
````

````js
/**
 * Complete update of a course
 * @param courseRequest - the full data of the course. Use getCourseDetails to get the existing set
 * @returns Course details updated
 *
 * @example
 * ```js
 * const course = await GCClient.getCourseDetails(courseId);
 * await GCClient.updateCourse({ ...course, description: 'Updated description' });
 * ```
 */
async updateCourse(
    courseRequest: CourseDetailsRequest
): Promise<CourseDetailsResponse>
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

Full example: [`examples/example-gpx-file.js`](examples/example-gpx-file.js)

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

## Activity Details

All of these read data. `activityId` is the number found in the activity list.

### Searching Activities

`getActivities` keeps its positional arguments. Use `searchActivities` to filter
by date or text.

```js
const activities = await GCClient.searchActivities({
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    search: 'morning',
    activityType: ActivityType.AllRunning,
    start: 0,
    limit: 20
});
const { firstActivityId, lastActivityId } =
    await GCClient.getFirstAndLastActivity();
```

Anywhere an activity type is expected, you can pass an `ActivityType` value or
any `typeKey` returned by `getActivityTypes()`. `ActivityType.Running` is
`street_running`; `ActivityType.AllRunning` is `running`.

### Data of One Activity

```js
const details = await GCClient.getActivityDetails(activityId, {
    maxChartSize: 2000,
    maxPolylineSize: 4000
});
const splits = await GCClient.getActivitySplits(activityId);
const typedSplits = await GCClient.getActivityTypedSplits(activityId);
const summaries = await GCClient.getActivitySplitSummaries(activityId);
const weather = await GCClient.getActivityWeather(activityId);
const heartRateZones = await GCClient.getActivityHeartRateZones(activityId);
const powerZones = await GCClient.getActivityPowerZones(activityId);
const exerciseSets = await GCClient.getActivityExerciseSets(activityId);
const workouts = await GCClient.getActivityWorkouts(activityId);
const polyline = await GCClient.getActivityPolyline(activityId);
```

### Types and Statistics

```js
const activityTypes = await GCClient.getActivityTypes();
const eventTypes = await GCClient.getEventTypes();
const powerCurve = await GCClient.getPowerCurve();
const stats = await GCClient.getActivityStats({
    startDate: new Date('2026-01-01'),
    endDate: new Date(),
    aggregation: 'lifetime',
    metric: 'duration'
});
```

### Creating and Editing Activities

These methods modify your account. Their requests were read from the Garmin
Connect web app and have not been verified against the API.

```js
// The privacy defaults to 'private'
const created = await GCClient.createManualActivity({
    activityName: 'Evening walk',
    activityType: ActivityType.Walking,
    startTime: new Date(),
    timezone: 'Europe/Paris',
    durationInSeconds: 1800,
    distanceInMeters: 2000
});

await GCClient.updateActivity(activityId, {
    description: 'Felt good',
    activityTypeDTO: { typeKey: ActivityType.Hiking },
    eventTypeDTO: { typeKey: 'uncategorized' },
    accessControlRuleDTO: { typeKey: 'private' }
});

// Photo IDs are listed in `metadataDTO.activityImages` of the activity
await GCClient.deleteActivityPhoto(activityId, imageId);
```

Full example: [`examples/example-activity-details.js`](examples/example-activity-details.js)

## Daily Health and Wellness

All methods here only read. Dates are `Date` objects, and single-day methods
default to today. Metrics are `null` when Garmin has no data for them. Several
response types are loose because only empty responses have been observed. See
`examples/example-health.js`.

### Daily Summary and Wellness

```js
const summary = await GCClient.getDailySummary(new Date('2020-03-24'));
const stress = await GCClient.getStress(date);
const respiration = await GCClient.getRespiration(date);
const spo2 = await GCClient.getSpO2(date);
const intensity = await GCClient.getIntensityMinutes(date);
const floors = await GCClient.getFloors(date);
const lifestyle = await GCClient.getLifestyleLog(date);
const hydration = await GCClient.getHydrationSummary(date); // includes the goal, in ml

// Lists, empty when there is nothing
const bodyBatteryEvents = await GCClient.getBodyBatteryEvents(date);
const stepsChart = await GCClient.getStepsChart(date);
const events = await GCClient.getDailyEvents(date);

// null when there is no data
const hrv = await GCClient.getHrv(date);
const healthStatus = await GCClient.getHealthStatus(date);

// getWellnessActivities(start = 1, limit = 20, until = new Date())
const activities = await GCClient.getWellnessActivities(1, 20);
```

### Sleep Summaries and Statistics

```js
const sleep = await GCClient.getSleep(date); // summary only, or null
const naps = await GCClient.getNaps(date);
const summaries = await GCClient.getSleepSummaries(start, end);
const scores = await GCClient.getSleepScores(start, end);

const stats = await GCClient.getSleepStats(start, end);
stats.individualStats; // every night of the range
stats.periods; // [{ startDate, endDate, overallStats }]
```

Garmin computes `overallStats` per request, and one request covers at most 28
days. Longer ranges therefore return one entry per period in `periods`. The
averages are not combined.

### Date Ranges

Both dates are included. Garmin limits these endpoints to 28 days (or the limit
is unknown), so longer ranges are requested in consecutive chunks and
concatenated.

```js
const bodyBattery = await GCClient.getBodyBattery(start, end); // daily reports
const steps = await GCClient.getStepsRange(start, end);
const stress = await GCClient.getStressRange(start, end);
const restingHeartRate = await GCClient.getRestingHeartRateRange(start, end);
const intensity = await GCClient.getIntensityMinutesRange(start, end);
const floors = await GCClient.getFloorsRange(start, end);
const hydration = await GCClient.getHydrationRange(start, end);
const respiration = await GCClient.getRespirationRange(start, end);
const bodyBatteryStats = await GCClient.getBodyBatteryRange(start, end);

// One entry per request that had data: [{ startDate, endDate, data }]
const hrv = await GCClient.getHrvRange(start, end);
```

### Weight History and Goals

Weights are in grams. These range methods send a single request.

```js
const range = await GCClient.getWeightRange(start, end);
const latest = await GCClient.getLatestWeight(date); // or null
const first = await GCClient.getFirstWeight(); // or null
const goals = await GCClient.getWeightGoals(start, end);
```

### Wellness Files

```js
// Saves wellness-YYYY-MM-DD.zip and returns its path, or null without content
const file = await GCClient.downloadDailyWellnessFile(date, './some/dir');
```

## Training Metrics and Biometrics

All of these are read-only. Without data from a compatible device, many of them
return `null`, an empty list or an object with empty members. The shapes of the
responses that have only been seen empty are not typed yet. See
`examples/example-metrics.js`.

Single day reads default to today:

```js
await GCClient.getTrainingReadiness(new Date('2026-03-15'));
await GCClient.getTrainingStatus();
await GCClient.getVo2Max();
await GCClient.getEnduranceScore(); // null without data
await GCClient.getHillScore(); // null without data
await GCClient.getHeatAltitudeAcclimation(); // null without data
await GCClient.getFitnessAge();
```

Date ranges:

```js
const start = new Date('2026-03-01');
const end = new Date('2026-03-28');

await GCClient.getVo2MaxRange(start, end);
await GCClient.getRacePredictionsRange(start, end);
await GCClient.getRunningTolerance(start, end); // daily
await GCClient.getRunningTolerance(start, end, 'weekly');

const latest = await GCClient.getRacePredictions(); // null without data
```

Thresholds and zones:

```js
await GCClient.getLactateThreshold();
await GCClient.getFtp('CYCLING');
await GCClient.getHeartRateZones();
await GCClient.getPowerZones();
await GCClient.getCriticalSwimSpeed(); // null without data
```

User statistics and details:

```js
const statistics = await GCClient.getUserStatistics();

// Metric 60 (the default) is the resting heart rate
const wellness = await GCClient.getUserWellnessStatistics(start, end, 60);

const information = await GCClient.getPersonalInformation();
```

## Workouts, calendar and training plans

Write methods change your account. Those marked "unverified" were derived from
Garmin's web app and have not been confirmed against the live API.

Full example: [`examples/example-training.js`](examples/example-training.js)

### Editing, copying and downloading workouts

Updating, copying and downloading are unverified.

```js
const detail = await GCClient.getWorkoutDetail({ workoutId });

// Send the whole workout back with your changes
await GCClient.updateWorkout({ ...detail, workoutName: 'New name' });

await GCClient.copyWorkout(workoutId, 'Copy of my workout');

// Writes ./workouts/<workoutId>.fit and returns that path
const file = await GCClient.downloadWorkout(workoutId, './workouts');

// Sport, step, condition and target types
const types = await GCClient.getWorkoutTypes();
```

### Scheduled workouts

A `scheduleId` identifies one calendar entry, not the workout. Unscheduling and
rescheduling are unverified.

```js
await GCClient.getScheduledWorkouts(
    new Date('2026-01-01'),
    new Date('2026-01-31')
);
await GCClient.getScheduledWorkout(scheduleId);
await GCClient.rescheduleWorkout(scheduleId, new Date('2026-02-03'));
await GCClient.unscheduleWorkout(scheduleId);
```

### Sending a workout to a device

Unverified: this request has never been sent to Garmin.

```js
// The message name defaults to the workout name
await GCClient.sendWorkoutToDevice(workoutId, deviceId, 'Today');
```

### Calendar notes

Unverified.

```js
await GCClient.createNote('Rest day', 'Easy walk only', new Date());
await GCClient.getNote(noteId);
await GCClient.deleteNote(noteId);
```

### Events

Only `getUpcomingEvents` has been called against Garmin. The query parameters of
`getEvents` and the body of `updateEvent` are unknown, so they are passed
through as you give them.

```js
// 30 days ahead, at most 10 events, starting today
await GCClient.getUpcomingEvents(30, 10);
await GCClient.getEvents(params);
await GCClient.getPrimaryEvent();
await GCClient.getEvent(eventId);
await GCClient.updateEvent(eventId, event);
await GCClient.deleteEvent(eventId);
```

### Training plans

The three single-plan reads are unverified.

```js
const { trainingPlanList } = await GCClient.getTrainingPlans(20);
await GCClient.getTrainingPlan(planId);
await GCClient.getAdaptiveTrainingPlan(planId);
await GCClient.getPhasedTrainingPlan(planId);
```

## Workout builder

See `examples/example-workout.js`, `examples/example-strength-workout.js` and
`examples/example-repeat-workout.js`. Parts of Garmin's workout format used for
the features below are not verified: check the result in Garmin Connect, or read
the workout back with `getWorkoutDetail`.

Repeat groups (they can be nested):

```js
const workout = new WorkoutBuilder(WorkoutType.Running, '4 x 400 m')
    .addStep(new Step(StepType.WarmUp, TimeDuration.fromMinutes(10)))
    .addStep(
        new RepeatGroup(4, [
            new Step(StepType.Run, DistanceDuration.fromMeters(400)),
            new Step(StepType.Recovery, TimeDuration.fromSeconds(90))
        ])
    )
    .build();

await GCClient.createWorkout(workout);
```

Secondary targets:

```js
new Step(
    StepType.Run,
    TimeDuration.fromMinutes(10),
    PowerZone.power(220, 10)
).withSecondaryTarget(CadenceTarget.cadence(90, 5));
```

Swimming:

```js
new WorkoutBuilder(WorkoutType.Swimming, 'Drills')
    .setPoolLength(25, 'meter')
    .addStep(
        new Step(StepType.Run, DistanceDuration.fromMeters(100))
            .withStroke(SwimStroke.Free)
            .withDrill(SwimDrill.Kick)
            .withEquipment(SwimEquipment.Kickboard)
            .withSecondaryTarget(
                new SwimInstructionTarget(SwimInstruction.Easy)
            )
    )
    .addStep(new Step(StepType.Rest, FixedRestDuration.fromSeconds(20)));
```

Multisport, with one segment per sport:

```js
new WorkoutBuilder(WorkoutType.MultiSport, 'Bike and run')
    .addSegment(new WorkoutSegment(WorkoutType.Cycling).addStep(bikeStep))
    .addSegment(new WorkoutSegment(WorkoutType.Running).addStep(runStep));
```

| Builder part  | Available                                                                                                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WorkoutType` | `Running`, `Cycling`, `Swimming`, `Strength`, `Cardio`, `Other`, `Yoga`, `Pilates`, `Hiit`, `MultiSport`, `Mobility`, `Rucking`                                                                                                                                                                                                     |
| `StepType`    | `WarmUp`, `Run`, `Exercise`, `Recovery`, `Rest`, `Cooldown`, `Other`, `Main`                                                                                                                                                                                                                                                        |
| Durations     | `TimeDuration`, `DistanceDuration`, `LapPressDuration`, `RepsDuration`, `CaloriesDuration`, `HeartRateDuration`, `PowerDuration`, `FixedRestDuration`, `RepetitionTimeDuration`, `SwimCssOffsetDuration`, and `ConditionDuration` with any `EndConditionType`                                                                       |
| Targets       | `NoTarget`, `PaceTarget`, `CadenceTarget`, `HrmZoneTarget`, `HrmTarget`, `PowerZoneTarget`, `PowerZone`, `SpeedTarget`, `GradeTarget`, `HeartRateLapTarget`, `PowerLapTarget`, `AveragePowerTarget`, `SpeedLapTarget`, `SwimStrokeTarget`, `SwimCssOffsetTarget`, `SwimInstructionTarget`, and `CustomTarget` with any `TargetKind` |
| Step options  | `withSecondaryTarget`, `withStroke`, `withEquipment`, `withDrill`, `withIntensity`                                                                                                                                                                                                                                                  |

`toIntervalsIcuDescription` writes repeat groups as `Main Set 4x` blocks.
Nested repeats are written out in full, as intervals.icu cannot nest them.

## Logging and body data

Methods marked "modifies the account" write to your Garmin account. Their endpoints were read from Garmin's web code and have not been verified against Garmin.

Dates are taken as days in the system timezone. To turn a `calendarDate` from a response back into a `Date`, use `new Date(calendarDate + 'T00:00:00')`.

### Weight

```js
// Modifies the account. Pounds by default, or 'kg'
await GCClient.updateWeight(new Date(), 81.5, 'Europe/Paris', 'kg');

// Modifies the account
const { dateWeightList } = await GCClient.getDailyWeightData(new Date());
const entry = dateWeightList[0];
await GCClient.deleteWeight(
    new Date(entry.calendarDate + 'T00:00:00'),
    entry.samplePk
);
```

### Hydration

```js
// Modifies the account. The value is added to the day, negative values subtract
await GCClient.updateHydrationLogMl(new Date(), 250);
await GCClient.updateHydrationLogOunces(new Date(), 8);
```

### Blood pressure

```js
await GCClient.getBloodPressureRange(
    new Date('2024-01-01T00:00:00'),
    new Date()
);
const day = await GCClient.getBloodPressureDay(new Date());

// Modifies the account. The timezone defaults to the system timezone
const reading = { systolic: 118, diastolic: 76, pulse: 61, notes: 'rest' };
await GCClient.logBloodPressure(reading, new Date(), 'Europe/Paris');

// Modifies the account. An edit replaces the whole measurement
const measurement = day.bloodPressureMeasurements[0];
const time = new Date(measurement.measurementTimestampGMT + 'Z');
await GCClient.updateBloodPressure(measurement.version, reading, time);

// Modifies the account. Read the day again if you edited the measurement
await GCClient.deleteBloodPressure(
    new Date(measurement.measurementTimestampLocal),
    measurement.version
);
```

### Sleep and naps

These modify the account. The payloads are unverified and sent as you give them.

```js
await GCClient.createManualSleep(payload);
await GCClient.updateManualSleep(sleepId, payload);
await GCClient.updateSleepNote(sleepId, payload);
await GCClient.logNap(payload);
```

### Nutrition

```js
await GCClient.getNutritionStatus();
await GCClient.getNutritionDailyLog(new Date());
await GCClient.getNutritionMeals(new Date());
await GCClient.getNutritionSettings(new Date()); // null when none are set
await GCClient.searchFoods('apple', {
    start: 0,
    limit: 20,
    regionCode: 'US',
    languageCode: 'en'
});
await GCClient.getCustomFoods();
await GCClient.getCustomFood(customFoodUuid);

// These modify the account. Item and food payloads are unverified
await GCClient.logFoods(new Date(), foodLogItems);
await GCClient.quickAddFoods(new Date(), quickAddItems);
await GCClient.deleteFoodLogs(new Date(), logIds);
await GCClient.saveCustomFood(customFood);
await GCClient.deleteCustomFood(customFoodId);
```

### Cycle tracking

Sensitive health data, available when cycle tracking is turned on for the account.

```js
await GCClient.getMenstrualCycleDayView(new Date());
await GCClient.getMenstrualCycleSummary(new Date());
await GCClient.getMenstrualCycleCalendar(
    new Date('2024-01-01T00:00:00'),
    new Date()
);
await GCClient.getLastConfirmedMenstrualCycle(new Date());

// Modifies the account. The payload is unverified
await GCClient.logMenstrualCycleDay(new Date(), dailyLog);
```

### Glucose

```js
await GCClient.getGlucoseDay(new Date());
await GCClient.getGlucoseRange(new Date('2024-01-01T00:00:00'), new Date());

// These modify the account. The payload and the id are unverified
await GCClient.logGlucose(entry);
await GCClient.deleteGlucose(glucoseId);
```

## Gear, devices, courses and segments

See [examples/example-equipment.js](./examples/example-equipment.js). Many of
these endpoints were found in Garmin's web code: where a response type is
`unknown` or a loose object, its shape is unverified.

### Gear

`getGear` and `getGearsForActivity` return the legacy shape. The gear v2 methods
add usage totals.

```js
const gear = await GCClient.getGearList();
await GCClient.getGearDetails(gear[0].uuid);
await GCClient.getAvailableGear(); // or getAvailableGear(date)

await GCClient.getGearTypes();
await GCClient.getGearUsageTypes();
await GCClient.getUserGearTypes();
await GCClient.getGearCollections();
```

These modify the account. The request bodies and status values are unverified.

```js
await GCClient.createGear(payload);
await GCClient.updateGear(gearId, payload);
await GCClient.setGearStatus(gearId, status); // e.g. to retire gear
await GCClient.deleteGearImage(gearId, imageId);
await GCClient.removeAllGearFromActivity(activityId);
```

### Devices

```js
await GCClient.getDevices();
const device = await GCClient.getLastUsedDevice(); // null without a device
await GCClient.getAllDeviceInfo();
await GCClient.getDeviceSettings(deviceId);

// Solar capable devices
await GCClient.getDeviceSolarData(deviceId, new Date());
await GCClient.getDeviceSolarRange(deviceId, startDate, endDate);
```

### Courses

```js
const draft = await GCClient.getCourseDraftFromActivity(activityId); // not saved
const fit = await GCClient.exportCourseAsFit(courseId); // Buffer
require('fs').writeFileSync('course.fit', fit);

await GCClient.getFavoriteCourses();

// These modify the account
await GCClient.addCourseToFavorites(courseId);
await GCClient.removeCourseFromFavorites(courseId);
await GCClient.deleteCourse(courseId);
```

### PacePro bands and power guides

```js
await GCClient.getPaceBandSummaries(); // or getPaceBandSummaries(courseId)
await GCClient.getPaceBand(paceBandId);
await GCClient.getPowerGuideSummaries(); // or getPowerGuideSummaries(courseId)
await GCClient.getPowerGuide(powerGuideId);

// These modify the account
await GCClient.deletePaceBand(paceBandId);
await GCClient.sendPaceBandToDevice(paceBandId, deviceId);
await GCClient.deletePowerGuide(powerGuideId);
```

### Segments

```js
await GCClient.getSegmentClassifications();
await GCClient.getSegmentSurfaceTypes();
await GCClient.searchSegments({ limit: 10, showFavorites: true });
await GCClient.getSegmentsForActivity(activityId);
await GCClient.getSegment(segmentId);
await GCClient.getSegmentLeaderboardRank(segmentId); // your own rank
```

## Records, Goals, Badges and Challenges

The write methods in this section have not been verified against Garmin. Where
the request body is a plain object, it is sent as given.

### Personal Records

```js
const records = await GCClient.getPersonalRecords();
const recordTypes = await GCClient.getPersonalRecordTypes();
```

### Goals

```js
// status: 'active' (default), 'future' or 'past'
const goals = await GCClient.getGoals('past', { start: 0, limit: 20 });

// These modify the account
await GCClient.createGoal(goal);
await GCClient.deleteGoal(goalId);
```

### Daily and Weight Goals

```js
const stepGoal = await GCClient.getDailyStepGoal(new Date('2026-01-15'));
const effectiveGoals = await GCClient.getEffectiveGoals();

// These modify the account
await GCClient.updateDailyWellnessGoal(new Date('2026-01-15'), goal);
await GCClient.setWeightGoal(70000); // grams, from today
```

### Badges

```js
const earned = await GCClient.getEarnedBadges();
const available = await GCClient.getAvailableBadges();
```

### Challenges

```js
const open = await GCClient.getAvailableBadgeChallenges();
const completed = await GCClient.getCompletedBadgeChallenges();
const unfinished = await GCClient.getNonCompletedBadgeChallenges();
const virtualChallenges = await GCClient.getAvailableVirtualChallenges();

const past = await GCClient.getHistoricalAdHocChallenges();
const current = await GCClient.getNonCompletedAdHocChallenges();

// Modifies the account. The library cannot leave a challenge.
await GCClient.joinBadgeChallenge(open[0].uuid);

// Modifies the account and can send invitations to other people
await GCClient.createAdHocChallenge(challenge);
```

### Multi-day Events

```js
// null when there are none
const events = await GCClient.getMultiDayActivities();
const event = await GCClient.getMultiDayActivity(eventId);
const activities = await GCClient.getActivitiesOfMultiDayActivity(eventId);

// These modify the account
await GCClient.createMultiDayActivity({
    name: 'Weekend tour',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-03'),
    accessControlRule, // accepted values are unknown, there is no default
    activityIds: []
});
await GCClient.deleteMultiDayActivity(eventId);
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

```js
/**
 * Performs a DELETE or PATCH request to the specified URL
 */
async delete<T>(url: string, config?: AxiosRequestConfig)
async patch<T>(url: string, data: any)
```

```js
/**
 * Runs a read query against the GraphQL gateway
 * @returns The `data` member of the response
 */
async graphql<T>(query: string): Promise<T>
```

## Testing

```bash
npm test
```

Runs the integration tests in `tests/integration` against a local server that stands in for Garmin Connect. No account or network is needed.

The tests in `tests/live` call the real Garmin Connect and are skipped by default. Sign in once to save tokens in `.garmin-tokens` (you are asked for the MFA code if your account uses one):

```bash
GARMIN_USERNAME=my.email@example.com GARMIN_PASSWORD=... npm run test:live:login
```

Then run the read-only tests:

```bash
GARMIN_LIVE=1 npm run test:live
```

`GARMIN_ALLOW_WRITES=1` adds the tests that change your account. Each one creates its own data and deletes it again. Read them before you run them: if a deletion fails, test data can be left behind.

```bash
GARMIN_LIVE=1 GARMIN_ALLOW_WRITES=1 npm run test:live
```
