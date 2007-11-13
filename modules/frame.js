
function define_frame_local_hook(hook_name)
{
    initialize_hook(hook_name).run = function (frame) {
        run_hooks(this, arguments);
        run_hooks(frame[hook_name], arguments);
    }
}

define_hook("make_frame_hook");

function generate_new_frame_tag(tag)
{
    var existing = [];
    var exact_match = false;
    var en = this.window_watcher.getWindowEnumerator ();
    if (tag == '') { tag = null; }
    var re;
    if (tag) {
        re = new RegExp ("^" + tag + "<(\\d+)>$");
    } else {
        re = new RegExp ("^(\\d+)$");
    }
    while (en.hasMoreElements ()) {
        var w = en.getNext().QueryInterface (Components.interfaces.nsIDOMWindow);
        if ('tag' in w)  {
            if (tag && w.tag == tag) {
                exact_match = true;
                continue;
            }
            var re_result = re.exec (w.tag);
            if (re_result)
                existing.push (re_result[1]);
        }
    }
    if (tag && ! exact_match)
        return tag;

    existing.sort (function (a, b) { return a - b; });

    var n = 1;
    for (var i = 0; i < existing.length; i++) {
        if (existing[i] < n) continue;
        if (existing[i] == n) { n++; continue; }
        break;
    }
    if (tag) {
        return tag + "<" + n + ">";
    } else {
        return n;
    }
}

function make_frame (url, tag)
{
    var open_args = ['conkeror'];
    if (url) { open_args.push (['find'].concat (url)); }
    if (tag) { open_args.push (['tag', tag]); }
    open_args = this.encode_xpcom_structure (open_args);
    var result = this.window_watcher.openWindow(null,
                                                this.chrome,
                                                null,
                                                "resizable=yes,dialog=no",
                                                open_args);
    make_frame_hook.run(result);
    return result;
}


define_frame_local_hook("frame_initialize_early_hook");
define_frame_local_hook("frame_initialize_hook");
define_frame_local_hook("frame_initialize_late_hook");

function frame_initialize(frame)
{
    frame.conkeror = conkeror;
    frame_initialize_early_hook.run(frame);
    frame_initialize_hook.run(frame);
    frame.setTimeout(function(){frame_initialize_late_hook.run(frame);},0);
}
