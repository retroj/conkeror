/**
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable("default_minibuffer_auto_complete_delay", 150,
    "Delay (in milliseconds) after the most recent key-stroke "+
    "before auto-completing.");

define_variable("minibuffer_auto_complete_preferences", {});

define_variable("minibuffer_auto_complete_default", false,
    "Boolean specifying whether to auto-complete by default. "+
    "The user variable `minibuffer_auto_complete_preferences' "+
    "overrides this.");

var minibuffer_history_data = {};

/* FIXME: These should possibly be saved to disk somewhere */
define_variable("minibuffer_history_max_items", 100,
    "Maximum number of minibuffer history entries stored. Older "+
    "history entries are truncated after this limit is reached.");


/* The parameter `args' specifies the arguments.  In addition, the
 * arguments for basic_minibuffer_state are also allowed.
 *
 * history:           [optional] specifies a string to identify the history list to use
 *
 * completer
 *
 * match_required
 *
 * default_completion  only used if match_required is set to true
 *
 * $valiator          [optional]
 *          specifies a function
 */
define_keywords("$keymap", "$history", "$validator",
                "$completer", "$match_required", "$default_completion",
                "$auto_complete", "$auto_complete_initial", "$auto_complete_conservative",
                "$auto_complete_delay",
                "$space_completes");
/* FIXME: support completing in another thread */
function text_entry_minibuffer_state (minibuffer, continuation) {
    keywords(arguments, $keymap = minibuffer_keymap);

    basic_minibuffer_state.call(this, minibuffer, forward_keywords(arguments));

    this.continuation = continuation;
    if (arguments.$history) {
        this.history = minibuffer_history_data[arguments.$history] =
            minibuffer_history_data[arguments.$history] || [];
        this.history_index = -1;
        this.saved_last_history_entry = null;
    }

    this.validator = arguments.$validator;

    if (arguments.$completer != null) {
        this.completer = arguments.$completer;
        let auto = arguments.$auto_complete;
        while (typeof(auto) == "string")
            auto = minibuffer_auto_complete_preferences[auto];
        if (auto == null)
            auto = minibuffer_auto_complete_default;
        this.auto_complete = auto;
        this.auto_complete_initial = !!arguments.$auto_complete_initial;
        this.auto_complete_conservative = !!arguments.$auto_complete_conservative;
        let delay = arguments.$auto_complete_delay;
        if (delay == null)
            delay = default_minibuffer_auto_complete_delay;
        this.auto_complete_delay = delay;
        this.completions = null;
        this.completions_valid = false;
        this.space_completes = !!arguments.$space_completes;
        if (this.space_completes)
            this.keymaps.push(minibuffer_space_completion_keymap);
        this.completions_timer_ID = null;
        this.completions_display_element = null;
        this.selected_completion_index = -1;
        this.match_required  = !!arguments.$match_required;
        this.match_required_default = this.match_required;
        if (this.match_required)
            this.default_completion = arguments.$default_completion;
    }
}

function completions_tree_view (minibuffer_state) {
    this.minibuffer_state = minibuffer_state;
}

var atom_service = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);

completions_tree_view.prototype = {
    constructor: completions_tree_view,
    get rowCount () {
        var c = this.minibuffer_state.completions;
        if (!c)
            return 0;
        return c.count;
    },
    getCellText: function (row,column) {
        var c = this.minibuffer_state.completions;
        if (row >= c.count)
            return null;
        if (column.index == 0)
            return c.get_string(row);
        if (c.get_description)
            return c.get_description(row);
        return "";
    },
    setTree: function (treebox) { this.treebox = treebox; },
    isContainer: function (row) { return false; },
    isSeparator: function (row) { return false; },
    isSorted: function () { return false; },
    getLevel: function (row) { return 0; },
    getImageSrc: function (row, col) { return null; },
    getRowProperties: function (row, props) {},
    getCellProperties: function (row, col, props) {
        if (col.index == 0)
            props.AppendElement(atom_service.getAtom("completion-string"));
        else
            props.AppendElement(atom_service.getAtom("completion-description"));
    },
    getColumnProperties: function (colid, col, props) {}
};

// inherit from basic_minibuffer_state
text_entry_minibuffer_state.prototype = {
    constructor: text_entry_minibuffer_state,
    __proto__: basic_minibuffer_state.prototype,
    load: function () {
        basic_minibuffer_state.prototype.load.call(this);
        var window = this.minibuffer.window;
        if (this.completer) {
            // Create completion display element if needed
            if (!this.completion_element) {
                /* FIXME: maybe use the dom_generator */
                var tree = create_XUL(window, "tree");
                var s = this;
                tree.addEventListener("select", function () {
                        s.selected_completion_index = s.completions_display_element.currentIndex;
                        s.handle_completion_selected();
                    }, true);
                tree.setAttribute("class", "completions");

                tree.setAttribute("rows", "8");

                tree.setAttribute("collapsed", "true");

                tree.setAttribute("hidecolumnpicker", "true");
                tree.setAttribute("hideheader", "true");

                var treecols = create_XUL(window, "treecols");
                tree.appendChild(treecols);
                var treecol = create_XUL(window, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                treecol = create_XUL(window, "treecol");
                treecol.setAttribute("flex", "1");
                treecols.appendChild(treecol);
                tree.appendChild(create_XUL(window, "treechildren"));

                this.minibuffer.insert_before(tree);
                tree.view = new completions_tree_view(this);
                this.completions_display_element = tree;

                /* This is the initial loading of this minibuffer
                 * state.  If this.complete_initial is true, generate
                 * completions. */
                if (this.auto_complete_initial)
                    this.handle_input();
            }
            this.update_completions_display();
        }
    },

    unload: function () {
        if (this.completions_display_element)
            this.completions_display_element.setAttribute("collapsed", "true");
        basic_minibuffer_state.prototype.unload.call(this);
    },

    destroy: function () {
        if (this.completions != null && this.completions.destroy)
            this.completions.destroy();
        delete this.completions;
        if (this.completions_cont)
            this.completions_cont.throw(abort());
        delete this.completions_cont;

        var el = this.completions_display_element;
        if (el) {
            el.parentNode.removeChild(el);
            this.completions_display_element = null;
        }
        if (this.continuation)
            this.continuation.throw(abort());
        basic_minibuffer_state.prototype.destroy.call(this);
    },

    handle_input: function () {
        if (!this.completer) return;

        this.completions_valid = false;

        if (!this.auto_complete) return;

        var s = this;
        var window = this.minibuffer.window;

        if (this.auto_complete_delay > 0) {
            if (this.completions_timer_ID != null)
                window.clearTimeout(this.completions_timer_ID);
            this.completions_timer_ID = window.setTimeout(
                function () {
                    s.completions_timer_ID = null;
                    s.update_completions(true /* auto */, true /* update completions display */);
                }, this.auto_complete_delay);
            return;
        }
        s.update_completions(true /* auto */, true /* update completions display */);
    },

    update_completions_display: function () {
        var m = this.minibuffer;
        if (m.current_state == this) {
            if (this.completions && this.completions.count > 0) {
                this.completions_display_element.view = this.completions_display_element.view;
                this.completions_display_element.setAttribute("collapsed", "false");

                this.completions_display_element.currentIndex = this.selected_completion_index;
                this.completions_display_element.treeBoxObject.scrollToRow(this.selected_completion_index);
            } else {
                this.completions_display_element.setAttribute("collapsed", "true");
            }
        }
    },

    /* If auto is true, this update is due to auto completion, rather
     * than specifically requested. */
    update_completions: function (auto, update_display) {
        var window = this.minibuffer.window;
        if (this.completions_timer_ID != null) {
            window.clearTimeout(this.completions_timer_ID);
            this.completions_timer_ID = null;
        }

        let m = this.minibuffer;

        if (this.completions_cont) {
            this.completions_cont.throw(abort());
            this.completions_cont = null;
        }

        let c = this.completer(m._input_text, m._selection_start,
                               auto && this.auto_complete_conservative);

        if (is_coroutine(c)) {
            let s = this;
            let already_done = false;
            this.completions_cont = co_call(function () {
                var x;
                try {
                    x = yield c;
                } catch (e) {
                    handle_interactive_error(window, e);
                } finally {
                    s.completions_cont = null;
                    already_done = true;
                }
                s.update_completions_done(x, update_display);
            }());

            // In case the completer actually already finished
            if (already_done)
                this.completions_cont = null;
            return;
        } else
            this.update_completions_done(c, update_display);
    },

    update_completions_done: function (c, update_display) {
        /* The completer should return undefined if completion was not
         * attempted due to auto being true.  Otherwise, it can return
         * null to indicate no completions. */
        if (this.completions != null && this.completions.destroy)
            this.completions.destroy();

        this.completions = c;
        this.completions_valid = true;
        this.applied_common_prefix = false;

        if (c && ("get_match_required" in c))
            this.match_required = c.get_match_required();
        if (this.match_required == null)
            this.match_required = this.match_required_default;

        let i = -1;
        if (c && c.count > 0) {
            if (this.match_required) {
                if (c.count == 1)
                    i = 0;
                else if (c.default_completion != null)
                    i = c.default_completion;
                else if (this.default_completion && this.completions.index_of)
                    i = this.completions.index_of(this.default_completion);
            }
            this.selected_completion_index = i;
        }

        if (update_display)
            this.update_completions_display();
    },

    select_completion: function (i) {
        this.selected_completion_index = i;
        this.completions_display_element.currentIndex = i;
        if (i >= 0)
            this.completions_display_element.treeBoxObject.ensureRowIsVisible(i);
        this.handle_completion_selected();
    },

    handle_completion_selected: function () {
        /**
         * When a completion is selected, apply it to the input text
         * if a match is not "required"; otherwise, the completion is
         * only displayed.
         */
        var i = this.selected_completion_index;
        var m = this.minibuffer;
        var c = this.completions;

        if (this.completions_valid && c && !this.match_required && i >= 0 && i < c.count)
            m.set_input_state(c.get_input_state(i));
    }
};

function minibuffer_complete (window, count) {
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw new Error("Invalid minibuffer state");
    if (!s.completer)
        return;
    var just_completed_manually = false;
    if (!s.completions_valid || s.completions === undefined) {
        if (s.completions_timer_ID == null)
            just_completed_manually = true;
        //XXX: may need to use ignore_input_events here
        s.update_completions(false /* not auto */, true /* update completions display */);

        // If the completer is a coroutine, nothing we can do here
        if (!s.completions_valid)
            return;
    }

    var c = s.completions;

    if (!c || c.count == 0)
        return;

    var e = s.completions_display_element;
    var new_index = -1;

    let common_prefix;

    if (count == 1 && !s.applied_common_prefix && (common_prefix = c.common_prefix_input_state)) {
        //XXX: may need to use ignore_input_events here
        m.set_input_state(common_prefix);
        s.applied_common_prefix = true;
    } else if (!just_completed_manually) {
        if (e.currentIndex != -1) {
            new_index = (e.currentIndex + count) % c.count;
            if (new_index < 0)
                new_index += c.count;
        } else {
            new_index = (count - 1) % c.count;
            if (new_index < 0)
                new_index += c.count;
        }
    }

    if (new_index != -1) {
       try {
            m.ignore_input_events = true;
            s.select_completion(new_index);
        } finally {
            m.ignore_input_events = false;
        }
    }
}
interactive("minibuffer-complete", null,
    function (I) { minibuffer_complete(I.window, I.p); });
interactive("minibuffer-complete-previous", null,
    function (I) { minibuffer_complete(I.window, -I.p); });

function exit_minibuffer (window) {
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw new Error("Invalid minibuffer state");

    var val = m._input_text;

    if (s.validator != null && !s.validator(val, m))
        return;

    var match = null;

    if (s.completer && s.match_required) {
        if (!s.completions_valid || s.completions === undefined)
            s.update_completions(false /* not conservative */, false /* don't update */);

        let c = s.completions;
        let i = s.selected_completion_index;
        if (c != null && i >= 0 && i < c.count) {
            if (c.get_value != null)
                match = c.get_value(i);
            else
                match = c.get_string(i);
        } else {
            m.message("No match");
            return;
        }
    }

    if (s.history) {
        s.history.push(val);
        if (s.history.length > minibuffer_history_max_items)
            s.history.splice(0, s.history.length - minibuffer_history_max_items);
    }
    var cont = s.continuation;
    delete s.continuation;
    m.pop_state();
    if (cont) {
        if (s.match_required)
            cont(match);
        else
            cont(val);
    }
}
interactive("exit-minibuffer", null,
    function (I) { exit_minibuffer(I.window); });

function minibuffer_history_next (window, count) {
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw new Error("Invalid minibuffer state");
    if (!s.history || s.history.length == 0)
        throw interactive_error("No history available.");
    if (count == 0)
        return;
    var index = s.history_index;
    if (count > 0 && index == -1)
        throw interactive_error("End of history; no next item");
    else if (count < 0 && index == 0)
        throw interactive_error("Beginning of history; no preceding item");
    if (index == -1) {
        s.saved_last_history_entry = m._input_text;
        index = s.history.length + count;
    } else
        index = index + count;

    if (index < 0)
        index = 0;

    m._restore_normal_state();
    if (index >= s.history.length) {
        index = -1;
        m._input_text = s.saved_last_history_entry;
    } else {
        m._input_text = s.history[index];
    }
    s.history_index = index;
    m._set_selection();
    s.handle_input();
}
interactive("minibuffer-history-next", null,
    function (I) { minibuffer_history_next(I.window, I.p); });
interactive("minibuffer-history-previous", null,
    function (I) { minibuffer_history_next(I.window, -I.p); });

// Define the asynchronous minibuffer.read function
minibuffer.prototype.read = function () {
    var s = new text_entry_minibuffer_state(this, (yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
};

minibuffer.prototype.read_command = function () {
    keywords(
        arguments,
        $prompt = "Command", $history = "command",
        $completer = prefix_completer(
            $completions = function (visitor) interactive_commands.for_each_value(visitor),
            $get_string = function (x) x.name,
            $get_description = function (x) x.shortdoc || "",
            $get_value = function (x) x.name),
        $match_required,
        $space_completes);
    var result = yield this.read(forward_keywords(arguments));
    yield co_return(result);
};

minibuffer.prototype.read_user_variable = function () {
    keywords(
        arguments,
        $prompt = "User variable", $history = "user_variable",
        $completer = prefix_completer(
            $completions = function (visitor) {
                for (var i in user_variables) visitor(i);
            },
            $get_string = function (x) x,
            $get_description = function (x) user_variables[x].shortdoc || "",
            $get_value = function (x) x),
        $match_required,
        $space_completes);
    var result = yield this.read(forward_keywords(arguments));
    yield co_return(result);
};

minibuffer.prototype.read_preference = function () {
    keywords(arguments,
             $prompt = "Preference:", $history = "preference",
             $completer = prefix_completer(
                 $completions = preferences.getBranch(null).getChildList("", {}),
                 $get_description = function (pref) {
                     let default_value = get_default_pref(pref);
                     let value = get_pref(pref);
                     if (value == default_value)
                         value = null;
                     let type;
                     switch (preferences.getBranch(null).getPrefType(pref)) {
                     case Ci.nsIPrefBranch.PREF_STRING:
                         type = "string";
                         break;
                     case Ci.nsIPrefBranch.PREF_INT:
                         type = "int";
                         break;
                     case Ci.nsIPrefBranch.PREF_BOOL:
                         type = "boolean";
                         break;
                     }
                     let out = type + ":";
                     if (value != null)
                         out += " " + pretty_print_value(value);
                     if (default_value != null)
                         out += " (" + pretty_print_value(default_value) + ")";
                     return out;
                 }),
             $match_required,
             $space_completes);
    var result = yield this.read(forward_keywords(arguments));
    yield co_return(result);
};

provide("minibuffer-read");
