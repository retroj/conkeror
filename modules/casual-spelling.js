/**
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Contributors:
 *   Kris Maglione
 *   John J. Foerch
 */

/*

This module provides a pattern matcher for hints_text_match which lets you
type ascii characters in the hints minibuffer to match unicode characters
such as accented letters and ligatures.

*/

in_module("casual_spelling");

function table_entry_features (entry) {
    var ret = { ligatures: false, multiples: false };
    if (typeof entry == "object") {
        for each (var t in entry) {
            if (typeof t == "string" && t.length > 1)
                ret.ligatures = true;
            else if (typeof t == "object") {
                ret.multiples = true;
                if (t.some(function (x) (x.length > 1)))
                    ret.ligatures = true;
            }
        }
    }
    return ret;
}

function make_table (table) {
    for (var k in table) {
        var features = table_entry_features(table[k]);
        if (features.ligatures) table.ligatures = true;
        if (features.multiples) table.multiples = true;
    }
    return table;
}


/**
 * make_table_from_ranges is a constructor of a casual-spelling 
 * table which generates the table from a shorthand form
 * called a "range table".  A range table is an array where each element
 * is an array of three elements: range-low, range-high, and range-spec.
 * Low and high are integer codepoints of unicode characters to be
 * translated.  The spec can be a string, or an array.  If it is a string,
 * it should be a single character.  The designated range will have that
 * character as its low-point translation, and each next character in the
 * range will be incremented from that point.  This is how you can
 * compactly denote alphabetic ranges, for example.  If the spec is an
 * array, the strings in that array will be repeated over the designated
 * range.  Multi-character translations, such as for ligatures, must be
 * given in the array form of range-spec.
 */
function make_table_from_ranges (table) {
    var ret = {};
    table.map(function (a) {
        var features = table_entry_features(a[2]);
        if (features.ligatures) ret.ligatures = true;
        if (features.multiples) ret.multiples = true;
        for (var c = a[0]; c <= a[1]; c++) {
            var chr = String.fromCharCode(c);
            if (typeof a[2] == "string")
                ret[chr] = String.fromCharCode(a[2].charCodeAt(0) + c - a[0]);
            else
                ret[chr] = a[2][(c - a[0]) % a[2].length];
        }
    });
    return ret;
}


function translate (chr) {
    return tables[chr] || chr;
}


/*
 * Pattern Matchers
 */

function hints_text_match (text, pattern) {
    if (pattern == "")
        return [0, 0];
    var plen = pattern.length;
    for (var i = 0, tlen = text.length - plen; i <= tlen; i++) {
        for (var j = 0;; j++) {
            if (pattern[j] != text[i+j] &&
                pattern[j] != translate(text[i+j]))
                break;
            if (j == plen - 1)
                return [i, i+plen];
        }
    }
    return false;
}

function hints_text_match_ligatures (text, pattern) {
    if (pattern == "")
        return [0, 0];
    var tlen = text.length;
    var plen = pattern.length;
    var decoded = Array.map(text, translate);
    for (var i = 0; i < tlen; i++) {
        for (var e = 0, j = 0; i + e < tlen; e++) {
            var elen = 1;
            if (pattern[j] != text[i+e] &&
                pattern.substring(j, j+(elen = decoded[i+e].length)) != decoded[i+e])
                break;
            j += elen;
            if (j == plen)
                return [i, i+e+1];
        }
    }
    return false;
}

function hints_text_match_multiples (text, pattern) {
    if (pattern == "")
        return [0, 0];
    var plen = pattern.length;
    var decoded = Array.map(text, function (x) Array.concat(x, translate(x)));
    for (var i = 0, tlen = text.length - plen; i < tlen; i++) {
        for (var j = 0; j < plen; j++) {
            if (! decoded[i+j].some(function (x) x == pattern[j]))
                break;
            if (j == plen - 1)
                return [i, i+plen];
        }
    }
    return false;
}

function hints_text_match_ligatures_multiples (text, pattern) {
    if (pattern == "")
        return [0, 0];
    var tlen = text.length;
    var plen = pattern.length;
    var decoded = Array.map(text, function (x) Array.concat(x, translate(x)));
    var matched, mlen;
    for (var i = 0; i < tlen; i++) {
        for (var e = 0, j = 0; i + e < tlen; e++) {
            if (! decoded[i+e].some(function (x) (pattern.substring(j, j+(mlen = x.length)) == (matched = x))))
                break;
            j += mlen;
            if (j == plen)
                return [i, i+e+1];
        }
    }
    return false;
}



/*
 * Table Installation
 */

var tables;

function add_table (table) {
    table.__proto__ = tables;
    tables = table;
    if (tables.ligatures && tables.multiples)
        conkeror.hints_text_match = hints_text_match_ligatures_multiples;
    else if (tables.ligatures)
        conkeror.hints_text_match = hints_text_match_ligatures;
    else if (tables.multiples)
        conkeror.hints_text_match = hints_text_match_multiples;
    else
        conkeror.hints_text_match = hints_text_match;
}


add_table(make_table({}));



var accents_table = make_table_from_ranges(
    [[0x00a9, 0x00a9, "C"],//copyright
     [0x00c0, 0x00c5, ["A"]],
     [0x00c7, 0x00c7, "C"],
     [0x00c8, 0x00cb, ["E"]],
     [0x00cc, 0x00cf, ["I"]],
     [0x00d1, 0x00d1, "N"],
     [0x00d2, 0x00d6, ["O"]],
     [0x00d8, 0x00d8, "O"],
     [0x00d9, 0x00dc, ["U"]],
     [0x00dd, 0x00dd, "Y"],
     [0x00e0, 0x00e5, ["a"]],
     [0x00e7, 0x00e7, "c"],
     [0x00e8, 0x00eb, ["e"]],
     [0x00ec, 0x00ef, ["i"]],
     [0x00f1, 0x00f1, "n"],
     [0x00f2, 0x00f6, ["o"]],
     [0x00f8, 0x00f8, "o"],
     [0x00f9, 0x00fc, ["u"]],
     [0x00fd, 0x00fd, "y"],
     [0x00ff, 0x00ff, "y"],
     [0x0100, 0x0105, ["A", "a"]],
     [0x0106, 0x010d, ["C", "c"]],
     [0x010e, 0x0111, ["D", "d"]],
     [0x0112, 0x011b, ["E", "e"]],
     [0x011c, 0x0123, ["G", "g"]],
     [0x0124, 0x0127, ["H", "h"]],
     [0x0128, 0x0130, ["I", "i"]],
     [0x0134, 0x0135, ["J", "j"]],
     [0x0136, 0x0136, ["K", "k"]],
     [0x0139, 0x0142, ["L", "l"]],
     [0x0143, 0x0148, ["N", "n"]],
     [0x0149, 0x0149, "n"],
     [0x014c, 0x0151, ["O", "o"]],
     [0x0154, 0x0159, ["R", "r"]],
     [0x015a, 0x0161, ["S", "s"]],
     [0x0162, 0x0167, ["T", "t"]],
     [0x0168, 0x0173, ["U", "u"]],
     [0x0174, 0x0175, ["W", "w"]],
     [0x0176, 0x0178, ["Y", "y", "Y"]],
     [0x0179, 0x017e, ["Z", "z"]],
     [0x0180, 0x0183, ["b", "B", "B", "b"]],
     [0x0187, 0x0189, ["C", "c", "D"]],
     [0x018a, 0x0192, ["D", "D", "d", "F", "f"]],
     [0x0193, 0x0194, ["G"]],
     [0x0197, 0x019b, ["I", "K", "k", "l", "l"]],
     [0x019d, 0x01a1, ["N", "n", "O", "O", "o"]],
     [0x01a4, 0x01a5, ["P", "p"]],
     [0x01ab, 0x01ab, ["t"]],
     [0x01ac, 0x01b0, ["T", "t", "T", "U", "u"]],
     [0x01b2, 0x01d2, ["V", "Y", "y", "Z", "z", "D", "L",
                       "N", "A", "a", "I", "i", "O", "o"]],
     [0x01d3, 0x01dc, ["U", "u"]],
     [0x01de, 0x01e1, ["A", "a"]],
     [0x01e4, 0x01ed, ["G", "g", "G", "g", "K", "k", "O", "o", "O", "o"]],
     [0x01f0, 0x01f5, ["j", "D", "G", "g"]],
     [0x01fa, 0x01fb, ["A", "a"]],
     [0x01fe, 0x0217, ["O", "o", "A", "a", "A", "a", "E", "e", "E",
                       "e", "I", "i", "I", "i", "O", "o", "O", "o",
                       "R", "r", "R", "r", "U", "u", "U", "u"]],
     [0x0253, 0x0257, ["b", "c", "d", "d"]],
     [0x0260, 0x0269, ["g", "h", "h", "i", "i"]],
     [0x026b, 0x0273, ["l", "l", "l", "l", "m", "n", "n"]],
     [0x027c, 0x028b, ["r", "r", "r", "r", "s", "t", "u", "u", "v"]],
     [0x0290, 0x0291, ["z"]],
     [0x029d, 0x02a0, ["j", "q"]],
     [0x1e00, 0x1e09, ["A", "a", "B", "b", "B", "b", "B", "b", "C", "c"]],
     [0x1e0a, 0x1e13, ["D", "d"]],
     [0x1e14, 0x1e1d, ["E", "e"]],
     [0x1e1e, 0x1e21, ["F", "f", "G", "g"]],
     [0x1e22, 0x1e2b, ["H", "h"]],
     [0x1e2c, 0x1e8f, ["I", "i", "I", "i", "K", "k", "K", "k", "K", "k",
                       "L", "l", "L", "l", "L", "l", "L", "l", "M", "m",
                       "M", "m", "M", "m", "N", "n", "N", "n", "N", "n",
                       "N", "n", "O", "o", "O", "o", "O", "o", "O", "o",
                       "P", "p", "P", "p", "R", "r", "R", "r", "R", "r",
                       "R", "r", "S", "s", "S", "s", "S", "s", "S", "s",
                       "S", "s", "T", "t", "T", "t", "T", "t", "T", "t",
                       "U", "u", "U", "u", "U", "u", "U", "u", "U", "u",
                       "V", "v", "V", "v", "W", "w", "W", "w", "W", "w",
                       "W", "w", "W", "w", "X", "x", "X", "x", "Y", "y"]],
     [0x1e90, 0x1e9a, ["Z", "z", "Z", "z", "Z", "z", "h", "t", "w", "y", "a"]],
     [0x1ea0, 0x1eb7, ["A", "a"]],
     [0x1eb8, 0x1ec7, ["E", "e"]],
     [0x1ec8, 0x1ecb, ["I", "i"]],
     [0x1ecc, 0x1ee3, ["O", "o"]],
     [0x1ee4, 0x1ef1, ["U", "u"]],
     [0x1ef2, 0x1ef9, ["Y", "y"]],
     [0x2071, 0x2071, "i"],
     [0x207f, 0x207f, "n"],
     [0x249c, 0x24b5, "a"],
     [0x24b6, 0x24cf, "A"],
     [0x24d0, 0x24e9, "a"],
     [0xff21, 0xff3a, "A"],
     [0xff41, 0xff5a, "a"]]);

var ligatures_table = make_table_from_ranges(
    [[0x00c6, 0x00c6, ["AE"]],
     [0x00df, 0x00df, ["ss"]],
     [0x00e6, 0x00e6, ["ae"]],
     [0x0132, 0x0132, ["IJ"]],
     [0x0133, 0x0133, ["ij"]],
     [0x0152, 0x0152, ["OE"]],
     [0x0153, 0x0153, ["oe"]],
     [0x01e2, 0x01e2, ["AE"]],
     [0x01e3, 0x01e3, ["ae"]],
     [0x01fc, 0x01fc, ["AE"]],
     [0x01fd, 0x01fd, ["ae"]],
     [0xfb00, 0xfb00, ["ff"]],
     [0xfb01, 0xfb01, ["fi"]],
     [0xfb02, 0xfb02, ["fl"]],
     [0xfb03, 0xfb03, ["ffi"]],
     [0xfb04, 0xfb04, ["ffl"]],
     [0xfb05, 0xfb05, ["st"]],
     [0xfb06, 0xfb06, ["st"]]]);

add_table(accents_table);
add_table(ligatures_table);

provide("casual-spelling");
