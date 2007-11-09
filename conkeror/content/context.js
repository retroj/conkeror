/*
The question is how to implement a context menu in Conkeror as elegantly as
possible, such that all its functionality is exposed not only to a gui mouse
interface, but also to keyboard interfaces with or without gui, the gui being
modularized so it can take many different forms beyond the classic style popup
menu.

Ignoring the UI for a moment, let's look at what a context menu's job really
is, and determine what exactly we mean by this vague noun, `context'.

Our module receives from its caller a DOM node.  The caller wants to know what
methods can be called on that node.  That sounds a lot like virtual-table
lookup in an object orientation system.

We received a node object from the caller, but our task concerns the context
of the node, which means traversing *up* the DOM, not down.  We can think of
our data type, then, as a conceptual--rather than a literal--type: the union
of a DOM node plus the environment in which it is embedded.

The environment comprises things of interest--things whose presence or absence
determines whether some method(s) will be valid for the context.  Is the node
an Image, for which we should deliver methods such as save_image and
follow_image?  Is the node inside a hyperlink for which we should deliver
methods like copy_link_location and follow_link_in_buffer?  Is the node
embedded in a navigable browser in which we can go back, or forward, or
reload, or stop?  These are examples of supertypes, again conceptual types,
not literal types as far as Javascript is concerned.  I used the word
`deliver', in the sense that we will put those methods into the virtual table
we build for the caller.  From the other side, though, the point of view of
the caller, the context-object's type appears to `inherit' those methods from
supertypes.

But these supertypes do not form a simple linear hierarchy.  Our Image
supertype is not a subclass of our Hyperlink supertype, or vice versa.  They
are separate concepts that coexist in our context.  Therefore, we can further
categorize our conceptual object system as a multiple inheritance object
system.

If our types are conceptual, not literal, how do we know whether or not a
given type is a supertype of our context object's type?  We cannot use
Javascript's `instanceof' operator.  Instead, we use predicate functions.  A
supertype can therefore be implemented as a predicate associated with methods.
When the predicate evaluates true on an object, that object is a subclass of
the supertype it represents, and we can add the methods provided by the
supertype to our virtual table.  In other words, this is how we implement
inheritance.

This model of a conceptual object system deeply informs the structure of our
code.  We are no longer dealing with a hairy procedure of side-effect code
that must all be done in just the right way to put the desired items in a
context menu.  We have a structured system that can be broken down into
sub-components, each of which can be understood separately, and upon which we
are free to build whatever kind of UI we desire.  The context system takes a
DOM node, and delivers methods appropriate to its context.  The UI's only task
then, is how to present those methods to the user.

--RetroJ
*/


function has_properties_p (obj) {
    for (var i in obj)
        return true;
    return false;
}


// call like: context_methods (document.popupNode);
function context_methods (node) {
    var methods = {};

    /*
     * `inherit' will add the named method to the named interface.
     */ 
    function inherit (method_interface, name, method) {
        if (! (method_interface in methods)) {
            methods[method_interface] = {};
        }
        if (! (name in methods[method_interface])) {
            methods[method_interface][name] = method;
        }
    }

    /*
     * `inherit_interface' will set the named interface to the group of
     * methods provided, if that interface is not yet set.  This allows us to
     * have method groups and `all-or-none' inheritance for the whole group.
     */ 
    function inherit_interface (name, interface_methods) {
        if (! (name in methods)) {
            methods[name] = interface_methods;
        }
    }

    // Zeroeth, see if we are a subclass of simple stuff.
    //
    if (getWebNavigation().canGoBack)
        inherit ('nav', 'back', function () { call_interactively('go-back',[1]); });
    if (getWebNavigation().canGoForward)
        inherit ('nav', 'forward', function () { call_interactively('go-forward',[1]); });
    inherit ('nav', 'reload', function () { reload(); });
    inherit ('nav', 'stop', function () { stop_loading(); });

    // page interface
    inherit ('page', 'save_page', function () { call_interactively('save-page'); });

    // See if the user clicked in a frame.
    if (node.ownerDocument != window.content.document) { // XXX: poor test for being a frame.
        // add methods for inFrame Supertype
        inherit ('frame', 'show_only_this_frameset_frame', function () { open_url_in (1, node.ownerDocument.location.href); });
        inherit ('frame', 'open_frameset_frame_in_buffer', function () { open_url_in (4, node.ownerDocument.location.href); });
        inherit ('frame', 'open_frameset_frame_in_frame', function () { open_url_in (16, node.ownerDocument.location.href); });
        inherit ('frame', 'reload_frameset_frame', function () { node.ownerDocument.location.reload (); });
        inherit ('frame', 'copy_frameset_frame_location', function () { call_interactively('copy_frameset_frame_location'); });
        inherit ('frame', 'save_frameset_frame_page', function () { call_interactively('save-page',[node.ownerDocument]); });
        inherit ('frame', 'view_frameset_frame_source', function () { call_interactively('view-source',[node.ownerDocument.location.href]); });
    }


    // First, case-analysis for nodes that never have children.
    //
    // these will be checks on the given node itself, and will be mutually
    // exclusive.
    if (node.nodeType == Node.ELEMENT_NODE) {
        if (image_node_p (node)) {
            var imageURL = image_node_url_spec (node); // variable for closures which follow.

            // add methods for onImage Supertype
            inherit ('image', 'copy_image', function () { call_interactively('copy-image-location',[imageURL]); });
            // add methods for onMetaDataItem Supertype (Properties screen)

            if (image_node_loaded_p (node)) {
                // add methods for onLoadedImage Supertype
                inherit ('image', 'save_image', function () { call_interactively('save-image',[makeURL(imageURL)]); });
            }
            if (! image_standalone_p (node)) {
                // add methods for notStandAloneImage Supertype
                inherit ('image', 'follow_image', function () { call_interactively('follow-image',[null, imageURL]); });
            }

        } else if (html_input_node_p (node) || html_textarea_node_p (node)) {

            if (textbox_node_p (node)) {
                // add methods for onTextInput Supertype
                inherit ('edit', 'undo', function () { goDoCommand('cmd_undo'); });
                inherit ('edit', 'cut', function () { goDoCommand('cmd_cut'); });
                inherit ('edit', 'paste', function () { goDoCommand('cmd_paste'); });
                inherit ('edit', 'delete', function () { goDoCommand('cmd_delete'); });
                inherit ('edit', 'copy', function () { goDoCommand('cmd_copy'); });
            }
            // note, firefox also checks, onKeywordField = keyword_field_node_p (this.target);

        } else if (html_html_node_p (node)) {

            // pages with multiple <body>s are lame. we'll teach them a lesson.
            var bodyElt = node.ownerDocument.getElementsByTagName("body")[0];
            if (bodyElt) {
                var computedURL = get_computed_url (bodyElt, "background-image");
                if (computedURL) {
                    // add methods for hasBGImage Supertype
                    var bgImageURL = makeURLAbsolute (bodyElt.baseURI, computedURL);
                    inherit ('background_image', 'follow_background_image', function () { call_interactively('follow-image',[null, bgImageURL]); });
                }
            }

        } else if ( "HTTPIndex" in content &&
                    content.HTTPIndex instanceof Components.interfaces.nsIHTTPIndex ) {
            // add methods for inDirList Supertype
                
            // Bubble outward till we get to an element with URL attribute
            // (which should be the href).
            var root = node;
            var link = null;
            while (root && !link) {
                if (root.tagName == "tree") {
                    // Hit root of tree; must have clicked in empty space;
                    // thus, no link.
                    break;
                }
                if (root.getAttribute ("URL")) {
                    // provide all link methods as an interface, so either all
                    // will be inherited, or none.
                    var link_iface = {};
                    // (inDirList && onLink) => open_link_in_frame and open_link_in_buffer
                    var linkURL = root.getAttribute("URL");
                    // add methods for onLink Supertype
                    link_iface.copy_link = function () { /* XXX: make sure link is focused */ call_interactively('copy-link-location'); };
                    link_iface.follow_link = function () { open_url_in (1, linkURL); };
                    // add methods for (inDirList && onLink) Supertype
                    link_iface.follow_link_in_buffer = function () { open_url_in (4, linkURL); };
                    link_iface.follow_link_in_frame = function () { open_url_in (16, linkURL); };

                    link = true;

                    // If element is a directory, then you can't save it.
                    if (root.getAttribute ("container") != "true") {
                        // add methods for onSaveableLink Supertype
                        link_iface.save_link = function () { /* XXX: make sure link is focused */ call_interactively ('save-focused-link'); };
                    }
                    inherit_interface ('link', link_iface);
                } else {
                    root = root.parentNode;
                }
            }
        }
    }


    // Second, bubble out, looking for items of interest that can have childen.
    // Always pick the innermost link, background image, etc.
    //
    const XMLNS = "http://www.w3.org/XML/1998/namespace";
    var elem = node;
    while (elem) {
        if (elem.nodeType == Node.ELEMENT_NODE) {

            // Link?
            if ((elem instanceof HTMLAnchorElement && elem.href) ||
                elem instanceof HTMLAreaElement ||
                elem instanceof HTMLLinkElement ||
                elem.getAttributeNS ("http://www.w3.org/1999/xlink", "type") == "simple")
            {
                var link_iface = {};
                var linkURL = get_link_url (elem);
                // add methods for onLink Supertype
                link_iface.copy_link = function () { call_interactively('copy-link-location', [linkURL]); };
                link_iface.follow_link = function () { open_url_in (1, linkURL); };
                link_iface.follow_link_in_buffer = function () { open_url_in (4, linkURL); };
                link_iface.follow_link_in_frame = function () { open_url_in (16, linkURL); };

                // add methods for onMetaDataItem Supertype
                // (none yet)

                if (get_link_uri (linkURL).scheme == "mailto") {
                    // add methods for onMailtoLink Supertype
                    link_iface.copy_email = function () { call_interactively ('copy-email-address', [linkURL]); };
                }
                if (url_saveable_p (linkURL)) {
                    // add methods for onSaveableLink Supertype
                    var linkURI = makeURL (linkURL);
                    link_iface.save_link = function () { call_interactively ('save-focused-link', [linkURI]); };
                }
                inherit_interface ('link', link_iface);
            }

            // Metadata item?
            //
            // if we have not already inherited metadata methods, check for a metadata item now.
            // if ( !this.onMetaDataItem ) {
            //     this.onMetaDataItem = metadata_item_p (elem);
            // }

            // Background image?  Look for the computed background-image
            // style.
            //
            var bgImgUrl = get_computed_url (elem, "background-image");
            if (bgImgUrl) {
                // add methods for hasBGImage Supertype
                var bgImageURL = makeURLAbsolute (elem.baseURI, bgImgUrl);
                inherit ('background_image', 'follow_background_image', function () { call_interactively('follow-image',[null, bgImageURL]); });
            }
        }
        elem = elem.parentNode;
    }

    // the isContentSelected superclass is has lower precedence than
    // onTextInput.
    if (content_selected_p ()) {
        inherit ('edit', 'copy', function () { goDoCommand('cmd_copy'); });
        inherit ('source', 'view_selection_source', function () { call_interactively ('view-partial-source'); });
    }
    inherit ('edit', 'select_all', function () { cmd_selectAll(); });

    if (node_mathml_p (node)) {
        inherit ('source', 'view_mathml_source', function () { call_interactively ('view-mathml-source',[null, node]); });
    }

    inherit ('source', 'view_source', function () { call_interactively('view-source'); });

    return methods;
}

