/**
 * (C) Copyright 2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var redirects = {};

function define_client_redirect (name) {
    var transforms = Array.prototype.slice.call(arguments, 1);
    function transform (location) {
        for (var i = 0, n = transforms.length; i < n; ++i) {
            if (transforms[i] instanceof RegExp) {
                if (location instanceof Ci.nsIURI)
                    var lstr = location.spec;
                else
                    lstr = location;
                location = transforms[i].exec(lstr);
            } else
                location = transforms[i](location);
            if (location == null)
                return null;
        }
        return location;
    }
    redirects[name] = transform;
}

function do_client_redirect (buffer, request, location) {
    try {
        location = location.QueryInterface(Ci.nsIURL);
        for (let [name, handler] in Iterator(redirects)) {
            var redirect = handler(location);
            if (redirect) {
                var history = buffer.web_navigation.sessionHistory;
                var entry = history.getEntryAtIndex(history.index, false);
                if (history.index > 0) {
                    if (entry.URI.spec == location.spec)
                        history.getEntryAtIndex(history.index - 1, true);
                } else if (entry.URI.spec == location.spec)
                    history.PurgeHistory(1);
                buffer.load(redirect);
                return;
            }
        }
    } catch (e) {}
}

add_hook('content_buffer_location_change_hook', do_client_redirect);

conkeror.define_client_redirect = define_client_redirect;

provide("client-redirect");
