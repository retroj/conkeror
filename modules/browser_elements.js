function browser_element_focus(buffer, elem)
{
    var elemTagName = elem.localName;
    var x = 0;
    var y = 0;
    switch (elemTagName) {
    case "FRAME": case "IFRAME":
        elem.contentWindow.focus();
        return false;
    case "AREA":
        var coords = elem.getAttribute("coords").split(",");
        x = Number(coords[0]);
        y = Number(coords[1]);
        break;
    }

    elem.focus();

    var doc = elem.ownerDocument;
    var evt = doc.createEvent("MouseEvents");
    var doc = elem.ownerDocument;

    evt.initMouseEvent("mouseover", true, true, doc.defaultView, 1, x, y, 0, 0, 0, 0, 0, 0, 0, null);
    elem.dispatchEvent(evt);
}

function browser_element_follow(buffer, elem, prefix)
{
    if (prefix > 4)
    {
        browser_element_follow_other_frame(buffer, elem);
        return;
    } else if (prefix > 1)
    {
        browser_element_follow_other_buffer(buffer, elem);
        return;
    }
    
    var elemTagName = elem.localName;
    elem.focus();

    var x = 1, y = 1;

    switch (elemTagName) {
    case "FRAME": case "IFRAME":
        return;
    case "IMG":
        var src = elem.src;
        if (src)
            src.ownerDocument.defaultView.location.href = src;
        return;
    case "AREA":
        // image map
        var coords = elem.getAttribute("coords").split(",");
        x = Number(coords[0]) + 1;
        y = Number(coords[1]) + 1;
        break;
    }

    var doc = elem.ownerDocument;
    var view = doc.defaultView;

    var evt = doc.createEvent("MouseEvents");
    /* FIXME: maybe use modifiers to indicate new tab/new window etc. behavior */
    evt.initMouseEvent("mousedown", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);

    evt.initMouseEvent("click", true, true, view, 1, x, y, 0, 0, /*ctrl*/ 0, /*event.altKey*/0,
                       /*event.shiftKey*/ 0, /*event.metaKey*/ 0, 0, null);
    elem.dispatchEvent(evt);
}

function element_get_url(buffer, elem) {
    if (elem == buffer.content_window)
        return elem.location.href;
    var name = null;
    switch (elem.localName) {
    case "FRAME": case "IFRAME":
        name = elem.contentWindow.location.href;
        break;
    case "IMG":
        name = elem.src;
        break;
    case "A":
        name = elem.href;
        break;
    }
    if (name && name.length == 0)
        name = null;
    return name;
}

function browser_element_follow_other_buffer(buffer, elem)
{
    elem.focus();
    var url = element_get_url(buffer, elem);
    if (url != null)
        open_url_in(buffer.frame, 4 /* other buffer */, url);
}

function browser_element_follow_other_frame(buffer, elem)
{
    elem.focus();
    var url = element_get_url(buffer, elem);
    if (url != null)
        open_url_in(buffer.frame, 5 /* other frame */, url);
}

function browser_element_follow_top(buffer, elem)
{
    elem.focus();
    var url = element_get_url(buffer, elem);
    if (url != null)
        open_url_in(buffer.frame, 1 /* current buffer */, url);
}

/* USER PREFERENCE */
/* FIXME: figure out why this needs to have a bunch of duplication */
var hints_xpath_expressions = {
    images: {def: "//img | //xhtml:img"},
    frames: {def: "//iframe | //frame | //xhtml:iframe | //xhtml:frame"},
    links: {def:
            "//*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
            "//input[not(@type='hidden')] | //a | //area | //iframe | //textarea | //button | //select | " +
            "//xhtml:*[@onclick or @onmouseover or @onmousedown or @onmouseup or @oncommand or @class='lk' or @class='s'] | " +
            "//xhtml:input[not(@type='hidden')] | //xhtml:a | //xhtml:area | //xhtml:iframe | //xhtml:textarea | " +
            "//xhtml:button | //xhtml:select"}
};

var hints_default_object_classes = {
    follow: "links",
    follow_top: "frames",
    focus: "frames",
    save: "links",
    def: "links"
};

I.hints_object_class = interactive_method(
    $sync = function (ctx, action_name) {
        var cls =
            ctx.hints_object_class ||
            hints_default_object_classes[action_name] ||
            hints_default_object_classes["def"];
        return cls;
    }
    );

I.hints_xpath_expression = interactive_method(
    $sync = function (ctx, action_name) {
        var cls =
            ctx.hints_object_class ||
            hints_default_object_classes[action_name] ||
            hints_default_object_classes["def"];
        var db = hints_xpath_expressions[cls];
        return db[action_name] || db["def"];
    }
    );

function hints_object_class_selector(name) {
    return function (ctx, active_keymap, overlay_keymap) {
        ctx.hints_object_class = name;
    }
}

function hinted_element_with_prompt(action, action_name, default_class, prompter)
{
    if (prompter != null && typeof(prompter) == "function") {
        return I.hinted_element(
            $prompt = I.bind(function (cls,prefix) {
                    var base = (cls == default_class) ?
                        action_name : 
                        action_name + " (" + cls + ")";
                    return prompter(prefix, base);
                }, I.hints_object_class(action), I.p),
            $hint_xpath_expression = I.hints_xpath_expression(action));
    } else {
        if (prompter == null)
            prompter = "";
        return I.hinted_element(
            $prompt = I.bind(function (cls) {
                    var base = (cls == default_class) ?
                        action_name : 
                        action_name + " (" + cls + ")";
                    return base + "" + prompter + ":";
                }, I.hints_object_class(action)),
            $hint_xpath_expression = I.hints_xpath_expression(action));
    }
}

interactive("browser-element-follow", browser_element_follow,
            I.current_buffer,
            hinted_element_with_prompt("follow", "Follow", "links", open_url_in_prompt),
            I.p);

interactive("browser-element-follow-other-buffer", browser_element_follow_other_buffer,
            I.current_buffer,
            hinted_element_with_prompt("follow", "Follow", "links", " in new buffer"));

interactive("browser-element-follow-other-frame", browser_element_follow_other_frame,
            I.current_buffer,
            hinted_element_with_prompt("follow", "Follow", "links", " in new frame"));

interactive("browser-element-follow-top", browser_element_follow_top,
            I.current_buffer,
            hinted_element_with_prompt("follow_top", "Follow", "frames", " in top frame"));

interactive("browser-element-focus", browser_element_focus,
            I.current_buffer,
            hinted_element_with_prompt("focus", "Focus", null, null));

interactive("browser-element-save", browser_element_save,
            $$ = hinted_element_with_prompt("save", "Save", "links", null),
            $$1 = I.bind(element_get_url, I.current_buffer, $$),
            I.F($prompt = "Save as:",
                $initial_value = I.bind(function (u) { return generate_save_path(u).path; }, $$1),
                $history = "save"));
