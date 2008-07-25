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


let permission_manager = Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager);

interactive("permission-manager", "View or edit the host-specific"
            + "permission list.\nThis list is used for the popup"
            + "blocker whitelist, among other things.",
            function (I) {
                I.minibuffer.message("Save the file and close the editor when done editing permissions.");

                let existing_perms = new string_hashmap();

                var file_buf =
                    "# Permission list\n\n" +
                    "# syntax: <domain> <type> <permission>\n\n" +
                    "# Common types: \n" +
                    "#   popup - whitelist/blacklist for the popup blocker\n\n" +
                    "# Permission values: (any non-negative integer is permitted)\n" +
                    "#   allow - equal to " + Ci.nsIPermissionManager.ALLOW_ACTION + "\n" +
                    "#   deny - equal to " + Ci.nsIPermissionManager.DENY_ACTION + "\n\n";

                // Prefix has 11 lines

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
                    let get_spaces = function (n) {
                        var x = "";
                        while (x.length < n) x += " ";
                        return x;
                    }
                    ++max_host_len;
                    ++max_type_len;
                    let max_host = get_spaces(max_host_len);
                    let max_type = get_spaces(max_type_len);
                    for (let i = 0; i < arr.length; ++i) {
                        let [host, type, cap] = arr[i];
                        if (cap == Ci.nsIPermissionManager.ALLOW_ACTION)
                            cap = "allow";
                        else if (cap == Ci.nsIPermissionManager.DENY_ACTION)
                            cap = "deny";
                        file_buf += host + max_host.substr(host.length) + type + max_type.substr(type.length) + cap + "\n";
                    }
                }

                var file = null;
                try {
                    file = get_temporary_file("permissions.txt");
                    let line = 12;

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
                                if (!/allow|deny|([0-9]+)/.test(cap))
                                    throw "invalid permission value: " + cap;
                                if (cap == "allow")
                                    cap = Ci.nsIPermissionManager.ALLOW_ACTION;
                                else if (cap == "deny")
                                    cap = Ci.nsIPermissionManager.DENY_ACTION;
                                else
                                    cap = parseInt(cap);
                                if (prev_entries.contains([host,type]))
                                    throw "duplicate entry";
                                prev_entries.add([host,type]);
                                arr.push([host,type,cap]);
                            } catch (syntax_err) {
                                line = i + 1;
                                lines.splice(i+1, 0, "# ERROR on previous line: " + syntax_err, "");
                                file_buf = lines.join("\n");
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
