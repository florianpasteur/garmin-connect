import { UrlClass } from '../UrlClass';
import { GCDogId } from '../types/dog';

/**
 * URLs of the dog endpoints. Profiles live on the `GCX_API` host, the rest on
 * `GC_API`. Read both inside each getter or method, never in a field
 * initialiser: tests point them at a local server.
 */
export class DogUrls {
    constructor(protected readonly url: UrlClass) {}

    private get PROFILE_SERVICE() {
        return `${this.url.GCX_API}/family-api/profile-service/profile`;
    }

    get DOGS() {
        return `${this.PROFILE_SERVICE}/pets`;
    }

    DOG(dogId: GCDogId) {
        return `${this.DOGS}/${encodeURIComponent(dogId)}`;
    }

    DOG_STATUS(dogId: GCDogId) {
        return `${this.DOG(dogId)}/status`;
    }

    get DOG_BREEDS() {
        return `${this.DOGS}/dog/breeds`;
    }

    /** Singular `pet`, unlike the other profile paths */
    DOG_PHOTO(dogId: GCDogId) {
        return `${this.PROFILE_SERVICE}/pet/${encodeURIComponent(dogId)}/photo`;
    }

    SOCIAL_DOGS(dogIds: GCDogId[]) {
        const query = dogIds.map((id) => `id=${encodeURIComponent(id)}`);
        return `${this.PROFILE_SERVICE}/social/pets?${query.join('&')}`;
    }

    get ANIMALS() {
        return `${this.url.GC_API}/animal-service/animal`;
    }

    ANIMAL(dogId: GCDogId) {
        return `${this.ANIMALS}/${encodeURIComponent(dogId)}`;
    }

    get ANIMAL_SEARCH() {
        return `${this.ANIMALS}/search`;
    }

    private get DOG_STATS() {
        return `${this.url.GC_API}/fitnessstats-service/activity-animal/dog/stats`;
    }

    /** The metrics are repeated query parameters */
    DOG_STATS_LIFETIME(metrics: string[]) {
        const query = metrics.map((m) => `metric=${encodeURIComponent(m)}`);
        return `${this.DOG_STATS}/lifetime?${query.join('&')}`;
    }

    get DOG_STATS_BULK() {
        return `${this.DOG_STATS}/bulk`;
    }

    get DOG_ACTIVITIES_SETTING() {
        return `${this.url.GC_API}/userprofile-service/userprofile/optional-feature/dog-activities`;
    }
}
