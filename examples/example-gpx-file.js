const { GarminConnect } = require('../dist/index');
const fs = require('fs/promises');
const path = require('path');

const GPX_FILE_NAME = 'paris-marathon.gpx';
const GPX_FILE_FOLDER = './assets/';

(async function () {
    const GARMIN_USERNAME = process.env.GARMIN_USERNAME;
    const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

    if (!GARMIN_USERNAME || !GARMIN_PASSWORD) {
        throw new Error(
            'GARMIN_USERNAME and GARMIN_PASSWORD must be set in the environment variables'
        );
    }

    const GCClient = new GarminConnect({
        username: GARMIN_USERNAME,
        password: GARMIN_PASSWORD
    });
    await GCClient.login();

    const fileContent = (
        await fs.readFile(path.join(GPX_FILE_FOLDER, GPX_FILE_NAME), 'utf8')
    ).toString();

    const response = await GCClient.importGpx(GPX_FILE_NAME, fileContent);

    const createCourseResponse = await GCClient.createCourse(
        1,
        response.courseName,
        response.geoPoints,
        response.coursePoints
    );

    console.log(
        'Course created with id:',
        createCourseResponse.courseId,
        `https://connect.garmin.com/modern/course/${createCourseResponse.courseId}`
    );
})();
