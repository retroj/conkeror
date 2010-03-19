/**
 * (C) Copyright 2008 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

const cache_service = Cc["@mozilla.org/network/cache-service;1"]
                      .getService(Ci.nsICacheService);

const CACHE_MEMORY   = Ci.nsICache.STORE_IN_MEMORY;
const CACHE_DISK     = Ci.nsICache.STORE_ON_DISK;
const CACHE_OFFLINE  = Ci.nsICache.STORE_OFFLINE;
const CACHE_ALL      = Ci.nsICache.STORE_ANYWHERE;

const CACHE_SESSION_HTTP         = "HTTP";
const CACHE_SESSION_HTTP_OFFLINE = "HTTP-offline";
const CACHE_SESSION_FTP          = "FTP";

// Returns null if uri is not cached.
function cache_entry_open (cache_type, cache_session, uri) {
    if (uri instanceof Ci.nsIURI)
        uri = uri.spec;
    let session = cache_service.createSession(cache_session, 0, true);
    session.doomEntriesIfExpired = false;
    // Remove the ref component of the URL
    let cache_key = uri.replace(/#.*$/, "");
    try {
        return session.openCacheEntry(cache_key,
                                      Ci.nsICache.ACCESS_READ,
                                      false);
    }
    catch (ex) {
        if (ex.name == "NS_ERROR_CACHE_KEY_NOT_FOUND" ||
            ex.name == "NS_ERROR_CACHE_WAIT_FOR_VALIDATION")
            return null;
        throw ex;
    }
}

// Returns false if uri is not cached, else true.
function cache_entry_clear (cache_type, cache_session, uri) {
    let entry = cache_entry_open(cache_type, cache_session, uri);
    if (entry == null)
        return false;
    entry.doom();
    entry.close();
    return true;
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
