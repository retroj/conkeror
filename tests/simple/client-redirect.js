
require("walnut");
require("client-redirect");

walnut_run({
    suite_setup: function () {
        this.real_redirects = client_redirect.redirects;
        client_redirect.redirects = {};
        define_client_redirect("r1",
            function (uri) {
                return /^example\.com$/.test(uri.host)
                    && uri.filePath == "/foo"
                    && uri.spec + "/bar";
            });
        define_client_redirect("r2",
            build_url_regexp($domain = "example", $allow_www,
                             $path = /(foo)/),
            function (m) {
                return "http://example.com/"+m[1]+"/"+m[1];
            });
    },
    suite_teardown: function () {
        client_redirect.redirects = this.real_redirects;
    },
    test_client_redirect_1: function () {
        var uri = make_uri("http://not-example.com/foo")
            .QueryInterface(Ci.nsIURL);
        assert_not(client_redirect.redirects.r1(uri));
    },
    test_client_redirect_2: function () {
        var uri = make_uri("http://example.com/")
            .QueryInterface(Ci.nsIURL);
        assert_not(client_redirect.redirects.r1(uri));
    },
    test_client_redirect_3: function () {
        var uri = make_uri("http://example.com/foo")
            .QueryInterface(Ci.nsIURL);
        assert_equals(client_redirect.redirects.r1(uri),
                      "http://example.com/foo/bar");
    },
    test_client_redirect_4: function () {
        var uri = make_uri("http://example.com/")
            .QueryInterface(Ci.nsIURL);
        assert_not(client_redirect.redirects.r2(uri));
    },
    test_client_redirect_5: function () {
        var uri = make_uri("http://example.com/foo")
            .QueryInterface(Ci.nsIURL);
        assert_equals(client_redirect.redirects.r2(uri),
                      "http://example.com/foo/foo");
    }
});
