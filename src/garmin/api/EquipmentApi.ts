import FormData from 'form-data';
import {
    CoursePrivacyRule,
    CreatedCourseResponse,
    GCGearId,
    ListCoursesResponse
} from '../types';
import { GCActivityId } from '../types/activity';
import {
    DeviceLastUsed,
    GearTypeDefinition,
    GearUserTypes,
    GearV2Item,
    SegmentClassification,
    SegmentDetails,
    SegmentSearchFilters
} from '../types/equipment';
import { GearData } from '../types/gear';
import {
    CourseDetailsRequest,
    CourseDetailsResponse,
    CoursePoint,
    GeoPoint,
    GpxActivityType,
    ImportedGpxResponse
} from '../types/gpx';
import { toDateString } from '../common/DateUtils';
import { courseRequestTemplate } from '../common/GpxUtils';
import { EquipmentUrls } from '../urls/equipment';
import { LoggingApi } from './LoggingApi';

export class EquipmentApi extends LoggingApi {
    protected readonly equipmentUrls = new EquipmentUrls(this.url);

    /**
     * Returns the gear data for the user.
     * @param availableGearDate - Optional date to filter the gear available at the date (format: 'YYYY-MM-DD').
     */
    async getGear(availableGearDate?: string): Promise<GearData[]> {
        const id = await this.getProfileId();
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

    /**
     * Imports GPX file content
     *
     * @example ./examples/example-gpx-file.js
     * @param fileName - Name of the GPX file
     * @param fileContent - Content of the GPX file as string
     * @returns Response from the GPX import operation
     */
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
                ...form.getHeaders()
            }
        });
    }

    /**
     * Creates a course from GPX data
     * You can get geoPoints and coursePoints from the imported GPX file response.
     *
     * @example ./examples/example-gpx-file.js
     * @param activityType - Type of activity for the course
     * @param courseName - Name of the course
     * @param geoPoints - Array of geographical points making up the course
     * @param coursePoints - Optional array of course points (waypoints)
     * @param privacy - Optional privacy setting for the course, defaults to PRIVATE (2). Use CoursePrivacyRule.PUBLIC (1) for public courses.
     * @returns Response from the course creation operation
     */
    async createCourse(
        activityType: GpxActivityType,
        courseName: string,
        geoPoints: GeoPoint[],
        coursePoints: CoursePoint[] = [],
        privacy: CoursePrivacyRule = CoursePrivacyRule.PRIVATE
    ): Promise<CreatedCourseResponse> {
        return await this.client.post(
            this.url.CREATE_COURSE_GPX_FILE,
            courseRequestTemplate(
                activityType,
                courseName,
                geoPoints,
                coursePoints,
                privacy
            ),
            {}
        );
    }

    /**
     * Lists all courses
     * @returns List of courses
     */
    async listCourses(): Promise<ListCoursesResponse> {
        return this.client.get<ListCoursesResponse>(this.url.LIST_COURSES);
    }

    /**
     * Get the details of a course
     * @param courseId - Course id
     * @returns Course details
     */
    async getCourseDetails(
        courseId: string | number
    ): Promise<CourseDetailsResponse> {
        return this.client.get<CourseDetailsResponse>(
            this.url.SINGLE_COURSE(courseId)
        );
    }

    /**
     * Edit course privacy
     * @param courseId - Course Id
     * @param privacy - Privacy setting for the course, use CoursePrivacyRule.PUBLIC (1) for public courses or CoursePrivacyRule.PRIVATE (2) for private courses. Defaults to PRIVATE.
     * @returns Course details
     */
    async updateCoursePrivacy(
        courseId: string | number,
        privacy: CoursePrivacyRule = CoursePrivacyRule.PRIVATE
    ): Promise<CourseDetailsResponse> {
        const courseDetails = await this.getCourseDetails(courseId);
        return this.client.put<CourseDetailsResponse, CourseDetailsRequest>(
            this.url.SINGLE_COURSE(courseId),
            {
                ...courseDetails,
                rulePK: privacy
            }
        );
    }

    /**
     * Rename course
     * @param courseId - Course Id
     * @param courseName - The new course nname
     * @returns Course details
     */
    async renameCourse(
        courseId: string | number,
        courseName: string
    ): Promise<CourseDetailsResponse> {
        const courseDetails = await this.getCourseDetails(courseId);
        return this.client.put<CourseDetailsResponse, CourseDetailsRequest>(
            this.url.SINGLE_COURSE(courseId),
            {
                ...courseDetails,
                courseName
            }
        );
    }

    /**
     * Complete update of course
     * @param courseRequest - the full data of course. Use getCourseDetails to get the existing set
     * @returns Course details updated
     */
    async updateCourse(
        courseRequest: CourseDetailsRequest
    ): Promise<CourseDetailsResponse> {
        return this.client.put<CourseDetailsResponse, CourseDetailsRequest>(
            this.url.SINGLE_COURSE(courseRequest.courseId),
            courseRequest
        );
    }

    /**
     * Exports a course as GPX file content
     * @param courseId - ID of the course to export
     * @returns GPX file content as string
     */
    async exportCourseAsGpx(courseId: number): Promise<string> {
        return this.client.get<string>(
            this.url.EXPORT_COURSE_GPX_FILE(courseId),
            {
                responseType: 'text'
            }
        );
    }

    /**
     * Lists the user's gear with its usage totals (gear v2 API)
     * @returns Gear items. `getGear` returns the legacy shape
     */
    async getGearList(): Promise<GearV2Item[]> {
        return this.client.get(this.equipmentUrls.GEAR_V2_LIST);
    }

    /**
     * Retrieves one gear item (gear v2 API)
     * @param gearId - uuid of the gear
     * @returns The gear item; its fields are unverified
     */
    async getGearDetails(gearId: GCGearId): Promise<Record<string, unknown>> {
        if (!gearId) {
            throw new Error('Missing gearId');
        }
        return this.client.get(this.equipmentUrls.GEAR_V2_BY_ID(gearId));
    }

    /**
     * Retrieves the gear available on a day (gear v2 API)
     * @param date - Day to read, defaults to today
     * @returns The gear items
     */
    async getAvailableGear(date: Date = new Date()): Promise<GearV2Item[]> {
        return this.client.get<GearV2Item[]>(
            this.equipmentUrls.GEAR_V2_AVAILABLE(toDateString(date))
        );
    }

    /**
     * Creates a gear item. Modifies the account.
     * @param gear - Request body; its shape is unverified
     * @returns The response, whose shape is unverified
     */
    async createGear(gear: Record<string, unknown>): Promise<unknown> {
        if (!gear) {
            throw new Error('Missing gear');
        }
        return this.client.post(this.equipmentUrls.GEAR_V2, gear);
    }

    /**
     * Updates a gear item. Modifies the account.
     * @param gearId - uuid of the gear
     * @param gear - Request body; its shape is unverified
     * @returns The response, whose shape is unverified
     */
    async updateGear(
        gearId: GCGearId,
        gear: Record<string, unknown>
    ): Promise<unknown> {
        if (!gearId) {
            throw new Error('Missing gearId');
        }
        if (!gear) {
            throw new Error('Missing gear');
        }
        return this.client.put(this.equipmentUrls.GEAR_V2_BY_ID(gearId), gear);
    }

    /**
     * Changes the status of a gear item, e.g. to retire it. Modifies the
     * account.
     * @param gearId - uuid of the gear
     * @param status - New status, as found in `GearV2Item.status`. The accepted
     * values are unverified
     * @returns The response, whose shape is unverified
     */
    async setGearStatus(gearId: GCGearId, status: string): Promise<unknown> {
        if (!gearId) {
            throw new Error('Missing gearId');
        }
        if (!status) {
            throw new Error('Missing status');
        }
        return this.client.put(
            this.equipmentUrls.GEAR_V2_STATUS(gearId, status),
            {}
        );
    }

    /**
     * Deletes an image of a gear item. Modifies the account.
     * @param gearId - uuid of the gear
     * @param imageId - Id of the image
     * @returns The response, whose shape is unverified
     */
    async deleteGearImage(
        gearId: GCGearId,
        imageId: string | number
    ): Promise<unknown> {
        if (!gearId) {
            throw new Error('Missing gearId');
        }
        if (!imageId) {
            throw new Error('Missing imageId');
        }
        return this.client.delete(
            this.equipmentUrls.GEAR_V2_IMAGE(gearId, imageId)
        );
    }

    /**
     * Removes all gear from an activity. Modifies the account.
     * @param activityId - Id of the activity
     * @returns The response, whose shape is unverified
     */
    async removeAllGearFromActivity(
        activityId: GCActivityId
    ): Promise<unknown> {
        if (!activityId) {
            throw new Error('Missing activityId');
        }
        return this.client.delete(
            this.equipmentUrls.ACTIVITY_ASSOCIATED_GEAR(activityId)
        );
    }

    /**
     * Lists the kinds of gear Garmin knows
     * @returns Gear type definitions
     */
    async getGearTypes(): Promise<GearTypeDefinition[]> {
        return this.client.get(this.equipmentUrls.GEAR_TYPES);
    }

    /**
     * Lists the usage types a gear item can have
     * @returns Usage type keys
     */
    async getGearUsageTypes(): Promise<string[]> {
        return this.client.get(this.equipmentUrls.GEAR_USAGE_TYPES);
    }

    /**
     * Retrieves the gear types the user has active and retired gear of
     * @returns Active and retired gear type keys
     */
    async getUserGearTypes(): Promise<GearUserTypes> {
        return this.client.get(this.equipmentUrls.USER_GEAR_TYPES);
    }

    /**
     * Lists the user's gear collections
     * @returns Collections; the shape of an item is unverified
     */
    async getGearCollections(): Promise<unknown[]> {
        return this.client.get(this.equipmentUrls.GEAR_COLLECTIONS);
    }

    /**
     * Lists the registered devices
     * @returns Devices; the shape of an item is unverified
     */
    async getDevices(): Promise<unknown[]> {
        return this.client.get(this.equipmentUrls.DEVICES);
    }

    /**
     * Retrieves the device that was used last
     * @returns The device, or null when there is none
     */
    async getLastUsedDevice(): Promise<DeviceLastUsed | null> {
        return this.getOptional(this.equipmentUrls.LAST_USED_DEVICE);
    }

    /**
     * Retrieves the information about all of the user's devices
     * @returns Device information; the shape of an item is unverified
     */
    async getAllDeviceInfo(): Promise<unknown[]> {
        return this.client.get(
            this.equipmentUrls.ALL_DEVICE_INFO(await this.getDisplayName())
        );
    }

    /**
     * Retrieves the settings of a device
     * @param deviceId - Id of the device
     * @returns The settings, whose shape is unverified, or null when empty
     */
    async getDeviceSettings(
        deviceId: number | string
    ): Promise<Record<string, unknown> | null> {
        if (!deviceId) {
            throw new Error('Missing deviceId');
        }
        return this.getOptional(this.equipmentUrls.DEVICE_SETTINGS(deviceId));
    }

    /**
     * Retrieves the solar input of a device for one day
     * @param deviceId - Id of a solar capable device
     * @param date - Day to read, defaults to today
     * @returns The solar data, whose shape is unverified, or null when empty
     */
    async getDeviceSolarData(
        deviceId: number | string,
        date = new Date()
    ): Promise<Record<string, unknown> | null> {
        if (!deviceId) {
            throw new Error('Missing deviceId');
        }
        return this.getOptional(
            this.equipmentUrls.SOLAR_DAY(deviceId, toDateString(date))
        );
    }

    /**
     * Retrieves the solar gain of a device over a date range. The longest range
     * Garmin accepts is unknown, so the range is requested as it is.
     * @param deviceId - Id of a solar capable device
     * @param start - First day
     * @param end - Last day
     * @returns The response, whose shape is unverified, or null when empty
     * @throws Error when `start` is after `end`
     */
    async getDeviceSolarRange(
        deviceId: number | string,
        start: Date,
        end: Date
    ): Promise<unknown> {
        if (!deviceId) {
            throw new Error('Missing deviceId');
        }
        if (!start || !end) {
            throw new Error('Missing date range');
        }
        const from = toDateString(start);
        const to = toDateString(end);
        if (from > to) {
            throw new Error(
                'getDeviceSolarRange: start date is after end date'
            );
        }
        return this.getOptional(
            this.equipmentUrls.SOLAR_RANGE(deviceId, from, to)
        );
    }

    /**
     * Deletes a course. Modifies the account.
     * @param courseId - Id of the course
     */
    async deleteCourse(courseId: number | string): Promise<void> {
        if (!courseId) {
            throw new Error('Missing courseId');
        }
        await this.client.delete(this.equipmentUrls.COURSE_BY_ID(courseId));
    }

    /**
     * Lists the favourite courses
     * @returns Courses; the shape of an item is unverified
     */
    async getFavoriteCourses(): Promise<unknown[]> {
        return this.client.get(this.equipmentUrls.COURSE_FAVORITES);
    }

    /**
     * Marks a course as favourite. Modifies the account.
     * @param courseId - Id of the course
     * @returns The response, whose shape is unverified
     */
    async addCourseToFavorites(courseId: number | string): Promise<unknown> {
        if (!courseId) {
            throw new Error('Missing courseId');
        }
        return this.client.post(this.equipmentUrls.COURSE_FAVORITES, {
            courseId
        });
    }

    /**
     * Removes a course from the favourites. Modifies the account.
     * @param courseId - Id of the course
     * @returns The response, whose shape is unverified
     */
    async removeCourseFromFavorites(
        courseId: number | string
    ): Promise<unknown> {
        if (!courseId) {
            throw new Error('Missing courseId');
        }
        return this.client.delete(this.equipmentUrls.COURSE_FAVORITE(courseId));
    }

    /**
     * Builds a course draft from an activity. Nothing is saved.
     * @param activityId - Id of an activity with a GPS track
     * @returns The draft, whose shape is unverified
     */
    async getCourseDraftFromActivity(
        activityId: GCActivityId
    ): Promise<Record<string, unknown>> {
        if (!activityId) {
            throw new Error('Missing activityId');
        }
        return this.client.get(
            this.equipmentUrls.COURSE_FROM_ACTIVITY(activityId)
        );
    }

    /**
     * Exports a course as a FIT file, with elevation
     * @param courseId - Id of the course
     * @returns Content of the FIT file
     */
    async exportCourseAsFit(courseId: number | string): Promise<Buffer> {
        if (!courseId) {
            throw new Error('Missing courseId');
        }
        return this.client.get<Buffer>(
            this.equipmentUrls.COURSE_FIT(courseId),
            { responseType: 'arraybuffer' }
        );
    }

    /**
     * Lists the PacePro pace bands
     * @param courseId - Optional course to restrict the list to
     * @returns Summaries; the shape of an item is unverified
     */
    async getPaceBandSummaries(courseId?: number | string): Promise<unknown[]> {
        return this.client.get(this.equipmentUrls.PACE_BAND_SUMMARIES, {
            params: { courseId }
        });
    }

    /**
     * Retrieves a PacePro pace band
     * @param paceBandId - Id of the pace band
     * @returns The pace band, whose shape is unverified
     */
    async getPaceBand(
        paceBandId: number | string
    ): Promise<Record<string, unknown>> {
        if (!paceBandId) {
            throw new Error('Missing paceBandId');
        }
        return this.client.get(this.equipmentUrls.PACE_BAND(paceBandId));
    }

    /**
     * Deletes a PacePro pace band. Modifies the account.
     * @param paceBandId - Id of the pace band
     */
    async deletePaceBand(paceBandId: number | string): Promise<void> {
        if (!paceBandId) {
            throw new Error('Missing paceBandId');
        }
        await this.client.delete(this.equipmentUrls.PACE_BAND(paceBandId));
    }

    /**
     * Sends a PacePro pace band to a device. Modifies the account.
     * @param paceBandId - Id of the pace band
     * @param deviceId - Id of the device
     * @param payload - Request body, empty by default; what Garmin expects is
     * unverified
     * @returns The response, whose shape is unverified
     */
    async sendPaceBandToDevice(
        paceBandId: number | string,
        deviceId: number | string,
        payload: Record<string, unknown> = {}
    ): Promise<unknown> {
        if (!paceBandId) {
            throw new Error('Missing paceBandId');
        }
        if (!deviceId) {
            throw new Error('Missing deviceId');
        }
        return this.client.post(
            this.equipmentUrls.PACE_BAND_DEVICE(paceBandId, deviceId),
            payload
        );
    }

    /**
     * Lists the power guides. Availability outside the web app is unverified.
     * @param courseId - Optional course to restrict the list to
     * @returns Summaries; the shape of an item is unverified
     */
    async getPowerGuideSummaries(
        courseId?: number | string
    ): Promise<unknown[]> {
        return this.client.get(this.equipmentUrls.POWER_GUIDE_SUMMARIES, {
            params: { courseId }
        });
    }

    /**
     * Retrieves a power guide. Availability outside the web app is unverified.
     * @param powerGuideId - Id of the power guide
     * @returns The power guide, whose shape is unverified
     */
    async getPowerGuide(
        powerGuideId: number | string
    ): Promise<Record<string, unknown>> {
        if (!powerGuideId) {
            throw new Error('Missing powerGuideId');
        }
        return this.client.get(this.equipmentUrls.POWER_GUIDE(powerGuideId));
    }

    /**
     * Deletes a power guide. Modifies the account.
     * @param powerGuideId - Id of the power guide
     */
    async deletePowerGuide(powerGuideId: number | string): Promise<void> {
        if (!powerGuideId) {
            throw new Error('Missing powerGuideId');
        }
        await this.client.delete(this.equipmentUrls.POWER_GUIDE(powerGuideId));
    }

    /**
     * Lists the segment classifications
     * @returns Classifications
     */
    async getSegmentClassifications(): Promise<SegmentClassification[]> {
        return this.client.get(this.equipmentUrls.SEGMENT_CLASSIFICATIONS);
    }

    /**
     * Retrieves a segment
     * @param segmentId - uuid of the segment
     * @returns The segment
     */
    async getSegment(segmentId: string): Promise<SegmentDetails> {
        if (!segmentId) {
            throw new Error('Missing segmentId');
        }
        return this.client.get(this.equipmentUrls.SEGMENT(segmentId));
    }

    /**
     * Retrieves the segments of an activity
     * @param activityId - Id of the activity
     * @returns The response, whose shape is unverified, or null when empty
     */
    async getSegmentsForActivity(activityId: GCActivityId): Promise<unknown> {
        if (!activityId) {
            throw new Error('Missing activityId');
        }
        return this.getOptional(
            this.equipmentUrls.SEGMENTS_OF_ACTIVITY(activityId)
        );
    }

    /**
     * Retrieves the user's own rank on a segment leaderboard
     * @param segmentId - uuid of the segment
     * @returns The response, whose shape is unverified, or null when empty
     */
    async getSegmentLeaderboardRank(segmentId: string): Promise<unknown> {
        if (!segmentId) {
            throw new Error('Missing segmentId');
        }
        return this.getOptional(
            this.equipmentUrls.SEGMENT_LEADERBOARD_RANK(
                segmentId,
                await this.getDisplayName()
            )
        );
    }

    /**
     * Searches segments. Sent as a POST, but it only reads.
     * @param filters - Search filters; their shape is unverified
     * @returns The response, whose shape is unverified
     */
    async searchSegments(filters: SegmentSearchFilters): Promise<unknown> {
        if (!filters) {
            throw new Error('Missing filters');
        }
        return this.client.post(this.equipmentUrls.SEGMENT_SEARCH, filters);
    }

    /**
     * Lists the segment surface types
     * @returns The response, whose shape is unverified
     */
    async getSegmentSurfaceTypes(): Promise<unknown> {
        return this.client.get(this.equipmentUrls.SEGMENT_SURFACE_TYPES);
    }
}
