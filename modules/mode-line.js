/**
 * (C) Copyright 2005 Shawn Betts
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("mode.js");

define_window_local_hook("mode_line_hook");

function generic_element_widget_container(window, container)
{
    this.window = window;
    this.container = container;
}
define_keywords("$flex", "$align", "$class", "$crop");
generic_element_widget_container.prototype = {
    add_text_widget : function (widget) {
        keywords(arguments);
        var flex = arguments.$flex;
        var class_name = arguments.$class;
        var align = arguments.$align;
        var crop = arguments.$crop;
        var element = create_XUL(this.window, "label");
        if (flex != null)
            element.setAttribute("flex", flex);
        if (align != null)
            element.setAttribute("align", align);
        if (class_name == null)
            class_name = widget.name;
        element.setAttribute("class", class_name);
        if (crop == null)
            crop = widget.crop;
        element.setAttribute("crop", crop);
        element.conkeror_widget = new generic_widget_element(element, widget);
        this.container.appendChild(element);
        return element.conkeror_widget;
    },
    destroy : function() {
        var children = this.container.childNodes;
        for (var i = 0; i < children.length; ++i)
            children.item(i).conkeror_widget.destroy();
    }
};

function mode_line(window)
{
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
    __proto__: generic_element_widget_container.prototype,

    uninstall: function () {
        this.container.parentNode.removeChild(this.window.mode_line.container);
        this.__proto__.__proto__.destroy.call(this);
    }
};


function generic_widget_element(element, widget)
{
    this.element = element;
    this.widget = widget;
    widget.attach(this);
}

generic_widget_element.prototype = {
    get text () {
        return this.element.getAttribute("value");
    },

    set text (v) {
        this.element.setAttribute("value", v);
    },

    destroy : function () {
        this.widget.destroy();
    },

    remove : function () {
        this.element.parentNode.removeChild(this.element);
        this.destroy();
    }
};


function text_widget(window)
{
    this.window_hooks = [];
    this.window = window;
}
text_widget.prototype = {
    add_hook : function (hook_name, handler)
    {
        var obj = this;
        if (handler == null) handler = function () { obj.update(); }
        add_hook.call(this.window, hook_name, handler);
        this.window_hooks.push([hook_name, handler]);
    },

    view : null,

    attach : function (view) {
        this.view = view;
        this.update();
    },

    update : function () {
    },

    destroy : function ()
    {
        for each (let i in this.window_hooks) {
            remove_hook.call(this.window, i[0], i[1]);
        }
    },

    remove : function ()
    {
        this.view.remove();
    }
};

define_global_window_mode("mode_line", "window_initialize_early_hook");

function current_buffer_name_widget(window) {
    this.name = "current-buffer-name-widget";
    text_widget.call(this, window);
    this.crop = "end";
    this.add_hook("current_content_buffer_location_change_hook");
    this.add_hook("select_buffer_hook");
}
current_buffer_name_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_name_widget.prototype.update = function () {
    this.view.text = this.window.buffers.current.description;
};

function current_buffer_scroll_position_widget(window) {
    this.name = "current-buffer-scroll-position-widget";
    text_widget.call(this, window);
    this.add_hook("current_buffer_scroll_hook");
    this.add_hook("select_buffer_hook");
    this.add_hook("current_content_buffer_location_change_hook");
    this.add_hook("current_content_buffer_focus_change_hook");
}
current_buffer_scroll_position_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_scroll_position_widget.prototype.update = function () {
    var b = this.window.buffers.current;
    var scrollX, scrollY, scrollMaxX, scrollMaxY;
    if (b instanceof content_buffer)
    {
        var w = b.focused_frame;
        scrollX = w.scrollX;
        scrollY = w.scrollY;
        scrollMaxX = w.scrollMaxX;
        scrollMaxY = w.scrollMaxY;
    } else
    {
        scrollX = b.scrollX;
        scrollY = b.scrollY;
        scrollMaxX = b.scrollMaxX;
        scrollMaxY = b.scrollMaxY;
    }
    var x = scrollMaxX == 0 ? 100 : Math.round(scrollX / scrollMaxX * 100);
    var y = scrollMaxY == 0 ? 100 : Math.round(scrollY / scrollMaxY * 100);
    this.view.text = "(" + x + ", " + y + ")";
};

function clock_widget(window)
{
    this.name = "clock-widget";
    text_widget.call(this, window);
    var obj = this;
    this.timer_ID = window.setInterval(function () { obj.update(); }, 60000);
}
clock_widget.prototype.__proto__ = text_widget.prototype;
clock_widget.prototype.update = function () {
    var time = new Date();
    var hours = time.getHours();
    var mins = time.getMinutes();
    this.view.text = (hours<10 ? "0" + hours:hours) + ":" + (mins<10 ?"0" +mins:mins);
};
clock_widget.prototype.destroy = function () {
    this.window.clearTimeout(this.timer_ID);
};

function mode_line_adder(widget_constructor) {
    return function (window) { window.mode_line.add_text_widget(new widget_constructor(window)); }
}

add_hook("mode_line_hook", mode_line_adder(current_buffer_name_widget));
add_hook("mode_line_hook", mode_line_adder(clock_widget));
add_hook("mode_line_hook", mode_line_adder(current_buffer_scroll_position_widget));

mode_line_mode(true);
