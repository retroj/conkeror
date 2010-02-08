/**
 * (C) Copyright 2004-2007 Shawn Betts
 * (C) Copyright 2007-2009 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * trim_whitespace removes whitespace from the beginning and end of the
 * given string.
 */
function trim_whitespace (str) {
    var tmp = new String(str);
    return tmp.replace(/^\s+/, "").replace(/\s+$/, "");
}


function shell_quote (str) {
    var s = str.replace("\"", "\\\"", "g");
    s = s.replace("$", "\$", "g");
    return s;
}

/* Like perl's quotemeta. Backslash all non-alphanumerics. */
function quotemeta (str) {
    return str.replace(/([^a-zA-Z0-9])/g, "\\$1");
}

/* Given a list of choices (strings), return a regex which matches any
   of them*/
function choice_regex (choices) {
    var regex = "(?:" + choices.map(quotemeta).join("|") + ")";
    return regex;
}


/**
 * get_shortdoc_string, given a docstring, returns the portion of the
 * docstring up to the first newline, or the whole docstring.
 */
function get_shortdoc_string (doc) {
    var shortdoc = null;
    if (doc != null) {
        var idx = doc.indexOf("\n");
        if (idx >= 0)
            shortdoc = doc.substring(0,idx);
        else
            shortdoc = doc;
    }
    return shortdoc;
}


/**
 * string_format takes a format-string containing %X style format codes,
 * and an object mapping the code-letters to replacement text.  It
 * returns a string with the formatting codes replaced by the replacement
 * text.
 */
function string_format (spec, substitutions) {
    return spec.replace(/%(.)/g, function (a, b) substitutions[b]);
}


/**
 * html_escape replaces characters which are special in html with character
 * entities, safe for inserting as text into an html document.
 */
function html_escape (str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
