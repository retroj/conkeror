
/// Get our localized strings.
/// 
var contextmenu_sb = add_stringbundle ("contextmenu_sb", "chrome://conkeror/locale/gui_context_menu.properties");

var the_gui_context_menu = null;


function gui_context_menu (menu) {
    this.methods = context_methods (document.popupNode);
    // initialize the gui menu here.
    //
    this.menu_root = document.getElementById ("contentAreaContextMenu");
    this.contextmenu_add_link_items (this.methods);
    this.contextmenu_add_image_items (this.methods);
    this.contextmenu_add_nav_items (this.methods);
    this.contextmenu_add_page_items (this.methods);
    this.contextmenu_add_background_image_items (this.methods);
    this.contextmenu_add_edit_items (this.methods);
    if ('frame' in this.methods)
        this.contextmenu_add_frame_items (this.methods);
    this.contextmenu_add_source_items (this.methods);
    return this;
}


gui_context_menu.prototype = {
menu_root: null,
methods: {},
call: function (method_interface, method) {
        if (method_interface in this.methods &&
            method in this.methods[method_interface])
        {
            this.methods[method_interface][method] ();
        } // XXX: else throw, or message something?
    },
has_methods: function () {
        if (! has_properties_p (this.methods))
            return false;
        return true;
    },
destroy: function () {
        var menu_root = document.getElementById ("contentAreaContextMenu");
        for (var i = menu_root.childNodes.length -1; i >= 0; i --)
            menu_root.removeChild(menu_root.childNodes[i]);
    },

///
/// DOM Procedures for the menu gui.
///
add_contextmenu_item : function (label, key, oncommand) {
        var menuitem = add_menuitem (this.menu_root, null, label, key, oncommand);
    },

add_contextmenu_separator : function () {
        var menuitem = add_menuseparator (this.menu_root);
    },

add_contextmenu_submenu : function (label, key) {
        var menuitem = add_submenu (this.menu_root, null, label, key);
        return add_menupopup (menuitem);
    },

context_add_maybe : function (iface, method) {
        if (iface in this.methods &&
            method in this.methods[iface])
        {
            this.add_contextmenu_item (contextmenu_sb.getString ("context_"+method+".label"),
                                       contextmenu_sb.getString ("context_"+method+".accesskey"),
                                       "the_gui_context_menu.call ('"+iface+"','"+method+"');");
            return true;
        }
        return false;
    },

///
/// Procedures to add specific menu items.
/// 
contextmenu_add_link_items : function () {
        var sep = false;
        sep = sep | this.context_add_maybe ('link', 'follow_link');
        sep = sep | this.context_add_maybe ('link', 'follow_link_in_buffer');
        sep = sep | this.context_add_maybe ('link', 'follow_link_in_frame');
        if (sep) this.add_contextmenu_separator ();
        sep = false;
        sep = sep | this.context_add_maybe ('link', 'save_link');
        sep = sep | this.context_add_maybe ('link', 'copy_email');
        sep = sep | this.context_add_maybe ('link', 'copy_link');
        if (sep) this.add_contextmenu_separator ();
    },

contextmenu_add_image_items : function () {
        var sep = false;
        sep = sep | this.context_add_maybe ('image', 'follow_image');
        sep = sep | this.context_add_maybe ('image', 'copy_image');
        if (sep) this.add_contextmenu_separator ();
        sep = false;
        sep = sep | this.context_add_maybe ('image', 'save_image');
    },

contextmenu_add_nav_items : function () {
        var sep = false;
        sep = sep | this.context_add_maybe ('nav', 'back');
        sep = sep | this.context_add_maybe ('nav', 'forward');
        sep = sep | this.context_add_maybe ('nav', 'stop');
        sep = sep | this.context_add_maybe ('nav', 'reload');
        if (sep) this.add_contextmenu_separator ();
    },

contextmenu_add_page_items : function () {
        this.context_add_maybe ('page', 'save_page');
    },

contextmenu_add_background_image_items : function () {
        if ('background_image' in this.methods)
            this.add_contextmenu_separator ();
        this.context_add_maybe ('background_image', 'follow_background_image');
    },

contextmenu_add_edit_items : function () {
        var sep = false;
        sep = sep | this.context_add_maybe ('edit', 'undo');
        if (sep) this.add_contextmenu_separator ();
        sep = false;
        sep = sep | this.context_add_maybe ('edit', 'cut');
        sep = sep | this.context_add_maybe ('edit', 'copy');
        sep = sep | this.context_add_maybe ('edit', 'paste');
        sep = sep | this.context_add_maybe ('edit', 'delete');
        if (sep) this.add_contextmenu_separator ();
        sep = false;
        sep = sep | this.context_add_maybe ('edit', 'select_all');
        if (sep) this.add_contextmenu_separator ();
    },

contextmenu_add_frame_items : function () {
        if ('frame' in this.methods)
            this.add_contextmenu_separator ();

        var frame_submenu = this.add_contextmenu_submenu (contextmenu_sb.getString ("thisFrameMenu.label"),
                                                          contextmenu_sb.getString ("thisFrameMenu.accesskey"));

        var methods = this.methods;

        function frame_menu_add_maybe (method)
        {
            if (method in methods.frame)
            {
                add_menuitem (frame_submenu,
                              null,
                              contextmenu_sb.getString ("context_"+method+".label"),
                              contextmenu_sb.getString ("context_"+method+".accesskey"),
                              "the_gui_context_menu.call ('frame','"+method+"');");
                return true;
            }
            return false;
        }

        frame_menu_add_maybe ('show_only_this_frameset_frame');
        frame_menu_add_maybe ('open_frameset_frame_in_buffer');
        frame_menu_add_maybe ('open_frameset_frame_in_frame');
        add_menuseparator (frame_submenu);
        frame_menu_add_maybe ('reload_frameset_frame');
        add_menuseparator (frame_submenu);
        frame_menu_add_maybe ('save_frameset_frame_page');
        add_menuseparator (frame_submenu);
        frame_menu_add_maybe ('view_frameset_frame_source');
    },

contextmenu_add_source_items : function () {
        if ('source' in this.methods) this.add_contextmenu_separator ();
        var sep = false;
        sep = sep | this.context_add_maybe ('source', 'view_selection_source');
        sep = sep | this.context_add_maybe ('source', 'view_mathml_source');
        sep = sep | this.context_add_maybe ('source', 'view_source');
    }

};

