/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("minibuffer-read.js");

define_keywords("$options");
minibuffer.prototype.read_explicit_option = function () {
    keywords(arguments);
    var options = arguments.$options;
    var options_string = or_string(options);
    var result = yield this.read(forward_keywords(arguments),
        $prompt = arguments.$prompt + " (" + options_string + ")",
        $validator = function (x, m) {
            if (options.indexOf(x) == -1) {
                m.message("Please answer " + options_string + ".");
                m._input_text = "";
                m._set_selection();
                return false;
            }
            return true;
        });
    yield co_return(result);
};

minibuffer.prototype.read_yes_or_no = function () {
    keywords(arguments);
    var result = yield this.read_explicit_option(forward_keywords(arguments), $options = ["yes", "no"]);
    yield co_return(result == "yes");
};

function single_character_options_minibuffer_state (minibuffer, continuation) {
    keywords(arguments);
    minibuffer_input_state.call(this, minibuffer, single_character_options_minibuffer_keymap, arguments.$prompt);
    this.continuation = continuation;
    this.options = arguments.$options;
}
single_character_options_minibuffer_state.prototype = {
    constructor: single_character_options_minibuffer_state,
    __proto__: minibuffer_input_state.prototype,
    destroy: function () {
        if (this.continuation)
            this.continuation.throw(abort());
        minibuffer_input_state.prototype.destroy.call(this);
    }
};
function single_character_options_enter_character (window, s, event) {
    var ch = String.fromCharCode(event.charCode);
    if (s.options.indexOf(ch) != -1) {
        var c = s.continuation;
        delete s.continuation;
        window.minibuffer.pop_state();
        if (c)
            c(ch);
        return;
    }
    var str = "Please answer " + or_string(s.options) + ".";
    window.minibuffer.message(str);
}

interactive("single-character-options-enter-character", null,
            function (I) {
                single_character_options_enter_character(
                    I.window,
                    I.minibuffer.check_state(single_character_options_minibuffer_state),
                    I.event);
            });

minibuffer.prototype.read_single_character_option = function () {
    keywords(arguments);
    var s = new single_character_options_minibuffer_state(this, (yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};

provide("minibuffer-read-options");
