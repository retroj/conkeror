/**
 * (C) Copyright 2013 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_hook("http_request_hook");

var http_request_observer = {
    observe: function (subject, topic, data) {
        if (topic != "http-on-modify-request")
            return;
        subject.QueryInterface(Ci.nsIHttpChannel);
        http_request_hook.run(subject);
    }
};

function http_request_hook_enable () {
    observer_service.addObserver(http_request_observer,
                                 "http-on-modify-request",
                                 false);
}

function http_request_hook_disable () {
    observer_service.removeObserver(http_request_observer,
                                    "http-on-modify-request");
}

http_request_hook_enable();

provide("http-request-hook");
