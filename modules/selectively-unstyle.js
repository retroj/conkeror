/**
 * (C) Copyright 2009 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

define_variable('selectively_unstyle_alist', [],
    "Alist mapping url-matching regular expressions to predicates to "+
    "selectively disable stylesheets.  All predicates corresponding to "+
    "matching regexps will be used.  Predicates are functions of one "+
    "argument.  They receive a styleSheet object as their argument, and "+
    "if they return true, that stylesheet will be disabled.");


function selectively_unstyle (buffer) {
    var uri = buffer.current_uri.spec;
    for each (let entry in selectively_unstyle_alist) {
        if (entry[0](uri)) {
            let func = entry[1];
            for each (var sheet in buffer.document.styleSheets) {
                func(sheet);
            }
        }
    }
}

add_hook("buffer_loaded_hook", selectively_unstyle);

provide("selectively-unstyle");
