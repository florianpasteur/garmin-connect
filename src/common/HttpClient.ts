import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    RawAxiosRequestHeaders
} from 'axios';
import _ from 'lodash';
import { DateTime } from 'luxon';
import OAuth from 'oauth-1.0a';
import qs from 'qs';
import { UrlClass } from '../garmin/UrlClass';
import {
    IOauth1,
    IOauth1Consumer,
    IOauth1Token,
    IOauth2Token,
    LoginOptions
} from '../garmin/types';
const crypto = require('crypto');

const USER_AGENT_CONNECTMOBILE = 'com.garmin.android.apps.connectmobile';

// Mobile SSO client id — must pair with the Android OAuth consumer key from S3.
const MOBILE_CLIENT_ID = 'GCM_ANDROID_DARK';
// The mobile SSO endpoints run in a WebView and expect browser-like headers.
const SSO_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const SSO_PAGE_HEADERS = {
    'User-Agent': SSO_USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document'
};
// responseStatus.type values returned by the mobile SSO API.
const SSO_SUCCESSFUL = 'SUCCESSFUL';
const SSO_MFA_REQUIRED = 'MFA_REQUIRED';

interface ISSOResponse {
    serviceURL: string | null;
    serviceTicketId: string | null;
    responseStatus: {
        type: string;
        message: string;
        httpStatus: string;
    };
    customerMfaInfo?: {
        email?: string | null;
        phoneNumber?: string | null;
        mfaLastMethodUsed?: string | null;
        defaultMfaMethod?: string | null;
    } | null;
}

const OAUTH_CONSUMER_URL =
    'https://thegarth.s3.amazonaws.com/oauth_consumer.json';
//  refresh token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export class HttpClient {
    client: AxiosInstance;
    url: UrlClass;
    oauth1Token: IOauth1Token | undefined;
    oauth2Token: IOauth2Token | undefined;
    OAUTH_CONSUMER: IOauth1Consumer | undefined;
    // Minimal in-memory cookie jar. Garmin's SSO carries the login session in
    // cookies, and the MFA verify step requires the same session that received
    // the challenge. axios does not persist cookies on its own, so we replay
    // them between requests via the interceptors below.
    private cookies: Record<string, string> = {};

    constructor(url: UrlClass) {
        this.url = url;
        this.client = axios.create();
        this.client.interceptors.response.use(
            (response) => {
                this.storeCookies(response.headers?.['set-cookie']);
                return response;
            },
            (error) => {
                this.storeCookies(error?.response?.headers?.['set-cookie']);
                return Promise.reject(error);
            }
        );
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                // console.log('originalRequest:', originalRequest)
                // Auto Refresh token
                if (
                    error?.response?.status === 401 &&
                    !originalRequest?._retry
                ) {
                    if (!this.oauth2Token) {
                        return;
                    }
                    if (isRefreshing) {
                        try {
                            const token = await new Promise<string>(
                                (resolve) => {
                                    refreshSubscribers.push((token) => {
                                        resolve(token);
                                    });
                                }
                            );
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this.client(originalRequest);
                        } catch (err) {
                            console.log('err:', err);
                            return Promise.reject(err);
                        }
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;
                    console.log('interceptors: refreshOauth2Token start');
                    await this.refreshOauth2Token();
                    console.log('interceptors: refreshOauth2Token end');
                    isRefreshing = false;
                    refreshSubscribers.forEach((subscriber) =>
                        subscriber(this.oauth2Token!.access_token)
                    );
                    refreshSubscribers = [];
                    originalRequest.headers.Authorization = `Bearer ${
                        this.oauth2Token!.access_token
                    }`;
                    return this.client(originalRequest);
                }
                if (axios.isAxiosError(error)) {
                    if (error?.response) this.handleError(error?.response);
                }
                throw error;
            }
        );
        this.client.interceptors.request.use(async (config) => {
            if (this.oauth2Token) {
                config.headers.Authorization =
                    'Bearer ' + this.oauth2Token.access_token;
            }
            const cookieHeader = this.getCookieHeader();
            if (cookieHeader) {
                config.headers.Cookie = cookieHeader;
            }
            return config;
        });
    }

    private storeCookies(setCookie?: string[]): void {
        if (!setCookie) {
            return;
        }
        for (const entry of setCookie) {
            // "NAME=VALUE; Path=/; ..." — keep only the NAME=VALUE pair.
            const [pair] = entry.split(';');
            const idx = pair.indexOf('=');
            if (idx <= 0) {
                continue;
            }
            const name = pair.slice(0, idx).trim();
            const value = pair.slice(idx + 1).trim();
            this.cookies[name] = value;
        }
    }

    private getCookieHeader(): string {
        return Object.entries(this.cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
    }

    async fetchOauthConsumer() {
        const response = await axios.get(OAUTH_CONSUMER_URL);
        this.OAUTH_CONSUMER = {
            key: response.data.consumer_key,
            secret: response.data.consumer_secret
        };
    }

    async checkTokenVaild() {
        if (this.oauth2Token) {
            if (this.oauth2Token.expires_at < DateTime.now().toSeconds()) {
                console.error('Token expired!');
                await this.refreshOauth2Token();
            }
        }
    }

    async get<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response?.data;
    }

    async post<T, R = any>(
        url: string,
        data: R,
        config?: AxiosRequestConfig<any>
    ): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response?.data;
    }

    async put<T, R = any>(
        url: string,
        data: R,
        config?: AxiosRequestConfig<any>
    ): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response?.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
        const response = await this.client.post<T>(url, null, {
            ...config,
            headers: {
                ...config?.headers,
                'X-Http-Method-Override': 'DELETE'
            }
        });
        return response?.data;
    }

    setCommonHeader(headers: RawAxiosRequestHeaders): void {
        _.each(headers, (headerValue, key) => {
            this.client.defaults.headers.common[key] = headerValue;
        });
    }

    handleError(response: AxiosResponse): void {
        this.handleHttpError(response);
    }

    handleHttpError(response: AxiosResponse): void {
        const { status, statusText, data } = response;
        const msg = `ERROR: (${status}), ${statusText}, ${JSON.stringify(
            data
        )}`;
        console.error(msg);
        throw new Error(msg);
    }

    /**
     * Login to Garmin Connect
     * @param username
     * @param password
     * @param options - optional login options, e.g. an `mfaHandler` for 2FA accounts
     * @returns {Promise<HttpClient>}
     */
    async login(
        username: string,
        password: string,
        options?: LoginOptions
    ): Promise<HttpClient> {
        await this.fetchOauthConsumer();
        // Get a service ticket via the mobile SSO API (handles MFA if required).
        const ticket = await this.getLoginTicket(username, password, options);
        // Exchange the ticket for an OAuth1 token...
        const oauth1 = await this.getOauth1Token(ticket);
        // ...then exchange OAuth1 for the OAuth2 token used by the API.
        await this.exchange(oauth1);
        return this;
    }

    /**
     * Obtains a login service ticket via Garmin's mobile SSO JSON API.
     *
     * This mirrors the modern Garmin Connect mobile app flow (and garth):
     * 1. GET the sign-in page to seed SSO session cookies.
     * 2. POST credentials as JSON to `/sso/mobile/api/login`.
     * 3. If the response status is MFA_REQUIRED, prompt for and verify the code.
     *
     * @see https://github.com/matin/garth/blob/main/src/garth/sso.py (login)
     *
     * @returns the `serviceTicketId` used to obtain the OAuth1 token.
     */
    private async getLoginTicket(
        username: string,
        password: string,
        options?: LoginOptions
    ): Promise<string> {
        const loginParams = {
            clientId: MOBILE_CLIENT_ID,
            locale: 'en-US',
            service: this.url.MOBILE_SERVICE_URL
        };

        // Step1: Seed SSO session cookies.
        await this.get<string>(
            `${this.url.MOBILE_SSO_SIGNIN_PAGE}?${qs.stringify({
                clientId: MOBILE_CLIENT_ID
            })}`,
            {
                headers: { ...SSO_PAGE_HEADERS, 'Sec-Fetch-Site': 'none' }
            }
        );

        // Step2: Submit credentials.
        const loginResult = await this.post<ISSOResponse>(
            `${this.url.MOBILE_API_LOGIN}?${qs.stringify(loginParams)}`,
            {
                username,
                password,
                rememberMe: false,
                captchaToken: ''
            },
            { headers: SSO_PAGE_HEADERS }
        );

        const responseType = loginResult?.responseStatus?.type;

        if (responseType === SSO_SUCCESSFUL) {
            if (!loginResult.serviceTicketId) {
                throw new Error('login failed - no service ticket returned');
            }
            return loginResult.serviceTicketId;
        }

        if (responseType === SSO_MFA_REQUIRED) {
            const mfaMethod =
                loginResult.customerMfaInfo?.mfaLastMethodUsed || 'email';
            return this.handleMFA(loginParams, mfaMethod, options);
        }

        const message = loginResult?.responseStatus?.message
            ? `: ${loginResult.responseStatus.message}`
            : '';
        throw new Error(
            `login failed (${responseType || 'unknown response'})${message}, please check username and password`
        );
    }

    /**
     * Completes the MFA challenge: prompts the caller (via `mfaHandler`) for the
     * emailed/app code, posts it to Garmin's mobile verify endpoint, and returns
     * the service ticket from the verification response.
     *
     * The SSO session cookies set during the login POST are replayed on the
     * verify POST by the cookie interceptors, so both share the same session.
     *
     * @see https://github.com/matin/garth/blob/main/src/garth/sso.py (handle_mfa)
     */
    async handleMFA(
        loginParams: Record<string, string>,
        mfaMethod: string,
        options?: LoginOptions
    ): Promise<string> {
        if (!options?.mfaHandler) {
            throw new Error('MFA required but no mfaHandler provided');
        }

        const code = (await options.mfaHandler()).trim();

        const verifyResult = await this.post<ISSOResponse>(
            `${this.url.MOBILE_API_VERIFY_MFA}?${qs.stringify(loginParams)}`,
            {
                mfaMethod,
                mfaVerificationCode: code,
                rememberMyBrowser: false,
                reconsentList: [],
                mfaSetup: false
            },
            { headers: SSO_PAGE_HEADERS }
        );

        if (verifyResult?.responseStatus?.type !== SSO_SUCCESSFUL) {
            const message = verifyResult?.responseStatus?.message
                ? `: ${verifyResult.responseStatus.message}`
                : '';
            throw new Error(`login failed after MFA${message}`);
        }
        if (!verifyResult.serviceTicketId) {
            throw new Error('login failed after MFA - no service ticket returned');
        }
        return verifyResult.serviceTicketId;
    }

    async refreshOauth2Token() {
        if (!this.OAUTH_CONSUMER) {
            await this.fetchOauthConsumer();
        }
        if (!this.oauth2Token || !this.oauth1Token) {
            throw new Error('No Oauth2Token or Oauth1Token');
        }
        const oauth1 = {
            oauth: this.getOauthClient(this.OAUTH_CONSUMER!),
            token: this.oauth1Token
        };
        await this.exchange(oauth1);
        console.log('Oauth2 token refreshed!');
    }

    async getOauth1Token(ticket: string): Promise<IOauth1> {
        if (!this.OAUTH_CONSUMER) {
            throw new Error('No OAUTH_CONSUMER');
        }
        const params = {
            ticket,
            'login-url': this.url.MOBILE_SERVICE_URL,
            'accepts-mfa-tokens': true
        };
        const url = `${this.url.OAUTH_URL}/preauthorized?${qs.stringify(
            params
        )}`;

        const oauth = this.getOauthClient(this.OAUTH_CONSUMER);

        const step4RequestData = {
            url: url,
            method: 'GET'
        };
        const headers = oauth.toHeader(oauth.authorize(step4RequestData));
        // console.log('getOauth1Token - headers:', headers);

        const response = await this.get<string>(url, {
            headers: {
                ...headers,
                'User-Agent': USER_AGENT_CONNECTMOBILE
            }
        });
        // console.log('getOauth1Token - response:', response);
        const token = qs.parse(response) as unknown as IOauth1Token;
        // console.log('getOauth1Token - token:', token);
        this.oauth1Token = token;
        return { token, oauth };
    }

    getOauthClient(consumer: IOauth1Consumer): OAuth {
        const oauth = new OAuth({
            consumer: consumer,
            signature_method: 'HMAC-SHA1',
            hash_function(base_string: string, key: string) {
                return crypto
                    .createHmac('sha1', key)
                    .update(base_string)
                    .digest('base64');
            }
        });
        return oauth;
    }
    //
    async exchange(oauth1: IOauth1) {
        const token = {
            key: oauth1.token.oauth_token,
            secret: oauth1.token.oauth_token_secret
        };
        // console.log('exchange - token:', token);

        const baseUrl = `${this.url.OAUTH_URL}/exchange/user/2.0`;
        const requestData = {
            url: baseUrl,
            method: 'POST',
            data: null
        };

        const step5AuthData = oauth1.oauth.authorize(requestData, token);
        // console.log('login - step5AuthData:', step5AuthData);
        const url = `${baseUrl}?${qs.stringify(step5AuthData)}`;
        // console.log('exchange - url:', url);
        this.oauth2Token = undefined;
        const response = await this.post<IOauth2Token>(url, null, {
            headers: {
                'User-Agent': USER_AGENT_CONNECTMOBILE,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        // console.log('exchange - response:', response);
        this.oauth2Token = this.setOauth2TokenExpiresAt(response);
        // console.log('exchange - oauth2Token:', this.oauth2Token);
    }

    setOauth2TokenExpiresAt(token: IOauth2Token): IOauth2Token {
        // human readable date
        token['last_update_date'] = DateTime.now().toLocal().toString();
        token['expires_date'] = DateTime.fromSeconds(
            DateTime.now().toSeconds() + token['expires_in']
        )
            .toLocal()
            .toString();
        // timestamp for check expired
        token['expires_at'] = DateTime.now().toSeconds() + token['expires_in'];
        token['refresh_token_expires_at'] =
            DateTime.now().toSeconds() + token['refresh_token_expires_in'];
        return token;
    }
}
