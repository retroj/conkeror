/**
 * (C) Copyright 2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Be sparing about adding service variables to this file.  Only add
 * services for which it makes sense to keep a global reference because
 * they are used in numerous separate places in Conkeror.  In most cases,
 * a simple `let' form around the function or two that use a service is
 * best, because it keeps all the code in one place.
 */

in_module(null);

const file_locator_service = Cc["@mozilla.org/file/directory_service;1"]
    .getService(Ci.nsIProperties);

const nav_bookmarks_service = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
    .getService(Ci.nsINavBookmarksService);

const nav_history_service = Cc["@mozilla.org/browser/nav-history-service;1"]
    .getService(Ci.nsINavHistoryService);

const observer_service = Cc["@mozilla.org/observer-service;1"]
    .getService(Ci.nsIObserverService);

provide("services");
