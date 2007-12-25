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
            if (buffer != buffer.frame.buffers.current)
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

function buffer()
{}

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

    // get focused_window
    // get focused_element
};


function buffer_container(frame)
{
    this.frame = frame;
    this.container = frame.document.getElementById("buffer-container");

    /* FIXME: Once we support alternative XUL files that have an
     * initial buffer that is not a browser buffer, this needs to be
     * fixed. */
    new browser_buffer(frame, this.container.firstChild);
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

        // Save focus state
        old_value.saved_focused_window = this.frame.document.commandDispatcher.focusedWindow;
        old_value.saved_focused_element = this.frame.document.commandDispatcher.focusedElement;

        if (old_value.on_switch_away)
            old_value.on_switch_away();

        // Select new buffer in the XUL deck
        this.container.selectedPanel = buffer.element;

        if (buffer.on_switch_to)
            buffer.on_switch_to();

        // Restore focus state
        if (buffer.saved_focused_element)
            set_focus_no_scroll(this.frame, buffer.saved_focused_element);
        else if (buffer.saved_focused_window)
            set_focus_no_scroll(this.frame, buffer.saved_focused_window);
        buffer.saved_focused_element = null;
        buffer.saved_focused_window = null;

        // Run hooks
        select_buffer_hook.run(buffer);
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
        if (b == this.current)
        {
            var index = this.selected_index;
            index = (index + 1) % count;
            this.current = this.get_buffer(index);
        }
        this.container.removeChild(b.element);
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

function buffer_initialize_frame(frame)
{
    // FIXME: This should probably not be done in this file
    var uris_to_load = [];
    var tag = null;
    if ('arguments' in frame)
    {
        var open_args;
        if (frame.arguments.length == 1)
            open_args = decode_xpcom_structure (frame.arguments[0]);
        else {
            open_args = [];
            for (var i = 0; i < frame.arguments.length; i++) {
                var args = decode_xpcom_structure(frame.arguments[i]);
                open_args = open_args.concat([args]);
            }
        }
        if (0 in open_args && open_args[0] == 'conkeror')
        {
            for (var j = 1; j < open_args.length; j++) {
                var op = open_args[j];
                if (op[0] == 'tag') { tag = op[1]; }
                else if (op[0] == 'find') { uris_to_load = op.slice(1).reverse(); }
            }
        }
    }
    frame.tag = generate_new_frame_tag(tag);

    if (0 in uris_to_load)
        frame.buffers.current.load_URI(uris_to_load[0]);
    for (var i = 1; i < uris_to_load.length; i++) {
        var b = new browser_buffer(frame);
        b.load_URI(uris_to_load[i]);
        frame.buffers.current = b;
    }
}

add_hook("frame_initialize_hook", buffer_initialize_frame);

I.current_buffer = interactive_method(
    $doc = "Current buffer",
    $sync = function (ctx, type) {
        var buffer = ctx.frame.buffers.current;
        if (type && !(buffer instanceof type))
            throw new Error("Current buffer is of invalid type");
        return buffer;
    });

I.current_buffer_window = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_window;
    });

// This name should perhaps change
I.current_buffer_document = interactive_method(
    $sync = function (ctx) {
        var buffer = ctx.frame.buffers.current;
        if (!(buffer instanceof browser_buffer))
            throw new Error("Current buffer is of invalid type");
        return buffer.content_document;
    });

// This name should perhaps change
I.active_document = I.current_buffer_document;

define_keywords("$default");
I.b = interactive_method(
    $async = function (ctx, cont) {
        keywords(arguments, $prompt = "Buffer:",
                 $default = ctx.frame.buffers.current,
                 $history = "buffer");
        var completer = all_word_completer(
            function (visitor) { // visit
                ctx.frame.buffers.for_each(visitor);
            },
            function (x) { // get_string
                return x.name;
            },
            function (x) { // get_description
                return x.title;
            }
            /* get_value = null */);
        ctx.frame.minibuffer.read(
            $prompt = arguments.$prompt,
            $history = arguments.$history,
            $completer = completer,
            $match_required = true,
            $default_completion = arguments.$default,
            $callback = cont);
    });



I.content_selection = interactive_method(
    $sync = function (ctx) {
        // -- Selection of content area of focusedWindow
        var focusedWindow = this.buffers.current.focused_window();
        return focusedWindow.getSelection ();
    });

require_later("browser_buffer.js");
