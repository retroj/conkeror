
require("walnut.js");

walnut_run({
    test_youtube_1: function () {
        assert_equals(regexp_exec(youtube_mode_test,
                                  "http://www.youtube.com/watch?v=cpmnazm6HVU&feature=related",
                                  1),
                      "cpmnazm6HVU");
    },
    test_youtube_2: function () {
        assert_equals(regexp_exec(youtube_mode_test,
                                  "http://www.youtube.com/watch?feature=player_detailpage&v=6ivsFnbeM_Q",
                                  1),
                      "6ivsFnbeM_Q");
    }
});
