
///
/// QUERYING NUMBERS
///
///

// numbering_get_number1: returns null or a number element from a document,
//                        if one exists by the given number.
//
function numbering_get_number1 (doc, number) {
    var nodes = doc.getElementsByTagName('SPAN');
    for (var i=0; i<nodes.length; i++) {
        if (nodes[i].getAttribute("conkeror-numbering") == number) {
            return nodes[i];
        }
    }
    return null;
}

// numbering_get_number: returns null a number element from a content
// object, by searching both content.document and each document in
// content.frames.
//
// content: e.g., window.content
//
function numbering_get_number (content, number) {
    var doc = content.document;
    var frames = content.frames;
    var numnode = numbering_get_number1 (doc, number);
    var i = 0;
    while (! numnode && i < frames.length) {
        numnode = numbering_get_number1 (frames[i].document, number);
    }
    return numnode;
}


// numbering_get_element: returns null or the element corresponding to
// number_node.
function numbering_get_element (number_node) {
    return number_node.ownerDocument.getElementById (
        number_node.getAttribute ('conkeror-numbering'));
}






///
/// GENERATING NUMBERS
///


// document should be the top document.
// high may be null, or lower limit.
function numbering_document_highest (document, high) {
    if (document && document.conkeror_numbering_high) {
        if (high == null || document.conkeror_numbering_high > high)
            high = document.conkeror_numbering_high;
    }
    var fr;
    fr = document.getElementsByTagName ("FRAME");
    for (var i = 0; i < fr.length; i++) {
        high = numbering_document_highest (fr[i].contentDocument, high);
    }
    fr = document.getElementsByTagName ("IFRAME");
    for (var i = 0; i < fr.length; i++) {
        high = numbering_document_highest (fr[i].contentDocument, high);
    }
    return high;
}

function numbering_generate1 (document, element) {

}

// element_fn is a function of one argument.  it will be called with
// the document, and it should return a list of elements to be
// numbered.
//
function numbering_generate (document, element_fn) {
    var nodes = element_fn.call (this, document);

    // attach a stylesheet to the document that styles the numbers.
    // they start out display='none'.
    //


    // we may be in a frame, so find the top document, and check for a
    // starting number that we may use.
    //
    var nstart = 1 + numbering_document_highest (this.content.document, 0);
    // dumpln (document.title + ": " + nstart);
    var n;
    for (var i = 0; i < nodes.length; i++) {
        n = i + nstart;
        numbering_generate1 (document, nodes[i], n);
    }
    // n may be null, or our highest link number.
    document.conkeror_numbering_high = n;

    // make numbers visible.
    //

}



///
/// USER CONFIGURATION
///

function numbering_simple (document) {
    var types = ['input', 'a','select','textarea','area'];
    var nodes = [];
    for (i = 0; i < types.length; i++) {
        var tmp = document.getElementsByTagName (types[i]);
        for (j = 0; j < tmp.length; j++) {
            if ((! tmp[j].hasAttributes ())                            ||
                (tmp[j].tagName == 'INPUT' && tmp[j].type == 'hidden') ||
                ((tmp[j].tagName == 'AREA' || tmp[j].tagName == 'A') &&
                 ! tmp[j].hasAttribute ('href')))
                continue;
            nodes.unshift (tmp[j]);
        }
    }
    return nodes;
}

var numbering_default = numbering_simple;

// this gets called in window scope with the document that was just
// loaded.  it will be called for each frame and iframe document, too.
function numbering_generate_default (document) {
    numbering_generate.call (this, document, numbering_default);
}

add_hook (dom_content_loaded_hook, numbering_generate_default);








function numbering_resize () {
    dumpln ('numbering_resize');
}
add_hook (frame_resize_hook, numbering_resize);

// add_hook (dom_content_loaded_hook,
//           function (buffer) {
//               dumpln ('dom_content_loaded_hook: '+buffer+' ('+buffer.contentDocument.title+')');
//           });
