/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 *
 * Portions of this file were derived from Vimperator,
 * (C) Copyright 2006-2007 Martin Stubenschrott.
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/**
 * Text and full-page zoom
 */

in_module(null);

var zoom_levels = [ 1, 10, 25, 50, 75, 90, 100,
                    120, 150, 200, 300, 500, 1000, 2000 ];

function browser_zoom_set (buffer, full_zoom, value) {
    var txt = full_zoom ? "Zoom: " : "Text zoom: ";
    if (value < zoom_levels[0])
        value = zoom_levels[0];
    if (value > zoom_levels[zoom_levels.length - 1])
        value = zoom_levels[zoom_levels.length - 1];
    buffer.markup_document_viewer[full_zoom ? "fullZoom" : "textZoom"] = value / 100.0;
    buffer.window.minibuffer.message(txt + value + "%");
}

function browser_zoom_change (buffer, full_zoom, count) {
    if (count == 0)
        return;
    var zoom = full_zoom ? "fullZoom" : "textZoom";
    var cur_value = buffer.markup_document_viewer[zoom] * 100;
    var new_level;
    if (count < 0) {
        new_level = 0;
        for (var i = zoom_levels.length - 1; i >= 0; --i) {
            if (zoom_levels[i] - 0.01 < cur_value) {
                new_level = i + count;
                break;
            }
        }
    } else {
        new_level = zoom_levels.length - 1;
        for (var i = 0; i < zoom_levels.length; ++i) {
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

interactive("zoom-in-text", null, function (I) {browser_zoom_change(I.buffer, false /* not full zoom */, I.p);});
interactive("zoom-out-text", null, function (I) {browser_zoom_change(I.buffer, false /* not full zoom */, -I.p);});
interactive("zoom-in-text-more", null, function (I) {browser_zoom_change(I.buffer, false /* not full zoom */, I.p * 3);});
interactive("zoom-out-text-more", null, function (I) {browser_zoom_change(I.buffer, false /* not full zoom */, -I.p * 3);});
interactive("zoom-reset-text", null, function (I) {browser_zoom_set(I.buffer, false /* not full zoom */, I.p = 100);});

interactive("zoom-in-full", null, function (I) {browser_zoom_change(I.buffer, true /* full zoom */, I.p);});
interactive("zoom-out-full", null, function (I) {browser_zoom_change(I.buffer, true /* full zoom */, -I.p);});
interactive("zoom-in-full-more", null, function (I) {browser_zoom_change(I.buffer, true /* full zoom */, I.p * 3);});
interactive("zoom-out-full-more", null, function (I) {browser_zoom_change(I.buffer, true /* full zoom */, -I.p * 3);});
interactive("zoom-reset-full", null, function (I) {browser_zoom_set(I.buffer, true /* full zoom */, I.p = 100);});

provide("zoom");
