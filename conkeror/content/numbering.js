
function numbering_simple (document) {
    var types = ['input', 'a','select','embed','textarea','area'];
    var nodes = [];
    for (i = 0; i < types.length; i++) {
	var tmp = document.getElementsByTagName (types[i]);
	for (j = 0; j < tmp.length; j++)
	    nodes.unshift (tmp[j]);
    }
    return nodes;
}

conkeror.numbering_default = numbering_simple;


function numbering_generate (element_fn) {
    var frames = this.content.frames;

}


function numbering_generate_default () {
    numbering_generate.call (this, numbering_default);
}


function numbering_resize () {
    dumpln ('numbering_resize');
}


add_hook (dom_content_loaded_hook, numbering_generate_default);

add_hook (frame_resize_hook, numbering_resize);
