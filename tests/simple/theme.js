
require('walnut.js');

walnut_run({
    test_get_contents_asynchronously_1: function () {
        assert(get_contents_synchronously("chrome://conkeror/content/conkeror.js"));
    },
    test_get_contents_asynchronously_2: function () {
        assert_null(get_contents_synchronously("chrome://conkeror/content/non-existent.file"));
    },
    test_get_contents_asynchronously_3: function () {
        assert(get_contents_synchronously(make_uri("chrome://conkeror/content/conkeror.js")));
    },
    test_theme_module_was_loaded: function () {
        assert(theme_load, "theme module was loaded");
    },
    test_theme1: function () {
        assert_error(function () { theme_load(" nonexistent theme name!"); });
    },
    test_theme_load_paths_exists: function () {
        assert(theme_load_paths);
    },
    test_default_theme_exists: function () {
        assert(theme_find("default"));
    },
    test_theme_location_prop_exists: function () {
        assert(theme_find("default").location);
    },
    test_theme_sheets_prop_exists: function () {
        assert(theme_find("default").sheets);
    },
    test_theme_find_recycles: function () {
        let th1 = theme_find("default");
        let th2 = theme_find("default");
        assert_equals(th1, th2);
    },
    test_theme_cssfile_module_1: function () {
        assert_equals(theme_cssfile_module("foo.css"), "foo");
    },
    test_theme_cssfile_module_2: function () {
        assert_equals(theme_cssfile_module("foo--bar.css"), "foo");
    },
    test_theme_unregister_method_exists: function () {
        assert(theme_find("default").unregister);
    },
    test_theme_register_method_exists: function () {
        assert(theme_find("default").register);
    },
    test_theme_registered_p_method_exists: function () {
        assert(theme_find("default").registered_p);
    }
});
