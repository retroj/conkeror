add_hook (make_frame_hook, function () { this.dumpln = dumpln; });


adsfadf;

var MAX_DUMP_DEPTH = 1;
function dump_obj_r(obj, name, indent, depth) {
    if (depth > MAX_DUMP_DEPTH) {
        return indent + name + ": <Maximum Depth Reached>\n";
    }
    if (typeof obj == "object") {
        var child = null;
        var output = indent + name + "\n";
        indent += "\t";
        for (var item in obj)
        {
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            if (typeof child == "object") {
                output += dump_obj(child, item, indent, depth + 1);
            } else {
                output += indent + item + ": " + child + "\n";
            }
        }
        return output;
    } else {
        return obj;
    }
}
add_hook (make_frame_hook, function () { this.dump_obj_r = dump_obj_r; });


function dump_obj (obj, name) {
    if (typeof obj == "object") {
        var child = null;
        var output = name + "\n";
        for (var item in obj)
        {
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            output += item + ": " + child + "\n";
        }
        return output;
    } else {
        return obj;
    }
}
add_hook (make_frame_hook, function () { this.dump_obj = dump_obj; });
