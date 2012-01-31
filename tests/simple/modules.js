
require('walnut.js');

walnut_run({
    test_featurep_1: function () {
        assert(! featurep("non-existent module"));
    },
    test_featurep_2: function () {
        assert(featurep("conkeror"));
    },
    test_call_after_load_1: function () {
        let a = 0;
        call_after_load("conkeror", function () { a = 1; });
        assert_equals(a, 1);
    }
});


walnut_run({
    suite_setup: function () {
        this._load_paths = load_paths;
        this._loading_paths = loading_paths;
        this._loading_urls = loading_urls;
        this._loading_features = loading_features;
        this._pending_loads = pending_loads;
        this._features = features;
        this._after_load_functions = after_load_functions;
        this._load_url = load_url;
        var suite = this;
        load_url = function (url) {
            suite.ob.push(url); //initialized for each test in suite.setup
            throw "Error opening input stream (invalid filename?)";
        };
    },
    suite_teardown: function () {
        load_paths = this._load_paths;
        load_url = this._load_url;
        loading_paths = this._loading_paths;
        loading_urls = this._loading_urls;
        loading_features = this._loading_features;
        pending_loads = this._pending_loads;
        features = this._features;
        after_load_functions = this._after_load_functions;
    },
    setup: function () {
        loading_paths = [];
        this.ob = [];
    },
    test_load_search_1__sans_extension: function () {
        load_paths = ["chrome://conkeror/content/",
                      "chrome://conkeror/content/extensions",
                      "chrome://conkeror/content/page-modes"];
        try {
            load("foo");
        } catch (e) {
        }
        assert_objects_equal(
            ["chrome://conkeror/content/foo",
             "chrome://conkeror/content/foo.js",
             "chrome://conkeror/content/foo.jsx",
             "chrome://conkeror/content/extensions/foo",
             "chrome://conkeror/content/extensions/foo.js",
             "chrome://conkeror/content/extensions/foo.jsx",
             "chrome://conkeror/content/page-modes/foo",
             "chrome://conkeror/content/page-modes/foo.js",
             "chrome://conkeror/content/page-modes/foo.jsx"],
            this.ob);
    },
    test_load_search_2__with_extension: function () {
        load_paths = ["chrome://conkeror/content/",
                      "chrome://conkeror/content/extensions",
                      "chrome://conkeror/content/page-modes"];
        try {
            load("foo.js");
        } catch (e) {
        }
        assert_objects_equal(
            ["chrome://conkeror/content/foo.js",
             "chrome://conkeror/content/extensions/foo.js",
             "chrome://conkeror/content/page-modes/foo.js"],
            this.ob);
    },
    test_load_search_3__load_path_dups: function () {
        load_paths = ["chrome://conkeror/content/",
                      "chrome://conkeror/content/extensions",
                      "chrome://conkeror/content/extensions/",
                      "chrome://conkeror/content/page-modes"];
        try {
            load("foo.js");
        } catch (e) {
        }
        assert_objects_equal(
            ["chrome://conkeror/content/foo.js",
             "chrome://conkeror/content/extensions/foo.js",
             "chrome://conkeror/content/page-modes/foo.js"],
            this.ob);
    },
    test_load_search_4__require_skips_cur_dir: function () {
        loading_paths = ["file:///foo/bar/baz/"];
        load_paths = ["chrome://conkeror/content/"];
        try {
            require("foo.js");
        } catch (e) {
        }
        assert_objects_equal(
            ["chrome://conkeror/content/foo.js"],
            this.ob);
    },
    test_load_search_5__relative_path: function () {
        load_paths = ["chrome://conkeror/content/",
                      "chrome://conkeror/content/extensions",
                      "chrome://conkeror/content/page-modes"];
        try {
            load("page-modes/foo");
        } catch (e) {
        }
        assert_objects_equal(
            this.ob,
            ["chrome://conkeror/content/page-modes/foo",
             "chrome://conkeror/content/page-modes/foo.js",
             "chrome://conkeror/content/page-modes/foo.jsx",
             "chrome://conkeror/content/extensions/page-modes/foo",
             "chrome://conkeror/content/extensions/page-modes/foo.js",
             "chrome://conkeror/content/extensions/page-modes/foo.jsx",
             "chrome://conkeror/content/page-modes/page-modes/foo",
             "chrome://conkeror/content/page-modes/page-modes/foo.js",
             "chrome://conkeror/content/page-modes/page-modes/foo.jsx"]);
    }
});


walnut_run({
    suite_setup: function () {
        this._load_paths = load_paths;
        this._loading_paths = loading_paths;
        this._loading_urls = loading_urls;
        this._loading_features = loading_features;
        this._pending_loads = pending_loads;
        this._features = features;
        this._after_load_functions = after_load_functions;
        this._load_url = load_url;
    },
    teardown: function () {
        load_paths = this._load_paths;
        load_url = this._load_url;
        loading_paths = this._loading_paths;
        loading_urls = this._loading_urls;
        loading_features = this._loading_features;
        pending_loads = this._pending_loads;
        features = this._features;
        after_load_functions = this._after_load_functions;
    },
    test_load__circular_load_is_error: function () {
        load_url = function () {
            load(make_uri("chrome://conkeror/content/foo.js"));
        };
        assert_error(function () {
            load(make_uri("chrome://conkeror/content/foo.js"));
        });
    },
    test_load__not_found_is_error: function () {
        load_paths = [];
        loading_paths = [];
        loading_urls = [];
        loading_features = [];
        pending_loads = [];
        assert_error(function () load("foo"));
    },
    test_require_later_1: function () {
        loading_urls = [];
        pending_loads = [];
        var ob = "";
        function mock_foo () {
            ob += "a";
            require_later("bar");
            ob += "b";
            load_url = mock_bar;
        }
        function mock_bar () {
            ob += "c";
        }
        load_url = mock_foo;
        load("foo");
        assert_equals(ob, "abc");
    },
    test_require_later_2: function () {
        loading_paths = [];
        loading_urls = [];
        loading_features = [];
        pending_loads = [];
        after_load_functions = [];
        features = {};
        var ob = [];
        var mock_modules = {
            foo: function () {
                ob.push("foo");
                require_later("baz");
                require("bar");
                provide("foo");
            },
            bar: function () {
                ob.push("bar");
                provide("bar");
            },
            baz: function () {
                ob.push("baz");
                require_later("quux");
                provide("baz");
            },
            quux: function () {
                ob.push("quux");
                provide("quux");
            }
        };
        load_url = function (url) {
            var module = url.substr(url.lastIndexOf('/')+1);
            mock_modules[module]();
        };
        load("foo");
        assert_objects_equal(ob, ["foo", "bar", "baz", "quux"]);
    },
    test_provide__load_order: function () {
        // want to make sure that after_load_functions only get called
        // after the completion of the load which provided the feature.
        loading_paths = [];
        loading_urls = [];
        loading_features = [];
        pending_loads = [];
        after_load_functions = [];
        features = {};

        var called = false;
        var mock_modules = {
            foo: function () {
                called = true;
                provide("foo");
                assert_not(featurep("foo"));
            }
        };
        load_url = function (url) {
            var module = url.substr(url.lastIndexOf('/')+1);
            mock_modules[module]();
        };
        load("foo");
        assert(called);
        assert(featurep("foo"));
    },
    test_provide: function () {
        loading_paths = [];
        loading_urls = [];
        loading_features = [];
        pending_loads = [];
        after_load_functions = [];
        features = {};
        provide("foo");
        assert(featurep("foo"));
    },
    test_load_relative_of_nsIURI: function () {
        var tried = null;
        load_url = function (url) {
            if (url == "chrome://conkeror/content/foo.js") {
                load("bar.js");
            } else {
                tried = url;
            }
        };
        load(make_uri("chrome://conkeror/content/foo.js"));
        assert_equals(tried, "chrome://conkeror/content/bar.js");
    },
    test_load_relative_path_nested: function () {
        loading_paths = [];
        loading_urls = [];
        loading_features = [];
        pending_loads = [];
        after_load_functions = [];
        features = {};
        var ob = [];
        var mock_modules = {
            foo: function () {
                load("deeper/bar");
                provide("foo");
            },
            bar: function () {
                assert(loading_paths[0].indexOf("some-path/deeper") > 0);
                provide("bar");
            }
        };
        load_url = function (url) {
            var module = url.substr(url.lastIndexOf('/')+1);
            mock_modules[module]();
        };
        load("some-path/foo");
        assert(featurep("foo"));
        assert(featurep("bar"));
    }
});
