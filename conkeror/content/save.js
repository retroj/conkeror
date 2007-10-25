
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
        url = url_o.QueryInterface(Components.interfaces.nsIURL);
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

function validateFileName(aFileName)
{
    var re = /[\/]+/g;
    if (get_os() == 'WINNT') {
        re = /[\\\/\|]+/g;
        aFileName = aFileName.replace(/[\"]+/g, "'");
        aFileName = aFileName.replace(/[\*\:\?]+/g, " ");
        aFileName = aFileName.replace(/[\<]+/g, "(");
        aFileName = aFileName.replace(/[\>]+/g, ")");
    }
    else if (get_os() == 'Darwin')
        re = /[\:\/]+/g;

    return aFileName.replace(re, "_");
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
            return validateFileName (fileName);
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
            return validateFileName(textToSubURI.unEscapeURIForUI(url.originCharset || "UTF-8", url.fileName));
        }
    } catch (e) {
        // This is something like a data: and so forth URI... no filename here.
    }
    return null;
}

function maybe_filename_from_document_title (aDocument) {
    if (aDocument) {
        var docTitle = validateFileName(aDocument.title).replace(/^\s+|\s+$/g, "");
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
        return validateFileName(path[1]);
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

function getDefaultFileName (aURI, aDocument, aContentDisposition) {
    return (maybe_filename_from_content_disposition (aContentDisposition, getCharsetforSave(aDocument)) ||
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
function generate_filename (url_o, aDocument, aContentType, aContentDisposition, dest_extension_s)
{
    var file_ext_s;
    var file_base_name_s;

    file_ext_s = maybe_get_url_extension (url_o);

    // Get the default filename:
    var file_name_s = getDefaultFileName(url_o, aDocument, aContentDisposition);

    // If file_ext_s is still blank, and url_o is a web link (http or
    // https), make the extension `.html'.
    if (! file_ext_s && !aDocument && !aContentType && (/^http(s?)/i.test(url_o.scheme))) {
        file_ext_s = ".html";
        file_base_name_s = file_name_s;
    } else {
        file_ext_s = getDefaultExtension(file_name_s, url_o, aContentType);
        // related to temporary fix for bug 120327 in getDefaultExtension
        if (file_ext_s == "")
            file_ext_s = file_name_s.replace (/^.*?\.(?=[^.]*$)/, "");
        file_base_name_s = file_name_s.replace (/\.[^.]*$/, "");
    }

    if (dest_extension_s)
        file_ext_s = dest_extension_s;

    var file_name_o  = conkeror.default_directory.clone();
    file_name_o.append (file_base_name_s +'.'+ file_ext_s);
    return file_name_o;
}



/*
 *  COMMANDS
 */


function save_focused_link (url_o, dest_file_o)
{
    this.download_uri_internal (
        url_o,
        null,        // document_o
        dest_file_o,
        null,        // dest_data_dir_o
        null,        // referrer_o
        null,        // content_type_s
        true,        // should_bypass_cache_p
        false,       // save_as_text_p
        false);      // save_as_complete_p
}
interactive ("save-focused-link", save_focused_link,
             ['focused_link_url_o',
              ['F', function (a) { return "Save Link As: "; },
               function (args) {
                   return generate_filename (args[0]).path;
               },
               "save"]]);


function save_image (url_o, dest_file_o)
{
    this.download_uri_internal (
        url_o,
        null,        // document_o
        dest_file_o,
        null,        // dest_data_dir_o
        null,        // referrer_o
        null,        // content_type_s
        false,       // should_bypass_cache_p
        false,       // save_as_text_p
        false);      // save_as_complete_p
}
interactive ("save-image", save_image,
             ['image_url_o',
              ['F', function (a) { return "Save Image As: "; },
               function (args) {
                   return generate_filename (args[0]).path;
               },
               "save"]]);


function save_page (document_o, dest_file_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    this.download_uri_internal (
        url_o,
        document_o,
        dest_file_o,
        null,   // dest_data_dir_o
        null,   // referrer_o
        content_type_s,
        false,  // should_bypass_cache_p
        false,  // save_as_text_p
        false); // save_as_complete_p
}
interactive("save-page", save_page,
            ['active_document',
             ['F', function (a) { return "Save Page As: "; },
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return generate_filename (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition).path;
              },
              "save"]]);


function save_page_as_text (document_o, dest_file_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    var should_bypass_cache_p = true;//not sure...
    this.download_uri_internal (
        url_o,
        document_o,
        dest_file_o,
        null,   // dest_data_dir_o
        null,   // referrer_o
        content_type_s,
        false,  //should_bypass_cache_p
        true,   // save_as_text_p
        false); // save_as_complete_p
}
interactive("save-page-as-text", save_page_as_text,
            ['active_document',
             ['F', function (a) { return "Save Page As: "; },
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return generate_filename (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition,
                      'txt').path;
              },
              "save"]]);


function save_page_complete (document_o, dest_file_o, dest_data_dir_o)
{
    var url_o = makeURL (document_o.documentURI);
    var content_type_s = document_o.contentType;
    this.download_uri_internal (
        url_o,
        document_o,
        dest_file_o,
        dest_data_dir_o,
        null,   // referrer_o
        content_type_s,
        false,  // should_bypass_cache_p
        false,  // save_as_text_p
        true);  // save_as_complete_p
}
interactive("save-page-complete", save_page_complete,
            ['active_document',
             ['F', function (a) { return "Save Page As: "; },
              function (args) {
                  var document_o = args[0];
                  var url_o = makeURL (document_o.documentURI);
                  var content_type_s = document_o.contentType;
                  var content_disposition = get_document_content_disposition (document_o);
                  return generate_filename (
                      url_o,
                      document_o,
                      content_type_s,
                      content_disposition).path;
              },
              "save"],
             ['F', function (a) { return "Data Directory: "; },
              function (args) { return args[1].path + ".support"; },
              "save"]]);
