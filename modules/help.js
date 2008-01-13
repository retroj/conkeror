require("special-buffer.js");
require("interactive.js");

function help_buffer(window, element) {
    keywords(arguments);
    conkeror.buffer.call(this, window, element, forward_keywords(arguments));
}

help_buffer.prototype = {
    constructor: help_buffer,

    __proto__: special_buffer.prototype
};

function where_is_command(buffer, command) {
    var list = find_command_in_keymap(buffer, command);
    var msg;
    if (list.length == 0)
        msg = command + " is not on any key";
    else
        msg = command + " is on " + list.join(", ");
    buffer.window.minibuffer.message(msg);
}
interactive("where-is", where_is_command, I.current_buffer, I.C($prompt = "Where is command:"));

function help_document_generator(document) {
    dom_generator.call(this, document, XHTML_NS);
}
help_document_generator.prototype = {
    __proto__: dom_generator.prototype,

    key_binding : function(str, parent) {
        var node = this.element("span", "class", "key-binding");
        this.text(str, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    source_code_reference : function(ref, parent) {
        var f = this.document.createDocumentFragment();
        var module_name = ref.module_name;
        //f.appendChild(this.text(module_name != null ? "module " : "file "));
        var x = this.element("a",
                             "class", "source-code-reference",
                             "href", "javascript:");
        x.addEventListener("click", function (event) {
                ref.open_in_editor();
                event.preventDefault();
                event.stopPropagation();
            }, false /* capture */, false /* allow untrusted */);
        x.textContent = (module_name != null ? module_name : ref.file_name);
        f.appendChild(x);
        if (parent)
            parent.appendChild(f);
        return f;
    },

    command_name : function(name, parent) {
        var node = this.element("span", "class", "command");
        this.text(name, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    command_reference : function(name, parent) {
        var node = this.element("a", "class", "command", "href", "#");
        /* FIXME: make this work */
        this.text(name, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    help_text : function(str, parent) {
        var paras = str.split("\n");
        var f = this.document.createDocumentFragment();
        for (var i = 0; i < paras.length; ++i) {
            var para = paras[i];
            if (para.length == 0)
                continue;

            var p = this.element("p", f);

            var regexp = /`([a-zA-Z0-9_\-$]+)\'/g;

            var match;
            var last_index = 0;
            while ((match = regexp.exec(para)) != null) {
                this.text(para.substring(last_index, match.index), p);
                var command = match[1];
                /* FIXME: check if it is a valid command */
                this.command_reference(command, p);
                last_index = regexp.lastIndex;
            }
            if (last_index < para.length)
                this.text(para.substring(last_index), p);
        }
        if (parent != null)
            parent.appendChild(f);
        return f;
    },

    add_help_stylesheet : function () {
        this.add_stylesheet("chrome://conkeror/content/help.css");
    }
};

define_keywords("$binding_list");
function describe_bindings_buffer(window, element) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, element, forward_keywords(arguments));
    this.binding_list = arguments.$binding_list;
    this.constructor_end();
}

describe_bindings_buffer.prototype = {

    get keymap() {
        return help_buffer_keymap;
    },

    title : "Key bindings",

    description : "*bindings*",

    generate : function () {
        var d = this.top_document;
        var list = this.binding_list;
        delete this.binding_list;

        var g = new help_document_generator(d);
        g.add_help_stylesheet();

        d.body.setAttribute("class", "describe-bindings");

        var table = d.createElementNS(XHTML_NS, "table");
        for (var i = 0; i < list.length; ++i) {
            var bind = list[i];
            var tr = d.createElementNS(XHTML_NS, "tr");
            tr.setAttribute("class", (i % 2 == 0) ? "even" : "odd");
            var seq_td = d.createElementNS(XHTML_NS, "td");
            seq_td.setAttribute("class", "key-binding");
            seq_td.textContent = bind.seq;
            tr.appendChild(seq_td);
            var command_td = d.createElementNS(XHTML_NS,"td");
            command_td.setAttribute("class", "command");
            var help_str = null;
            if (bind.command != null) {
                command_td.textContent = bind.command;
                var cmd = interactive_commands.get(bind.command);
                if (cmd != null)
                    help_str = cmd.shortdoc;
            }
            else if (bind.fallthrough)
                command_td.textContent = "[pass through]";
            tr.appendChild(command_td);
            var help_td = d.createElementNS(XHTML_NS, "td");
            help_td.setAttribute("class", "help");
            help_td.textContent = help_str || "";
            tr.appendChild(help_td);
            table.appendChild(tr);
        }
        d.body.appendChild(table);
    },

    __proto__: special_buffer.prototype
};


function describe_bindings(buffer, target) {
    var list = [];
    for_each_key_binding(buffer, function (binding_stack) {
            var last = binding_stack[binding_stack.length - 1];
            if (last.command == null && !last.fallthrough)
                return;
            var bind = {seq: format_binding_sequence(binding_stack),
                        fallthrough: last.fallthrough,
                        command: last.command};
            list.push(bind);
        });
    create_buffer(buffer.window, buffer_creator(describe_bindings_buffer,
                                                $configuration = buffer.configuration,
                                                $binding_list = list),
                  target);
}
interactive("describe-bindings", describe_bindings, I.current_buffer, I.browse_target("describe-bindings"));
default_browse_targets["describe-bindings"] = "find-url";



define_keywords("$command", "$bindings");
function describe_command_buffer(window, element) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, element, forward_keywords(arguments));
    this.bindings = arguments.$bindings;
    this.command = arguments.$command;
    this.cmd = interactive_commands.get(this.command);
    this.source_code_reference = this.cmd.source_code_reference;
    this.constructor_end();
}

describe_command_buffer.prototype = {

    get keymap() {
        return help_buffer_keymap;
    },

    get title() { return "Command help: " + this.command; },

    description : "*help*",

    generate : function () {
        var d = this.top_document;

        var g = new help_document_generator(d);

        g.add_help_stylesheet();
        d.body.setAttribute("class", "describe-command");

        var p;

        p = g.element("p", d.body);
        g.command_reference(this.command, p);
        var cmd = interactive_commands.get(this.command);
        if (cmd.source_code_reference)  {
            g.text(" is an interactive command in ", p);
            g.source_code_reference(cmd.source_code_reference, p);
            g.text(".", p);
        } else {
            g.text(" is an interactive command.", p);
        }

        if (this.bindings.length > 0) {
            p = g.element("p", d.body);
            g.text("It is bound to ", p);
            for (var i = 0; i < this.bindings.length; ++i) {
                if (i != 0)
                    g.text(", ", p);
                g.key_binding(this.bindings[i], p);
            }
            g.text(".", p);
        }

        if (cmd.doc != null)
            g.help_text(cmd.doc, d.body);
    },

    __proto__: special_buffer.prototype
};


function describe_command(buffer, command, target) {
    var bindings = find_command_in_keymap(buffer, command);
    create_buffer(buffer.window,
                  buffer_creator(describe_command_buffer,
                                 $configuration = buffer.configuration,
                                 $command = command,
                                 $bindings = bindings),
                  target);
}
interactive("describe-command", describe_command,
            I.current_buffer,
            I.C($prompt = "Describe command:"),
            I.browse_target("describe-command"));
default_browse_targets["describe-command"] = "find-url";






function view_referenced_source_code(buffer) {
    if (buffer.source_code_reference == null)
        throw interactive_error("Command not valid in current buffer.");
    buffer.source_code_reference.open_in_editor();
}
interactive("view-referenced-source-code", view_referenced_source_code,
            I.current_buffer);





define_keywords("$binding", "$other_bindings", "$key_sequence");
function describe_key_buffer(window, element) {
    keywords(arguments);
    special_buffer.call(this, window, element, forward_keywords(arguments));
    this.key_sequence = arguments.$key_sequence;
    this.bindings = arguments.$other_bindings;
    this.bind = arguments.$binding;
    this.source_code_reference = this.bind.source_code_reference;
}

describe_key_buffer.prototype = {

    get keymap() {
        return help_buffer_keymap;
    },

    get title() { return "Key help: " + this.key_sequence; },

    description : "*help*",

    generate : function () {
        var d = this.top_document;

        var g = new help_document_generator(d);

        g.add_help_stylesheet();
        d.body.setAttribute("class", "describe-key");

        var p;

        p = g.element("p", d.body);
        g.key_binding(this.key_sequence, p);
        g.text(" is bound to the command ", p);
        var command = this.bind.command;
        if (command == null)
            g.command_name("[pass through]", p);
        else
            g.command_reference(command, p);
        if (this.source_code_reference) {
            g.text(" in ", p);
            g.source_code_reference(this.source_code_reference, p);
        }
        g.text(".", p);

        if (command != null) {
            p = g.element("p", d.body);
            g.command_reference(command, p);
            var cmd = interactive_commands.get(command);
            if (cmd.source_code_reference)  {
                g.text(" is an interactive command in ", p);
                g.source_code_reference(cmd.source_code_reference, p);
                g.text(".", p);
            } else {
                g.text(" is an interactive command.", p);
            }

            if (this.bindings.length > 0) {
                p = g.element("p", d.body);
                g.text("It is bound to ", p);
                for (var i = 0; i < this.bindings.length; ++i) {
                    if (i != 0)
                        g.text(", ", p);
                    g.key_binding(this.bindings[i], p);
                }
                g.text(".", p);
            }

            if (cmd.doc != null)
                g.help_text(cmd.doc, d.body);
        }
    },

    __proto__: special_buffer.prototype
};


function describe_key(buffer, key_info, target) {
    var bindings;
    var seq = key_info[0];
    var bind = key_info[1];

    if (bind.command)
        bindings = find_command_in_keymap(buffer, bind.command);
    else
        bindings = [];

    create_buffer(buffer.window,
                  buffer_creator(describe_key_buffer,
                                 $configuration = buffer.configuration,
                                 $key_sequence = seq.join(" "),
                                 $other_bindings = bindings,
                                 $binding = bind),
                  target);
}
interactive("describe-key", describe_key,
            $$ = I.current_buffer,
            I.key_binding($prompt = "Describe key:",
                          $buffer = $$),
            I.browse_target("describe-key"));
default_browse_targets["describe-key"] = "find-url";
