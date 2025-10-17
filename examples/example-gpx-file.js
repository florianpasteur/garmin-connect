const {
    GarminConnect,
    convertGpxImportResponseToGpxSaveRequest
} = require('../dist/index');
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

    console.log(response);

    const courseBody = convertGpxImportResponseToGpxSaveRequest(response);

    const createCourseResponse = await GCClient.createCourse(courseBody);

    await fs.writeFile(
        GPX_FILE_FOLDER + 'response.json',
        JSON.stringify(response, null, 2)
    );
    await fs.writeFile(
        GPX_FILE_FOLDER + 'createCourseResponse.json',
        JSON.stringify(createCourseResponse, null, 2)
    );
})();
