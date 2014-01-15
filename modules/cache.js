/**
 * (C) Copyright 2008 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

const cache_service = Cc["@mozilla.org/network/cache-service;1"]
                      .getService(Ci.nsICacheService);

const CACHE_MEMORY   = Ci.nsICache.STORE_IN_MEMORY;
const CACHE_DISK     = Ci.nsICache.STORE_ON_DISK;
const CACHE_OFFLINE  = Ci.nsICache.STORE_OFFLINE;
const CACHE_ALL      = Ci.nsICache.STORE_ANYWHERE;

const CACHE_SESSION_HTTP         = "HTTP";
const CACHE_SESSION_HTTP_OFFLINE = "HTTP-offline";
const CACHE_SESSION_FTP          = "FTP";

function cache_error (code) {
    let xpcom_exc = Components.Exception("", code);
    let e = new Error("cache error: " + xpcom_exc.name);
    e.result = code;
    e.__proto__ = cache_error.prototype;
    return e;
}
cache_error.prototype.__proto__ = Error.prototype;

function cache_entry_open(cache_session, uri) {
    if (uri instanceof Ci.nsIURI)
        uri = uri.spec;

    let session = cache_service.createSession(cache_session, 0, true);
    session.doomEntriesIfExpired = false;

    let deferred = Promise.defer();

    let cache_listener = {
        onCacheEntryAvailable: function onCacheEntryAvailable(descriptor, accessGranted, status) {
            if (status != Cr.NS_OK)
                deferred.reject(cache_error(status));
            else
                deferred.resolve(descriptor);
        }
    };

    let cache_key = uri.replace(/#.*$/, "");
    session.asyncOpenCacheEntry(cache_key, Ci.nsICache.ACCESS_READ, cache_listener);
    return make_simple_cancelable(deferred);
}

function cache_entry_clear(cache_session, uri) {
    if (uri instanceof Ci.nsIURI)
        uri = uri.spec;

    let session = cache_service.createSession(cache_session, 0, true);
    session.doomEntriesIfExpired = false;

    let deferred = Promise.defer();

    let cache_listener = {
        onCacheEntryDoomed: function onCacheEntryDoomed(status) {
            switch (status) {
            case Cr.NS_OK:
                deferred.resolve(true);
                break;
            case Cr.NS_ERROR_NOT_AVAILABLE:
                deferred.resolve(false);
                break;
            default:
                deferred.reject(cache_error(status));
            }
        }
    };

    let cache_key = uri.replace(/#.*$/, "");
    session.doomEntry(cache_key, cache_listener);
    return make_simple_cancelable(deferred);
}

function cache_clear (cache_type) {
    cache_service.evictEntries(cache_type);
    if (cache_type == CACHE_DISK)
        cache_service.evictEntries(Ci.nsICache.STORE_ON_DISK_IN_FILE);
}

function cache_disable (cache_type) {
    if (cache_type == CACHE_MEMORY)
        session_pref("browser.cache.memory.enable", false);
    else if (cache_type == CACHE_DISK)
        session_pref("browser.cache.disk.enable", false);
    else if (cache_type == CACHE_OFFLINE)
        session_pref("browser.cache.offline.enable", false);
    else if (cache_type == CACHE_ALL) {
        cache_disable(CACHE_MEMORY);
        cache_disable(CACHE_DISK);
        cache_disable(CACHE_OFFLINE);
    }
    else
        throw new Error("Invalid cache type");
}

function cache_enable (cache_type) {
    if (cache_type == CACHE_MEMORY)
        session_pref("browser.cache.memory.enable", true);
    else if (cache_type == CACHE_DISK)
        session_pref("browser.cache.disk.enable", true);
    else if (cache_type == CACHE_OFFLINE)
        session_pref("browser.cache.offline.enable", true);
    else if (cache_type == CACHE_ALL) {
        cache_enable(CACHE_MEMORY);
        cache_enable(CACHE_DISK);
        cache_enable(CACHE_OFFLINE);
    }
    else
        throw new Error("Invalid cache type");
}

provide("cache");
