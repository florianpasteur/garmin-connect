import { AxiosRequestConfig } from 'axios';
import appRoot from 'app-root-path';
import * as fs from 'fs';
import * as path from 'path';
import { HttpClient } from '../../common/HttpClient';
import { checkIsDirectory, createDirectory, writeToFile } from '../../utils';
import { UrlClass } from '../UrlClass';
import {
    GarminDomain,
    GCUserProfileId,
    GCUserHash,
    IGarminTokens,
    IOauth1Token,
    IOauth2Token,
    ISocialProfile,
    LoginOptions,
    IUserSettings
} from '../types';
import { splitDateRange } from '../common/DateUtils';

let config: GCCredentials | undefined = undefined;

try {
    config = appRoot.require('/garmin.config.json');
} catch (e) {
    // Do nothing
}

export type EventCallback<T> = (data: T) => void;

export interface GCCredentials {
    username: string;
    password: string;
}
export interface Listeners {
    [event: string]: EventCallback<any>[];
}

export enum Event {
    sessionChange = 'sessionChange'
}

export interface Session {}

export class BaseApi {
    client: HttpClient;
    private _userHash: GCUserHash | undefined;
    private credentials: GCCredentials;
    private listeners: Listeners;
    private profile: Promise<ISocialProfile> | undefined;
    protected url: UrlClass;

    constructor(
        credentials: GCCredentials | undefined = config,
        domain: GarminDomain = 'garmin.com'
    ) {
        if (!credentials) {
            throw new Error('Missing credentials');
        }
        this.credentials = credentials;
        this.url = new UrlClass(domain);
        this.client = new HttpClient(this.url);
        this._userHash = undefined;
        this.listeners = {};
    }

    /**
     * Login to Garmin Connect with provided credentials or those set during construction
     * @param username - Optional username to override the one in credentials
     * @param password - Optional password to override the one in credentials
     * @param options - Optional login options, e.g. an `mfaHandler` for 2FA accounts
     * @returns The GarminConnect instance for chaining
     */
    async login(
        username?: string,
        password?: string,
        options?: LoginOptions
    ): Promise<this> {
        if (username && password) {
            this.credentials.username = username;
            this.credentials.password = password;
        }
        this.resetProfileCache();
        await this.client.login(
            this.credentials.username,
            this.credentials.password,
            options
        );
        return this;
    }

    /**
     * Exports OAuth tokens to files in the specified directory
     * @param dirPath - Directory path where token files will be saved
     */
    exportTokenToFile(dirPath: string): void {
        if (!checkIsDirectory(dirPath)) {
            createDirectory(dirPath);
        }
        // save oauth1 to json
        if (this.client.oauth1Token) {
            writeToFile(
                path.join(dirPath, 'oauth1_token.json'),
                JSON.stringify(this.client.oauth1Token)
            );
        }
        if (this.client.oauth2Token) {
            writeToFile(
                path.join(dirPath, 'oauth2_token.json'),
                JSON.stringify(this.client.oauth2Token)
            );
        }
    }

    /**
     * Loads OAuth tokens from files in the specified directory
     * @param dirPath - Directory path where token files are stored
     * @throws Error if directory not found
     */
    loadTokenByFile(dirPath: string): void {
        if (!checkIsDirectory(dirPath)) {
            throw new Error('loadTokenByFile: Directory not found: ' + dirPath);
        }
        this.resetProfileCache();
        let oauth1Data = fs.readFileSync(
            path.join(dirPath, 'oauth1_token.json')
        ) as unknown as string;
        const oauth1 = JSON.parse(oauth1Data);
        this.client.oauth1Token = oauth1;

        let oauth2Data = fs.readFileSync(
            path.join(dirPath, 'oauth2_token.json')
        ) as unknown as string;
        const oauth2 = JSON.parse(oauth2Data);
        this.client.oauth2Token = oauth2;
    }

    /**
     * Exports OAuth tokens as an object
     * @returns Object containing OAuth1 and OAuth2 tokens
     * @throws Error if tokens are not found
     */
    exportToken(): IGarminTokens {
        if (!this.client.oauth1Token || !this.client.oauth2Token) {
            throw new Error('exportToken: Token not found');
        }
        return {
            oauth1: this.client.oauth1Token,
            oauth2: this.client.oauth2Token
        };
    }

    /**
     * Loads OAuth tokens from provided token objects (e.g., from DB or localStorage)
     * @param oauth1 - OAuth1 token object
     * @param oauth2 - OAuth2 token object
     */
    loadToken(oauth1: IOauth1Token, oauth2: IOauth2Token): void {
        this.resetProfileCache();
        this.client.oauth1Token = oauth1;
        this.client.oauth2Token = oauth2;
    }

    /**
     * Retrieves the user's settings from Garmin Connect
     * @returns User settings data
     */
    async getUserSettings(): Promise<IUserSettings> {
        return this.client.get<IUserSettings>(this.url.USER_SETTINGS);
    }

    /**
     * Retrieves the user's social profile from Garmin Connect
     * @returns User's social profile data
     */
    async getUserProfile(): Promise<ISocialProfile> {
        return this.client.get<ISocialProfile>(this.url.USER_PROFILE);
    }

    /**
     * Performs a GET request to the specified URL
     * @param url - URL to send the request to
     * @param data - Optional query parameters or request configuration
     * @returns Response data of type T
     */
    async get<T>(url: string, data?: any) {
        const response = await this.client.get(url, data);
        return response as T;
    }

    /**
     * Performs a POST request to the specified URL
     * @param url - URL to send the request to
     * @param data - Data to send in the request body
     * @returns Response data of type T
     */
    async post<T>(url: string, data: any) {
        const response = await this.client.post<T>(url, data, {});
        return response as T;
    }

    /**
     * Performs a PUT request to the specified URL
     * @param url - URL to send the request to
     * @param data - Data to send in the request body
     * @returns Response data of type T
     */
    async put<T>(url: string, data: any) {
        const response = await this.client.put<T>(url, data, {});
        return response as T;
    }

    /**
     * Performs a DELETE request to the specified URL
     * @param url - URL to send the request to
     * @param config - Optional request configuration
     * @returns Response data of type T
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.delete<T>(url, config);
    }

    /**
     * Performs a PATCH request to the specified URL
     * @param url - URL to send the request to
     * @param data - Data to send in the request body
     * @returns Response data of type T
     */
    async patch<T>(url: string, data: any): Promise<T> {
        return this.client.patch<T>(url, data);
    }

    /**
     * Runs a read query against the GraphQL gateway
     * @param query - GraphQL document, e.g. `query{weightScalar(...)}`
     * @returns The `data` member of the response
     * @throws Error when the response lists errors
     */
    async graphql<T = any>(query: string): Promise<T> {
        const response = await this.client.post<{
            data: T;
            errors?: Array<{ message: string }>;
        }>(`${this.url.GC_API}/graphql-gateway/graphql`, { query });
        if (response?.errors?.length) {
            throw new Error(
                'graphql: ' + response.errors.map((e) => e.message).join('; ')
            );
        }
        return response?.data;
    }

    /** `displayName` of the signed in user, fetched once per session */
    protected async getDisplayName(): Promise<GCUserHash> {
        return (await this.getCachedProfile()).displayName;
    }

    /** `profileId` of the signed in user, fetched once per session */
    protected async getProfileId(): Promise<GCUserProfileId> {
        return (await this.getCachedProfile()).profileId;
    }

    /**
     * GET for endpoints that answer `204 No Content` when there is no data
     * @returns The response data, or null when the body is empty
     */
    protected async getOptional<T>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<T | null> {
        const data = await this.client.get<T | ''>(url, config);
        return data === '' || data === undefined ? null : data;
    }

    /**
     * Requests a long date range as consecutive chunks, one after the other
     * @param maxDays - Longest range the endpoint accepts, both ends included
     * @param request - Called with each chunk as YYYY-MM-DD strings
     * @returns The non empty responses, oldest first
     */
    protected async requestByDateRange<T>(
        start: Date,
        end: Date,
        maxDays: number,
        request: (start: string, end: string) => Promise<T | null>
    ): Promise<T[]> {
        const results: T[] = [];
        for (const range of splitDateRange(start, end, maxDays)) {
            const result = await request(range.start, range.end);
            if (result !== null) {
                results.push(result);
            }
        }
        return results;
    }

    private resetProfileCache(): void {
        this.profile = undefined;
    }

    private getCachedProfile(): Promise<ISocialProfile> {
        if (!this.profile) {
            this.profile = this.getUserProfile().catch((error) => {
                this.profile = undefined;
                throw error;
            });
        }
        return this.profile;
    }
}
