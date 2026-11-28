const { GarminConnect } = require('@flow-js/garmin-connect');

// Has to be run in an async function to be able to use the await keyword
const main = async () => {
    // Create a new Garmin Connect Client
    const GCClient = new GarminConnect({
        username: 'your-email',
        password: 'your-password'
    });

    // Uses credentials from garmin.config.json or uses supplied params
    await GCClient.login();

    // Personal records
    const records = await GCClient.getPersonalRecords();
    const recordTypes = await GCClient.getPersonalRecordTypes();
    console.log(records.length, 'records,', recordTypes.length, 'types');

    // Goals
    const goals = await GCClient.getGoals('active');
    console.log(goals.length, 'active goals');
    console.log(await GCClient.getDailyStepGoal());
    console.log(await GCClient.getEffectiveGoals());

    // Badges
    const badges = await GCClient.getEarnedBadges();
    console.log(badges.map((badge) => badge.badgeName));

    // Challenges
    const challenges = await GCClient.getNonCompletedBadgeChallenges();
    console.log(challenges.map((challenge) => challenge.badgeChallengeName));
    const adHocChallenges = await GCClient.getNonCompletedAdHocChallenges();
    console.log(adHocChallenges.length, 'ad hoc challenges');

    // Multi-day events, null when there are none
    console.log(await GCClient.getMultiDayActivities());
};

// Run the code
main();
