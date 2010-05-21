/**
 * (C) Copyright 2009 David Kettler
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("mode-line.js");

function button_widget (window) {
    this.class_name = "button-widget";
    text_widget.call(this, window);
}
button_widget.prototype = {
    constructor: button_widget,
    __proto__: text_widget.prototype,

    make_element: function (window) {
        var command = this.command;
        var element = create_XUL(window, "image");

        element.addEventListener("click", function (event) {
            var I = new interactive_context(window.buffers.current);
            co_call(call_interactively(I, command));
        }, false);

        element.addEventListener("mouseover", function (event) {
            var msg = "Button: " + command;
            var keymaps = get_current_keymaps(window);
            var list = keymap_lookup_command(keymaps, command);
            if (list.length)
                msg += " (which is on key " + list.join(", ") + ")";
            window.minibuffer.show(msg);
        }, false);

        element.addEventListener("mouseout", function (event) {
            window.minibuffer.show("");
        }, false);

        element.setAttribute("id", "button-widget-" + command);
        element.setAttribute("class", this.class_name);
        for (var a in this.attributes) {
            element.setAttribute(a, this.attributes[a]);
        }

        return element;
    }
};

function make_button_widget (command, attributes) {
    if (typeof attributes == "string")
        // Simple case
        attributes = { src: "moz-icon://stock/gtk-" + attributes };

    function new_widget (window) {
        button_widget.call(this, window);
    }
    new_widget.prototype = {
        constructor: new_widget,
        __proto__: button_widget.prototype,
        command: command,
        attributes: attributes
    }
    new_widget.mode_line_adder = function (window) {
        var widget = new new_widget(window);
        window.mode_line.add_widget(widget, widget.make_element(window));
    }

    return new_widget;
}

function mode_line_add_buttons (buttons, prepend) {
    for (var i = 0, n = buttons.length; i < n; i++) {
        var j = prepend ? n - i - 1 : i;
        var w = make_button_widget(buttons[j][0], buttons[j][1]);
        add_hook("mode_line_hook", mode_line_adder(w), prepend);
    }
}

standard_mode_line_buttons = [
    ["find-url", "open"],
    ["find-url-new-buffer", "new"],
    ["back", "go-back"],
    ["forward", "go-forward"],
    ["reload", "refresh"],
    ["kill-current-buffer", "close"],
    ["buffer-previous", "go-up"],
    ["buffer-next", "go-down"],
    ["help-page", "help"],
];

provide("mode-line-buttons");
