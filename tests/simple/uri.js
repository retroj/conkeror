
require('walnut.js');

walnut_run({
    test_make_uri_1: function () {
        assert(make_uri("chrome://conkeror/content/conkeror.js"));
    },
    test_make_uri_2: function () {
        assert(make_uri("http://www.example.com/"));
    },
    test_make_uri_3: function () {
        assert_error(function () { make_uri("chrome://conkeror"); });
    }
});
