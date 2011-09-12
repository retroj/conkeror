
require('walnut.js');

function mock_textfield (onlyid) {
    this.getAttribute = function (accessor) {
        if (! accessor || accessor != onlyid)
            return null;
        return onlyid + "!text    box%--";
    };
    if (! onlyid)
        this.tagName = "textarea";
}

walnut_run({
    test_elem_mock: function () {
        var elem = new mock_textfield("name");
        assert_equals(elem.getAttribute("name"), "name!text    box%--");

        var elem = new mock_textfield("id");
        assert_equals(elem.getAttribute("id"), "id!text    box%--");
    },
    test_filenames: function () {
        var document = {
            URL: "http://www.bbc.co.uk/",
            location: {
                protocol: "http:"
            }
        };

        var elem = new mock_textfield();
        assert_equals(external_editor_make_base_filename(elem, document),
                      "www-bbc-co-uk-textarea");

        var elem = new mock_textfield("id");
        assert_equals(external_editor_make_base_filename(elem, document),
                      "www-bbc-co-uk-id-text-box");

        var elem = new mock_textfield("name");
        assert_equals(external_editor_make_base_filename(elem, document),
                      "www-bbc-co-uk-name-text-box");
    }
});
