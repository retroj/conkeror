/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_variable("default_minibuffer_auto_complete_delay", 150,
                     "Delay (in milliseconds) after the most recent key stroke before auto-completing.");

define_variable("minibuffer_auto_complete_preferences", {});

define_variable("minibuffer_auto_complete_default", false, "Boolean specifying whether to auto-complete by default.\nThe user variable `minibuffer_auto_complete_preferences' overrides this.");

var minibuffer_history_data = new string_hashmap();

/* FIXME: These should possibly be saved to disk somewhere */
define_variable("minibuffer_history_max_items", 100, "Maximum number of minibuffer history entries stored.\nOlder history entries are truncated after this limit is reached.");


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
define_keywords("$history", "$validator",

                "$completer", "$match_required", "$default_completion",
                "$auto_complete", "$auto_complete_initial", "$auto_complete_conservative",
                "$auto_complete_delay",
                "$space_completes");
/* FIXME: support completing in another thread */
function text_entry_minibuffer_state(continuation) {
    keywords(arguments);

    basic_minibuffer_state.call(this, forward_keywords(arguments));
    this.keymap = minibuffer_keymap;

    this.continuation = continuation;
    if (arguments.$history)
    {
        this.history = minibuffer_history_data.get_put_default(arguments.$history, []);
        this.history_index = this.history.length;
    }

    this.validator = arguments.$validator;

    if (arguments.$completer != null)
    {
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
        this.completions_timer_ID = null;
        this.completions_display_element = null;
        this.selected_completion_index = -1;
        this.match_required  = !!arguments.$match_required;
        if (this.match_required)
            this.default_completion = arguments.$default_completion;
    }
}

function completions_tree_view(minibuffer_state)
{
    this.minibuffer_state = minibuffer_state;
}

var atom_service = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);

completions_tree_view.prototype = {
    get rowCount () {
        var c = this.minibuffer_state.completions;
        if (!c)
            return 0;
        return c.count;
    },
    getCellText : function(row,column){
        var c = this.minibuffer_state.completions;
        if (row >= c.count)
            return null;
        if (column.index == 0)
            return c.get_string(row);
        if (c.get_description)
            return c.get_description(row);
        return "";
    },
    setTree : function(treebox){ this.treebox = treebox; },
    isContainer: function(row){ return false; },
    isSeparator: function(row){ return false; },
    isSorted: function(){ return false; },
    getLevel: function(row){ return 0; },
    getImageSrc: function(row,col){ return null; },
    getRowProperties: function(row,props){},
    getCellProperties: function(row,col,props){
        if (col.index == 0)
            props.AppendElement(atom_service.getAtom("completion-string"));
        else
            props.AppendElement(atom_service.getAtom("completion-description"));
    },
    getColumnProperties: function(colid,col,props){}
};

// inherit from basic_minibuffer_state
text_entry_minibuffer_state.prototype = {
    __proto__: basic_minibuffer_state.prototype,
    load : function (window) {
        this.window = window;
        if (this.completer) {
            // Create completion display element if needed
            if (!this.completion_element)
            {
                /* FIXME: maybe use the dom_generator */
                var tree = create_XUL(window, "tree");
                var s = this;
                tree.addEventListener("select", function () {
                        s.selected_completion_index = s.completions_display_element.currentIndex;
                        s.handle_completion_selected();
                    }, true, false);
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

                window.minibuffer.insert_before(tree);
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

    unload : function (window) {
        if (this.completions_display_element)
            this.completions_display_element.setAttribute("collapsed", "true");
    },

    destroy : function (window) {
        if (this.completions != null && this.completions.destroy)
            this.completions.destroy();
        delete this.completions;
        if (this.completions_cont)
            this.completions_cont.throw(abort());
        delete this.completions_cont;

        var el = this.completions_display_element;
        if (el)
        {
            el.parentNode.removeChild(el);
            this.completions_display_element = null;
        }
        if (this.continuation)
            this.continuation.throw(abort());
    },

    handle_input : function () {
        if (!this.completer) return;

        this.completions_valid = false;

        if (!this.auto_complete) return;

        var s = this;

        if (this.auto_complete_delay > 0) {
            if (this.completions_timer_ID != null)
                this.window.clearTimeout(this.completions_timer_ID);
            this.completions_timer_ID = this.window.setTimeout(
                function () {
                    s.completions_timer_ID = null;
                    s.update_completions(true /* auto */, true /* update completions display */);
                }, this.auto_complete_delay);
            return;
        }

        s.update_completions(true /* auto */, true /* update completions display */);
    },

    ran_minibuffer_command : function () {
        this.handle_input();
    },

    update_completions_display : function () {

        var m = this.window.minibuffer;

        if (m.current_state == this)
        {
            if (this.completions && this.completions.count > 0)
            {
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
    update_completions : function (auto, update_display) {

        if (this.completions_timer_ID != null) {
            this.window.clearTimeout(this.completions_timer_ID);
            this.completions_timer_ID = null;
        }

        let m = this.window.minibuffer;

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

    update_completions_done : function update_completions_done(c, update_display) {

        /* The completer should return undefined if completion was not
         * attempted due to auto being true.  Otherwise, it can return
         * null to indicate no completions. */
        if (this.completions != null && this.completions.destroy)
            this.completions.destroy();

        this.completions = c;
        this.completions_valid = true;
        this.applied_common_prefix = false;

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

    select_completion : function (i) {
        this.selected_completion_index = i;
        this.completions_display_element.currentIndex = i;
        if (i >= 0)
            this.completions_display_element.treeBoxObject.ensureRowIsVisible(i);
        this.handle_completion_selected();
    },

    handle_completion_selected : function () {
        /**
         * When a completion is selected, apply it to the input text
         * if a match is not "required"; otherwise, the completion is
         * only displayed.
         */
        var i = this.selected_completion_index;
        var m = this.window.minibuffer;
        var c = this.completions;

        if (this.completions_valid && c && !this.match_required && i >= 0 && i < c.count)
        {
            m.set_input_state(c.get_input_state(i));
        }
    }
};

function minibuffer_complete(window, count)
{
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

    if (count == 1 && !s.applied_common_prefix && (common_prefix = c.common_prefix_input_state))
    {
        m.set_input_state(common_prefix);
        s.applied_common_prefix = true;
    } else if (!just_completed_manually) {
        if (e.currentIndex != -1)
        {
            new_index = (e.currentIndex + count) % c.count;
            if (new_index < 0)
                new_index += c.count;
        } else {
            new_index = (count - 1) % c.count;
            if (new_index < 0)
                new_index += c.count;
        }
    }

    if (new_index != -1)
        s.select_completion(new_index);
}
interactive("minibuffer-complete", function (I) {minibuffer_complete(I.window, I.p);});
interactive("minibuffer-complete-previous", function (I) {minibuffer_complete(I.window, -I.p);});

function exit_minibuffer(window)
{
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

    if (s.history)
    {
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
interactive("exit-minibuffer", function (I) {exit_minibuffer(I.window);});

function minibuffer_history_next (window, count)
{
    var m = window.minibuffer;
    var s = m.current_state;
    if (!(s instanceof text_entry_minibuffer_state))
        throw new Error("Invalid minibuffer state");
    if (!s.history || s.history.length == 0)
        return;
    m._restore_normal_state();
    var index = s.history_index + count;
    if (index < 0)
        index = 0;
    if (index >= s.history.length)
        index = s.history.length - 1;
    s.history_index = index;
    m._input_text = s.history[index];
    m._set_selection();
}
interactive("minibuffer-history-next", function (I) {minibuffer_history_next(I.window, I.p);});
interactive("minibuffer-history-previous", function (I) {minibuffer_history_next(I.window, -I.p);});

// Define the asynchronous minibuffer.read function
minibuffer.prototype.read = function () {
    var s = new text_entry_minibuffer_state((yield CONTINUATION), forward_keywords(arguments));
    this.push_state(s);
    var result = yield SUSPEND;
    yield co_return(result);
}

minibuffer.prototype.read_command = function () {
    keywords(arguments);
    var completer = prefix_completer(
        $completions = function (visitor) interactive_commands.for_each_value(visitor),
        $get_string = function (x) x.name,
        $get_description = function (x) x.shortdoc || "",
        $get_value = function (x) x.name
    );

    var result = yield this.read($prompt = "Command", $history = "command",
        forward_keywords(arguments),
        $completer = completer,
        $match_required = true);
    yield co_return(result);
}

minibuffer.prototype.read_user_variable = function () {
    keywords(arguments);
    var completer = prefix_completer(
        $completions = function (visitor) user_variables.for_each(visitor),
        $get_string = function (x) x,
        $get_description = function (x) user_variables.get(x).shortdoc || "",
        $get_value = function (x) x
    );

    var result = yield this.read($prompt = "User variable", $history = "user_variable",
        forward_keywords(arguments),
        $completer = completer,
        $match_required = true);
    yield co_return(result);
}
