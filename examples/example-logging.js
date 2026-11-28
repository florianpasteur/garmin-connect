const { GarminConnect } = require('@flow-js/garmin-connect');

// Reads only: blood pressure, nutrition and glucose
const main = async () => {
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });
    await GCClient.login();

    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Blood pressure
    const bloodPressure = await GCClient.getBloodPressureRange(monthAgo, today);
    console.log(bloodPressure?.measurementSummaries);
    console.log(await GCClient.getBloodPressureDay(today));

    // Nutrition
    console.log(await GCClient.getNutritionStatus());
    console.log(await GCClient.getNutritionDailyLog(today));
    console.log(await GCClient.getNutritionMeals(today));
    console.log(await GCClient.searchFoods('apple', { limit: 5 }));
    console.log(await GCClient.getCustomFoods());

    // Glucose
    console.log(await GCClient.getGlucoseDay(today));
};

// Run the code
main();
