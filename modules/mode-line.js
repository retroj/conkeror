/**
 * (C) Copyright 2005 Shawn Betts
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("mode.js");

define_window_local_hook("mode_line_hook");

define_keywords("$flex", "$align", "$class", "$crop");
function generic_element_widget_container (window, container) {
    this.window = window;
    this.container = container;
}
generic_element_widget_container.prototype = {
    constructor: generic_element_widget_container,
    add_text_widget: function (widget) {
        keywords(arguments, $flex = widget.flex,
                 $class = widget.class_name, $crop = widget.crop);
        var flex = arguments.$flex;
        var class_name = arguments.$class;
        var align = arguments.$align;
        var crop = arguments.$crop;
        var element = create_XUL(this.window, "label");
        if (flex)
            element.setAttribute("flex", flex);
        if (align)
            element.setAttribute("align", align);
        if (class_name)
            element.setAttribute("class", class_name);
        if (crop)
            element.setAttribute("crop", crop);
        return this.add_widget(widget, element);
    },
    add_widget: function (widget, element) {
        element.conkeror_widget = new generic_widget_element(element, widget);
        this.container.appendChild(element);
        return element.conkeror_widget;
    },
    destroy: function () {
        var children = this.container.childNodes;
        for (var i = 0, nchildren = children.length; i < nchildren; ++i)
            children.item(i).conkeror_widget.destroy();
    }
};

function mode_line (window) {
    var element = create_XUL(window, "hbox");
    element.setAttribute("class", "mode-line");
    /* FIXME: this will need to changed to be buffer-local */
    var insert_before = window.document.getElementById("minibuffer");
    insert_before.parentNode.insertBefore(element, insert_before);
    window.mode_line = this;
    generic_element_widget_container.call(this, window, element);
    mode_line_hook.run(window, this);
}
mode_line.prototype = {
    constructor: mode_line,
    __proto__: generic_element_widget_container.prototype,

    uninstall: function () {
        this.container.parentNode.removeChild(this.window.mode_line.container);
        generic_element_widget_container.prototype.destroy.call(this);
    }
};


function generic_widget_element (element, widget) {
    this.element = element;
    this.widget = widget;
    widget.attach(this);
}
generic_widget_element.prototype = {
    constructor: generic_widget_element,
    get text () {
        return this.element.getAttribute("value");
    },

    set text (v) {
        this.element.setAttribute("value", v);
    },

    destroy: function () {
        this.widget.destroy();
    },

    remove: function () {
        this.element.parentNode.removeChild(this.element);
        this.destroy();
    }
};


function text_widget (window) {
    this.window_hooks = [];
    this.window = window;
}
text_widget.prototype = {
    constructor: text_widget,
    add_hook: function (hook_name, handler) {
        var obj = this;
        if (handler == null)
            handler = function () { obj.update(); };
        add_hook.call(this.window, hook_name, handler);
        this.window_hooks.push([hook_name, handler]);
    },

    view: null,

    attach: function (view) {
        this.view = view;
        this.update();
    },

    update: function () {},

    destroy: function () {
        for each (let i in this.window_hooks) {
            remove_hook.call(this.window, i[0], i[1]);
        }
    },

    remove: function () {
        this.view.remove();
    }
};


define_global_window_mode("mode_line", "window_initialize_early_hook");

function current_buffer_name_widget (window) {
    this.class_name = "current-buffer-name-widget";
    text_widget.call(this, window);
    this.flex = "1";
    this.crop = "end";
    this.add_hook("current_content_buffer_location_change_hook");
    this.add_hook("select_buffer_hook");
}
current_buffer_name_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_name_widget.prototype.update = function () {
    this.view.text = this.window.buffers.current.description;
};

function current_buffer_scroll_position_widget (window) {
    this.class_name = "current-buffer-scroll-position-widget";
    text_widget.call(this, window);
    this.add_hook("current_buffer_scroll_hook");
    this.add_hook("select_buffer_hook");
    this.add_hook("current_content_buffer_location_change_hook");
    this.add_hook("current_content_buffer_focus_change_hook");
    this.add_hook("current_special_buffer_generated_hook");
}
current_buffer_scroll_position_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_scroll_position_widget.prototype.update = function () {
    var b = this.window.buffers.current;
    var scrollX, scrollY, scrollMaxX, scrollMaxY;
    var w = b.focused_frame;
    scrollX = w.scrollX;
    scrollY = w.scrollY;
    scrollMaxX = w.scrollMaxX;
    scrollMaxY = w.scrollMaxY;
    var x = scrollMaxX == 0 ? 100 : Math.round(scrollX / scrollMaxX * 100);
    var y = scrollMaxY == 0 ? 100 : Math.round(scrollY / scrollMaxY * 100);
    this.view.text = "(" + x + ", " + y + ")";
};


define_variable("clock_time_format", "%R",
    "Format string for the mode-line clock widget.\n"+
    "It takes the same format as strftime() in C. "+
    "See http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html "+
    "for details.");

function clock_widget (window) {
    this.class_name = "clock-widget";
    text_widget.call(this, window);
    var obj = this;
    this.do_update = function () { obj.update(); };
    // todo: use one timer for multiple clock widgets
    this.timer_ID = window.setTimeout(this.do_update, 0);
    this.timer_timeout = true;
}
clock_widget.prototype.__proto__ = text_widget.prototype;
clock_widget.prototype.update = function () {
    var time = new Date();
    this.view.text = time.toLocaleFormat(clock_time_format);
    if (time.getSeconds() > 0 || time.getMilliseconds() > 100) {
        this.window.clearTimeout(this.timer_ID);
        var time = time.getSeconds() * 1000 + time.getMilliseconds();
        time = 60000 - time;
        this.timer_ID = this.window.setTimeout(this.do_update, time);
        this.timer_timeout = true;
    } else if (this.timer_timeout) {
        this.window.clearTimeout(this.timer_ID);
        this.timer_ID = this.window.setInterval(this.do_update, 60000);
        this.timer_timeout = false;
    }
};
clock_widget.prototype.destroy = function () {
    this.window.clearTimeout(this.timer_ID);
};

function buffer_count_widget (window) {
    this.class_name = "buffer-count-widget";
    text_widget.call(this, window);
    this.add_hook("select_buffer_hook");
    this.add_hook("create_buffer_hook");
    this.add_hook("kill_buffer_hook");
}
buffer_count_widget.prototype.__proto__ = text_widget.prototype;
buffer_count_widget.prototype.update = function () {
    this.view.text = ("[" + (this.window.buffers.selected_index+1) + "/" +
                      this.window.buffers.count + "]");
};

function loading_count_widget (window) {
    this.class_name = "loading-count-widget";
    text_widget.call(this, window);
    var obj = this;
    this.add_hook("content_buffer_started_loading_hook");
    this.add_hook("content_buffer_finished_loading_hook");
    this.add_hook("kill_buffer_hook");
}
loading_count_widget.prototype.__proto__ = text_widget.prototype;
loading_count_widget.prototype.update = function () {
    var count = 0;
    for_each_buffer(function (b) { if (b.loading) count++; });
    if (count)
        this.view.text = "(" + count + " loading)";
    else
        this.view.text = "";
};

function mode_line_adder (widget_constructor) {
    if (!('mode_line_adder' in widget_constructor))
        widget_constructor.mode_line_adder = function (window) {
            window.mode_line.add_text_widget(new widget_constructor(window));
        };
    return widget_constructor.mode_line_adder;
}

add_hook("mode_line_hook", mode_line_adder(current_buffer_name_widget));
add_hook("mode_line_hook", mode_line_adder(clock_widget));
add_hook("mode_line_hook", mode_line_adder(current_buffer_scroll_position_widget));

mode_line_mode(true);

provide("mode-line");
