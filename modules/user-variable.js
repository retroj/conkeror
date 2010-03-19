/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

require("source-code.js");

var user_variables = {};

function define_variable (name, default_value, doc) {
    conkeror[name] = default_value;
    user_variables[name] = {
        default_value: default_value,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference()
    };
}

function define_special_variable (name, getter, setter, doc) {
    conkeror.__defineGetter__(name, getter);
    conkeror.__defineSetter__(name, setter);
    user_variables[name] = {
        default_value: undefined,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference()
    };
}

provide("user-variable");
