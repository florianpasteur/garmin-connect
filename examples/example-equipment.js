const { GarminConnect } = require('@flow-js/garmin-connect');

// Reads gear, devices, courses and segments. Nothing is changed.
const main = async () => {
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });
    await GCClient.login();

    // Gear, with how much each item has been used
    const gear = await GCClient.getGearList();
    gear.forEach((item) => {
        const km = (item.distanceUsedMeters / 1000).toFixed(1);
        console.log(`${item.name} (${item.status}): ${km} km`);
    });
    console.log('Gear types:', await GCClient.getGearTypes());
    console.log('Usage types:', await GCClient.getGearUsageTypes());

    // Devices
    console.log('Devices:', await GCClient.getDevices());
    const lastUsed = await GCClient.getLastUsedDevice();
    if (lastUsed) {
        console.log('Last used device:', lastUsed.lastUsedDeviceName);
    }

    // Courses
    console.log('Favourite courses:', await GCClient.getFavoriteCourses());
    const { coursesForUser } = await GCClient.listCourses();
    if (coursesForUser.length) {
        const { courseId } = coursesForUser[0];
        const fit = await GCClient.exportCourseAsFit(courseId);
        console.log('FIT file size:', fit.length);
        console.log(
            'Pace bands:',
            await GCClient.getPaceBandSummaries(courseId)
        );
    }

    // Segments
    console.log(
        'Segment classifications:',
        await GCClient.getSegmentClassifications()
    );
};

// Run the code
main();
