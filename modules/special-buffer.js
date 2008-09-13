/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("buffer.js");

function special_buffer(window, element) {
    this.constructor_begin();
    keywords(arguments);
    conkeror.buffer.call(this, window, element, forward_keywords(arguments));
    this.generated = false;

    var buffer = this;
    add_hook.call(this, "buffer_loaded_hook", function () {
            buffer.generated = true;
            buffer.generate();
        });
    this.web_navigation.loadURI("chrome://conkeror/content/blank.html", Ci.nsIWebNavigation.LOAD_FLAGS_NONE,
                                null /* referrer */, null /* post data */, null /* headers */);
    this.constructor_end();
}

special_buffer.prototype.__proto__ = buffer.prototype;

// Sub-classes must define a generate method
