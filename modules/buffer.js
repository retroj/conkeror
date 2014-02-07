/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2012 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var define_buffer_local_hook = local_hook_definer("window");

function define_current_buffer_hook (hook_name, existing_hook) {
    define_buffer_local_hook(hook_name);
    add_hook(existing_hook, function (buffer) {
            if (!buffer.window.buffers || buffer != buffer.window.buffers.current)
                return;
            var hook = conkeror[hook_name];
            hook.run.apply(hook, Array.prototype.slice.call(arguments));
        });
}

define_buffer_local_hook("buffer_title_change_hook");
define_buffer_local_hook("buffer_description_change_hook");
define_buffer_local_hook("buffer_icon_change_hook");
define_buffer_local_hook("select_buffer_hook");
define_buffer_local_hook("create_buffer_early_hook");
define_buffer_local_hook("create_buffer_late_hook");
define_buffer_local_hook("create_buffer_hook");
define_buffer_local_hook("kill_buffer_hook");
define_buffer_local_hook("move_buffer_hook");
define_buffer_local_hook("buffer_scroll_hook");
define_buffer_local_hook("buffer_dom_content_loaded_hook");
define_buffer_local_hook("buffer_loaded_hook");
define_buffer_local_hook("set_input_mode_hook");
define_buffer_local_hook("zoom_hook");

define_current_buffer_hook("current_buffer_title_change_hook", "buffer_title_change_hook");
define_current_buffer_hook("current_buffer_description_change_hook", "buffer_description_change_hook");
define_current_buffer_hook("current_buffer_icon_change_hook", "buffer_icon_change_hook");
define_current_buffer_hook("current_buffer_scroll_hook", "buffer_scroll_hook");
define_current_buffer_hook("current_buffer_dom_content_loaded_hook", "buffer_dom_content_loaded_hook");
define_current_buffer_hook("current_buffer_zoom_hook", "zoom_hook");


function buffer_position_before (container, b, i) {
    return i;
}

function buffer_position_after (container, b, i) {
    return i + 1;
}

function buffer_position_end (container, b, i) {
    return container.count;
}

function buffer_position_end_by_type (container, b, i) {
    // after last buffer of same type
    var count = container.count;
    var p = count - 1;
    while (p >= 0 &&
           container.get_buffer(p).constructor != b.constructor)
    {
        p--;
    }
    if (p == -1)
        return count;
    else
        return p + 1;
}

define_variable("new_buffer_position", buffer_position_end,
    "Used to compute the position in the buffer-list at which "+
    "to insert new buffers which do not have an opener.  These "+
    "include buffers created by typing an url or webjump, or "+
    "buffers created via command-line remoting.  The value "+
    "should be a number giving the index or a function of three "+
    "arguments that returns the index at which to insert the "+
    "new buffer.  The first argument is the buffer_container "+
    "into which the new buffer is being inserted.  The second "+
    "argument is the buffer to be inserted.  The third argument "+
    "is the position of the currently selected buffer.  Several "+
    "such functions are provided, including, buffer_position_before, "+
    "buffer_position_after, buffer_position_end, and "+
    "buffer_position_end_by_type.");

define_variable("new_buffer_with_opener_position", buffer_position_after,
    "Used to compute the position in the buffer-list at which "+
    "to insert new buffers which have an opener in the same "+
    "window.  These include buffers created by following a link "+
    "or frame, and contextual help buffers.  The allowed values "+
    "are the same as those for `new_buffer_position', except that "+
    "the second argument passed to the function is the index of "+
    "the opener instead of the index of the current buffer (often "+
    "one and the same).");

define_variable("bury_buffer_position", null,
    "Used to compute the position in the buffer-list to move a "+
    "buried buffer to.  A value of null prevents bury-buffer "+
    "from moving the buffer at all.  Other allowed values are "+
    "the same as those for `new_buffer_position', except that "+
    "the second argument passed to the function is the index of "+
    "the new buffer that will be selected after burying the "+
    "current buffer.");

define_variable("allow_browser_window_close", true,
    "If this is set to true, if a content buffer page calls " +
    "window.close() from JavaScript and is not prevented by the " +
    "normal Mozilla mechanism that restricts pages from closing " +
    "a window that was not opened by a script, the buffer will be " +
    "killed, deleting the window as well if it is the only buffer.");

define_keywords("$opener", "$position");
function buffer_creator (type) {
    var args = forward_keywords(arguments);
    return function (window) {
        return new type(window, args);
    };
}

function buffer_modality (buffer) {
    buffer.keymaps.push(default_global_keymap);
}

function buffer (window) {
    this.constructor_begin();
    keywords(arguments, $position = this.default_position);
    this.opener = arguments.$opener;
    this.window = window;
    var element = create_XUL(window, "vbox");
    element.setAttribute("flex", "1");
    var browser = create_XUL(window, "browser");
    browser.setAttribute("type", "content");
    browser.setAttribute("flex", "1");
    browser.setAttribute("autocompletepopup", "popup_autocomplete");
    element.appendChild(browser);
    this.window.buffers.container.appendChild(element);
    this.window.buffers.insert(this, arguments.$position, this.opener);
    this.window.buffers.buffer_history.push(this);
    this.element = element;
    this.browser = element.firstChild;
    this.element.conkeror_buffer_object = this;

    this.local = { __proto__: conkeror };
    this.page = null;
    this.enabled_modes = [];
    this.default_browser_object_classes = {};

    var buffer = this;

    this.browser.addEventListener("scroll", function (event) {
            buffer_scroll_hook.run(buffer);
        }, true /* capture */);

    this.browser.addEventListener("DOMContentLoaded", function (event) {
            buffer_dom_content_loaded_hook.run(buffer);
        }, true /* capture */);

    this.window.setTimeout(function () { create_buffer_late_hook.run(buffer); }, 0);

    this.browser.addEventListener("load", function (event) {
            if (event.target == buffer.document)
                buffer_loaded_hook.run(buffer);
        }, true /* capture */);

    this.browser.addEventListener("DOMWindowClose", function (event) {
            /* This call to preventDefault is very important; without
             * it, somehow Mozilla does something bad and as a result
             * the window loses focus, causing keyboard commands to
             * stop working. */
            event.preventDefault();

            if (allow_browser_window_close)
                kill_buffer(buffer, true);
        }, true);

    this.browser.addEventListener("focus", function (event) {
        if (buffer.focusblocker &&
            event.target instanceof Ci.nsIDOMHTMLElement &&
            buffer.focusblocker(buffer, event))
        {
            event.target.blur();
        } else
            buffer.set_input_mode();
    }, true);

    this.browser.addEventListener("blur", function (event) {
        buffer.set_input_mode();
    }, true);

    this.modalities = [buffer_modality];

    // When create_buffer_early_hook runs, basic buffer properties
    // will be available, but not the properties subclasses.
    create_buffer_early_hook.run(this);

    this.constructor_end();
}
buffer.prototype = {
    constructor: buffer,
    toString: function () "#<buffer>",

    // default_position is the default value for the $position keyword to
    // the buffer constructor.  This property can be set on the prototype
    // of a subclass in order to override new_buffer_position and
    // new_buffer_with_opener_position for specific types of buffers.
    default_position: null,

    /* Saved focus state */
    saved_focused_frame: null,
    saved_focused_element: null,

    clear_saved_focus: function () {
        this.saved_focused_frame = null;
        this.saved_focused_element = null;
    },

    // get title ()   [must be defined by subclasses]
    // get name ()    [must be defined by subclasses]
    dead: false, /* This is set when the buffer is killed */

    keymaps: null,
    mark_active: false,

    // The property focusblocker is available for an external module to
    // put a function on which takes a buffer as its argument and returns
    // true to block a focus event, or false to let normal processing
    // occur.  Having this one property explicitly handled by the buffer
    // class allows for otherwise modular focus-blockers.
    focusblocker: null,

    // icon is a string url of an icon to use for this buffer.  Setting it
    // causes buffer_icon_change_hook to be run.
    _icon: null,
    get icon () this._icon,
    set icon (x) {
        if (this._icon != x) {
            this._icon = x;
            buffer_icon_change_hook.run(this);
        }
    },

    default_message: "",

    set_default_message: function (str) {
        this.default_message = str;
        if (this == this.window.buffers.current)
            this.window.minibuffer.set_default_message(str);
    },

    constructors_running: 0,

    constructor_begin: function () {
        this.constructors_running++;
    },

    constructor_end: function () {
        if (--this.constructors_running == 0) {
            create_buffer_hook.run(this);
            this.set_input_mode();
            delete this.opener;
        }
    },

    destroy: function () {
        this.dead = true;
        this.browser = null;
        this.element = null;
        this.saved_focused_frame = null;
        this.saved_focused_element = null;
        // prevent modalities from accessing dead browser
        this.modalities = [];
    },

    set_input_mode: function () {
        if (this != this.window.buffers.current)
            return;
        this.keymaps = [];
        this.modalities.map(function (m) m(this), this);
        set_input_mode_hook.run(this);
    },

    override_keymaps: function (keymaps) {
        if (keymaps) {
            this.keymaps = keymaps;
            this.set_input_mode = function () {
                set_input_mode_hook.run(this);
            };
        } else
            delete this.set_input_mode;
        this.set_input_mode();
    },

    /* Browser accessors */
    get top_frame () { return this.browser.contentWindow; },
    get document () { return this.browser.contentDocument; },
    get web_navigation () { return this.browser.webNavigation; },
    get doc_shell () { return this.browser.docShell; },
    get markup_document_viewer () { return this.browser.markupDocumentViewer; },
    get current_uri () { return this.browser.currentURI; },

    is_child_element: function (element) {
        return (element && this.is_child_frame(element.ownerDocument.defaultView));
    },

    is_child_frame: function (frame) {
        return (frame && frame.top == this.top_frame);
    },

    // This method is like focused_frame, except that if no content
    // frame actually has focus, this returns null.
    get focused_frame_or_null () {
        var frame = this.window.document.commandDispatcher.focusedWindow;
        if (this.is_child_frame(frame))
            return frame;
        return null;
    },

    get focused_frame () {
        var frame = this.window.document.commandDispatcher.focusedWindow;
        if (this.is_child_frame(frame))
            return frame;
        return this.top_frame;
    },

    get focused_element () {
        var element = this.window.document.commandDispatcher.focusedElement;
        if (this.is_child_element(element))
            return element;
        return null;
    },

    get focused_selection_controller () {
        return this.focused_frame
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsISelectionDisplay)
            .QueryInterface(Ci.nsISelectionController);
    },

    do_command: function (command) {
        function attempt_command (element, command) {
            var controller;
            if (element.controllers
                && (controller = element.controllers.getControllerForCommand(command)) != null
                && controller.isCommandEnabled(command))
            {
                controller.doCommand(command);
                return true;
            }
            return false;
        }

        var element = this.focused_element;
        if (element && attempt_command(element, command))
            return;
        var win = this.focused_frame;
        while (true) {
            if (attempt_command(win, command))
                return;
            if (!win.parent || win == win.parent)
                break;
            win = win.parent;
        }
    }
};

function with_current_buffer (buffer, callback) {
    return callback(new interactive_context(buffer));
}

function check_buffer (obj, type) {
    if (!(obj instanceof type))
        throw interactive_error("Buffer has invalid type.");
    if (obj.dead)
        throw interactive_error("Buffer has already been killed.");
    return obj;
}

function caret_enabled (buffer) {
    return buffer.browser.getAttribute('showcaret');
}

function clear_selection (buffer) {
    let sel_ctrl = buffer.focused_selection_controller;
    if (sel_ctrl) {
        let sel = sel_ctrl.getSelection(sel_ctrl.SELECTION_NORMAL);
        if (caret_enabled(buffer)) {
            if (sel.anchorNode)
                sel.collapseToStart();
        } else {
            sel.removeAllRanges();
        }
    }
}


function buffer_container (window, create_initial_buffer) {
    this.window = window;
    this.container = window.document.getElementById("buffer-container");
    this.buffer_list = [];
    this.buffer_history = [];

    // Stores the current buffer object, because
    // this.container.selectedPanel may be temporarily invalid while
    // killing a buffer.  Use the `this.current' getter rather than
    // accessing this property directly.
    this.current_buffer_object = null;

    window.buffers = this;
    create_initial_buffer(window);
}
buffer_container.prototype = {
    constructor: buffer_container,
    toString: function () "#<buffer_container>",

    insert: function (buffer, position, opener) {
        var i = this.index_of(opener);
        if (position == null) {
            if (i == null)
                position = new_buffer_position;
            else
                position = new_buffer_with_opener_position;
        }
        if (i == null)
            i = this.selected_index || 0;
        try {
            if (position instanceof Function)
                var p = position(this, buffer, i);
            else
                p = position;
            this.buffer_list.splice(p, 0, buffer);
        } catch (e) {
            this.buffer_list.splice(0, 0, buffer);
            dumpln("Error inserting buffer, inserted at 0.");
            dump_error(e);
        }
    },

    get current () {
        if (this.current_buffer_object)
            return this.current_buffer_object;
        return this.container.selectedPanel.conkeror_buffer_object;
    },

    set current (buffer) {
        var old_value = this.current;
        if (old_value == buffer)
            return;

        this.buffer_history.splice(this.buffer_history.indexOf(buffer), 1);
        this.buffer_history.unshift(buffer);

        this._switch_away_from(this.current);
        this._switch_to(buffer);

        // Run hooks
        select_buffer_hook.run(buffer);
    },

    // Ensure the focus state for the current buffer is updated
    save_focus: function () {
        // If minibuffer is active, the focus is already saved, so leave that focus state as is
        if (this.window.minibuffer.active)
            return;

        var b = this.current;
        b.saved_focused_frame = b.focused_frame;
        b.saved_focused_element = b.focused_element;
    },

    // Restore the focus state for the current buffer, unless the minibuffer is still active
    restore_focus: function () {
        /**
         * This next focus call seems to be needed to avoid focus
         * somehow getting lost (and the keypress handler therefore
         * not getting called at all) when killing buffers.
         */
        this.window.focus();

        // If the minibuffer is active, keep the saved focus state but don't
        // restore it until the minibuffer becomes inactive
        if (this.window.minibuffer.active)
            return;

        var b = this.current;

        b.browser.focus();

        var saved_focused_element = b.saved_focused_element;
        var saved_focused_frame = b.saved_focused_frame;
        b.clear_saved_focus();

        if (saved_focused_element) {
            try {
                if (saved_focused_element.focus) {
                    set_focus_no_scroll(this.window, saved_focused_element);
                    return;
                }
            } catch (e) { /* saved_focused_element may be dead */ }
        }

        if (saved_focused_frame) {
            try {
                set_focus_no_scroll(this.window, saved_focused_frame);
            } catch (e) { /* saved_focused_frame may be dead */ }
        }
    },

    // Note: old_value is still the current buffer when this is called
    _switch_away_from: function (old_value) {
        this.save_focus();

        if ('isActive' in old_value.browser.docShell)
            old_value.browser.docShell.isActive = false;
        old_value.browser.setAttribute("type", "content");
    },

    _switch_to: function (buffer) {
        // Select new buffer in the XUL deck
        this.current_buffer_object = buffer;
        this.container.selectedPanel = buffer.element;

        buffer.browser.setAttribute("type", "content-primary");
        if ('isActive' in buffer.browser.docShell)
            buffer.browser.docShell.isActive = true;

        this.restore_focus();

        buffer.set_input_mode();

        this.window.minibuffer.set_default_message(buffer.default_message);
    },

    get count () {
        return this.buffer_list.length;
    },

    get_buffer: function (index) {
        if (index >= 0 && index < this.count)
            return this.buffer_list[index]
        return null;
    },

    get selected_index () {
        var nodes = this.buffer_list;
        var count = nodes.length;
        for (var i = 0; i < count; ++i)
            if (nodes[i] == this.container.selectedPanel.conkeror_buffer_object)
                return i;
        return null;
    },

    index_of: function (b) {
        var nodes = this.buffer_list;
        var count = nodes.length;
        for (var i = 0; i < count; ++i)
            if (nodes[i] == b)
                return i;
        return null;
    },

    get unique_name_list () {
        var existing_names = {};
        var bufs = [];
        this.for_each(function(b) {
                var base_name = b.name;
                var name = base_name;
                var index = 1;
                while (existing_names[name]) {
                    ++index;
                    name = base_name + "<" + index + ">";
                }
                existing_names[name] = true;
                bufs.push([name, b]);
            });
        return bufs;
    },

    kill_buffer: function (b) {
        if (b.dead)
            return true;
        var count = this.count;
        if (count <= 1)
            return false;
        var new_buffer = this.buffer_history[0];
        var changed = false;
        if (b == new_buffer) {
            new_buffer = this.buffer_history[1];
            changed = true;
        }
        this._switch_away_from(this.current);
        // The removeChild call below may trigger events in progress
        // listeners.  This call to `destroy' gives buffer subclasses a
        // chance to remove such listeners, so that they cannot try to
        // perform UI actions based upon a xul:browser that no longer
        // exists.
        var element = b.element;
        b.destroy();

        // Switch to new buffer before destroying this buffer so that
        // there always remains a selected buffer
        this._switch_to(new_buffer);

        // In Gecko >= 25, the selectedIndex property of the xul:deck
        // remains the same even after removing a child, which means
        // if the removed child has a lower index than that of the new
        // current buffer, the correct child will no longer be
        // selected.  In the worst case, selectedIndex will fall out
        // of the valid range, resulting in no buffer being selected
        // which breaks Conkeror.  As a workaround, we reassign the
        // selectedPanel immediately after removing the child.
        var new_element = this.current.element;
        this.container.removeChild(element);
        this.container.selectedPanel = new_element;


        this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
        this.buffer_history.splice(this.buffer_history.indexOf(b), 1);
        if (changed) {
            select_buffer_hook.run(new_buffer);
            this.buffer_history.splice(this.buffer_history.indexOf(new_buffer), 1);
            this.buffer_history.unshift(new_buffer);
        }
        kill_buffer_hook.run(b);
        return true;
    },

    bury_buffer: function (b) {
        var new_buffer = this.buffer_history[0];
        if (b == new_buffer)
            new_buffer = this.buffer_history[1];
        if (! new_buffer)
            throw interactive_error("No other buffer");
        if (bury_buffer_position != null) {
            this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
            this.insert(b, bury_buffer_position, new_buffer);
        }
        this.buffer_history.splice(this.buffer_history.indexOf(b), 1);
        this.buffer_history.push(b);
        this.current = new_buffer;
        if (bury_buffer_position != null)
            move_buffer_hook.run(b);
        return true;
    },

    unbury_buffer: function (b) {
        var c = this.current;
        if (bury_buffer_position != null) {
            this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
            this.buffer_list.splice(this.buffer_list.indexOf(c), 0, b);
        }
        this.buffer_history.splice(this.buffer_history.indexOf(b), 1);
        this.buffer_history.unshift(b);
        this.current = b;
        if (bury_buffer_position != null)
            move_buffer_hook.run(b);
        return true;
    },

    for_each: function (f) {
        var count = this.count;
        for (var i = 0; i < count; ++i)
            f(this.get_buffer(i));
    }
};

function buffer_initialize_window_early (window) {
    /**
     * Use content_buffer by default to handle an unusual case where
     * browser.chromeURI is used perhaps.  In general this default
     * should not be needed.
     */
    var create_initial_buffer =
        window.args.initial_buffer_creator || buffer_creator(content_buffer);
    new buffer_container(window, create_initial_buffer);
}

add_hook("window_initialize_early_hook", buffer_initialize_window_early);


/**
 * initialize_first_buffer_type is a workaround for a XULRunner bug that
 * first appeared in version 2.0, manifested as missing scrollbars in the
 * first buffer of any window.  It only affects content-primary browsers,
 * and the workaround is to initialize the browser as type "content" then
 * change it to content-primary after a delay.
 */
function initialize_first_buffer_type (window) {
    window.buffers.current.browser.setAttribute("type", "content-primary");
}

add_hook("window_initialize_late_hook", initialize_first_buffer_type);


define_buffer_local_hook("buffer_kill_before_hook", RUN_HOOK_UNTIL_FAILURE);
function buffer_before_window_close (window) {
    var bs = window.buffers;
    var count = bs.count;
    for (let i = 0; i < count; ++i) {
        if (!buffer_kill_before_hook.run(bs.get_buffer(i)))
            return false;
    }
    return true;
}
add_hook("window_before_close_hook", buffer_before_window_close);

function buffer_window_close_handler (window) {
    var bs = window.buffers;
    var count = bs.count;
    for (let i = 0; i < count; ++i) {
        let b = bs.get_buffer(i);
        b.destroy();
    }
}
add_hook("window_close_hook", buffer_window_close_handler);

/* open/follow targets */
const OPEN_CURRENT_BUFFER = 0; // only valid for open if the current
                               // buffer is a content_buffer.
const OPEN_NEW_BUFFER = 1;
const OPEN_NEW_BUFFER_BACKGROUND = 2;
const OPEN_NEW_WINDOW = 3;

const FOLLOW_DEFAULT = 4; // for open, implies OPEN_CURRENT_BUFFER
const FOLLOW_CURRENT_FRAME = 5; // for open, implies OPEN_CURRENT_BUFFER

var TARGET_PROMPTS = [" in current buffer",
                      " in new buffer",
                      " in new buffer (background)",
                      " in new window",
                      "",
                      " in current frame"];

var TARGET_NAMES = ["current buffer",
                    "new buffer",
                    "new buffer (background)",
                    "new window",
                    "default",
                    "current frame"];


function create_buffer (window, creator, target) {
    switch (target) {
    case OPEN_NEW_BUFFER:
        window.buffers.current = creator(window, null);
        break;
    case OPEN_NEW_BUFFER_BACKGROUND:
        creator(window, null);
        break;
    case OPEN_NEW_WINDOW:
        make_window(creator);
        break;
    default:
        throw new Error("invalid target");
    }
}

let (queued_buffer_creators = null) {
    function create_buffer_in_current_window (creator, target, focus_existing) {
        function process_queued_buffer_creators (window) {
            for (var i = 0; i < queued_buffer_creators.length; ++i) {
                var x = queued_buffer_creators[i];
                create_buffer(window, x[0], x[1]);
            }
            queued_buffer_creators = null;
        }

        if (target == OPEN_NEW_WINDOW)
            throw new Error("invalid target");
        var window = get_recent_conkeror_window();
        if (window) {
            if (focus_existing)
                window.focus();
            create_buffer(window, creator, target);
        } else if (queued_buffer_creators != null) {
            queued_buffer_creators.push([creator,target]);
        } else {
            queued_buffer_creators = [];
            window = make_window(creator);
            add_hook.call(window, "window_initialize_late_hook", process_queued_buffer_creators);
        }
    }
};


/*
 * Read Buffer
 */
define_variable("read_buffer_show_icons", false,
    "Boolean which says whether read_buffer should show buffer "+
    "icons in the completions list.\nNote, setting this variable "+
    "alone does not cause favicons or other kinds of icons to be "+
    "fetched.  For that, load the `favicon' (or similar other) "+
    "library.");

minibuffer_auto_complete_preferences["buffer"] = true;
define_keywords("$buffers", "$default");
minibuffer.prototype.read_buffer = function () {
    var window = this.window;
    keywords(arguments, $prompt = "Buffer:",
             $buffers = function (visitor) window.buffers.for_each(visitor),
             $default = window.buffers.current,
             $history = "buffer");
    var completer = all_word_completer(
        $completions = arguments.$buffers,
        $get_string = function (x) x.description,
        $get_description = function (x) x.title,
        $get_icon = (read_buffer_show_icons ?
                     function (x) x.icon : null));
    var result = yield this.read(
        $keymap = read_buffer_keymap,
        $prompt = arguments.$prompt,
        $history = arguments.$history,
        $completer = completer,
        $enable_icons = read_buffer_show_icons,
        $match_required = true,
        $auto_complete = "buffer",
        $auto_complete_initial = true,
        $auto_complete_delay = 0,
        $default_completion = arguments.$default);
    yield co_return(result);
};


function buffer_move_forward (window, count) {
    var buffers = window.buffers;
    var index = buffers.selected_index;
    var buffer = buffers.current
    var total = buffers.count;
    if (total == 1)
        return;
    var new_index = (index + count) % total;
    if (new_index == index)
        return;
    if (new_index < 0)
        new_index += total;
    buffers.buffer_list.splice(index, 1);
    buffers.buffer_list.splice(new_index, 0, buffer);
    move_buffer_hook.run(buffer);
}
interactive("buffer-move-forward",
    "Move the current buffer forward in the buffer order.",
    function (I) { buffer_move_forward(I.window, I.p); });

interactive("buffer-move-backward",
    "Move the current buffer backward in the buffer order.",
    function (I) { buffer_move_forward(I.window, -I.p); });


function buffer_next (window, count) {
    var index = window.buffers.selected_index;
    var total = window.buffers.count;
    if (total == 1)
        throw new interactive_error("No other buffer");
    index = (index + count) % total;
    if (index < 0)
        index += total;
    window.buffers.current = window.buffers.get_buffer(index);
}
interactive("buffer-next",
    "Switch to the next buffer.",
    function (I) { buffer_next(I.window, I.p); });
interactive("buffer-previous",
    "Switch to the previous buffer.",
    function (I) { buffer_next(I.window, -I.p); });

function switch_to_buffer (window, buffer) {
    if (buffer && !buffer.dead)
        window.buffers.current = buffer;
}
interactive("switch-to-buffer",
    "Prompt for a buffer and switch to it.",
    function (I) {
        switch_to_buffer(
            I.window,
            (yield I.minibuffer.read_buffer(
                $prompt = "Switch to buffer:",
                $default = (I.window.buffers.count > 1 ?
                            I.window.buffers.buffer_history[1] :
                            I.buffer))));
    });

define_variable("can_kill_last_buffer", true,
    "When true, kill-buffer can kill the last  buffer in a window, "+
    "and close the window.");

function kill_other_buffers (buffer) {
    if (!buffer)
        return;
    var bs = buffer.window.buffers;
    var b;
    while ((b = bs.get_buffer(0)) != buffer)
        bs.kill_buffer(b);
    var count = bs.count;
    while (--count)
        bs.kill_buffer(bs.get_buffer(1));
}
interactive("kill-other-buffers",
    "Kill all buffers except current one.\n",
    function (I) { kill_other_buffers(I.buffer); });


function kill_buffer (buffer, force) {
    if (!buffer)
        return;
    var buffers = buffer.window.buffers;
    if (buffers.count == 1 && buffer == buffers.current) {
        if (can_kill_last_buffer || force) {
            delete_window(buffer.window);
            return;
        } else
            throw interactive_error("Can't kill last buffer.");
    }
    buffers.kill_buffer(buffer);
}
interactive("kill-buffer",
    "Kill a buffer specified in the minibuffer.\n" +
    "If `can_kill_last_buffer' is set to true, an attempt to kill the "+
    "last remaining buffer in a window will cause the window to be closed.",
    function (I) {
        kill_buffer((yield I.minibuffer.read_buffer($prompt = "Kill buffer:")));
    });

interactive("kill-current-buffer",
    "Kill the current buffer.\n" +
    "If `can_kill_last_buffer' is set to true, an attempt to kill the "+
    "last remaining buffer in a window will cause the window to be closed.",
    function (I) { kill_buffer(I.buffer); });

interactive("read-buffer-kill-buffer",
    "Kill the current selected buffer in the completions list "+
    "in a read buffer minibuffer interaction.",
    function (I) {
        var s = I.window.minibuffer.current_state;
        var i = s.selected_completion_index;
        var c = s.completions;
        if (i == -1)
            return;
        kill_buffer(c.get_value(i));
        s.completer.refresh();
        s.handle_input(I.window.minibuffer);
    });

interactive("bury-buffer",
    "Bury the current buffer.\nPut the current buffer at the end of " +
    "the buffer list, so that it is the least likely buffer to be " +
    "selected by `switch-to-buffer'.",
    function (I) { I.window.buffers.bury_buffer(I.buffer); });

interactive("unbury-buffer",
    "Unbury the buffer lowest in the buffer-history list.\n"+
    "With universal argument, prompt for a buffer.  When "+
    "`bury_buffer_position` is non-null, move the buffer "+
    "to the current position in the buffer list.",
    function (I) {
        var buffers = I.window.buffers;
        if (I.prefix_argument)
            var b = yield I.minibuffer.read_buffer(
                $prompt = "Switch to buffer:",
                $buffers = function (visitor) {
                    var count = buffers.count;
                    for (var i = count - 1; i >= 0; --i)
                        visitor(buffers.buffer_history[i]);
                },
                $default = buffers.buffer_history[buffers.count - 1]);
        else
            b = buffers.buffer_history[buffers.count - 1];
        buffers.unbury_buffer(b);
    });

function change_directory (buffer, dir) {
    if (buffer.page != null)
        delete buffer.page.local.cwd;
    buffer.local.cwd = make_file(dir);
}
interactive("change-directory",
    "Change the current directory of the selected buffer.",
    function (I) {
        change_directory(
            I.buffer,
            (yield I.minibuffer.read_existing_directory_path(
                $prompt = "Change to directory:",
                $initial_value = make_file(I.local.cwd).path)));
    });

interactive("shell-command", null,
    function (I) {
        var cwd = I.local.cwd;
        var cmd = (yield I.minibuffer.read_shell_command($cwd = cwd));
        yield shell_command(cmd, $cwd = cwd);
    });


/**
 * selection_is_embed_p is used to test whether the unfocus command can
 * unfocus an element, even though there is a selection.  This happens
 * when the focused element is an html:embed.
 */
function selection_is_embed_p (sel, focused_element) {
    if (sel.rangeCount == 1) {
        try {
            var r = sel.getRangeAt(0);
            var a = r.startContainer.childNodes[r.startOffset];
            if ((a instanceof Ci.nsIDOMHTMLEmbedElement ||
                 a instanceof Ci.nsIDOMHTMLObjectElement) &&
                a == focused_element)
            {
                return true;
            }
        } catch (e) {}
    }
    return false;
}

/**
 * unfocus is a high-level command for unfocusing hyperlinks, inputs,
 * frames, iframes, plugins, and also clearing the selection.
 */
define_buffer_local_hook("unfocus_hook");
function unfocus (window, buffer) {
    // 1. if there is a selection, clear it.
    var selc = buffer.focused_selection_controller;
    if (selc) {
        var sel = selc.getSelection(selc.SELECTION_NORMAL);
        var active = ! sel.isCollapsed;
        var embed_p = selection_is_embed_p(sel, buffer.focused_element);
        clear_selection(buffer);
        if (active && !embed_p) {
            window.minibuffer.message("cleared selection");
            return;
        }
    }
    // 2. if there is a focused element, unfocus it.
    if (buffer.focused_element) {
        buffer.focused_element.blur();
        // if an element in a detached fragment has focus, blur() will
        // not work, and we need to take more drastic measures.  the
        // action taken was found through experiment, so it is possibly
        // not the most concise way to unfocus such an element.
        if (buffer.focused_element) {
            buffer.element.focus();
            buffer.top_frame.focus();
        }
        window.minibuffer.message("unfocused element");
        return;
    }
    // 3. if an iframe has focus, we must blur it.
    if (buffer.focused_frame_or_null &&
        buffer.focused_frame_or_null.frameElement)
    {
        buffer.focused_frame_or_null.frameElement.blur();
    }
    // 4. return focus to top-frame from subframes and plugins.
    buffer.top_frame.focus();
    buffer.top_frame.focus(); // needed to get focus back from plugins
    window.minibuffer.message("refocused top frame");
    // give page-modes an opportunity to set focus specially
    unfocus_hook.run(buffer);
}
interactive("unfocus",
    "Unfocus is a high-level command for unfocusing hyperlinks, inputs, "+
    "frames, iframes, plugins, and also for clearing the selection.\n"+
    "The action that it takes is based on precedence.  If there is a "+
    "focused hyperlink or input, it will unfocus that.  Otherwise, if "+
    "there is a selection, it will clear the selection.  Otherwise, it "+
    "will return focus to the top frame from a focused frame, iframe, "+
    "or plugin.  In the case of plugins, since they steal keyboard "+
    "control away from Conkeror, the normal way to unfocus them is "+
    "to use command-line remoting externally: conkeror -batch -f "+
    "unfocus.  Page-modes also have an opportunity to alter the default"+
    "focus via the hook, `focus_hook'.",
    function (I) {
        unfocus(I.window, I.buffer);
    });


function for_each_buffer (f) {
    for_each_window(function (w) { w.buffers.for_each(f); });
}


/*
 * Buffer Modes
 */

define_buffer_local_hook("buffer_mode_change_hook");
define_current_buffer_hook("current_buffer_mode_change_hook", "buffer_mode_change_hook");

define_keywords("$display_name", "$doc");
function buffer_mode (name, enable, disable) {
    keywords(arguments);
    this.name = name.replace("-","_","g");
    this.hyphen_name = name.replace("_","-","g");
    if (enable)
        this._enable = enable;
    if (disable)
        this._disable = disable;
    this.display_name = arguments.$display_name;
    this.doc = arguments.$doc;
    this.enable_hook = this.name + "_enable_hook";
    this.disable_hook = this.name + "_disable_hook";
}
buffer_mode.prototype = {
    constructor: buffer_mode,
    name: null,
    display_name: null,
    doc: null,
    enable_hook: null,
    disable_hook: null,
    _enable: null,
    _disable: null,
    enable: function (buffer) {
        try {
            if (this._enable)
                this._enable(buffer);
        } finally {
            buffer.enabled_modes.push(this.name);
            if (conkeror[this.enable_hook])
                conkeror[this.enable_hook].run(buffer);
            buffer_mode_change_hook.run(buffer);
        }
    },
    disable: function (buffer) {
        try {
            if (this._disable)
                this._disable(buffer);
        } finally {
            var i = buffer.enabled_modes.indexOf(this.name);
            if (i > -1)
                buffer.enabled_modes.splice(i, 1);
            if (conkeror[this.disable_hook])
                conkeror[this.disable_hook].run(buffer);
            buffer_mode_change_hook.run(buffer);
        }
    }
};
define_keywords("$constructor");
function define_buffer_mode (name, enable, disable) {
    keywords(arguments, $constructor = buffer_mode, $doc = null);
    var constructor = arguments.$constructor;
    var m = new constructor(name, enable, disable, forward_keywords(arguments));
    name = m.name; // normalized
    conkeror[name] = m;
    define_buffer_local_hook(m.enable_hook);
    define_buffer_local_hook(m.disable_hook);
    interactive(m.hyphen_name,
        arguments.$doc,
        function (I) {
            var enabledp = (I.buffer.enabled_modes.indexOf(name) > -1);
            if (enabledp)
                m.disable(I.buffer);
            else
                m.enable(I.buffer);
            I.minibuffer.message(m.hyphen_name + (enabledp ? " disabled" : " enabled"));
        });
}
ignore_function_for_get_caller_source_code_reference("define_buffer_mode");


/*
 * Mode Display in Minibuffer
 */

function minibuffer_mode_indicator (window) {
    this.window = window;
    var element = create_XUL(window, "label");
    element.setAttribute("id", "minibuffer-mode-indicator");
    element.setAttribute("class", "mode-text-widget");
    window.document.getElementById("minibuffer").appendChild(element);
    this.element = element;
    this.hook_function = method_caller(this, this.update);
    add_hook.call(window, "select_buffer_hook", this.hook_function);
    add_hook.call(window, "current_buffer_mode_change_hook", this.hook_function);
    this.update();
}
minibuffer_mode_indicator.prototype = {
    constructor: minibuffer_mode_indicator,
    window: null,
    element: null,
    hook_function: null,
    update: function () {
        var buffer = this.window.buffers.current;
        var str = buffer.enabled_modes.map(
            function (x) {
                return (conkeror[x].display_name || null);
            }).filter(function (x) x != null).join(" ");
        this.element.value = str;
    },
    uninstall: function () {
        remove_hook.call(this.window, "select_buffer_hook", this.hook_function);
        remove_hook.call(this.window, "current_buffer_mode_change_hook", this.hook_function);
        this.element.parentNode.removeChild(this.element);
    }
};
define_global_window_mode("minibuffer_mode_indicator", "window_initialize_hook");
minibuffer_mode_indicator_mode(true);


/*
 * minibuffer-keymaps-display
 */
function minibuffer_keymaps_display_update (buffer) {
    var element = buffer.window.document
        .getElementById("keymaps-display");
    if (element) {
        var str = buffer.keymaps.reduce(
            function (acc, kmap) {
                if (kmap.display_name)
                    acc.push(kmap.display_name);
                return acc;
            }, []).join("/");
        if (element.value != str)
            element.value = str;
    }
}

function minibuffer_keymaps_display_initialize (window) {
    var element = create_XUL(window, "label");
    element.setAttribute("id", "keymaps-display");
    element.setAttribute("class", "mode-text-widget");
    element.setAttribute("value", "");
    var mb = window.document.getElementById("minibuffer");
    mb.appendChild(element);
}

define_global_mode("minibuffer_keymaps_display_mode",
    function enable () {
        add_hook("window_initialize_hook", minibuffer_keymaps_display_initialize);
        add_hook("set_input_mode_hook", minibuffer_keymaps_display_update);
        for_each_window(minibuffer_keymaps_display_initialize);
    },
    function disable () {
        remove_hook("window_initialize_hook", minibuffer_keymaps_display_initialize);
        remove_hook("set_input_mode_hook", minibuffer_keymaps_display_update);
        for_each_window(function (w) {
            var element = w.document
                .getElementById("keymaps-display");
            if (element)
                element.parentNode.removeChild(element);
        });
    });

minibuffer_keymaps_display_mode(true);


/*
 * minibuffer-keymaps-highlight
 */
function minibuffer_keymaps_highlight_update (buffer) {
    var mb = buffer.window.document.getElementById("minibuffer");
    if (buffer.keymaps.some(function (k) k.notify))
        dom_add_class(mb, "highlight");
    else
        dom_remove_class(mb, "highlight");
}

define_global_mode("minibuffer_keymaps_highlight_mode",
    function enable () {
        add_hook("set_input_mode_hook", minibuffer_keymaps_highlight_update);
    },
    function disable () {
        remove_hook("set_input_mode_hook", minibuffer_keymaps_highlight_update);
        for_each_window(function (w) {
            var mb = w.document.getElementById("minibuffer");
            if (mb)
                dom_remove_class("highlight");
        });
    });

minibuffer_keymaps_highlight_mode(true);


provide("buffer");
