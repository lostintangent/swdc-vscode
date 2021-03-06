import axios from "axios";

import { api_endpoint } from "./Constants";
import { showErrorStatus, getItem, logIt } from "./Util";

// build the axios api base url
const beApi = axios.create({
    baseURL: `${api_endpoint}`
});

const spotifyApi = axios.create({});

export async function spotifyApiGet(api, accessToken) {
    if (api.indexOf("https://api.spotify.com") === -1) {
        api = "https://api.spotify.com" + api;
    }
    spotifyApi.defaults.headers.common[
        "Authorization"
    ] = `Bearer ${accessToken}`;
    return await spotifyApi
        .get(api)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            // when a token expires, we'll get the following error data
            // err.response.status === 401
            // err.response.statusText = "Unauthorized"
            logIt(`error fetching data for ${api}, message: ${err.message}`);
            return err;
        });
}

export async function spotifyApiPut(api, payload, accessToken) {
    if (api.indexOf("https://api.spotify.com") === -1) {
        api = "https://api.spotify.com" + api;
    }
    spotifyApi.defaults.headers.common[
        "Authorization"
    ] = `Bearer ${accessToken}`;
    return await spotifyApi
        .put(api, payload)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(`error posting data for ${api}, message: ${err.message}`);
            return err;
        });
}

export async function spotifyApiPost(api, payload, accessToken) {
    if (api.indexOf("https://api.spotify.com") === -1) {
        api = "https://api.spotify.com" + api;
    }
    spotifyApi.defaults.headers.common[
        "Authorization"
    ] = `Bearer ${accessToken}`;
    return await spotifyApi
        .post(api, payload)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(`error posting data for ${api}, message: ${err.message}`);
            return err;
        });
}

/**
 * Response returns a paylod with the following...
 * data: <payload>, status: 200, statusText: "OK", config: Object
 * @param api
 * @param jwt
 */
export async function softwareGet(api, jwt) {
    if (jwt) {
        beApi.defaults.headers.common["Authorization"] = jwt;
    }
    return await beApi
        .get(api)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(`error fetching data for ${api}, message: ${err.message}`);
            return err;
        });
}

/**
 * perform a put request
 */
export async function softwarePut(api, payload, jwt) {
    // PUT the kpm to the PluginManager
    beApi.defaults.headers.common["Authorization"] = jwt;
    return beApi
        .put(api, payload)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(`error posting data for ${api}, message: ${err.message}`);
            return err;
        });
}

/**
 * perform a post request
 */
export async function softwarePost(api, payload, jwt) {
    // POST the kpm to the PluginManager
    beApi.defaults.headers.common["Authorization"] = jwt;
    return beApi
        .post(api, payload)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(`error posting data for ${api}, message: ${err.message}`);
            return err;
        });
}

/**
 * perform a delete request
 */
export async function softwareDelete(api, jwt) {
    beApi.defaults.headers.common["Authorization"] = jwt;
    return beApi
        .delete(api)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            logIt(
                `error with delete request for ${api}, message: ${err.message}`
            );
            return err;
        });
}

/**
 * Check if the spotify response has an expired token
 * {"error": {"status": 401, "message": "The access token expired"}}
 */
export function hasTokenExpired(resp) {
    // when a token expires, we'll get the following error data
    // err.response.status === 401
    // err.response.statusText = "Unauthorized"
    if (
        resp &&
        resp.response &&
        resp.response.status &&
        resp.response.status === 401
    ) {
        return true;
    }
    return false;
}

/**
 * check if the reponse is ok or not
 * axios always sends the following
 * status:200
 * statusText:"OK"
 * 
    code:"ENOTFOUND"
    config:Object {adapter: , transformRequest: Object, transformResponse: Object, …}
    errno:"ENOTFOUND"
    host:"api.spotify.com"
    hostname:"api.spotify.com"
    message:"getaddrinfo ENOTFOUND api.spotify.com api.spotify.com:443"
    port:443
 */
export function isResponseOk(resp) {
    let status = getResponseStatus(resp);
    if (status && resp && status < 300) {
        return true;
    }
    return false;
}

/**
 * check if the user has been deactived
 */
export async function isUserDeactivated(resp) {
    if (resp && !isResponseOk(resp)) {
        if (isUnauthenticatedAndDeactivated(resp)) {
            showErrorStatus(
                "To see your coding data in Code Time, please reactivate your account."
            );
            return true;
        }
    }
    resp = await softwareGet("/users/ping", getItem("jwt"));
    if (isUnauthenticatedAndDeactivated(resp)) {
        showErrorStatus(
            "To see your coding data in Code Time, please reactivate your account."
        );
        return true;
    }
    return false;
}

/**
 * get the response http status code
 * axios always sends the following
 * status:200
 * statusText:"OK"
 */
function getResponseStatus(resp) {
    let status = null;
    if (resp && resp.status) {
        status = resp.status;
    } else if (resp && resp.response && resp.response.status) {
        status = resp.response.status;
    }
    return status;
}

/**
 * get the request's response data
 */
function getResponseData(resp) {
    let data = null;
    if (resp && resp.data) {
        data = resp.data;
    } else if (resp && resp.response && resp.response.data) {
        data = resp.response.data;
    }
    return data;
}

/**
 * check if the response has the deactivated code
 */
function isUnauthenticatedAndDeactivated(resp) {
    let status = getResponseStatus(resp);
    let data = getResponseData(resp);
    if (status && status >= 400 && data) {
        // check if we have the data object
        let code = data.code || "";
        if (code === "DEACTIVATED") {
            showErrorStatus(
                "To see your coding data in Code Time, please reactivate your account."
            );
            return true;
        }
    }
    return false;
}
