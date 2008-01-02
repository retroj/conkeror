require("buffer.js");

function special_buffer(window, element) {
    keywords(arguments);
    conkeror.buffer.call(this, window, element, forward_keywords(arguments));

    var buffer = this;
    add_hook.call(this, "buffer_loaded_hook", function () {
            buffer.generate();
        });
    this.web_navigation.loadURI("about:blank", Ci.nsIWebNavigation.LOAD_FLAGS_NONE,
                                null /* referrer */, null /* post data */, null /* headers */);
}

special_buffer.prototype.__proto__ = buffer.prototype;

// Sub-classes must define a generate method
