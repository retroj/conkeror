/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nicholas A. Zigarovich
 * (C) Copyright 2008 John J. Foerch
 * (C) Copyright 2011 Peter Lunicks
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 **/

require("mode.js");

define_variable("tab_bar_button_select", 0,
                "The mouse button that selects tabs." +
                "0 = left, 1 = middle, 2 = right, null = disabled.");

define_variable("tab_bar_button_close", 2,
                "The mouse button that closes tabs." +
                "0 = left, 1 = middle, 2 = right, null = disabled.");

define_variable("tab_bar_show_icon", false,
                "Whether or not to show buffer icons in tabs.");

define_variable("tab_bar_show_index", true,
                "Whether or not to show the tab index in each tab.");

/**
 * Constructs a tab bar for the given window.
 */
function tab_bar (window) {
    window.tab_bar = this;
    var scrollbox = create_XUL(window, "arrowscrollbox");
    scrollbox.setAttribute("id", "tab2-bar");
    scrollbox.setAttribute("orient", "horizontal");
    var after = window.buffers.container;
    this.window = window;
    this.element = scrollbox;
    after.parentNode.insertBefore(scrollbox, after);

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
    if (window.buffers.current != null)
        tab_bar_select_buffer(window.buffers.current);
}


/**
 * Destroys the tab bar.
 */
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
 * Updates the "index" node and "ordinal" attribute of all tabs.
 */
tab_bar.prototype.update_ordinals = function () {
    var buffers = this.window.buffers;
    for (var i = 0, n = this.element.childNodes.length; i < n; i++) {
        var ordinal = buffers.index_of(this.element.childNodes[i].buffer) + 1;
        this.element.childNodes[i].setAttribute("ordinal", ordinal);
        this.element.childNodes[i].index.setAttribute("value", ordinal);
    }
};


/**
 * Updates the "multiple" attribute of the tab bar.
 */
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
function tab_bar_add_buffer (buffer, noupdate) {

    // Get the tab bar
    var tabbar = buffer.window.tab_bar;
    tabbar.update_multiple_attribute();

    var ordinal = buffer.window.buffers.index_of(buffer) + 1;
    if (ordinal < buffer.window.buffers.buffer_list.length && ! noupdate)
        tabbar.update_ordinals();

    // Create a tab and add it to the tab bar
    var tab = create_XUL(buffer.window, "hbox");
    tab.buffer = buffer;
    tab.setAttribute("class", "tab2");
    tab.addEventListener("click", function (event) {
            if (event.button == tab_bar_button_select) {
                if (!tab.buffer.dead)
                    tab.buffer.window.buffers.current = tab.buffer;
            }
        }, false /* not capturing */);
    tab.setAttribute("selected", "false");

    // Create the label to hold the buffer icon
    var image = create_XUL(buffer.window, "image");
    image.setAttribute("class", "tab2-icon");
    if (buffer.icon != null)
        image.setAttribute("src", buffer.icon);

    // Create the label to hold the tab number
    var index = create_XUL(buffer.window, "label");
    index.setAttribute("class", "tab2-index");
    index.setAttribute("value", ordinal);

    // Create the label to hold the tab title
    var label = create_XUL(buffer.window, "label");
    label.setAttribute("class", "tab2-label");
    label.setAttribute("crop", "end");

    // No close button, just use the designated mouse button.
    tab.addEventListener("click", function (event) {
            if (event.button == tab_bar_button_close) {
                kill_buffer(tab.buffer);
                event.stopPropagation();
            }
        }, false /* not capturing */);

    // Add all the stuff to the new tab
    tab.image = image;
    tab.label = label;
    tab.index = index;
    if (tab_bar_show_index)
        tab.appendChild(index);
    if (tab_bar_show_icon)
        tab.appendChild(image);
    tab.appendChild(label);
    tabbar.element.appendChild(tab);
    buffer.tab = tab;
    tab_bar_update_buffer_title(buffer);

    // Note, XULRunner 1.9.x puts the tab in the wrong location if we set
    // the ordinal before adding the tab to the tab-bar.
    tab.setAttribute("ordinal", ordinal);
}


/**
 * Removes the tab for the given buffer.
 */
function tab_bar_kill_buffer (b) {
    var t = b.window.tab_bar;
    t.update_multiple_attribute();
    if (t.selected_buffer == b)
        t.selected_buffer = null;
    b.tab.parentNode.removeChild(b.tab);
    t = b.window.tab_bar;
    delete b.tab;

    // Renumber the tabs.
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


/**
 * Updates the tab of the given buffer to indicate it is the currently open one.
 */
function tab_bar_select_buffer (b) {
    var t = b.window.tab_bar;
    if (t.selected_buffer != null)
        t.selected_buffer.tab.setAttribute("selected", "false");
    t.selected_buffer = b;
    b.tab.setAttribute("selected", "true");
    t.element.ensureElementIsVisible(b.tab);
}


/**
 * Updates the tab title for the given buffer.
 */
function tab_bar_update_buffer_title (b) {
    var title = b.title;
    if (title == null || title.length == 0)
        title = b.description;
    b.tab.label.setAttribute("value", title);
}


/**
 * Updates the tab icon for the given buffer.
 */
function tab_bar_update_buffer_icon (b) {
    if (b.icon != null)
        b.tab.image.setAttribute("src", b.icon);
    else
        b.tab.image.removeAttribute("src");
}


/**
 * Inserts the tab bar in the given window.
 */
function tab_bar_install (window) {
    if (window.tab_bar)
        throw new Error("tab bar already initialized for window");
    new tab_bar(window);
}


/**
 * Removes the tab bar from the given window.
 * If the tab bar is not installed, throws an error.
 */
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

provide("tab-bar");
provide("new-tabs");
