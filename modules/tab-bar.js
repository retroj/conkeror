/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("favicon.js");
require("mode.js");

function tab_bar (window) {
    window.tab_bar = this;
    var element = create_XUL(window, "arrowscrollbox");
    element.setAttribute("id", "tab-bar");
    element.setAttribute("orient", "horizontal");
    var after = window.buffers.container;
    this.window = window;
    this.element = element;
    after.parentNode.insertBefore(element, after);

    add_hook.call(window, "select_buffer_hook", tab_bar_select_buffer);
    add_hook.call(window, "create_buffer_early_hook", tab_bar_add_buffer);
    add_hook.call(window, "kill_buffer_hook", tab_bar_kill_buffer);
    add_hook.call(window, "move_buffer_hook", tab_bar_move_buffer);
    add_hook.call(window, "create_buffer_hook", tab_bar_update_buffer_title);
    add_hook.call(window, "buffer_title_change_hook", tab_bar_update_buffer_title);
    add_hook.call(window, "buffer_description_change_hook", tab_bar_update_buffer_title);
    add_hook.call(window, "buffer_icon_change_hook", tab_bar_update_buffer_icon);

    window.buffers.for_each(function (b) tab_bar_add_buffer(b, true));
    this.update_multiple_attribute();
    this.update_ordinals();
    if (window.buffers.current != null)
        tab_bar_select_buffer(window.buffers.current);
}
tab_bar.prototype.destroy = function () {
    remove_hook.call(this.window, "select_buffer_hook", tab_bar_select_buffer);
    remove_hook.call(this.window, "create_buffer_early_hook", tab_bar_add_buffer);
    remove_hook.call(this.window, "kill_buffer_hook", tab_bar_kill_buffer);
    remove_hook.call(this.window, "move_buffer_hook", tab_bar_move_buffer);
    remove_hook.call(this.window, "create_buffer_hook", tab_bar_update_buffer_title);
    remove_hook.call(this.window, "buffer_title_change_hook", tab_bar_update_buffer_title);
    remove_hook.call(this.window, "buffer_description_change_hook", tab_bar_update_buffer_title);
    remove_hook.call(this.window, "buffer_icon_change_hook", tab_bar_update_buffer_icon);
    this.window.buffers.for_each(function (b) { delete b.tab; });
    this.selected_buffer = null;
    this.element.parentNode.removeChild(this.element);
    delete this.window.tab_bar;
};


/**
 * Updates the "ordinal" attribute of all tabs.
 */
tab_bar.prototype.update_ordinals = function () {
    var buffers = this.window.buffers;
    for (var i = 0, n = this.element.childNodes.length; i < n; i++) {
        var ordinal = buffers.index_of(this.element.childNodes[i].buffer) + 1;
        this.element.childNodes[i].setAttribute("ordinal", ordinal);
    }
};

tab_bar.prototype.update_multiple_attribute = function () {
    if (this.window.buffers.count > 1)
        this.element.setAttribute("multiple", "true");
    else
        this.element.setAttribute("multiple", "false");
};

/**
 * Adds a tab for the given buffer.  When second argument 'noupdate' is
 * true, a new tab in the middle of the buffer list will not cause the
 * ordinals of other tabs to be updated.  This is used during
 * initialization of the tab bar.
 */
function tab_bar_add_buffer (b, noupdate) {
    var t = b.window.tab_bar;
    t.update_multiple_attribute();
    var ordinal = b.window.buffers.index_of(b) + 1;
    if (ordinal < b.window.buffers.buffer_list.length && ! noupdate)
        t.update_ordinals();
    var tab = create_XUL(b.window, "hbox");
    tab.buffer = b;
    tab.setAttribute("class", "tab");
    tab.addEventListener("click", function () {
            if (!tab.buffer.dead)
                tab.buffer.window.buffers.current = tab.buffer;
        }, false /* not capturing */);
    tab.setAttribute("selected", "false");
    tab.setAttribute("ordinal", ordinal);
    var image = create_XUL(b.window, "image");
    image.setAttribute("class", "tab-icon");
    if (b.icon != null)
        image.setAttribute("src", b.icon);
    var label = create_XUL(b.window, "label");
    label.setAttribute("class", "tab-label");
    label.setAttribute("crop", "end");
    var button = create_XUL(b.window, "toolbarbutton");
    button.setAttribute("class", "tab-close-button");
    button.addEventListener("click", function (event) {
            kill_buffer(tab.buffer);
            event.stopPropagation();
        }, false /* not capturing */);
    tab.appendChild(image);
    tab.appendChild(label);
    tab.appendChild(button);
    tab.tab_label = label;
    tab.tab_image = image;
    t.element.appendChild(tab);
    b.tab = tab;
    tab_bar_update_buffer_title(b);
}

function tab_bar_kill_buffer (b) {
    var t = b.window.tab_bar;
    t.update_multiple_attribute();
    if (t.selected_buffer == b)
        t.selected_buffer = null;
    b.tab.parentNode.removeChild(b.tab);
    delete b.tab;
    t.update_ordinals();
}


/**
 * Updates all tab indices and ensure that the current tab is still visible.
 */
function tab_bar_move_buffer (b) {
    var t = b.window.tab_bar;
    t.update_ordinals();
    t.element.ensureElementIsVisible(b.window.buffers.current.tab);
}


function tab_bar_select_buffer (b) {
    var t = b.window.tab_bar;
    if (t.selected_buffer != null)
        t.selected_buffer.tab.setAttribute("selected", "false");
    t.selected_buffer = b;
    b.tab.setAttribute("selected", "true");
    t.element.ensureElementIsVisible(b.tab);
}

function tab_bar_update_buffer_title (b) {
    var title = b.title;
    if (title == null || title.length == 0)
        title = b.description;
    b.tab.tab_label.setAttribute("value", title);
}

function tab_bar_update_buffer_icon (b) {
    if (b.icon != null)
        b.tab.tab_image.setAttribute("src", b.icon);
    else
        b.tab.tab_image.removeAttribute("src");
}

function tab_bar_install (window) {
    if (window.tab_bar)
        throw new Error("tab bar already initialized for window");
    new tab_bar(window);
}

function tab_bar_uninstall (window) {
    if (!window.tab_bar)
        throw new Error("tab bar not initialized for window");
    window.tab_bar.destroy();
}

define_global_mode("tab_bar_mode",
                   function () { // enable
                       add_hook("window_initialize_hook", tab_bar_install);
                       for_each_window(tab_bar_install);
                   },
                   function () { // disable
                       remove_hook("window_initialize_hook", tab_bar_install);
                       for_each_window(tab_bar_uninstall);
                   });

tab_bar_mode(true);

provide("new-tabs");
provide("tab-bar");
