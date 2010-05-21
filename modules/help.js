/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 * (C) Copyright 2008 Nelson Elhage
 * (C) Copyright 2008 David Glasser
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("special-buffer.js");
require("interactive.js");

function where_is_command (buffer, command) {
    var keymaps = get_current_keymaps(buffer.window);
    var list = keymap_lookup_command(keymaps, command);
    var msg;
    if (list.length == 0)
        msg = command + " is not on any key";
    else
        msg = command + " is on " + list.join(", ");
    buffer.window.minibuffer.message(msg);
}
interactive("where-is", null, function (I) {
    where_is_command(I.buffer,
                     (yield I.minibuffer.read_command($prompt = "Where is command:")));
});

function help_document_generator (document, buffer) {
    dom_generator.call(this, document, XHTML_NS);
    this.buffer = buffer;
}
help_document_generator.prototype = {
    constructor: help_document_generator,
    __proto__: dom_generator.prototype,

    key_binding: function (str, parent) {
        var node = this.element("span", "class", "key-binding");
        this.text(str, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    source_code_reference: function (ref, parent) {
        var f = this.document.createDocumentFragment();
        var module_name = ref.module_name;
        var buffer = this.buffer;
        //f.appendChild(this.text(module_name != null ? "module " : "file "));
        var x = this.element("a",
                             "class", "source-code-reference",
                             "href", "javascript:");
        x.addEventListener("click", function (event) {
            co_call(function () {
                try {
                    yield ref.open_in_editor();
                } catch (e) {
                    handle_interactive_error(buffer.window, e);
                }}());
            event.preventDefault();
            event.stopPropagation();
        }, false /* capture */);
        x.textContent = (module_name != null ? module_name : ref.file_name);
        f.appendChild(x);
        if (parent)
            parent.appendChild(f);
        return f;
    },

    command_name: function (name, parent) {
        var node = this.element("span", "class", "command");
        this.text(name, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    command_reference: function (name, parent) {
        var node = this.element("a",
                                "class", "command",
                                "href", "javascript:");
        var buffer = this.buffer;
        node.addEventListener("click", function (event) {
                                  /* FIXME: don't hardcode browse target */
                                  describe_command(buffer, name, OPEN_NEW_BUFFER);
                                  event.preventDefault();
                                  event.stopPropagation();
            }, false /* capture */);
        this.text(name, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    variable_reference: function (name, parent) {
        var node = this.element("a", "class", "variable", "href", "#");
        /* FIXME: make this work */
        this.text(name, node);
        if (parent)
            parent.appendChild(node);
        return node;
    },

    help_text: function (str, parent) {
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

    add_help_stylesheet: function () {
        this.add_stylesheet("chrome://conkeror-gui/content/help.css");
    }
};


function help_buffer_modality (buffer, element) {
    buffer.keymaps.push(help_buffer_keymap);
}

/*
 * Describe Bindings
 */

define_keywords("$binding_list");
function describe_bindings_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.binding_list = arguments.$binding_list;
    this.modalities.push(help_buffer_modality);
    this.constructor_end();
}
describe_bindings_buffer.prototype = {
    constructor: describe_bindings_buffer,
    title: "Key bindings",

    description: "*bindings*",

    generate: function () {
        var d = this.document;
        var list = this.binding_list;
        delete this.binding_list;

        var list_by_keymap = {};
        var keymap_list = [];
        for each (let x in list) {
            let name = x.bound_in || "";
            let km;
            if (name in list_by_keymap)
                km = list_by_keymap[name];
            else {
                km = list_by_keymap[name] = {list_by_category: {}, category_list: [], name: name};
                keymap_list.push(km);
            }
            let catname = x.category || "";
            let cat;
            if (catname in km.list_by_category)
                cat = km.list_by_category[catname];
            else {
                cat = km.list_by_category[catname] = [];
                cat.name = catname;
                if (catname == "")
                    km.category_list.unshift(cat);
                else
                    km.category_list.push(cat);
            }
            cat.push(x);
        }

        var g = new help_document_generator(d, this);
        g.add_help_stylesheet();

        d.body.setAttribute("class", "help-list");

        for each (let km in keymap_list) {
            g.text(km.name, g.element("h1", d.body));
            for each (let cat in km.category_list) {
                if (cat.name != "")
                    g.text(cat.name, g.element("h2", d.body));

                let table = g.element("table", d.body);
                for (var i = 0; i < cat.length; ++i) {
                    let bind = cat[i];
                    let tr = g.element("tr", table, "class", (i % 2 == 0) ? "even" : "odd");
                    let seq_td = g.element("td", tr, "class", "key-binding");
                    g.text(bind.seq, seq_td);
                    let command_td = g.element("td", tr, "class", "command");
                    let help_str = null;
                    if (bind.command != null) {
                        if (typeof(bind.command) == "function") {
                            g.text("[function]", command_td);
                        } else {
                            let cmd = interactive_commands.get(bind.command);
                            if (cmd != null) {
                                g.command_reference(cmd.name, command_td);
                                help_str = cmd.shortdoc;
                            } else {
                                g.text(bind.command, command_td);
                            }
                        }
                    } else if (bind.fallthrough)
                        g.text("[pass through]", command_td);
                    let help_td = g.element("td", tr, "class", "help");
                    g.text(help_str || "", help_td);
                }
            }
        }
    },

    __proto__: special_buffer.prototype
};


function describe_bindings (buffer, target, keymaps, prefix) {
    var list = [];
    if (! keymaps)
        keymaps = get_current_keymaps(buffer.window);
    if (prefix)
        prefix = format_binding_sequence(
            prefix.map(function (x) { return {key:x}; }))+" ";
    else
        prefix = "";
    for_each_key_binding(keymaps, function (binding_stack) {
            var last = binding_stack[binding_stack.length - 1];
            if (last.command == null && !last.fallthrough)
                return;
            let bound_in = null;
        outer:
            for (let i = binding_stack.length - 1; i >= 0; --i) {
                bound_in = binding_stack[i].bound_in;
                while (bound_in) {
                    if (bound_in.name && !bound_in.anonymous)
                        break outer;
                    bound_in = bound_in.bound_in;
                }
            }
            var bind = {seq: prefix+format_binding_sequence(binding_stack),
                        fallthrough: last.fallthrough,
                        command: last.command,
                        bound_in: bound_in.name,
                        category: last.category
                       };
            list.push(bind);
        });
    create_buffer(buffer.window, buffer_creator(describe_bindings_buffer,
                                                $opener = buffer,
                                                $binding_list = list),
                  target);
}
function describe_bindings_new_buffer (I) {
    describe_bindings(I.buffer, OPEN_NEW_BUFFER);
}
function describe_bindings_new_window (I) {
    describe_bindings(I.buffer, OPEN_NEW_WINDOW);
}
interactive("describe-bindings",
    "Show a help buffer describing the bindings in the context keymaps, "+
    "meaning the top-level keymaps according to the focus context in the "+
    "current buffer.",
    alternates(describe_bindings_new_buffer,
               describe_bindings_new_window));

function describe_active_bindings_new_buffer (I) {
    describe_bindings(I.buffer, OPEN_NEW_BUFFER,
                      I.keymaps || get_current_keymaps(I.buffer.window),
                      I.key_sequence.slice(0, -1));
}
function describe_active_bindings_new_window (I) {
    describe_bindings(I.buffer, OPEN_NEW_WINDOW,
                      I.keymaps || get_current_keymaps(I.buffer.window),
                      I.key_sequence.slice(0, -1));
}
interactive("describe-active-bindings",
    "Show a help buffer describing the bindings in the active keymaps, "+
    "meaning the keymaps in the middle of an ongoing key sequence.  This "+
    "command is intended to be called via `sequence_help_keymap'.  For "+
    "that reason, `describe-active-bindings' does not consume and prefix "+
    "commands like `universal-argument', as doing so would lead to "+
    "ambiguities with respect to the intent of the user.",
    describe_active_bindings_new_buffer);


/*
 * Apropos Command
 */

define_keywords("$command_list");
function apropos_command_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.command_list = arguments.$command_list;
    this.modalities.push(help_buffer_modality);
    this.constructor_end();
}
apropos_command_buffer.prototype = {
    constructor: apropos_command_buffer,
    title: "Apropos commands",

    description: "*Apropos*",

    generate: function () {
        var d = this.document;
        var list = this.command_list;
        delete this.command_list;

        var g = new help_document_generator(d, this);
        g.add_help_stylesheet();

        d.body.setAttribute("class", "help-list");

        var table = d.createElementNS(XHTML_NS, "table");
        for (var i = 0; i < list.length; ++i) {
            var binding = list[i];
            var tr = d.createElementNS(XHTML_NS, "tr");
            tr.setAttribute("class", (i % 2 == 0) ? "even" : "odd");

            var command_td = d.createElementNS(XHTML_NS,"td");
            g.command_reference(binding.name, command_td);

            var shortdoc = "";
            if (binding.cmd.shortdoc != null)
                shortdoc = binding.cmd.shortdoc;
            tr.appendChild(command_td);

            var shortdoc_td = d.createElementNS(XHTML_NS, "td");
            shortdoc_td.setAttribute("class", "help");
            shortdoc_td.textContent = shortdoc;
            tr.appendChild(shortdoc_td);

            table.appendChild(tr);
        }
        d.body.appendChild(table);
    },

    __proto__: special_buffer.prototype
};


/* TODO: support regexps/etc. */
function apropos_command (buffer, substring, target) {
    var list = [];
    interactive_commands.for_each(function (name, cmd) {
        if (name.indexOf(substring) != -1) {
            var binding = {name: name, cmd: cmd};
            list.push(binding);
        }
    });
    list.sort(function (a,b) {
                  if (a.name < b.name)
                      return -1;
                  if (a.name > b.name)
                      return 1;
                  return 0
              });
    create_buffer(buffer.window, buffer_creator(apropos_command_buffer,
                                                $opener = buffer,
                                                $command_list = list),
                  target);
}

function apropos_command_new_buffer (I) {
    apropos_command(I.buffer,
                    (yield I.minibuffer.read($prompt = "Apropos command:",
                                             $history = "apropos")),
                    OPEN_NEW_BUFFER);
}
function apropos_command_new_window (I) {
    apropos_command(I.buffer,
                    (yield I.minibuffer.read($prompt = "Apropos command:",
                                             $history = "apropos")),
                    OPEN_NEW_WINDOW);
}
interactive("apropos-command", "List commands whose names contain a given substring.",
            alternates(apropos_command_new_buffer, apropos_command_new_window));



/*
 * Describe Command
 */

define_keywords("$command", "$bindings");
function describe_command_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.bindings = arguments.$bindings;
    this.command = arguments.$command;
    this.cmd = interactive_commands.get(this.command);
    this.source_code_reference = this.cmd.source_code_reference;
    this.modalities.push(help_buffer_modality);
    this.constructor_end();
}
describe_command_buffer.prototype = {
    constructor: describe_command_buffer,
    get title () { return "Command help: " + this.command; },

    description: "*help*",

    generate: function () {
        var d = this.document;

        var g = new help_document_generator(d, this);

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


function describe_command (buffer, command, target) {
    var keymaps = get_current_keymaps(buffer.window);
    var bindings = keymap_lookup_command(keymaps, command);
    create_buffer(buffer.window,
                  buffer_creator(describe_command_buffer,
                                 $opener = buffer,
                                 $command = command,
                                 $bindings = bindings),
                  target);
}
function describe_command_new_buffer (I) {
    describe_command(I.buffer, (yield I.minibuffer.read_command($prompt = "Describe command:")),
                     OPEN_NEW_BUFFER);
}
function describe_command_new_window (I) {
    describe_command(I.buffer, (yield I.minibuffer.read_command($prompt = "Describe command:")),
                     OPEN_NEW_WINDOW);
}
interactive("describe-command", null,
            alternates(describe_command_new_buffer, describe_command_new_window));



function view_referenced_source_code (buffer) {
    if (buffer.source_code_reference == null)
        throw interactive_error("Command not valid in current buffer.");
    yield buffer.source_code_reference.open_in_editor();
}
interactive("view-referenced-source-code", null,
            function (I) {yield view_referenced_source_code(I.buffer);});


/*
 * Describe Key
 */

define_keywords("$binding", "$other_bindings", "$key_sequence");
function describe_key_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.key_sequence = arguments.$key_sequence;
    this.bindings = arguments.$other_bindings;
    this.bind = arguments.$binding;
    this.source_code_reference = this.bind.source_code_reference;
    this.modalities.push(help_buffer_modality);
    this.constructor_end();
}
describe_key_buffer.prototype = {
    constructor: describe_key_buffer,
    get title () { return "Key help: " + this.key_sequence; },

    description: "*help*",

    generate: function () {
        var d = this.document;

        var g = new help_document_generator(d, this);

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
        if (this.bind.browser_object != null) {
            g.text(" with the browser object, ", p);
            if (this.bind.browser_object instanceof Function) {
                g.text("<anonymous browser-object function>", p);
            } else if (this.bind.browser_object instanceof browser_object_class) {
                g.text(this.bind.browser_object.name, p);
            } else if (typeof(this.bind.browser_object) == "string") {
                g.text('"'+this.bind.browser_object+'"', p);
            } else {
                g.text(this.bind.browser_object, p);
            }
        }
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


function describe_key (buffer, key_info, target) {
    var bindings;
    var seq = key_info[0];
    var bind = key_info[1];
    var keymaps = get_current_keymaps(buffer.window);
    if (bind.command)
        bindings = keymap_lookup_command(keymaps, bind.command);
    else
        bindings = [];
    create_buffer(buffer.window,
                  buffer_creator(describe_key_buffer,
                                 $opener = buffer,
                                 $key_sequence = seq.join(" "),
                                 $other_bindings = bindings,
                                 $binding = bind),
                  target);
}
function describe_key_new_buffer (I) {
    describe_key(I.buffer,
                 (yield I.minibuffer.read_key_binding($prompt = "Describe key:")),
                 OPEN_NEW_BUFFER);
}
function describe_key_new_window (I) {
    describe_key(I.buffer,
                 (yield I.minibuffer.read_key_binding($prompt = "Describe key:")),
                 OPEN_NEW_WINDOW);
}

function describe_key_briefly (buffer, key_info) {
    var bindings;
    var seq = key_info[0];
    var bind = key_info[1];
    var browser_object = "";
    if (bind.browser_object != null) {
        browser_object += " on the browser object, ";
        if (bind.browser_object instanceof Function) {
            browser_object += "<anonymous browser-object function>";
        } else if (bind.browser_object instanceof browser_object_class) {
            browser_object += bind.browser_object.name;
        } else if (typeof(bind.browser_object) == "string") {
            browser_object += '"'+bind.browser_object+'"';
        } else {
            browser_object += bind.browser_object;
        }
    }
    buffer.window.minibuffer.message(seq.join(" ") + " runs the command " + bind.command + browser_object);
}

interactive("describe-key", null,
            alternates(describe_key_new_buffer, describe_key_new_window));

interactive("describe-key-briefly", null,
    function (I) {
        describe_key_briefly(
            I.buffer,
            (yield I.minibuffer.read_key_binding($prompt = "Describe key:")));
    });



/*
 * Describe Variable
 */

define_keywords("$variable");
function describe_variable_buffer (window) {
    this.constructor_begin();
    keywords(arguments);
    special_buffer.call(this, window, forward_keywords(arguments));
    this.variable = arguments.$variable;
    this.cmd = user_variables[this.variable];
    this.source_code_reference = this.cmd.source_code_reference;
    this.modalities.push(help_buffer_modality);
    this.constructor_end();
}
describe_variable_buffer.prototype = {
    constructor: describe_variable_buffer,
    get title () { return "Variable help: " + this.variable; },

    description: "*help*",

    generate: function () {
        var d = this.document;

        var g = new help_document_generator(d, this);

        g.add_help_stylesheet();
        d.body.setAttribute("class", "describe-variable");

        var p;

        p = g.element("p", d.body);
        g.variable_reference(this.variable, p);
        var uvar = user_variables[this.variable];
        if (uvar.source_code_reference)  {
            g.text(" is a user variable in ", p);
            g.source_code_reference(uvar.source_code_reference, p);
            g.text(".", p);
        } else {
            g.text(" is a user variable.", p);
        }

        p = g.element("p", d.body);
        g.text("Its value is: ", p);
        let value = conkeror[this.variable];
        {
            let s = pretty_print_value(value);
            let pre = g.element("pre", p);
            g.text(s, pre);
        }

        if (uvar.doc != null)
            g.help_text(uvar.doc, d.body);

        if (uvar.default_value !== undefined &&
            (uvar.default_value !== value ||
             (typeof(uvar.default_value) != "object")))  {
            p = g.element("p", d.body);
            g.text("Its default value is: ", p);
            {
                let s = pretty_print_value(uvar.default_value);
                let pre = g.element("pre", p);
                g.text(s, pre);
            }
        }
    },

    __proto__: special_buffer.prototype
};


function describe_variable (buffer, variable, target) {
    create_buffer(buffer.window,
                  buffer_creator(describe_variable_buffer,
                                 $opener = buffer,
                                 $variable = variable),
                  target);
}
function describe_variable_new_buffer (I) {
    describe_variable(I.buffer,
                      (yield I.minibuffer.read_user_variable($prompt = "Describe variable:")),
                      OPEN_NEW_BUFFER);
}
function describe_variable_new_window (I) {
    describe_variable(I.buffer,
                      (yield I.minibuffer.read_user_variable($prompt = "Describe variable:")),
                      OPEN_NEW_WINDOW);
}
interactive("describe-variable", null,
            alternates(describe_variable_new_buffer, describe_variable_new_window));



/*
 * Describe Preference
 */

function describe_preference (buffer, preference, target) {
    let key = preference.charAt(0).toUpperCase() + preference.substring(1);
    let url = "http://kb.mozillazine.org/" + key;
    browser_object_follow(buffer, target, url);
}
function describe_preference_new_buffer (I) {
    describe_preference(I.buffer, (yield I.minibuffer.read_preference($prompt = "Describe preference:")),
                        OPEN_NEW_BUFFER);
}
function describe_preference_new_window (I) {
    describe_preference(I.buffer, (yield I.minibuffer.read_preference($prompt = "Describe preference:")),
                        OPEN_NEW_WINDOW);
}
interactive("describe-preference", null,
            alternates(describe_preference_new_buffer, describe_preference_new_window));

provide("help");
