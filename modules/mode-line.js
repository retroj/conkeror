require("mode.js");

define_frame_local_hook("mode_line_hook");

function generic_element_widget_container(frame, container)
{
    this.frame = frame;
    this.container = container;
}
generic_element_widget_container.prototype = {
    add_text_widget : function (widget, flex, align, class_name) {
        var element = create_XUL(this.frame, "label");
        if (flex != null)
            element.setAttribute("flex", flex);
        if (align != null)
            element.setAttribute("align", align);
        if (class_name == null)
            class_name = widget.name;
        element.setAttribute("class", class_name);
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

function mode_line(frame)
{
    var element = create_XUL(frame, "hbox");
    element.setAttribute("class", "mode-line");
    var insert_before = frame.document.getElementById("minibuffer-hbox");
    insert_before.parentNode.insertBefore(element, insert_before);
    frame.mode_line = this;
    generic_element_widget_container.call(this, frame, element);
    mode_line_hook.run(frame, this);
}
mode_line.prototype = {
    __proto__: generic_element_widget_container.prototype,

    remove: function () {
        this.container.parentNode.removeChild(this.frame.mode_line.container);
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


function text_widget(frame)
{
    this.frame_hooks = [];
    this.frame = frame;
}
text_widget.prototype = {
    add_hook : function (hook_name, handler)
    {
        var obj = this;
        if (handler == null) handler = function () { obj.update(); }
        add_hook.call(this.frame, hook_name, handler);
        this.frame_hooks.push(handler);
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
        for (var i = 0; i < this.frame_hooks.length; ++i)
            remove_hook.call(this.frame, this.frame_hooks[i]);
    },

    remove : function ()
    {
        this.view.remove();
    }
};

function mode_line_install(frame)
{
    if (frame.mode_line)
        throw new Error("mode line already initialized for frame");
    frame.mode_line = new mode_line(frame);
}

function mode_line_uninstall(frame)
{
    if (!frame.mode_line)
        throw new Error("mode line not initialized for frame");
    frame.mode_line.remove();
    delete frame.mode_line;
}

define_global_mode("mode_line_mode",
                   function () { // enable
                       add_hook("frame_initialize_early_hook", mode_line_install);
                       for_each_frame(mode_line_install);
                   },
                   function () { // disable
                       remove_hook("frame_initialize_early_hook", mode_line_install);
                       for_each_frame(mode_line_uninstall);
                   });

function current_buffer_name_widget(frame) {
    this.name = "current-buffer-name-widget";
    text_widget.call(this, frame);
    this.add_hook("current_browser_buffer_location_change_hook");
    this.add_hook("select_buffer_hook");
}
current_buffer_name_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_name_widget.prototype.update = function () {
    this.view.text = this.frame.buffers.current.name;
};

function current_buffer_scroll_position_widget(frame) {
    this.name = "current-buffer-scroll-position-widget";
    text_widget.call(this, frame);
    this.add_hook("current_buffer_scroll_hook");
    this.add_hook("select_buffer_hook");
    this.add_hook("current_browser_buffer_location_change_hook");
    this.add_hook("current_browser_buffer_focus_change_hook");
}
current_buffer_scroll_position_widget.prototype.__proto__ = text_widget.prototype;
current_buffer_scroll_position_widget.prototype.update = function () {
    var b = this.frame.buffers.current;
    var scrollX, scrollY, scrollMaxX, scrollMaxY;
    if (b instanceof browser_buffer)
    {
        var w = b.focused_window();
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

function clock_widget(frame)
{
    this.name = "clock-widget";
    text_widget.call(this, frame);
    var obj = this;
    this.timer_ID = frame.setInterval(function () { obj.update(); }, 60000);
}
clock_widget.prototype.__proto__ = text_widget.prototype;
clock_widget.prototype.update = function () {
    var time = new Date();
    var hours = time.getHours();
    var mins = time.getMinutes();
    this.view.text = (hours<10 ? "0" + hours:hours) + ":" + (mins<10 ?"0" +mins:mins);
};
clock_widget.prototype.destroy = function () {
    this.frame.clearTimeout(this.timer_ID);
};

function mode_line_adder(widget_constructor) {
    return function (frame) { frame.mode_line.add_text_widget(new widget_constructor(frame)); }
}

add_hook("mode_line_hook", mode_line_adder(current_buffer_name_widget));
add_hook("mode_line_hook", mode_line_adder(clock_widget));
add_hook("mode_line_hook", mode_line_adder(current_buffer_scroll_position_widget));

mode_line_mode(true);
