

interactive("point-select",
    "",
    function (I) {
        var elem = yield read_browser_object(I);
        var rect = elem.getBoundingClientRect();
        var point = I.buffer.point;
        point.xpath = get_xpath_for_element(elem);
        point.top = rect.top;
        point.left = rect.left;
        point.width = rect.width;
        point.height = rect.height;
        I.buffer.point_update();
    },
    $browser_object = browser_object_dom_node);


provide("point-commands");
