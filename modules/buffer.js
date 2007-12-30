function define_buffer_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (buffer) {
        run_hooks(this, arguments);
        if (hook_name in buffer.frame)
            run_hooks(buffer.frame[hook_name], arguments);
        if (hook_name in buffer)
            run_hooks(buffer[hook_name], arguments);
    }
}

function define_current_buffer_hook(hook_name, existing_hook)
{
    define_buffer_local_hook(hook_name);
    add_hook(existing_hook, function (buffer) {
            if (!buffer.frame.buffers || buffer != buffer.frame.buffers.current)
                return;
            var hook = conkeror[hook_name];
            hook.run.apply(hook, Array.prototype.slice.call(arguments));
        });
}

define_buffer_local_hook("buffer_title_change_hook");
define_buffer_local_hook("select_buffer_hook");
define_buffer_local_hook("buffer_scroll_hook");

define_current_buffer_hook("current_buffer_title_change_hook", "buffer_title_change_hook");
define_current_buffer_hook("current_buffer_scroll_hook", "buffer_scroll_hook");

function buffer(context_buffer)
{
    if (context_buffer != null)
        this.cwd = context_buffer.cwd;

    else
        this.cwd = default_directory.path;
}

buffer.prototype = {
    /* Saved focus state */
    saved_focused_window : null,
    saved_focused_element : null,
    on_switch_to : null,
    on_switch_away : null,
    // get title ()   [must be defined by subclasses]
    // get name ()    [must be defined by subclasses]
    dead : false, /* This is set when the buffer is killed */

    get scrollX () { return 0; },
    get scrollY () { return 0; },
    get scrollMaxX () { return 0; },
    get scrollMaxY () { return 0; }

    // focused_window()
    // focused_element()
};


function buffer_container(frame)
{
    this.frame = frame;
    this.container = frame.document.getElementById("buffer-container");

    /* FIXME: Once we support alternative XUL files that have an
     * initial buffer that is not a browser buffer, this needs to be
     * fixed. */
    var buffer = new browser_buffer(frame, $element = this.container.firstChild);
    if (frame.cwd_arg != null) {
        buffer.cwd = frame.cwd_arg;
        delete frame.cwd_arg;
    }
}

buffer_container.prototype = {
    constructor : buffer_container.constructor,

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
        old_value.saved_focused_window = this.frame.document.commandDispatcher.focusedWindow;
        old_value.saved_focused_element = this.frame.document.commandDispatcher.focusedElement;

        if (old_value.on_switch_away)
            old_value.on_switch_away();
    },

    _switch_to : function (buffer) {
        // Select new buffer in the XUL deck
        this.container.selectedPanel = buffer.element;

        if (buffer.on_switch_to)
            buffer.on_switch_to();

        /**
         * This next focus call seems to be needed to avoid focus
         * somehow getting lost (and the keypress handler therefore
         * not getting called at all) when killing buffers.
         */
        this.frame.focus();

        // Restore focus state
        if (buffer.saved_focused_element)
            set_focus_no_scroll(this.frame, buffer.saved_focused_element);
        else if (buffer.saved_focused_window)
            set_focus_no_scroll(this.frame, buffer.saved_focused_window);

        buffer.saved_focused_element = null;
        buffer.saved_focused_window = null;
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

function buffer_initialize_frame_early(frame)
{
    frame.buffers = new buffer_container(frame);
}

add_hook("frame_initialize_early_hook", buffer_initialize_frame_early);

I.current_buffer = interactive_method(
    $doc = "Current buffer",
    $sync = function (ctx, type) {
        var buffer = ctx.frame.buffers.current;
        if (type && !(buffer instanceof type))
            throw interactive_error("Current buffer is of invalid type");
        return buffer;
    });

define_keywords("$default");
I.b = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "Buffer:",
                 $default = ctx.frame.buffers.current,
                 $history = "buffer");
        var completer = all_word_completer(
            $completions = function (visitor) {
                ctx.frame.buffers.for_each(visitor);
            },
            $get_string = function (x) {
                return x.name;
            },
            $get_description = function (x) {
                return x.title;
            },
            $complete_blank);
        ctx.frame.minibuffer.read(
            $prompt = arguments.$prompt,
            $history = arguments.$history,
            $completer = completer,
            $match_required = true,
            $default_completion = arguments.$default,
            $callback = cont);
    });

I.cwd = interactive_method(
    $sync = function (ctx) {
        return ctx.frame.buffers.current.cwd;
    });

function buffer_next (frame, count)
{
    var index = frame.buffers.selected_index;
    var total = frame.buffers.count;
    index = (index + count) % total;
    if (index < 0)
        index += total;
    frame.buffers.current = frame.buffers.get_buffer(index);
}
interactive("buffer-next",
            "Switch to the next buffer.",
            buffer_next, I.current_frame, I.p);
interactive("buffer-previous",
            "Switch to the previous buffer.",
            buffer_next, I.current_frame, I.bind(function (x) {return -x;}, I.p));


function switch_to_buffer (frame, buffer)
{
    if (buffer && !buffer.dead)
        frame.buffers.current = buffer;
}
interactive("switch-to-buffer",
            "Switch to a buffer specified in the minibuffer.",
            switch_to_buffer,
            I.current_frame,
            I.b($prompt = "Switch to buffer:",
                $default = I.bind(function(frame) {
                        return frame.buffers.get_buffer((frame.buffers.selected_index + 1) % frame.buffers.count);
                    }, I.current_frame)));

/* USER PREFERENCE */
/* If this is set to true, kill-buffer can kill the last remaining
 * buffer, and close the window. */
var can_kill_last_buffer = false;

function kill_buffer(buffer)
{
    if (!buffer)
        return;
    var buffers = buffer.frame.buffers;
    if (buffers.count == 1 && buffer == buffers.current) {
        if (can_kill_last_buffer) {
            delete_frame(buffer.frame);
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
    buffer.cwd = dir;
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

require_later("browser_buffer.js");
