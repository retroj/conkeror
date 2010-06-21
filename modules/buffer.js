/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2010 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

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
define_buffer_local_hook("select_buffer_hook");
define_buffer_local_hook("create_buffer_early_hook");
define_buffer_local_hook("create_buffer_hook");
define_buffer_local_hook("kill_buffer_hook");
define_buffer_local_hook("buffer_scroll_hook");
define_buffer_local_hook("buffer_dom_content_loaded_hook");
define_buffer_local_hook("buffer_loaded_hook");

define_current_buffer_hook("current_buffer_title_change_hook", "buffer_title_change_hook");
define_current_buffer_hook("current_buffer_description_change_hook", "buffer_description_change_hook");
define_current_buffer_hook("current_buffer_scroll_hook", "buffer_scroll_hook");
define_current_buffer_hook("current_buffer_dom_content_loaded_hook", "buffer_dom_content_loaded_hook");


define_keywords("$opener");
function buffer_creator (type) {
    var args = forward_keywords(arguments);
    return function (window) {
        return new type(window, args);
    };
}

define_variable("allow_browser_window_close", true,
    "If this is set to true, if a content buffer page calls " +
    "window.close() from JavaScript and is not prevented by the " +
    "normal Mozilla mechanism that restricts pages from closing " +
    "a window that was not opened by a script, the buffer will be " +
    "killed, deleting the window as well if it is the only buffer.");

function buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    this.opener = arguments.$opener;
    this.window = window;
    var element = create_XUL(window, "vbox");
    element.setAttribute("flex", "1");
    var browser = create_XUL(window, "browser");
    if (window.buffers.count == 0)
        browser.setAttribute("type", "content-primary");
    else
        browser.setAttribute("type", "content");
    browser.setAttribute("flex", "1");
    browser.setAttribute("autocompletepopup", "popup_autocomplete");
    element.appendChild(browser);
    this.window.buffers.container.appendChild(element);
    this.window.buffers.buffer_list.push(this);
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

    this.browser.addEventListener("load", function (event) {
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

    this.modalities = [];

    // When create_buffer_hook_early runs, basic buffer properties
    // will be available, but not the properties subclasses.
    create_buffer_early_hook.run(this);

    this.constructor_end();
}
buffer.prototype = {
    constructor: buffer,

    /* Saved focus state */
    saved_focused_frame: null,
    saved_focused_element: null,

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
        if (this.input_mode)
            conkeror[this.input_mode](this, false);
        this.keymaps = [];
        this.modalities.map(function (m) m(this), this);
    },

    override_keymaps: function (keymaps) {
        if (keymaps) {
            this.keymaps = keymaps;
            this.set_input_mode = function () {};
            if (this.input_mode)
                conkeror[this.input_mode](this, false);
        } else {
            delete this.set_input_mode;
            this.set_input_mode();
        }
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
        var child_docshells = this.doc_shell.getDocShellEnumerator(
            Ci.nsIDocShellTreeItem.typeContent,
            Ci.nsIDocShell.ENUMERATE_FORWARDS);
        while (child_docshells.hasMoreElements()) {
            let ds = child_docshells.getNext()
                .QueryInterface(Ci.nsIDocShell);
            if (ds.hasFocus) {
                let display = ds.QueryInterface(Ci.nsIInterfaceRequestor)
                    .getInterface(Ci.nsISelectionDisplay);
                if (! display)
                    return null;
                return display.QueryInterface(Ci.nsISelectionController);
            }
        }
        return this.doc_shell
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
    window.buffers = this;
    create_initial_buffer(window);
}
buffer_container.prototype = {
    constructor: buffer_container,

    get current () {
        return this.container.selectedPanel.conkeror_buffer_object;
    },

    set current (buffer) {
        var old_value = this.current;
        if (old_value == buffer)
            return;

        this.buffer_list.splice(this.buffer_list.indexOf(buffer), 1);
        this.buffer_list.unshift(buffer);

        this._switch_away_from(this.current);
        this._switch_to(buffer);

        // Run hooks
        select_buffer_hook.run(buffer);
    },

    _switch_away_from: function (old_value) {
        // Save focus state
        old_value.saved_focused_frame = old_value.focused_frame;
        old_value.saved_focused_element = old_value.focused_element;

        old_value.browser.setAttribute("type", "content");
    },

    _switch_to: function (buffer) {
        // Select new buffer in the XUL deck
        this.container.selectedPanel = buffer.element;

        buffer.browser.setAttribute("type", "content-primary");

        /**
         * This next focus call seems to be needed to avoid focus
         * somehow getting lost (and the keypress handler therefore
         * not getting called at all) when killing buffers.
         */
        this.window.focus();

        // Restore focus state
        buffer.browser.focus();
        if (buffer.saved_focused_element)
            set_focus_no_scroll(this.window, buffer.saved_focused_element);
        else if (buffer.saved_focused_frame)
            set_focus_no_scroll(this.window, buffer.saved_focused_frame);

        buffer.saved_focused_element = null;
        buffer.saved_focused_frame = null;

        this.window.minibuffer.set_default_message(buffer.default_message);
    },

    get count () {
        return this.container.childNodes.length;
    },

    get_buffer: function (index) {
        if (index >= 0 && index < this.count)
            return this.container.childNodes.item(index).conkeror_buffer_object;
        return null;
    },

    get selected_index () {
        var nodes = this.container.childNodes;
        var count = nodes.length;
        for (var i = 0; i < count; ++i)
            if (nodes.item(i) == this.container.selectedPanel)
                return i;
        return null;
    },

    index_of: function (b) {
        var nodes = this.container.childNodes;
        var count = nodes.length;
        for (var i = 0; i < count; ++i)
            if (nodes.item(i) == b.element)
                return i;
        return null;
    },

    get unique_name_list () {
        var existing_names = new string_hashset();
        var bufs = [];
        this.for_each(function(b) {
                var base_name = b.name;
                var name = base_name;
                var index = 1;
                while (existing_names.contains(name)) {
                    ++index;
                    name = base_name + "<" + index + ">";
                }
                existing_names.add(name);
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
        var new_buffer = this.buffer_list[0];
        var changed = false;
        if (b == new_buffer) {
            new_buffer = this.buffer_list[1];
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
        this.container.removeChild(element);
        this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
        this._switch_to(new_buffer);
        if (changed) {
            select_buffer_hook.run(new_buffer);
            this.buffer_list.splice(this.buffer_list.indexOf(new_buffer), 1);
            this.buffer_list.unshift(new_buffer);
        }
        kill_buffer_hook.run(b);
        return true;
    },

    bury_buffer: function (b) {
        var new_buffer = this.buffer_list[0];
        if (b == new_buffer)
            new_buffer = this.buffer_list[1];
        this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
        this.buffer_list.push(b);
        this.current = new_buffer;
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
minibuffer_auto_complete_preferences["buffer"] = true;
define_keywords("$default");
minibuffer.prototype.read_buffer = function () {
    var window = this.window;
    var buffer = this.window.buffers.current;
    keywords(arguments, $prompt = "Buffer:",
             $default = buffer,
             $history = "buffer");
    var completer = all_word_completer(
        $completions = function (visitor) window.buffers.for_each(visitor),
        $get_string = function (x) x.description,
        $get_description = function (x) x.title);
    var result = yield this.read(
        $keymap = read_buffer_keymap,
        $prompt = arguments.$prompt,
        $history = arguments.$history,
        $completer = completer,
        $match_required = true,
        $auto_complete = "buffer",
        $auto_complete_initial = true,
        $auto_complete_delay = 0,
        $default_completion = arguments.$default);
    yield co_return(result);
};


interactive("buffer-reset-input-mode",
    "Force a reset of the input mode.  Used by quote-next.",
    function (I) {
        I.buffer.set_input_mode();
    });


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
    "Switch to a buffer specified in the minibuffer.",
    function (I) {
        switch_to_buffer(
            I.window,
            (yield I.minibuffer.read_buffer(
                $prompt = "Switch to buffer:",
                $default = (I.window.buffers.count > 1 ?
                            I.window.buffers.buffer_list[1] :
                            I.buffer))));
    });

define_variable("can_kill_last_buffer", true,
    "If this is set to true, kill-buffer can kill the last "+
    "remaining buffer, and close the window.");

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
    "Bury the current buffer.\n Put the current buffer at the end of " +
    "the buffer list, so that it is the least likely buffer to be " +
    "selected by `switch-to-buffer'.",
    function (I) { I.window.buffers.bury_buffer(I.buffer); });

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
        clear_selection(buffer);
        if (active) {
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
    "frames, iframes, plugins, and also for clearing the selection.  "+
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
 * BUFFER MODES
 */

var mode_functions = {};
var mode_display_names = {};

define_buffer_local_hook("buffer_mode_change_hook");
define_current_buffer_hook("current_buffer_mode_change_hook", "buffer_mode_change_hook");

define_keywords("$display_name", "$class", "$enable", "$disable", "$doc");
function define_buffer_mode (name) {
    keywords(arguments);

    var hyphen_name = name.replace("_","-","g");
    var display_name = arguments.$display_name;
    var mode_class = arguments.$class;
    var enable = arguments.$enable;
    var disable = arguments.$disable;

    mode_display_names[name] = display_name;

    var can_disable;

    if (disable == false) {
        can_disable = false;
        disable = null;
    } else
        can_disable = true;

    var state = (mode_class != null) ? mode_class : (name + "_enabled");
    var enable_hook_name = name + "_enable_hook";
    var disable_hook_name = name + "_disable_hook";
    define_buffer_local_hook(enable_hook_name);
    define_buffer_local_hook(disable_hook_name);

    var change_hook_name = null;

    if (mode_class) {
        mode_functions[name] = { enable: enable,
                                 disable: disable,
                                 mode_class: mode_class,
                                 disable_hook_name: disable_hook_name };
        change_hook_name = mode_class + "_change_hook";
        define_buffer_local_hook(change_hook_name);
    }

    function func (buffer, arg) {
        var old_state = buffer[state];
        var cur_state = (old_state == name);
        var new_state = (arg == null) ? !cur_state : (arg > 0);
        if ((new_state == cur_state) || (!can_disable && !new_state))
            // perhaps show a message if (!can_disable && !new_state)
            // to tell the user that this mode cannot be disabled.  do
            // we have any existing modes that would benefit by it?
            return null;
        if (new_state) {
            if (mode_class && old_state != null)  {
                // Another buffer-mode of our same mode-class is
                // enabled.  Buffer-modes within a mode-class are
                // mutually exclusive, so turn the old one off.
                buffer.enabled_modes.splice(buffer.enabled_modes.indexOf(old_state), 1);
                let x = mode_functions[old_state];
                let y = x.disable;
                if (y) y(buffer);
                conkeror[x.disable_hook_name].run(buffer);
            }
            buffer[state] = name;
            if (enable)
                enable(buffer);
            conkeror[enable_hook_name].run(buffer);
            buffer.enabled_modes.push(name);
        } else {
            buffer.enabled_modes.splice(buffer.enabled_modes.indexOf(name), 1);
            disable(buffer);
            conkeror[disable_hook_name].run(buffer);
            buffer[state] = null;
        }
        if (change_hook_name)
            conkeror[change_hook_name].run(buffer, buffer[state]);
        buffer_mode_change_hook.run(buffer);
        return new_state;
    }

    conkeror[name] = func;
    interactive(hyphen_name, arguments.$doc, function (I) {
        var arg = I.P;
        var new_state = func(I.buffer, arg && univ_arg_to_number(arg));
        I.minibuffer.message(hyphen_name + (new_state ? " enabled" : " disabled"));
    });
}
ignore_function_for_get_caller_source_code_reference("define_buffer_mode");


function minibuffer_mode_indicator (window) {
    this.window = window;
    var element = create_XUL(window, "label");
    element.setAttribute("id", "minibuffer-mode-indicator");
    element.collapsed = true;
    element.setAttribute("class", "minibuffer");
    window.document.getElementById("minibuffer").appendChild(element);
    this.element = element;
    this.hook_func = method_caller(this, this.update);
    add_hook.call(window, "select_buffer_hook", this.hook_func);
    add_hook.call(window, "current_buffer_mode_change_hook", this.hook_func);
    this.update();
}
minibuffer_mode_indicator.prototype = {
    constructor: minibuffer_mode_indicator,
    update: function () {
        var buf = this.window.buffers.current;
        var modes = buf.enabled_modes;
        var str = modes.map(
            function (x) {
                let y = mode_display_names[x];
                if (y)
                    return "[" + y + "]";
                else
                    return null;
            }).filter(function (x) x != null).join(" ");
        this.element.collapsed = (str.length == 0);
        this.element.value = str;
    },
    uninstall: function () {
        remove_hook.call(window, "select_buffer_hook", this.hook_fun);
        remove_hook.call(window, "current_buffer_mode_change_hook", this.hook_fun);
        this.element.parentNode.removeChild(this.element);
    }
};
define_global_window_mode("minibuffer_mode_indicator", "window_initialize_hook");
minibuffer_mode_indicator_mode(true);



/*
 * INPUT MODES
 */
define_current_buffer_hook("current_buffer_input_mode_change_hook", "input_mode_change_hook");
define_keywords("$display_name", "$doc");
function define_input_mode (base_name, keymap_name) {
    keywords(arguments);
    var name = base_name + "_input_mode";
    define_buffer_mode(name,
                       $class = "input_mode",
                       $enable = function (buffer) {
                           check_buffer(buffer, content_buffer);
                           buffer.keymaps.push(conkeror[keymap_name]);
                       },
                       $disable = function (buffer) {
                           var i = buffer.keymaps.indexOf(conkeror[keymap_name]);
                           if (i > -1)
                               buffer.keymaps.splice(i, 1);
                       },
                       forward_keywords(arguments));
}
ignore_function_for_get_caller_source_code_reference("define_input_mode");


function minibuffer_input_mode_indicator (window) {
    this.window = window;
    this.hook_func = method_caller(this, this.update);
    add_hook.call(window, "select_buffer_hook", this.hook_func);
    add_hook.call(window, "current_buffer_input_mode_change_hook", this.hook_func);
    this.update();
}
minibuffer_input_mode_indicator.prototype = {
    constructor: minibuffer_input_mode_indicator,
    update: function () {
        var buf = this.window.buffers.current;
        var mode = buf.input_mode;
        var classname = mode ? ("minibuffer-" + buf.input_mode.replace("_","-","g")) : "";
        this.window.minibuffer.element.className = classname;
    },
    uninstall: function () {
        remove_hook.call(window, "select_buffer_hook", this.hook_func);
        remove_hook.call(window, "current_buffer_input_mode_change_hook", this.hook_func);
    }
};

define_global_window_mode("minibuffer_input_mode_indicator", "window_initialize_hook");
minibuffer_input_mode_indicator_mode(true);

provide("buffer");
