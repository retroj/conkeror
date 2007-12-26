require("browser_buffer.js");

define_buffer_local_hook("browser_buffer_input_mode_change_hook");
define_current_buffer_hook("current_browser_buffer_input_mode_change_hook", "browser_buffer_input_mode_change_hook");

function define_browser_buffer_input_mode(base_name, keymap_name) {
    var name = "browser_buffer_" + base_name + "_input_mode";
    buffer[name + "_enabled"] = false;
    define_buffer_local_hook(name + "_enable_hook");
    define_buffer_local_hook(name + "_disable_hook");
    conkeror[name] = function (buffer) {
        if (buffer[name + "_enabled"])
            return;
        if (buffer.current_input_mode) {
            conkeror[buffer.current_input_mode + "_disable_hook"].run(buffer);
            buffer[buffer.current_input_mode + "_enabled"] = false;
        }
        buffer.current_input_mode = name;
        buffer[name + "_enabled"] = true;
        buffer.keymap = conkeror[keymap_name];
        conkeror[name + "_enable_hook"].run(buffer);
        browser_buffer_input_mode_change_hook.run(buffer);
    }
    var hyphen_name = name.replace("_","-","g");
    interactive(hyphen_name, conkeror[name], I.current_buffer(browser_buffer));
}

define_browser_buffer_input_mode("normal", "browser_buffer_normal_keymap");

// For SELECT elements
define_browser_buffer_input_mode("select", "browser_buffer_select_keymap");

// For text INPUT and TEXTAREA elements
define_browser_buffer_input_mode("text", "browser_buffer_text_keymap");
define_browser_buffer_input_mode("textarea", "browser_buffer_textarea_keymap");

define_browser_buffer_input_mode("quote_next", "browser_buffer_quote_next_keymap");
define_browser_buffer_input_mode("quote", "browser_buffer_quote_keymap");

add_hook("browser_buffer_focus_change_hook", function (buffer) {
        if (buffer.browser_buffer_text_input_mode_enabled ||
            buffer.browser_buffer_textarea_input_mode_enabled ||
            buffer.browser_buffer_select_input_mode_enabled ||
            buffer.browser_buffer_normal_input_mode_enabled) {
            var elem = buffer.focused_element();
            if (elem) {
                switch (elem.localName.toLowerCase()) {
                    // FIXME: probably add a special radiobox/checkbox keymap as well
                case "input":
                    var type = elem.getAttribute("type");
                    if (type != null) type = type.toLowerCase();
                    if (type != "radio" &&
                        type != "radio" &&
                        type != "checkbox" &&
                        type != "submit" &&
                        type != "reset")
                        browser_buffer_text_input_mode(buffer);
                    return;
                case "textarea":
                    browser_buffer_textarea_input_mode(buffer);
                    return;
                case "select":
                    browser_buffer_select_input_mode(buffer);
                    return;
                }
            }
            browser_buffer_normal_input_mode(buffer);
        }
    });

function browser_input_minibuffer_status(frame) {
    this.frame = frame;
    var element = create_XUL(frame, "label");
    element.setAttribute("id", "minibuffer-input-status");
    element.collapsed = true;
    element.setAttribute("class", "minibuffer");
    var insert_before = frame.document.getElementById("minibuffer-prompt");
    insert_before.parentNode.insertBefore(element, insert_before);
    this.element = element;
    this.select_buffer_hook_func = add_hook.call(frame, "select_buffer_hook", method_caller(this, this.update));
    this.mode_change_hook_func = add_hook.call(frame, "current_browser_buffer_input_mode_change_hook",
                                               method_caller(this, this.update));
    this.update();
}
browser_input_minibuffer_status.prototype = {
    update : function () {
        var buf = this.frame.buffers.current;
        if (buf.browser_buffer_normal_input_mode_enabled) {
            this.element.collapsed = true;
            this.frame.minibuffer.element.className = "";
        } else {
            var name = "";
            var className = null;
            if (buf.browser_buffer_text_input_mode_enabled) {
                name = "[TEXT INPUT]";
                className = "text";
            } else if (buf.browser_buffer_textarea_input_mode_enabled) {
                name = "[TEXTAREA INPUT]";
                className = "textarea";
            } else if (buf.browser_buffer_select_input_mode_enabled) {
                name = "[SELECT INPUT]";
                className = "select";
            } else if (buf.browser_buffer_quote_next_input_mode_enabled) {
                name = "[PASS THROUGH (next)]";
                className = "quote-next";
            } else if (buf.browser_buffer_quote_input_mode_enabled) {
                name = "[PASS THROUGH]";
                className = "quote";
            } else /* error */;

            this.element.value = name;
            this.element.collapsed = false;
            this.frame.minibuffer.element.className = "minibuffer-" + className + "-input-mode";
        }
    },
    uninstall : function () {
        remove_hook.call(frame, "select_buffer_hook", this.select_buffer_hook_func);
        remove_hook.call(frame, "current_browser_buffer_input_mode_change_hook",
                         method_caller(this, this.update), this.mode_change_hook_func);
        this.element.parentNode.removeChild(this.element);
    }
};

function browser_input_minibuffer_status_install(frame) {
    if (frame.browser_input_minibuffer_status)
        throw new Error("browser input minibuffer status already initialized for frame");
    frame.browser_input_minibuffer_status = new browser_input_minibuffer_status(frame);
}

function browser_input_minibuffer_status_uninstall(frame) {
    if (frame.browser_input_minibuffer_status)
        return;
    frame.browser_input_minibuffer_status.uninstall();
    delete frame.browser_input_minibuffer_status;
}

define_global_mode("browser_input_minibuffer_status_mode",
                   function () { // enable
                       add_hook("frame_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_frame(browser_input_minibuffer_status_install);
                   },
                   function () { // disable
                       remove_hook("frame_initialize_hook", browser_input_minibuffer_status_install);
                       for_each_frame(browser_input_minibuffer_status_uninstall);
                   });
browser_input_minibuffer_status_mode(true);

