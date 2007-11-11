
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
};

/* If browser is null, create a new browser */
function browser_buffer(frame, browser)
{
    this.frame = frame;
    if (browser == null)
    {
        var document = this.frame.document;
        browser = document.createElementNS("http://www.mozilla.org/keymaster/"
                                           + "gatekeeper/there.is.only.xul", "browser");
        browser.setAttribute("type", "content");
        browser.setAttribute("flex", "1");
        browser.setAttribute("usechromesheets",
                             "chrome://conkeror/content/numbering.css, "
                             + "chrome://global/skin/xulscrollbars.css");
        this.frame.buffers.container.appendChild(browser);
    }
    this.element = browser;
    this.element.conkeror_buffer_object = this;
    
}

browser_buffer.prototype = {
    get content_window() {
        return this.element.contentWindow;
    },

    get content_document() {
        return this.element.contentDocument;
    },

    get title() {
        return this.element.contentTitle;
    },

    /* Used to display the correct URI when the buffer opens initially
     * even before loading has progressed far enough for currentURI to
     * contain the correct URI. */
    _display_URI : null,

    get current_URI () {
        return this.element.currentURI;
    },

    get display_URI_string () {
        if (this._display_URI)
            return this._display_URI;
        return this.currentURI.spec;
    },

    get name () {
        return this.display_URI_string;
    },

    get web_navigation () {
        return this.element.webNavigation;
    },

    load_URI : function (URI_s) {
        this._display_URI = URI_s;
        this.web_navigation.loadURI(URI_s, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
                                    null /* referrer */,
                                    null /* post data */,
                                    null /* headers */);
    },

    on_switch_to : function () {
        this.element.setAttribute("type", "content-primary");
    },

    on_switch_away : function () {
        this.element.setAttribute("type", "content");
    },

    prototype : buffer.prototype
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
        run_hooks(select_buffer_hook, buffer);
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
        return this.container.selectedIndex;
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

add_hook(frame_initialize_early_hook, buffer_initialize_frame_early, true);

function buffer_initialize_frame(frame)
{
    // FIXME: This should probably not be done in this file
    var uris_to_load = [];
    var tag = null;
    if ('arguments' in frame)
    {
        for (var i = 0; i < frame.arguments.length; i++) {
            var open_args = conkeror.decode_xpcom_structure (frame.arguments[i]);
            if (0 in open_args && open_args[0] == 'conkeror')
            {
                for (var j = 1; j < open_args.length; j++) {
                    var op = open_args[j];
                    if (op[0] == 'tag') { tag = op[1]; }
                    else if (op[0] == 'find') { uris_to_load = op.slice(1).reverse(); }
                }
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

add_hook(frame_initialize_hook, buffer_initialize_frame, true);
