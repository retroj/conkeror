/**
 * (C) Copyright 2007 John J. Foerch
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard.
 *
 * Portions of this file were derived from Mozilla,
 * (C) Copyright 1998-2007 Mozilla Foundation.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

/* maybe_get_filename_extension
 *
 * file_name_s: string filename, may be null.
 *
 * returns null or extension part of file_name_s.
 */
function maybe_get_filename_extension (file_name_s) {
    var url = Components.classes["@mozilla.org/network/standard-url;1"]
        .createInstance(Components.interfaces.nsIURL);
    url.filePath = file_name_s;
    if (url.fileExtension == '')
        return null;
    return url.fileExtension;
}


function maybe_get_url_extension (url_o) {
    try {
        var url = url_o.QueryInterface(Components.interfaces.nsIURL);
        if (url.fileExtension == '')
            return null;
        return url.fileExtension;
    } catch (e) {
        return null;
    }
}

/* maybe_get_preferred_filename_extension
 *
 * file_name_s: string filename, may be null.
 *
 * content_type: string content type, may be null.
 *
 * returns null, the default extension for the given
 * content type, or the extension part of file_name_s.
 */
function maybe_get_preferred_filename_extension (file_name_s, content_type) {
    var ext = maybe_get_filename_extension (file_name_s);
    var mimeInfo = null;
    var primary = null;
    if (content_type) {
        try {
            // throws if content_type is an empty string
            mimeInfo = Components.classes["@mozilla.org/mime;1"]
                .getService(Components.interfaces.nsIMIMEService)
                .getFromTypeAndExtension(content_type, ext);
            primary = mimeInfo.primaryExtension;
        } catch (e) { }
    }
    if (ext && mimeInfo && mimeInfo.extensionExists(ext))
        return ext;
    else if (primary)
        return primary;
    else
        return ext;
}


function maybe_get_preferred_url_extension (url_o, content_type) {
    var ext = maybe_get_url_extension(url_o);
    var mimeInfo = null;
    var primary = null;
    if (content_type) {
        try {
            mimeInfo = Components.classes["@mozilla.org/mime;1"]
                .getService(Components.interfaces.nsIMIMEService)
                .getFromTypeAndExtension(content_type, null);
            primary = mimeInfo.primaryExtension;
        } catch (e) { }
    }
    if (ext && mimeInfo && mimeInfo.extensionExists(ext))
        return ext;
    else if (primary)
        return primary;
    else
        return ext;
}

function get_default_extension (file_name_s, url_o, content_type) {
    if (content_type == "text/plain" ||
        content_type == "application/octet-stream" ||
        url_o.scheme == "ftp")
    {
        return "";
    }
    return (maybe_get_preferred_filename_extension(file_name_s, content_type) ||
            maybe_get_preferred_url_extension(url_o, content_type));
}

function get_charset_for_save (doc) {
    if (doc)
        return doc.characterSet;
    return null;
}


function maybe_filename_from_content_disposition (content_disposition, charset) {
    if (content_disposition) {
        const mhp = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
            .getService(Components.interfaces.nsIMIMEHeaderParam);
        var dummy = { value: null };  // Need an out param...

        var filename = null;
        try {
            filename = mhp.getParameter(content_disposition, "filename", charset, true, dummy);
        } catch (e) {
            try {
                filename = mhp.getParameter(content_disposition, "name", charset, true, dummy);
            } catch (e) { }
        }
        if (filename)
            return filename;
        else
            return null;
    }
    return null;
}

function maybe_filename_from_uri (uri) {
    try {
        var url = uri.QueryInterface(Components.interfaces.nsIURL);
        if (url.fileName != "") {
            // 2) Use the actual file name, if present
            var text_to_sub_uri = Cc["@mozilla.org/intl/texttosuburi;1"].
                getService(Ci.nsITextToSubURI);
            return text_to_sub_uri.unEscapeURIForUI(url.originCharset ||
                                                    "UTF-8", url.fileName);
        }
    } catch (e) {
        // This is something like a data: and so forth URI... no filename here.
    }
    return null;
}

function maybe_filename_from_title (title) {
    if (title) {
        title = title.replace(/^\s+|\s+$/g, "");
        if (title && title.length > 0) {
            // 3) Use the document title
            return title;
        }
    }
    return null;
}

function maybe_filename_from_url_last_directory (uri) {
    // 5) If this is a directory, use the last directory name
    try {
        var path = uri.path.match(/\/([^\/]+)\/$/);
        if (path && path.length > 1)
            return path[1];
        return null;
    } catch (e) {
        return null;
    }
}

function maybe_filename_from_url_host (uri) {
    if (uri && 'host' in uri)
        return uri.host;
    return null;
}

function maybe_filename_from_localization_default () {
    try {
        return getStringBundle().GetStringFromName("DefaultSaveFileName");
    } catch (e) {
        return null;
    }
}

function generate_filename_safely_default (filename) {
    return filename.replace(/[\/]+/g, '_');
}

function generate_filename_safely_darwin (filename) {
    return filename.replace(/[\:\/]+/g, '_');
}

function generate_filename_safely_winnt (filename) {
    filename = filename.replace(/[\"]+/g,     "'");
    filename = filename.replace(/[\*\:\?]+/g, ' ');
    filename = filename.replace(/[\<]+/g,     '(');
    filename = filename.replace(/[\>]+/g,     ')');
    filename = filename.replace(/[\\\/\|]+/g, '_');
    return filename;
}


var generate_filename_safely_fn = null;

switch (get_os()) {
case 'Darwin':
    generate_filename_safely_fn = generate_filename_safely_darwin;
    break;
case 'WINNT':
    generate_filename_safely_fn = generate_filename_safely_winnt;
    break;
default:
    generate_filename_safely_fn = generate_filename_safely_default;
    break;
}

/**
 * spec may be a string (URI), a load spec, or an nsIDOMDocument
 *
 * extension may be null, in which case an extension is suggested as well
 */
function suggest_file_name (spec, extension) {
    var document;
    var uri;
    var content_type;

    if (typeof(spec) == "string" || spec instanceof Ci.nsIDOMDocument)
        spec = load_spec(spec);

    var file_name = load_spec_filename(spec);

    document = load_spec_document(spec);
    uri = load_spec_uri(spec);
    content_type = load_spec_mime_type(spec);

    if (!file_name) {
        file_name = generate_filename_safely_fn(
            maybe_filename_from_content_disposition(
                document && get_document_content_disposition(document),
                get_charset_for_save(document)) ||
            ((spec.suggest_filename_from_uri != false) && maybe_filename_from_uri(uri)) ||
            maybe_filename_from_title(load_spec_title(spec)) ||
            maybe_filename_from_url_last_directory(uri) ||
            maybe_filename_from_url_host(uri) ||
            maybe_filename_from_localization_default() ||
            "index");

    }
    var base_name = file_name.replace(/\.[^.]*$/, "");

    var file_ext = extension || load_spec_filename_extension(spec);

    if (!file_ext) {
        file_ext = get_default_extension(file_name, uri, content_type);
        if (file_ext == "") {
            let x = file_name.lastIndexOf(".");
            if (x == -1)
                file_ext = null;
            else
                file_ext = file_name.substring(x+1);
        }
        if (!file_ext && (/^http(s?)/i).test(uri.scheme) && !content_type ||
            content_type == "application/octet-stream")
            file_ext = "html";
    }

    if (file_ext != null && file_ext.length > 0)
        return base_name + "." + file_ext;
    else
        return base_name;
}

function suggest_save_path_from_file_name (file_name, buffer) {
    var cwd = with_current_buffer(buffer, function (I) I.local.cwd);
    var file = cwd.clone();
    file.append(file_name);
    return file.path;
}

provide("suggest-file-name");
