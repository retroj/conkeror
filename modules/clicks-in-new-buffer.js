/**
 * (C) Copyright 2008 Nicholas Zigarovich
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

// Which mouse button? 0 = left, 1 = middle, 2 = right
if (typeof clicks_in_new_buffer_button == "undefined")
    var clicks_in_new_buffer_button = 1;

// Which open target? OPEN_NEW_BUFFER or OPEN_NEW_BUFFER_BACKGROUND
if (typeof clicks_in_new_buffer_target == "undefined")
    var clicks_in_new_buffer_target = OPEN_NEW_BUFFER;

// Should mouse click event propagation be stopped?
if (typeof clicks_in_new_buffer_ev_stop_prop == "undefined")
    var clicks_in_new_buffer_ev_stop_prop = true;

var find_tag_in_parents = function (tag, element)
{
    // FIXME If tag names will always be upper-case, toLowerCase() can
    //       be eliminated. Also not sure that p will ever be null.
    for (p = element.parentNode;
	 p != null && p.tagName.toLowerCase() != "html";
	 p = p.parentNode)
	{
	    if (p.tagName.toLowerCase() == tag)
		return p;
	}
    return null;
}

var open_link_in_new_buffer = function (event)
{
    if (event.button != clicks_in_new_buffer_button)
	return;
    var element = event.target;
    var anchor = null;
    if (element instanceof Ci.nsIDOMHTMLAnchorElement)
	anchor = element;
    // FIXME The 'tostring() ==' is a terrible kludge.
    else if (element.wrappedJSObject.toString() == "[object HTMLSpanElement]" ||
	     element instanceof Ci.nsIDOMHTMLImageElement)
	anchor = find_tag_in_parents("a", element);
    if (anchor != null)
	{
	    event.preventDefault();
	    if (clicks_in_new_buffer_ev_stop_prop)
		event.stopPropagation();
	    var spec = element_get_load_spec(anchor);
	    var window = window_watcher.activeWindow;
	    var buffer = window.buffers.current;
	    create_buffer(window,
			  buffer_creator(content_buffer,
					 $load = spec,
					 $configuration = buffer.configuration),
			  clicks_in_new_buffer_target);
	}
}

var clicks_in_new_buffer_add_listener = function (buffer)
{
    buffer.browser.addEventListener("click",
				    open_link_in_new_buffer,
				    true);
}

var clicks_in_new_buffer_remove_listener = function (buffer)
{
    buffer.browser.removeEventListener("click",
				       open_link_in_new_buffer,
				       true);
}

var for_each_buffer = function (f)
{
    for_each_window(function (w) { w.buffers.for_each(f); });
}

var clicks_in_new_buffer_mode_enable = function ()
{
    add_hook("create_buffer_hook",
	     clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_add_listener);
}

var clicks_in_new_buffer_mode_disable = function ()
{
    remove_hook("create_buffer_hook",
		clicks_in_new_buffer_add_listener);
    for_each_buffer(clicks_in_new_buffer_remove_listener);
}

define_global_mode("clicks_in_new_buffer_mode",
		   clicks_in_new_buffer_mode_enable,
		   clicks_in_new_buffer_mode_disable);

clicks_in_new_buffer_mode(true);
