/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2008 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var define_buffer_local_hook = local_hook_definer("window");

function define_current_buffer_hook(hook_name, existing_hook)
{
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
define_buffer_local_hook("create_buffer_hook");
define_buffer_local_hook("kill_buffer_hook");
define_buffer_local_hook("buffer_scroll_hook");
define_buffer_local_hook("buffer_dom_content_loaded_hook");
define_buffer_local_hook("buffer_loaded_hook");

define_current_buffer_hook("current_buffer_title_change_hook", "buffer_title_change_hook");
define_current_buffer_hook("current_buffer_description_change_hook", "buffer_description_change_hook");
define_current_buffer_hook("current_buffer_scroll_hook", "buffer_scroll_hook");
define_current_buffer_hook("current_buffer_dom_content_loaded_hook", "buffer_dom_content_loaded_hook");

function buffer_configuration(existing_configuration) {
    if (existing_configuration != null) {
        this.cwd = existing_configuration.cwd;
    }
    else {
        this.cwd = default_directory.path;
    }
}

define_keywords("$configuration", "$element");
function buffer_creator(type) {
    var args = forward_keywords(arguments);
    return function (window, element) {
        return new type(window, element, args);
    }
}

define_variable("allow_browser_window_close", true,
                     "If this is set to true, if a content buffer page calls " +
                     "window.close() from JavaScript and is not prevented by the " +
                     "normal Mozilla mechanism that restricts pages from closing " +
                     "a window that was not opened by a script, the buffer will be " +
                     "killed, deleting the window as well if it is the only buffer.");

function buffer(window, element)
{
    this.constructor_begin();
    keywords(arguments, $configuration = null);
    this.window = window;
    this.configuration = new buffer_configuration(arguments.$configuration);
    if (element == null)
    {
        element = create_XUL(window, "vbox");
        element.setAttribute("flex", "1");
        var browser = create_XUL(window, "browser");
        browser.setAttribute("type", "content");
        browser.setAttribute("flex", "1");
        browser.setAttribute("autocompletepopup", "popup_autocomplete");
        element.appendChild(browser);
        this.window.buffers.container.appendChild(element);
    } else {
        /* Manually set up session history.
         *
         * This is needed because when constructor for the XBL binding
         * (mozilla/toolkit/content/widgets/browser.xml#browser) for
         * the initial browser element of the window is called, the
         * docShell is not yet initialized and setting up the session
         * history will fail.  To work around this problem, we do as
         * tabbrowser.xml (Firefox) does and set the initial browser
         * to have the disablehistory=true attribute, and then repeat
         * the work that would normally be done in the XBL
         * constructor.
         */

        // This code is taken from mozilla/browser/base/content/browser.js
        let browser = element.firstChild;
        browser.webNavigation.sessionHistory =
            Cc["@mozilla.org/browser/shistory;1"].createInstance(Ci.nsISHistory);
        observer_service.addObserver(browser, "browser:purge-session-history", false);

        // remove the disablehistory attribute so the browser cleans up, as
        // though it had done this work itself
        browser.removeAttribute("disablehistory");

        // enable global history
        browser.docShell.QueryInterface(Ci.nsIDocShellHistory).useGlobalHistory = true;
    }
    this.window.buffers.buffer_list.push(this);
    this.element = element;
    this.browser = element.firstChild;
    this.element.conkeror_buffer_object = this;

    this.enabled_modes = [];
    this.local_variables = {};

    var buffer = this;

    this.browser.addEventListener("scroll", function (event) {
            buffer_scroll_hook.run(buffer);
        }, true /* capture */, false /* ignore untrusted events */);

    this.browser.addEventListener("DOMContentLoaded", function (event) {
            buffer_dom_content_loaded_hook.run(buffer);
        }, true /* capture */, false /*ignore untrusted events */);

    this.browser.addEventListener("load", function (event) {
            buffer_loaded_hook.run(buffer);
        }, true /* capture */, false /*ignore untrusted events */);

    this.browser.addEventListener("DOMWindowClose", function (event) {
            /* This call to preventDefault is very important; without
             * it, somehow Mozilla does something bad and as a result
             * the window loses focus, causing keyboard commands to
             * stop working. */
            event.preventDefault();

            if (allow_browser_window_close)
                kill_buffer(buffer, true);
        }, true);

    this.constructor_end();
}

buffer.prototype = {
    /* Saved focus state */
    saved_focused_frame : null,
    saved_focused_element : null,
    on_switch_to : null,
    on_switch_away : null,
    // get title ()   [must be defined by subclasses]
    // get name ()    [must be defined by subclasses]
    dead : false, /* This is set when the buffer is killed */

    default_message : "",

    get : function (x) {
        if (x in this.local_variables)
            return this.local_variables[x];
        return conkeror[x];
    },

    set_default_message : function (str) {
        this.default_message = str;
        if (this == this.window.buffers.current)
            this.window.minibuffer.set_default_message(str);
    },

    constructors_running : 0,

    constructor_begin : function () {
        this.constructors_running++;
    },

    constructor_end : function () {
        if (--this.constructors_running == 0)
            create_buffer_hook.run(this);
    },

    /* General accessors */
    get cwd () { return this.configuration.cwd; },

    /* Browser accessors */
    get top_frame () { return this.browser.contentWindow; },
    get document () { return this.browser.contentDocument; },
    get web_navigation () { return this.browser.webNavigation; },
    get doc_shell () { return this.browser.docShell; },
    get markup_document_viewer () { return this.browser.markupDocumentViewer; },
    get current_URI () { return this.browser.currentURI; },

    is_child_element : function (element)
    {
        return (element && this.is_child_frame(element.ownerDocument.defaultView));
    },

    is_child_frame : function (frame)
    {
        return (frame && frame.top == this.top_frame);
    },

    // This method is like focused_frame, except that if no content
    // frame actually has focus, this returns null.
    get focused_frame_or_null () {
        var frame = this.window.document.commandDispatcher.focusedWindow;
        var top = this.top_frame;
        if (this.is_child_frame(frame))
            return frame;
        return null;
    },

    get focused_frame () {
        var frame = this.window.document.commandDispatcher.focusedWindow;
        var top = this.top_frame;
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

    do_command : function (command)
    {
        function attempt_command(element, command)
        {
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
        do  {
            if (attempt_command(win, command))
                return;
            if (!win.parent || win == win.parent)
                break;
            win = win.parent;
        } while (true);
    },

    handle_kill : function () {
        this.dead = true;
        this.browser = null;
        this.element = null;
        this.saved_focused_frame = null;
        this.saved_focused_element = null;
        kill_buffer_hook.run(this);
    }
};

function check_buffer(obj, type) {
    if (!(obj instanceof type))
        throw interactive_error("Buffer has invalid type.");
    if (obj.dead)
        throw interactive_error("Buffer has already been killed.");
    return obj;
}

function buffer_container(window, create_initial_buffer)
{
    this.window = window;
    this.container = window.document.getElementById("buffer-container");
    this.buffer_list = [];
    window.buffers = this;

    create_initial_buffer(window, this.container.firstChild);
}

buffer_container.prototype = {
    constructor : buffer_container,

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

    _switch_away_from : function (old_value) {
        // Save focus state
        old_value.saved_focused_frame = old_value.focused_frame;
        old_value.saved_focused_element = old_value.focused_element;

        old_value.browser.setAttribute("type", "content");
    },

    _switch_to : function (buffer) {
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

    get_buffer : function (index) {
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

    index_of : function (b) {
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
                while (existing_names.contains(name))
                {
                    ++index;
                    name = base_name + "<" + index + ">";
                }
                existing_names.add(name);
                bufs.push([name, b]);
            });
        return bufs;
    },

    kill_buffer : function (b) {
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
        this.container.removeChild(b.element);
        this.buffer_list.splice(this.buffer_list.indexOf(b), 1);
        this._switch_to(new_buffer);
        if (changed) {
            select_buffer_hook.run(new_buffer);
            this.buffer_list.splice(this.buffer_list.indexOf(new_buffer), 1);
            this.buffer_list.unshift(new_buffer);
        }
        b.handle_kill();
        return true;
    },

    for_each : function (f) {
        var count = this.count;
        for (var i = 0; i < count; ++i)
            f(this.get_buffer(i));
    }
};

function buffer_initialize_window_early(window)
{
    /**
     * Use content_buffer by default to handle an unusual case where
     * browser.chromeURI is used perhaps.  In general this default
     * should not be needed.
     */

    var create_initial_buffer
        = window.args.initial_buffer_creator || buffer_creator(content_buffer);
    new buffer_container(window, create_initial_buffer);
}

add_hook("window_initialize_early_hook", buffer_initialize_window_early);


define_buffer_local_hook("buffer_kill_before_hook", RUN_HOOK_UNTIL_FAILURE);
function buffer_before_window_close(window)
{
    var bs = window.buffers;
    var count = bs.count;
    for (let i = 0; i < count; ++i) {
        if (!buffer_kill_before_hook.run(bs.get_buffer(i)))
            return false;
    }
    return true;
}
add_hook("window_before_close_hook", buffer_before_window_close);

function buffer_window_close_handler(window)
{
    var bs = window.buffers;
    var count = bs.count;
    for (let i = 0; i < count; ++i) {
        let b = bs.get_buffer(i);
        b.handle_kill();
    }
}
add_hook("window_close_hook", buffer_window_close_handler);

/* open/follow targets */
const OPEN_CURRENT_BUFFER = 0; // only valid for open if the current
                               // buffer is a content_buffer; for
                               // follow, equivalent to
                               // FOLLOW_TOP_FRAME.
const OPEN_NEW_BUFFER = 1;
const OPEN_NEW_BUFFER_BACKGROUND = 2;
const OPEN_NEW_WINDOW = 3;

const FOLLOW_DEFAULT = 4; // for open, implies OPEN_CURRENT_BUFFER
const FOLLOW_CURRENT_FRAME = 5; // for open, implies OPEN_CURRENT_BUFFER
const FOLLOW_TOP_FRAME = 6; // for open, implies OPEN_CURRENT_BUFFER

var TARGET_PROMPTS = [" in current buffer",
                      " in new buffer",
                      " in new buffer (background)",
                      " in new window",
                      "",
                      " in current frame",
                      " in top frame"];

var TARGET_NAMES = ["current buffer",
                    "new buffer",
                    "new buffer (background)",
                    "new window",
                    "default",
                    "current frame",
                    "top frame"];


function browse_target_prompt(target, prefix) {
    if (prefix == null)
        prefix = "Open URL";
    return prefix + TARGET_PROMPTS[target] + ":";
}


var default_browse_targets = {};
default_browse_targets["follow"] = [FOLLOW_DEFAULT, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["follow-top"] = [FOLLOW_TOP_FRAME, FOLLOW_CURRENT_FRAME];

interactive_context.prototype.browse_target = function (action) {
    var prefix = this.prefix_argument;
    var targets = action;
    while (typeof(targets) == "string")
        targets = default_browse_targets[targets];
    if (prefix == null || typeof(prefix) != "object")
        return targets[0];
    var num = prefix[0];
    var index = 0;
    while (num >= 4 && index + 1 < targets.length) {
        num = num / 4;
        index++;
    }
    return targets[index];
};

function create_buffer(window, creator, target) {
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

var queued_buffer_creators = null;
function _process_queued_buffer_creators(window) {
    for (var i = 0; i < queued_buffer_creators.length; ++i) {
        var x = queued_buffer_creators[i];
        create_buffer(window, x[0], x[1]);
    }
    queued_buffer_creators = null;
}
function create_buffer_in_current_window(creator, target, focus_existing) {
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
        add_hook.call(window, "window_initialize_late_hook", _process_queued_buffer_creators);
    }
}

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

interactive_context.prototype.__defineGetter__("cwd", function () this.buffer.cwd);

function buffer_next (window, count)
{
    var index = window.buffers.selected_index;
    var total = window.buffers.count;
    index = (index + count) % total;
    if (index < 0)
        index += total;
    window.buffers.current = window.buffers.get_buffer(index);
}
interactive("buffer-next",
            "Switch to the next buffer.",
            function (I) {buffer_next(I.window, I.p);});
interactive("buffer-previous",
            "Switch to the previous buffer.",
            function (I) {buffer_next(I.window, -I.p);});

function switch_to_buffer (window, buffer)
{
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
                                    I.buffer)))
                )
            });

define_variable("can_kill_last_buffer", true,
                     "If this is set to true, kill-buffer can kill the last remaining buffer, and close the window.");

function kill_buffer(buffer, force)
{
    if (!buffer)
        return;
    var buffers = buffer.window.buffers;
    if (buffers.count == 1 && buffer == buffers.current) {
        if (can_kill_last_buffer || force) {
            delete_window(buffer.window);
            return;
        }
        else
            throw interactive_error("Can't kill last buffer.");
    }
    buffers.kill_buffer(buffer);
}
interactive("kill-buffer",
            "Kill a buffer specified in the minibuffer.\n" +
            "If `can_kill_last_buffer' is set to true, an attempt to kill the last remaining " +
            "buffer in a window will cause the window to be closed.",
            function (I) {kill_buffer((yield I.minibuffer.read_buffer($prompt = "Kill buffer:")))});

interactive("kill-current-buffer",
            "Kill the current buffer.\n" +
            "If `can_kill_last_buffer' is set to true, an attempt to kill the last remaining " +
            "buffer in a window will cause the window to be closed.",
            function (I) {kill_buffer(I.buffer)});

function change_directory(buffer, dir) {
    buffer.configuration.cwd = dir;
}
interactive("change-current-directory",
            "Change the current directory of the selected buffer.",
            function (I) {
                change_directory(
                    I.buffer,
                    (yield I.minibuffer.read_existing_directory_path(
                        $prompt = "New current directory:",
                        $initial_value = I.cwd)));
            });

interactive("shell-command", function (I) {
    var cwd = I.cwd;
    var cmd = (yield I.minibuffer.read_shell_command($cwd = cwd));
    yield shell_command(cmd, $cwd = cwd);
});

function unfocus(buffer)
{
    var elem = buffer.focused_element;
    if (elem) {
        elem.blur();
        return;
    }
    var win = buffer.focused_frame;
    if (win != buffer.top_frame)
        return;
    buffer.top_frame.focus();
}
interactive("unfocus", function (I) {
    unfocus(I.buffer);
    I.window.minibuffer.message("unfocus");
});

require_later("content-buffer.js");

var mode_functions = {};

var mode_display_names = {};

define_buffer_local_hook("buffer_mode_change_hook");
define_current_buffer_hook("current_buffer_mode_change_hook", "buffer_mode_change_hook");

define_keywords("$class", "$enable", "$disable", "$doc");
function define_buffer_mode(name, display_name) {
    keywords(arguments);

    var hyphen_name = name.replace("_","-","g");
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
        mode_functions[name] = {enable: enable,
                                disable: disable,
                                mode_class: mode_class,
                                disable_hook_name: disable_hook_name};
        change_hook_name = mode_class + "_change_hook";
        define_buffer_local_hook(change_hook_name);
    }

    function func(buffer, arg) {
        var old_state = buffer[state];
        var cur_state = (old_state == name);
        var new_state = (arg == null) ? !cur_state : (arg > 0);
        if ((new_state == cur_state) || (!can_disable && !new_state))
            return null;
        if (new_state) {
            if (mode_class && old_state != null)  {
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
    };
    conkeror[name] = func;
    interactive(hyphen_name, arguments.$doc, function (I) {
        var arg = I.P;
        var new_state = func(I.buffer, arg && univ_arg_to_number(arg));
        I.minibuffer.message(hyphen_name + (new_state ? " enabled" : " disabled"));
    });
}
ignore_function_for_get_caller_source_code_reference("define_buffer_mode");


function minibuffer_mode_indicator(window) {
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
    update : function () {
        var buf = this.window.buffers.current;
        var modes = buf.enabled_modes;
        var str = modes.map( function (x) {
            let y = mode_display_names[x];
            if (y)
                return "[" + y + "]";
            else
                return null;
        } ).filter( function (x) x != null ).join(" ");
        this.element.collapsed = (str.length == 0);
        this.element.value = str;
    },
    uninstall : function () {
        remove_hook.call(window, "select_buffer_hook", this.hook_fun);
        remove_hook.call(window, "current_buffer_mode_change_hook", this.hook_fun);
        this.element.parentNode.removeChild(this.element);
    }
};
define_global_window_mode("minibuffer_mode_indicator", "window_initialize_hook");
minibuffer_mode_indicator_mode(true);
