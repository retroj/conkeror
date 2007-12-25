
/**
 * Text and full-page zoom
 */


var zoom_levels = [ 1, 10, 25, 50, 75, 90, 100,
                    120, 150, 200, 300, 500, 1000, 2000 ];

function browser_zoom_set(buffer, full_zoom, value) {
    if (value < zoom_levels[0])
        value = zoom_levels[0];
    if (value > zoom_levels[zoom_levels.length - 1])
        value = zoom_levels[zoom_levels.length - 1];
    buffer.markup_document_viewer[full_zoom ? "fullZoom" : "textZoom"] = value / 100.0;
    buffer.frame.minibuffer.message((full_zoom ? "Full" : "Text") + " zoom: " + value + "%");
}

function browser_zoom_change(buffer, full_zoom, count) {
    if (count == 0)
        return;
    var zoom = full_zoom ? "fullZoom" : "textZoom";
    var cur_value = buffer.markup_document_viewer[zoom] * 100;
    var new_level;
    if (count < 0) {
        new_level = 0;
        for (var i = zoom_levels.length - 1; i >= 0; --i)
        {
            if (zoom_levels[i] - 0.01 < cur_value) {
                new_level = i + count;
                break;
            }
        }
    } else {
        new_level = zoom_levels.length - 1;
        for (var i = 0; i < zoom_levels.length; ++i)
        {
            if (zoom_levels[i] + 0.01 > cur_value) {
                new_level = i + count;
                break;
            }
        }
    }

    if (new_level < 0)
        new_level = 0;
    if (new_level >= zoom_levels.length)
        new_level = zoom_levels.length - 1;
    browser_zoom_set(buffer, full_zoom, zoom_levels[new_level]);
}

interactive("zoom-in-text", browser_zoom_change,
            I.current_buffer(browser_buffer), false /* not full zoom */,
            I.p);

interactive("zoom-out-text", browser_zoom_change,
            I.current_buffer(browser_buffer), false /* not full zoom */,
            I.bind(function (x) { return -x; }, I.p));

interactive("zoom-in-text-more", browser_zoom_change,
            I.current_buffer(browser_buffer), false /* not full zoom */,
            I.bind(function (x) { return x * 3; }, I.p));

interactive("zoom-out-text-more", browser_zoom_change,
            I.current_buffer(browser_buffer), false /* not full zoom */,
            I.bind(function (x) { return -x * 3; }, I.p));

interactive("zoom-reset-text", browser_zoom_set,
            I.current_buffer(browser_buffer), false /* not full zoom */,
            I.p(100));

interactive("zoom-in-full", browser_zoom_change,
            I.current_buffer(browser_buffer), true /* full zoom */,
            I.p);

interactive("zoom-out-full", browser_zoom_change,
            I.current_buffer(browser_buffer), true /* full zoom */,
            I.bind(function (x) { return -x; }, I.p));

interactive("zoom-reset-full", browser_zoom_set,
            I.current_buffer(browser_buffer), true /* full zoom */,
            I.p(100));

interactive("zoom-in-full-more", browser_zoom_change,
            I.current_buffer(browser_buffer), true /* full zoom */,
            I.bind(function (x) { return x * 3; }, I.p));

interactive("zoom-out-full-more", browser_zoom_change,
            I.current_buffer(browser_buffer), true /* full zoom */,
            I.bind(function (x) { return -x * 3; }, I.p));
