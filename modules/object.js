/**
 * (C) Copyright 2016 Scott Jaderholm

 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

function object_keys (object) {
    return Object.keys(object);
}

function object_values (object) {
    return object_keys(object).map(function (key) { return object[key]; });
}

provide("object");
