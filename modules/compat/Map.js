/**
 * (C) Copyright 2014 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 **/

/**
 * Simple emulation of Map for Gecko versions < 13 Keys are based on
 * string representation of Object, rather than Object identity, but
 * for numbers and strings the effect is the same.
 **/

if (typeof(Map) == "undefined") {
    function Map() {
        this.data = {}
        this.size = 0;
    }
    Map.prototype.get = function (k) { return this.data["K" + k]; };
    Map.prototype.set = function (k, v) {
        if (!(("K" + k) in this.data)) ++this.size;
        this.data["K" + k] = v;
    };
    Map.prototype.has = function (k) { return ("K" + k) in this.data; };
    Map.prototype.delete = function (k) {
        if (("K" + k) in this.data) {
            delete this.data["K" + k];
            --this.size;
        }
    };
    Map.prototype.clear = function (k) { this.data = {}; this.size = 0; };

    // Note: This does not return in insertion order.
    Map.prototype.keys = function () {
        for (k in this.data)
            yield k.substring(1);
    };

    // Note: This does not return in insertion order.
    Map.prototype.values = function () {
        for (k in this.data)
            yield this.data[k];
    };

    // Note: This does not return in insertion order.
    Map.prototype.entries = function () {
        for (k in this.data)
            yield [k.substring(1), this.data[k]];
    };

    Map.prototype.forEach = function (callbackFn, thisArg) {
        for (k in this.data)
            callbackFn.call(thisArg, k.substring(1), this.data[k]);
    };
}
