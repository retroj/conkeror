/**
 * (C) Copyright 2012 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

define_page_mode("smbc-mode",
    build_url_regexp($domain = "www.smbc-comics"),
    function enable (buffer) {
        buffer.page.local.browser_relationship_patterns = {};
        buffer.page.local.browser_relationship_patterns[RELATIONSHIP_NEXT] =
            [function (doc) xpath_find_node(doc, "//map[@name='buttons']/area[4]")];
        buffer.page.local.browser_relationship_patterns[RELATIONSHIP_PREVIOUS] =
            [function (doc) xpath_find_node(doc, "//map[@name='buttons']/area[2]")];
    },
    function disable (buffer) {},
    $display_name = "SMBC");

page_mode_activate(smbc_mode);

provide("smbc");
