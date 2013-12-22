/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("minibuffer-read.js");

let _viewable_mime_type_list = null;

__defineGetter__("viewable_mime_type_list",
    function () {
        if (_viewable_mime_type_list == null) {
            let list = [];
            var en = category_manager
                .enumerateCategory("Gecko-Content-Viewers");
            while (en.hasMoreElements())
                list.push(en.getNext()
                            .QueryInterface(Ci.nsISupportsCString)
                            .toString());
            _viewable_mime_type_list = list;
        }
        return _viewable_mime_type_list;
    });

var category_manager = Cc["@mozilla.org/categorymanager;1"]
    .getService(Ci.nsICategoryManager);

minibuffer.prototype.read_viewable_mime_type = function () {
    var result = yield this.read(
        forward_keywords(arguments),
        $completer = new prefix_completer(
            $completions = viewable_mime_type_list),
        $require_match,
        $space_completes);
    yield co_return(result);
};

provide("minibuffer-read-mime-type");
