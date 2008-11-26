/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Deniz Dogan
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 *
 * This is a tab bar which is based on tab-bar.js but makes customization of the
 * tabs much easier. It provides sensible default styles but lets the user
 * simply override these defaults by normal CSS.
 **/

require("mode.js");

function tab_bar(window) {
    window.tab_bar = this;
    var element = create_XUL(window, "arrowscrollbox");
    element.setAttribute("id", "tab2-bar");
    element.setAttribute("orient", "horizontal");
    var after = window.buffers.container;
    this.window = window;
    this.element = element;
    after.parentNode.insertBefore(element, after);

    add_hook.call(window, "select_buffer_hook", tab_bar_select_buffer);
    add_hook.call(window, "create_buffer_hook", tab_bar_add_buffer);
    add_hook.call(window, "kill_buffer_hook", tab_bar_kill_buffer);
    add_hook.call(window, "buffer_title_change_hook", tab_bar_update_buffer_title);
    add_hook.call(window, "buffer_description_change_hook", tab_bar_update_buffer_title);
    //    add_hook.call(window, "buffer_favicon_change_hook", tab_bar_update_buffer_icon);
    window.buffers.for_each(tab_bar_add_buffer);
    this.update_multiple_attribute();
    if (window.buffers.current != null)
        tab_bar_select_buffer(window.buffers.current);
}

tab_bar.prototype.destroy = function () {
    remove_hook.call(this.window, "select_buffer_hook", tab_bar_select_buffer);
    remove_hook.call(this.window, "create_buffer_hook", tab_bar_add_buffer);
    remove_hook.call(this.window, "kill_buffer_hook", tab_bar_kill_buffer);
    remove_hook.call(this.window, "buffer_title_change_hook", tab_bar_update_buffer_title);
    remove_hook.call(this.window, "buffer_description_change_hook", tab_bar_update_buffer_title);
    //    remove_hook.call(this.window, "buffer_favicon_change_hook", tab_bar_update_buffer_icon);
    this.window.buffers.for_each(function (b) {
            delete b.tab;
        });
    this.selected_buffer = null;
    this.element.parentNode.removeChild(this.element);
};

tab_bar.prototype.update_multiple_attribute = function () {
    if (this.window.buffers.count > 1)
        this.element.setAttribute("multiple", "true");
    else
        this.element.setAttribute("multiple", "false");
};

function tab_bar_add_buffer(buffer) {

    // Get the tab bar
    var tabbar = buffer.window.tab_bar;
    tabbar.update_multiple_attribute();

    // Create a tab and add it to the tab bar
    var tab = create_XUL(buffer.window, "hbox");
    tab.setAttribute("class", "tab2");
    tab.addEventListener("click", function () {
            if (!buffer.dead)
                buffer.window.buffers.current = buffer;
        }, false /* not capturing */);
    tab.setAttribute("selected", "false");

    // Create the label to hold the tab number
    // TODO: Make the numbers optional and use the favicon if that's what the
    // user wants.
    var iconlabel = create_XUL(buffer.window, "label");
    iconlabel.setAttribute("class", "tab2-icon");

    // Create the label to hold the tab title
    var label = create_XUL(buffer.window, "label");
    label.setAttribute("class", "tab2-label");
    label.setAttribute("crop", "end");

    // Create the close button
//     var button = create_XUL(buffer.window, "image");
//     button.setAttribute("class", "tab2-close-button");
//     button.addEventListener("click", function (event) {
//             kill_buffer(buffer);
//             event.stopPropagation();
//         }, false /* not capturing */);

    // Add all the stuff to the new tab
    tab.appendChild(iconlabel);
    tab.appendChild(label);
//     tab.appendChild(button);
    tab.tab_label = label;
    tab.tab_icon = iconlabel;
    tabbar.element.appendChild(tab);
    buffer.tab = tab;
    tab_bar_update_buffer_title(buffer);

    // Set the tab number. Remember that at this point, the tab has already been
    // added to the hbox.
    var total = tabbar.element.getElementsByClassName("tab2").length;
    iconlabel.value = total;
}

function tab_bar_kill_buffer(b) {
    var t = b.window.tab_bar;
    t.update_multiple_attribute();
    if (t.selected_buffer == b)
        t.selected_buffer = null;
    b.tab.parentNode.removeChild(b.tab);
    t = b.window.tab_bar;
    delete b.tab;

    for (var i = 0; i < t.element.childNodes.length; i++) {
	t.element.childNodes[i].childNodes[0].value = i + 1;
    }
}

function tab_bar_select_buffer(b) {
    var t = b.window.tab_bar;
    if (t.selected_buffer != null)
        t.selected_buffer.tab.setAttribute("selected", "false");
    t.selected_buffer = b;
    b.tab.setAttribute("selected", "true");
    t.element.ensureElementIsVisible(b.tab);
}

function tab_bar_update_buffer_title(b) {
    var title = b.title;
    if (title == null || title.length == 0)
        title = b.description;
    b.tab.tab_label.setAttribute("value", title);
}

function tab_bar_install(window) {
    if (window.tab_bar)
        throw new Error("tab bar already initialized for window");
    new tab_bar(window);
}

function tab_bar_uninstall(window) {
    if (!window.tab_bar)
        throw new Error("tab bar not initialized for window");
    window.tab_bar.destroy();
    delete window.tab_bar;
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
