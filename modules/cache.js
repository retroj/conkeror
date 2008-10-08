/**
 * (C) Copyright 2008 Nicholas A. Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var CACHE_MEMORY  = Ci.nsICache.STORE_IN_MEMORY;
var CACHE_DISK    = Ci.nsICache.STORE_ON_DISK;
var CACHE_OFFLINE = Ci.nsICache.STORE_OFFLINE;
var CACHE_ALL     = Ci.nsICache.STORE_ANYWHERE;

function cache_clear(cache_type) {
    let cs = Cc["@mozilla.org/network/cache-service;1"]
             .getService(Ci.nsICacheService);
    cs.evictEntries(cache_type);
    if (cache_type == CACHE_DISK)
        cs.evictEntries(Ci.nsICache.STORE_ON_DISK_IN_FILE);
}

function cache_disable(cache_type) {
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

function cache_enable(cache_type) {
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
