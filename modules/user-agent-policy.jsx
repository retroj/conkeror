/**
 * (C) Copyright 2013 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

require("http-request-hook");

var policies = {};

function user_agent_policy (name, user_agent, patterns) {
    this.name = name;
    this.user_agent = user_agent;
    this.byhost = {};
    this.byregexp = [];
    for (var i = 0, n = patterns.length; i < n; ++i) {
        var p = patterns[i];
        if (p instanceof RegExp)
            this.byregexp.push(p);
        else
            this.byhost[p] = true;
    }
}
user_agent_policy.prototype = {
    constructor: user_agent_policy,
    name: null,
    user_agent: null,
    byhost: null,
    byregexp: null
};

function define_policy (name, user_agent) {
    var patterns = Array.prototype.slice.call(arguments, 2);
    var o = new user_agent_policy(name, user_agent, patterns);
    policies[o.name] = o;
    return o;
}

function http_request_hook_function (channel) {
    var uri = channel.URI;
    var spec = uri.spec;
    try {
        var host = uri.host;
    } catch (e) {}
    outer: for each (let p in policies) {
        if (host && p.byhost[host]) {
            var user_agent = p.user_agent;
            break;
        }
        for (var i = 0, r; r = p.byregexp[i]; ++i) {
            if (r.test(spec)) {
                user_agent = p.user_agent;
                break outer;
            }
        }
    }
    if (user_agent != null) // allow empty-string ua
        channel.setRequestHeader("User-Agent", user_agent, false);
}
add_hook("http_request_hook", http_request_hook_function);

provide("user-agent-policy");
