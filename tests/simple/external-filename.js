require('walnut.js');

function mock_textfield(onlyid) {
    this.getAttribute = function (accessor) {
        if (! accessor || accessor != onlyid)
            return null;

        return onlyid + "!text    box%--"
    }
}

walnut_run({
    suite_setup: function () {
        this.ext = edit_field_in_external_editor_file_ext;
    },
    suite_teardown: function () {
        edit_field_in_external_editor_file_ext = this.ext;
    },
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
        assert_equals(get_filename_for_current_textfield(document, elem),
                      "www-bbc-co-uk-textarea.txt");

        var elem = new mock_textfield("id");
        assert_equals(get_filename_for_current_textfield(document, elem),
                      "www-bbc-co-uk-id-text-box.txt");

        var elem = new mock_textfield("name");
        assert_equals(get_filename_for_current_textfield(document, elem),
                      "www-bbc-co-uk-name-text-box.txt");
    }
});
