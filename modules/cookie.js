/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

var cookie_manager = Cc["@mozilla.org/cookiemanager;1"]
    .getService(Ci.nsICookieManager2);

function clear_cookies () {
    cookie_manager.removeAll();
}
interactive("clear-cookies", "Permanently delete all existing cookies.",
          function (I) {
              clear_cookies();
              I.minibuffer.message("Cookies cleared.");
          });

define_label("COOKIE_LIFETIME_DEFAULT");
define_label("COOKIE_LIFETIME_SESSION");
define_label("COOKIE_LIFETIME_DAYS", "days");
define_label("COOKIE_LIFETIME_PROMPT");

define_special_variable("cookie_lifetime_policy",
                        function () {
                            switch (get_pref("network.cookie.lifetimePolicy")) {
                            case 0:
                                return COOKIE_LIFETIME_DEFAULT;
                            case 1:
                                return COOKIE_LIFETIME_PROMPT;
                            case 2:
                                  return COOKIE_LIFETIME_SESSION;
                            case 3:
                                return COOKIE_LIFETIME_DAYS(get_pref("network.cookie.lifetime.days"));
                            default:
                                return undefined;
                            }
                        },
                        function (value) {
                            switch (label_id(value)) {
                            case COOKIE_LIFETIME_DEFAULT:
                                session_pref("network.cookie.lifetimePolicy", 0);
                                break;
                            case COOKIE_LIFETIME_PROMPT:
                                session_pref("network.cookie.lifetimePolicy", 1);
                                break;
                            case COOKIE_LIFETIME_SESSION:
                                session_pref("network.cookie.lifetimePolicy", 2);
                                break;
                            case COOKIE_LIFETIME_DAYS:
                                session_pref("network.cookie.lifetimePolicy", 3);
                                session_pref("network.cookie.lifetime.days", value.days);
                                break;
                            }
                        },
                        "Specifies the default cookie lifetime policy.");

provide("cookie");
