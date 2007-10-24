/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

/*
 * Utility functions for application scope.
 *
 */

/// Window title formatting

/**
 * Default tile formatter.  The page url is ignored.  If there is a
 * page_title, returns: "Page title - Conkeror".  Otherwise, it
 * returns just: "Conkeror".
 */
function default_title_formatter ()
{
    var page_title = this.getBrowser().mCurrentBrowser.contentTitle;
    var page_url = this.getWebNavigation().currentURI.spec;

    if (page_title && page_title.length > 0)
        return page_title + " - Conkeror";
    else
        return "Conkeror";
}

function set_window_title ()
{
    this.document.title = title_format_fn.call (this);
}

function init_window_title ()
{
    conkeror.title_format_fn = default_title_formatter;
    conkeror.add_hook (conkeror.dom_content_loaded_hook, conkeror.set_window_title);
    conkeror.add_hook (conkeror.make_frame_after_hook, conkeror.set_window_title);
}
///


// Put the string on the clipboard
function writeToClipboard(str)
{
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
}


function makeURLAbsolute (base, url)
{
    // Construct nsIURL.
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
	.getService(Components.interfaces.nsIIOService);
    var baseURI  = ioService.newURI(base, null, null);

    return ioService.newURI (baseURI.resolve (url), null, null).spec;
}


function get_link_location (element)
{
    if (element && element.getAttribute("href")) {
        var loc = element.getAttribute("href");
        return makeURLAbsolute(element.baseURI, loc);
    }
}


function makeURL(aURL)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newURI(aURL, null, null);
}

function makeFileURL(aFile)
{
  var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
  return ioService.newFileURI(aFile);
}


function get_document_content_disposition (document_o)
{
    var content_disposition = null;
    try {
        content_disposition =
            document_o.defaultView
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .getDocumentMetadata("content-disposition");
    } catch (e) { }
    return content_disposition;
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
function make_default_file_name_to_save_url (url_o, aDocument, aContentType, aContentDisposition, dest_extension_s)
{
     function getDefaultExtension(file_name_s, url_o, aContentType)
     {
         if (aContentType == "text/plain" || aContentType == "application/octet-stream" || url_o.scheme == "ftp")
             return "";   // temporary fix for bug 120327

         // First try the extension from the filename
         var url = Components.classes["@mozilla.org/network/standard-url;1"]
             .createInstance(Components.interfaces.nsIURL);
         url.filePath = file_name_s;

         var ext = url.fileExtension;

         // This mirrors some code in nsExternalHelperAppService::DoContent
         // Use the filename first and then the URI if that fails

         var mimeInfo = null;
         if (aContentType || ext) {
             try {
                 mimeInfo = Components.classes["@mozilla.org/mime;1"]
                     .getService(Components.interfaces.nsIMIMEService)
                     .getFromTypeAndExtension(aContentType, ext);
             }
             catch (e) {
             }
         }

         if (ext && mimeInfo && mimeInfo.extensionExists(ext))
             return ext;

         // Well, that failed.  Now try the extension from the URI
         var urlext;
         try {
             url = url_o.QueryInterface(Components.interfaces.nsIURL);
             urlext = url.fileExtension;
         } catch (e) {
         }

         if (urlext && mimeInfo && mimeInfo.extensionExists(urlext)) {
             return urlext;
         } else {
             try {
                 return mimeInfo.primaryExtension;
             }
             catch (e) {
                 // Fall back on the extensions in the filename and URI for lack
                 // of anything better.
                 return ext || urlext;
             }
         }
     }


     function getDefaultFileName(aDefaultFileName, aURI, aDocument,
                                 aContentDisposition)
     {
         function getCharsetforSave(aDocument)
         {
             if (aDocument)
                 return aDocument.characterSet;

             if (document.commandDispatcher.focusedWindow)
                 return document.commandDispatcher.focusedWindow.document.characterSet;

             return window.content.document.characterSet;
         }

         function validateFileName(aFileName)
         {
             // XXX: is there really any good reason why default
             //      filenames should be platform dependent?  this
             //      is a rather pointless side-effect.
             var re = /[\/]+/g;
             if (get_os () == 'WINNT') {
                 re = /[\\\/\|]+/g;
                 aFileName = aFileName.replace(/[\"]+/g, "'");
                 aFileName = aFileName.replace(/[\*\:\?]+/g, " ");
                 aFileName = aFileName.replace(/[\<]+/g, "(");
                 aFileName = aFileName.replace(/[\>]+/g, ")");
             }
             else if (get_os () == 'Darwin')
                 re = /[\:\/]+/g;

             return aFileName.replace(re, "_");
         }


         // 1) look for a filename in the content-disposition header, if any
         if (aContentDisposition) {
             const mhp = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
                 .getService(Components.interfaces.nsIMIMEHeaderParam);
             var dummy = { value: null };  // Need an out param...
             var charset = getCharsetforSave(aDocument);

             var fileName = null;
             try {
                 fileName = mhp.getParameter(aContentDisposition, "filename", charset,
                                             true, dummy);
             }
             catch (e) {
                 try {
                     fileName = mhp.getParameter(aContentDisposition, "name", charset, true,
                                                 dummy);
                 }
                 catch (e) {
                 }
             }
             if (fileName)
                 return fileName;
         }

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

         if (aDocument) {
             var docTitle = validateFileName(aDocument.title).replace(/^\s+|\s+$/g, "");
             if (docTitle) {
                 // 3) Use the document title
                 return docTitle;
             }
         }

         if (aDefaultFileName)
             // 4) Use the caller-provided name, if any
             return validateFileName(aDefaultFileName);

         // 5) If this is a directory, use the last directory name
         var path = aURI.path.match(/\/([^\/]+)\/$/);
         if (path && path.length > 1)
             return validateFileName(path[1]);

         try {
             if (aURI.host)
                 // 6) Use the host.
                 return aURI.host;
         } catch (e) {
             // Some files have no information at all, like Javascript generated pages
         }
         try {
             // 7) Use the default file name
             return getStringBundle().GetStringFromName("DefaultSaveFileName");
         } catch (e) {
             //in case localized string cannot be found
         }
         // 8) If all else fails, use "index"
         return "index";
     }

     // end of support functions.
     //

     var file_ext_s;
     var file_base_name_s;

    try {
        // Assuming nsiUri is valid, calling QueryInterface(...) on it will
        // populate extra object fields (eg filename and file extension).
        var url = url_o.QueryInterface(Components.interfaces.nsIURL);
        file_ext_s = url.fileExtension;
    } catch (e) { }

    // Get the default filename:
    var file_name_s = getDefaultFileName(null, url_o, aDocument, aContentDisposition);

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
