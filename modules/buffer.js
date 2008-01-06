function define_buffer_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (buffer) {
        run_hooks(this, arguments);
        if (hook_name in buffer.window)
            run_hooks(buffer.window[hook_name], arguments);
        if (hook_name in buffer)
            run_hooks(buffer[hook_name], arguments);
    }
}

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
define_buffer_local_hook("buffer_scroll_hook");
define_buffer_local_hook("buffer_dom_content_loaded_hook");
define_buffer_local_hook("buffer_loaded_hook");

define_current_buffer_hook("current_buffer_title_change_hook", "buffer_title_change_hook");
define_current_buffer_hook("current_buffer_description_change_hook", "buffer_description_change_hook");
define_current_buffer_hook("current_buffer_scroll_hook", "buffer_scroll_hook");

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

/* USER PREFERENCE */
/* If this is set to true, if a content buffer page calls
 * window.close() from JavaScript and is not prevented by the normal
 * Mozilla mechanism that restricts pages from closing a window that
 * was not opened by a script, the buffer will be killed, deleting the
 * window as well if it is the only buffer. */
var allow_browser_window_close = true;

function buffer(window, element)
{
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
        element.appendChild(browser);
        this.window.buffers.container.appendChild(element);
    }
    this.element = element;
    this.browser = element.firstChild;
    this.element.conkeror_buffer_object = this;

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

    /* General accessors */
    get cwd () { return this.configuration.cwd; },

    /* Browser accessors */
    get top_frame () { return this.browser.contentWindow; },
    get top_document () { return this.browser.contentDocument; },
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
    }
};


function buffer_container(window, create_initial_buffer)
{
    this.window = window;
    this.container = window.document.getElementById("buffer-container");

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
        // TODO: call hook here
        var new_buffer = this.current;
        var changed = false;
        if (b == this.current)
        {
            var index = this.selected_index;
            index = (index + 1) % count;
            new_buffer = this.get_buffer(index);
            changed = true;
        }
        this._switch_away_from(this.current);
        this.container.removeChild(b.element);
        this._switch_to(new_buffer);
        if (changed)
            select_buffer_hook.run(new_buffer);
        b.dead = true;
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
    window.buffers = new buffer_container(window, create_initial_buffer);
}

add_hook("window_initialize_early_hook", buffer_initialize_window_early);


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
default_browse_targets["open"] = [OPEN_CURRENT_BUFFER, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["follow"] = [FOLLOW_DEFAULT, OPEN_NEW_BUFFER, OPEN_NEW_WINDOW];
default_browse_targets["follow-top"] = [FOLLOW_TOP_FRAME, FOLLOW_CURRENT_FRAME];

I.browse_target = interactive_method(
    $sync = function (ctx, action) {
        var prefix = ctx.prefix_argument;
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
    });

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
function create_buffer_in_current_window(creator, target) {
    if (target == OPEN_NEW_WINDOW)
        throw new Error("invalid target");
    var window = get_recent_conkeror_window();
    if (window) {
        create_buffer(window, creator, target);
    } else if (queued_buffer_creators != null) {
        queued_buffer_creators.push([creator,target]);
    } else {
        queued_buffer_creators = [];
        window = make_window(creator);
        add_hook.call(window, "window_initialize_late_hook", _process_queued_buffer_creators);
    }
}

I.current_buffer = interactive_method(
    $doc = "Current buffer",
    $sync = function (ctx, type) {
        if (type && !(ctx.buffer instanceof type))
            throw interactive_error("Current buffer is of invalid type");
        return ctx.buffer;
    });


I.focused_element = interactive_method(
    $sync =  function (ctx) {
        return ctx.buffer.focused_element;
    });

I.current_frame = interactive_method(
    $sync = function (ctx) {
        return ctx.buffer.focused_frame;
    });

I.top_frame = interactive_method(
    $sync = function (ctx) {
        return ctx.buffer.top_frame;
    });

// This name should perhaps change
I.top_document = interactive_method(
    $sync = function (ctx) {
        return ctx.buffer.top_document;
    });

// This name should perhaps change
I.active_document = I.top_document;

define_keywords("$default");
I.b = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "Buffer:",
                 $default = ctx.buffer,
                 $history = "buffer");
        var completer = all_word_completer(
            $completions = function (visitor) {
                ctx.window.buffers.for_each(visitor);
            },
            $get_string = function (x) {
                return x.description;
            },
            $get_description = function (x) {
                return x.title;
            },
            $complete_blank);
        ctx.window.minibuffer.read(
            $prompt = arguments.$prompt,
            $history = arguments.$history,
            $completer = completer,
            $match_required = true,
            $default_completion = arguments.$default,
            $callback = cont);
    });

I.cwd = interactive_method(
    $sync = function (ctx) {
        return ctx.buffer.cwd;
    });

I.buffer_configuration = interactive_method(
    $sync = function (ctx) {
        return ctx.buffer.configuration;
    });

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
            buffer_next, I.current_window, I.p);
interactive("buffer-previous",
            "Switch to the previous buffer.",
            buffer_next, I.current_window, I.bind(function (x) {return -x;}, I.p));


function switch_to_buffer (window, buffer)
{
    if (buffer && !buffer.dead)
        window.buffers.current = buffer;
}
interactive("switch-to-buffer",
            "Switch to a buffer specified in the minibuffer.",
            switch_to_buffer,
            I.current_window,
            I.b($prompt = "Switch to buffer:",
                $default = I.bind(function(window) {
                        return window.buffers.get_buffer((window.buffers.selected_index + 1) % window.buffers.count);
                    }, I.current_window)));

/* USER PREFERENCE */
/* If this is set to true, kill-buffer can kill the last remaining
 * buffer, and close the window. */
var can_kill_last_buffer = true;

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
            kill_buffer,
            I.b($prompt = "Kill buffer:"));

interactive("kill-current-buffer",
            "Kill the current buffer.\n" +
            "If `can_kill_last_buffer' is set to true, an attempt to kill the last remaining " +
            "buffer in a window will cause the window to be closed.",
            kill_buffer, I.current_buffer);

function change_directory(buffer, dir) {
    buffer.configuration.cwd = dir;
}
interactive("change-current-directory",
            "Change the current directory of the selected buffer.",
            change_directory,
            I.current_buffer,
            I.bind(function (x) { return x.path; },
                   I.f($prompt = "New current directory:",
                       $initial_value = I.cwd)));


interactive("shell-command",
            shell_command,
            $$ = I.cwd,
            I.shell_command($prompt = I.bind(function (cwd) {
                        return "Shell command [" + cwd + "]:";
                    }, $$)));


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
interactive("unfocus", unfocus, I.current_buffer);

require_later("content-buffer.js");
