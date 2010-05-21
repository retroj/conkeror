/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function timer_callback (callback) {
    this.callback = callback;
}
timer_callback.prototype = {
    constructor: timer_callback,
    QueryInterface: XPCOMUtils.generateQI([Ci.nsITimerCallback]),

    notify: function (timer) {
        this.callback.call(null, timer);
    }
};

function call_after_timeout (callback, timeout) {
    var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    timer.initWithCallback(new timer_callback(callback), timeout, Ci.nsITimer.TYPE_ONE_SHOT);
    return timer;
}

function call_at_interval (callback, interval) {
    var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    timer.initWithCallback(new timer_callback(callback), interval, Ci.nsITimer.TYPE_REPEATING_SLACK);
    return timer;
}

function call_at_precise_interval (callback, interval) {
    var timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    timer.initWithCallback(new timer_callback(callback), interval, Ci.nsITimer.TYPE_REPEATING_PRECISE);
    return timer;
}

function timer_cancel (timer) {
    timer.cancel();
}

provide("timer");
