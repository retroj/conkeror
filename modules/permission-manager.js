/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Interface to nsIPermissionManager, which controls the popup
 * blocking whitelist, among other things.
 */

in_module(null);

let permission_manager = Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager);

let permission_types = {
    popup : {desc: "specifies a whitelist and blacklist for the popup blocker",
             values: [ ["allow", Ci.nsIPermissionManager.ALLOW_ACTION],
                       ["deny", Ci.nsIPermissionManager.DENY_ACTION] ],
             related_prefs: [
                 [ "dom.disable_open_during_load",
                   "This preference defines the default behavior of whether " +
                   "unrequested popups are allowed for sites not listed in the permission list." ],
                 [ "dom.popup_maximum", "The number of pop-ups to allow from a single non-click event."] ]
            },

    cookie : {desc: "specifies per-host cookie policies",
              values: [
                  ["allow", Ci.nsIPermissionManager.ALLOW_ACTION],
                  ["session", Ci.nsICookiePermission.ACCESS_SESSION, "expire matching cookies when the browser exits"],
                  ["deny", Ci.nsIPermissionManager.DENY_ACTION] ],
              related_prefs: [
                  [ "network.cookie.lifetime.behavior.enabled" ],
                  [ "network.cookie.cookieBehavior",
                    "This preference defines the default cookie behavior for sites not listed in the " +
                    "permission list.  The value 0 means to enable all cookies, 1 means to reject " +
                    "only third-party cookies, and 2 means to reject all cookies." ],
                  [ "network.cookie.lifetime.behavior",
                    "If network.cookie.lifetime.behavior.enabled is set to true, a value of 0 means all " +
                    "cookies expire at the end of the current session,  while a value of 1 means that " +
                    "cookies expire after the number of days specified by network.cookie.lifetime.days."
                  ],
                  [ "network.cookie.lifetime.days" ] ]
             },


    image : {desc: "specifies per-host image automatic loading policies",
              values: [
                  ["allow", Ci.nsIPermissionManager.ALLOW_ACTION],
                  ["deny", Ci.nsIPermissionManager.DENY_ACTION] ],
              related_prefs: [
                  [ "permissions.default.image", "This prefreence defines the default image loading policy "
                                                 + "for sites not listed in the permission list.  The value "
                                                 + "1 means all images should be loaded, 2 means no images "
                                                 + "should be loaded, and 3 means only third-party images "
                                                 + "are blocked." ] ]
            },

    install : {desc: "specifies a whitelist of sites from which XPI files may be opened",
              values: [
                  ["allow", Ci.nsIPermissionManager.ALLOW_ACTION] ]
              }
};

/*
 * cookie
 *
 *
 *
 * popup
 *   dom.popup_maximum  -  The number of pop-ups to allow from a single non-click event
 *
 *   dom.popup_allowed_events
 *
 *   dom.disable_open_during_load - This preference defines the default behavior of whether unrequested popups are allowed for sites not listed in the permission list.
 *
 *
 */

interactive("permission-manager", "View or edit the host-specific "
            + "permission list.\nThis list is used for the popup"
            + "blocker whitelist, among other things.",
            function (I) {
                I.minibuffer.message("Save the file and close the editor when done editing permissions.");

                let existing_perms = new string_hashmap();

                var file_buf =
                    "# -*- conf -*-\n" +
                    "# Permission list\n\n";


                {
                    let e = permission_manager.enumerator;
                    let arr = [];
                    let max_host_len = 0;
                    let max_type_len = 0;
                    while (e.hasMoreElements()) {
                        let p = e.getNext().QueryInterface(Ci.nsIPermission);
                        let host = p.host;
                        let type = p.type;
                        let cap = p.capability;
                        if (max_host_len < host.length)
                            max_host_len = host.length;
                        if (max_type_len < type.length)
                            max_type_len = type.length;
                        arr.push([host, type, cap]);
                        existing_perms.put([host, type], cap);
                    }
                    ++max_host_len;
                    ++max_type_len;
                    let max_host = get_spaces(max_host_len);
                    let max_type = get_spaces(max_type_len);
                    for (let i = 0; i < arr.length; ++i) {
                        let [host, type, cap] = arr[i];
                        if (permission_types.hasOwnProperty(type)) {
                            let values = permission_types[type].values;
                            for (let j = 0; j < values.length; ++j) {
                                if (cap == values[j][1]) {
                                    cap = values[j][0];
                                    break;
                                }
                            }
                        }
                        file_buf += host + max_host.substr(host.length) + type + max_type.substr(type.length) + cap + "\n";
                    }

                    if (arr.length == 0)
                        file_buf += "\n";
                }

                file_buf += "\n" +
                    "# entry syntax (one per line): <domain> <type> <permission>\n\n" +
                    "# example: google.com popup allow\n\n" +

                    word_wrap("The <domain> must be a valid domain name.  Depending on the <type>, only exact " +
                              "matches may be used, or alternatively it may match any sub-domain if a more " +
                              "specific entry is not found.", 80, "# ") + "\n" +
                    "# The possible values for the permission <type> include:\n";
                for (let type in permission_types) {
                    let data = permission_types[type];
                    file_buf += "#   " + type + " - " + data.desc + "\n\n";
                    file_buf += "#     Supported <permission> values:\n";
                    for (let i = 0; i < data.values.length; ++i) {
                        let x = data.values[i];
                        file_buf += "#       " + x[0] + " (" + x[1] + ")";
                        if (x[3])
                            file_buf += " - " + x[3];
                        file_buf += "\n";
                    }
                    if (data.related_prefs && data.related_prefs.length > 0) {
                        file_buf += "\n#     Related Mozilla preferences:\n";
                        for (let i = 0; i < data.related_prefs.length; ++i) {
                            let x = data.related_prefs[i];
                            file_buf += "#       " + x[0] + " = " + get_pref(x[0]) + "\n";
                            if (x.length > 1) {
                                file_buf += word_wrap(x[1], 80, "#         ", "#");
                            }
                            file_buf += "\n";
                        }
                    }
                }
                var file = null;
                try {
                    file = get_temporary_file("permissions.txt");
                    let line = 4;

                    outer: while (1) {

                        write_text_file(file, file_buf);
                        yield open_file_with_external_editor(file, $line = line);

                        let new_buf = read_text_file(file);
                        if (new_buf == file_buf) {
                            I.minibuffer.message("No permission changes made.");
                            break;
                        }

                        // Parse
                        let lines = new_buf.split("\n");
                        if (lines[lines.length - 1].length == 0) // Remove extra line at end
                            lines.length = lines.length - 1;
                        let arr = [];
                        let prev_entries = new string_hashset();
                        for (let i = 0; i < lines.length; ++i) {
                            // Parse each line, checking for syntax errors
                            let x = lines[i];
                            let idx = x.indexOf('#');
                            if (idx != -1)
                                x = x.substr(0, idx);
                            let parts = x.split(/\s+/);
                            if (parts.length == 1 && parts[0].length == 0)
                                continue; // ignore blank line
                            try {
                                let host = parts[0];
                                if (!/[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*/.test(host))
                                    throw "invalid host name: " + host;
                                if (parts.length < 2)
                                    throw "missing permission type";
                                let type = parts[1];
                                if (parts.length < 3)
                                    throw "missing permission value";
                                let cap = parts[2];
                                if (permission_types.hasOwnProperty(type)) {
                                    let values = permission_types[type].values;
                                    for (let i = 0; i < values.length; ++i) {
                                        if (cap == values[i][0]) {
                                            cap = values[i][1];
                                            break;
                                        }
                                    }
                                }
                                if (!/([0-9]+)/.test(cap))
                                    throw "invalid permission value: " + cap;
                                cap = parseInt(cap);
                                if (parts.length > 3)
                                    throw "too many terms";
                                if (prev_entries.contains([host,type]))
                                    throw "duplicate entry";
                                prev_entries.add([host,type]);
                                arr.push([host,type,cap]);
                            } catch (syntax_err) {
                                line = i + 1;
                                lines.splice(i+1, 0, "# ERROR on previous line: " + syntax_err, "");
                                file_buf = lines.join("\n") + "\n";
                                I.minibuffer.message("Correct the syntax error in the permissions list, " +
                                                     "or close the editor to abort.");
                                continue outer;
                            }
                        }
                        let num_added = 0;
                        let num_changed = 0;
                        for (let i = 0; i < arr.length; ++i) {
                            let [host,type,cap] = arr[i];
                            let x = existing_perms.get([host,type]);
                            let add = false;
                            if (x === undefined) {
                                ++num_added;
                                add = true;
                            } else {
                                if (x != cap) {
                                    ++num_changed;
                                    add = true;
                                }
                                existing_perms.remove([host,type]);
                            }
                            if (add)
                                permission_manager.add(make_uri("http://" + host), type, cap);
                        }
                        let num_removed = 0;
                        for (let k in existing_perms.iterator(true)) {
                            let [host,type] = k.split(",",2);
                            ++num_removed;
                            permission_manager.remove(host,type);
                        }
                        let msg;
                        if (num_added == 0 && num_changed == 0 && num_removed == 0)
                            msg = "No permission changes made.";
                        else {
                            msg = "Updated permissions list: " +
                                [["added", num_added],
                                 ["changed", num_changed],
                                 ["removed", num_removed]].
                                filter(function ([caption, count]) count > 0).
                                map(function ([caption, count]) {
                                        if (count == 1)
                                             return "1 entry " + caption;
                                        return count + " entries " + caption;
                                    }).join(", ") +
                                ".";
                        }
                        I.minibuffer.message(msg);
                        break;
                    }
                } catch (e) {
                    dump_error(e);
                    throw interactive_error("Failed to edit permissions list in external editor.");
                } finally {
                    file.remove(false);
                }
            });

provide("permission-manager");
