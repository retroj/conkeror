/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

in_module(null);

function ssl_add_exception(buffer) {
    /* FIXME: A user preference variable should specify whether to
     * pre-fill location and furthermore (dependent on pre-filling the
     * location) whether prefetchCert should be set to true. */
    var params = { exceptionAdded: false };
    if (buffer instanceof content_buffer) {
        params.prefetchCert = true;
        params.location = buffer.current_uri.spec;
    }
    buffer.window.openDialog("chrome://pippki/content/exceptionDialog.xul",
                             "", "chrome,centerscreen,modal", params);
    if ((buffer instanceof content_buffer) && params.exceptionAdded)
        reload(buffer);
}

interactive("ssl-add-exception",
            "Add an exception for the SSL certificate of the current content page.",
            function (I) {ssl_add_exception(I.buffer);});

function ssl_certificate_manager() {
    make_chrome_window("chrome://pippki/content/certManager.xul", null);
}

interactive("ssl-certificate-manager",
            "Show the SSL certificate manager.\n" +
            "The certificate manager can be used to view, import, and export certificates" +
            " for Certificate Authorities (CA) as well as web sites.",
            ssl_certificate_manager);

provide("ssl");
