/**
 * (C) Copyright 2008 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

var walnut_output = dumpln;

function is (got, expect, name) {
    if (name == null) name = "unnamed test";
    if (got != expect) {
        walnut_output(name+" failed. expected <"+expect+">, got <"+got+">.");
        return false;
    }
    walnut_output(name);
    return true;
}

function quiet_is (got, expect, name) {
    var out = walnut_output;
    walnut_output = function () {};
    var res = is(got, expect, name);
    walnut_output = out;
    return res;
}

// sanity check
is(quiet_is(1,0), false, "walnut sanity check 1");
is(quiet_is(1,1), true, "walnut sanity check 2");

