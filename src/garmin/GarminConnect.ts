import { GolfScorecard, GolfSummary } from './types/golf';
import { DogApi } from './api/DogApi';

export {
    EventCallback,
    GCCredentials,
    Listeners,
    Event,
    Session
} from './api/BaseApi';

export default class GarminConnect extends DogApi {
    /**
     * Retrieves golf summary data
     * @returns Summary of golf activities
     * @throws Error if golf summary data is invalid or empty
     */
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

    /**
     * Retrieves golf scorecard for a specific round
     * @param scorecardId - ID of the scorecard to retrieve
     * @returns Golf scorecard data
     * @throws Error if golf scorecard data is invalid or empty
     */
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
}
