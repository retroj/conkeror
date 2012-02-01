/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("buffer.js");

define_buffer_local_hook("special_buffer_generated_hook");
define_current_buffer_hook("current_special_buffer_generated_hook", "special_buffer_generated_hook");


function special_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    conkeror.buffer.call(this, window, forward_keywords(arguments));
    this.generated = false;

    var buffer = this;
    add_hook.call(this, "buffer_loaded_hook", function () {
            buffer.generated = true;
            buffer.generate();
            call_after_timeout(function () {
                    special_buffer_generated_hook.run(buffer);
                }, 0);
        });
    this.web_navigation.loadURI("chrome://conkeror-gui/content/blank.html", Ci.nsIWebNavigation.LOAD_FLAGS_NONE,
                                null /* referrer */, null /* post data */, null /* headers */);
    this.constructor_end();
}
special_buffer.prototype = {
    constructor: special_buffer,
    __proto__: buffer.prototype,
    toString: function () "#<special_buffer>",
    generate: function () {
        throw Error("subclasses of special_buffer must define 'generate'");
    }
};

provide("special-buffer");
