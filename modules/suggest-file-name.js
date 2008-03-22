
/*
 *  GENERATE FILENAME
 */


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
function maybe_get_preferred_filename_extension (file_name_s, content_type)
{
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
    if (ext && mimeInfo && mimeInfo.extensionExists (ext))
        return ext;
    else if (primary)
        return primary;
    else
        return ext;
}


function maybe_get_preferred_url_extension (url_o, content_type) {
    var ext = maybe_get_url_extension (url_o);
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
    if (ext && mimeInfo && mimeInfo.extensionExists (ext))
        return ext;
    else if (primary)
        return primary;
    else
        return ext;
}

function getDefaultExtension (file_name_s, url_o, content_type) {
    if (content_type == "text/plain" ||
        content_type == "application/octet-stream" ||
        url_o.scheme == "ftp")
    {
        return "";
    }
    return (maybe_get_preferred_filename_extension (file_name_s, content_type) ||
            maybe_get_preferred_url_extension (url_o, content_type));
}

function getCharsetforSave(aDocument)
{
    if (aDocument)
        return aDocument.characterSet;
    return null;
}


function maybe_filename_from_content_disposition (aContentDisposition, charset) {
    if (aContentDisposition) {
        const mhp = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
            .getService(Components.interfaces.nsIMIMEHeaderParam);
        var dummy = { value: null };  // Need an out param...

        var fileName = null;
        try {
            fileName = mhp.getParameter(aContentDisposition, "filename", charset, true, dummy);
        } catch (e) {
            try {
                fileName = mhp.getParameter(aContentDisposition, "name", charset, true, dummy);
            } catch (e) { }
        }
        if (fileName)
            return fileName;
        else
            return null;
    }
    return null;
}

function maybe_filename_from_url (aURI) {
    try {
        var url = aURI.QueryInterface(Components.interfaces.nsIURL);
        if (url.fileName != "") {
            // 2) Use the actual file name, if present
            var textToSubURI = Components.classes["@mozilla.org/intl/texttosuburi;1"]
                .getService(Components.interfaces.nsITextToSubURI);
            return textToSubURI.unEscapeURIForUI(url.originCharset || "UTF-8", url.fileName);
        }
    } catch (e) {
        // This is something like a data: and so forth URI... no filename here.
    }
    return null;
}

function maybe_filename_from_document_title (aDocument) {
    if (aDocument) {
        var docTitle = aDocument.title.replace(/^\s+|\s+$/g, "");
        if (docTitle) {
            // 3) Use the document title
            return docTitle;
        }
    }
    return null;
}

function maybe_filename_from_url_last_directory (aURI) {
    // 5) If this is a directory, use the last directory name
    try {
    var path = aURI.path.match(/\/([^\/]+)\/$/);
    if (path && path.length > 1)
        return path[1];
    return null;
    } catch (e) {
        return null;
    }
}

function maybe_filename_from_url_host (aURI) {
    if (aURI && 'host' in aURI)
        return aURI.host;
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
    return filename.replace (/[\/]+/g, '_');
}

function generate_filename_safely_darwin (filename) {
    return filename.replace(/[\:\/]+/g, '_');
}

function generate_filename_safely_winnt (filename)
{
    filename = filename.replace (/[\"]+/g,     "'");
    filename = filename.replace (/[\*\:\?]+/g, ' ');
    filename = filename.replace (/[\<]+/g,     '(');
    filename = filename.replace (/[\>]+/g,     ')');
    filename = filename.replace (/[\\\/\|]+/g, '_');
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



function getDefaultFileName (aURI, aDocument) {
    return generate_filename_safely_fn
        (maybe_filename_from_content_disposition(aDocument && get_document_content_disposition(aDocument),
                                                 getCharsetforSave(aDocument)) ||
         maybe_filename_from_url (aURI) ||
         maybe_filename_from_document_title (aDocument) ||
         maybe_filename_from_url_last_directory (aURI) ||
         maybe_filename_from_url_host (aURI) ||
         maybe_filename_from_localization_default () ||
         "index");
}

/**
 * Determine what the 'default' path is for operations like save-page.
 * Returns an nsILocalFile.
 * @param url_o nsIURI of the document being saved.
 * @param aDocument The document to be saved
 * @param aContentType The content type we're saving, if it could be
 *        determined by the caller.
 * @param aContentDisposition The content-disposition header for the object
 *        we're saving, if it could be determined by the caller.
 * @param dest_extension_s To override the extension of the destination file,
 *        pass the extension you want here.  Otherwise pass null.  This is
 *        used by save_page_as_text.
 */
function suggest_file_name_internal(url, aDocument, aContentType, dest_extension_s)
{
    url = make_uri(url);

    var file_ext_s;
    var file_base_name_s;

    file_ext_s = maybe_get_url_extension (url);

    // Get the default filename:
    var file_name_s = getDefaultFileName(url, aDocument);

    // If file_ext_s is still blank, and url is a web link (http or
    // https), make the extension `.html'.
    if (! file_ext_s && !aDocument && !aContentType && (/^http(s?)/i.test(url.scheme))) {
        file_ext_s = "html";
        file_base_name_s = file_name_s;
    } else {
        file_ext_s = getDefaultExtension(file_name_s, url, aContentType);
        // related to temporary fix for bug 120327 in getDefaultExtension
        if (file_ext_s == "")
            file_ext_s = file_name_s.replace (/^.*?\.(?=[^.]*$)/, "");
        file_base_name_s = file_name_s.replace (/\.[^.]*$/, "");
    }

    if (dest_extension_s)
        file_ext_s = dest_extension_s;

    return file_base_name_s +'.'+ file_ext_s;
}

/**
 * spec may be a string (URI), a load spec, or an nsIDOMDocument
 *
 * extension may be null, in which case an extension is suggested as well
 */
function suggest_file_name(spec, extension) {
    var document;
    var uri;
    var content_type;
    if (spec.filename)
        return spec.filename;

    if (spec instanceof Ci.nsIDOMDocument)
        document = spec;
    else if (typeof(load_spec) == "object" && load_spec.document)
        document = spec.document;
    else
        uri = uri_from_load_spec(spec);

    if (document) {
        uri = document.documentURIObject;
        content_type = document.contentType;
    }

    return suggest_file_name_internal(uri, document, content_type, extension);
}

function suggest_save_path_from_file_name(file_name, buffer) {
    var cwd = (buffer && buffer.cwd) || default_directory.path;
    var file = get_file(cwd);
    file.append(file_name);
    return file.path;
}
