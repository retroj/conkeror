/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Portions of this file are derived from the "Open in Browser" extension,
 * (C) Copyright 2006 Sylvain Pasche.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 **/

/**
 * This module was inspired by the "Open in Browser" extension by Sylvain
 * Pasche, available at <http://www.spasche.net/openinbrowser/>.
 *
 * This module implements (in a somewhat hacky way) overriding of the
 * server-specified mime type for specified URLs. It works by registering an
 * observer for the "http-on-examine-response" and
 * "http-on-examine-merged-response" topics and changes the response MIME type
 * of the nsIHTTPChannel object passed as the subject, as well as clearing any
 * "Content-disposition" header.
 *
 * Unfortunately, due to the design, this hack does not work for FTP.
 *
 **/

in_module(null);

let EXAMINE_TOPIC = "http-on-examine-response";
let EXAMINE_MERGED_TOPIC = "http-on-examine-merged-response";

let table = new string_hashmap();

let timeout = 10000; // 10000 milliseconds = 10 seconds

let table_size = 0;

// uri must be an instance of nsIURI
function can_override_mime_type_for_uri(uri) {
    return uri.schemeIs("http") || uri.schemeIs("https");
}

let clear_override = function(uri_string) {
    table.remove(uri_string);
    table_size--;

    if (table_size == 0) {
        observer_service.removeObserver(observer, EXAMINE_TOPIC);
        observer_service.removeObserver(observer, EXAMINE_MERGED_TOPIC);
    }
}

let observer = {
    observe: function (subject, topic, data) {
        if (topic != EXAMINE_TOPIC && topic != EXAMINE_MERGED_TOPIC)
            return;

        subject.QueryInterface(Ci.nsIHttpChannel);

        var uri_string = subject.originalURI.spec;
        var obj = table.get(uri_string);
        if (!obj)
            return;

        obj.timer.cancel();

        subject.contentType = obj.mime_type;

        // drop content-disposition header
        subject.setResponseHeader("Content-Disposition", "", false);

        clear_override(uri_string);
    }
};



// uri must be an instance of nsIURI and can_override_mime_type_for_uri must
// return true for the passed uri.

// mime_type must be a string
function override_mime_type_for_next_load(uri, mime_type) {
    cache_entry_clear(CACHE_ALL, CACHE_SESSION_HTTP, uri);

    var obj = table.get(uri.spec);
    if (obj)
        obj.timer.cancel();
    else
        table_size++;

    obj = { mime_type: mime_type };

    obj.timer = call_after_timeout(function () {
                                       clear_override(uri.spec);
                                   }, timeout);

    if (table_size == 1) {
        observer_service.addObserver(observer, EXAMINE_TOPIC, false);
        observer_service.addObserver(observer, EXAMINE_MERGED_TOPIC, false);
    }
    table.put(uri.spec, obj);
}

provide("mime-type-override");
