
in_module(null);

var noscript_service = Cc["@maone.net/noscript-service;1"]
    .createInstance().wrappedJSObject;

function unique(a) {
    var r = new Array();
    o:for(var i = 0, n = a.length; i < n; i++) {
        for(var x = 0, y = r.length; x < y; x++) {
            if(r[x]==a[i]) continue o;
        }
        r[r.length] = a[i];
    }
    return r;
}

function hideObject(p, o) {
    if (!p.mimeRx.test(o.type)) return;
    var r = p.document.createElement("object");
    r.style.width = o.offsetWidth + "px";
    r.style.height = o.offsetHeight + "px";
    r.style.display = "inline-block";
    o.className += " " + p.className;
    o.parentNode.insertBefore(r, o);
}

function showObject(p, o) {
    var cs = o.className;
    cs = cs.replace(p.classRx, '');
    if (cs != o.className) {
        o.className = cs;
        var r = o.previousSibling;
        if (r instanceof HTMLObjectElement) {
            r.parentNode.removeChild(r);
        }
    }
}

function setObjectVisibility(document, callback) {
    var tags = ["object", "embed"];
    const ns = noscript_service;
    var rx = ns.hideOnUnloadRegExp;
    if (!rx) return;
    var params = {
        document: document,
        mimeRx: rx,
        classRx: ns.hideObjClassNameRx,
        className: ns.hideObjClassName
    };

    var objects = null;
    var local_objects, count;

    for each(var tag in tags) {
        local_objects = document.getElementsByTagName(tag);
        count = local_objects.count;
        if (count) {
            objects = objects || [local_objects[--count]];
            while(count-- > 0) {
	        objects.push(local_objects[count]);
            }
        }
    }
    if(objects) {
        for (counter = objects.length; counter-- > 0;) {
            callback(params, objects[counter]);
        }
    }
}


function ns_allow_temp(url, buffer, P, allow) {
    var enabled, temp;
    const ns = noscript_service;
    if (allow == "Y" || allow == "y" || allow == "yes" || allow == "Yes") {
        enabled = true;
        temp = ns.getPref("toggle.temp");
        ns.setTemp(url, enabled && temp);
        ns.setJSEnabled(url, enabled, false, ns.mustCascadeTrust(url, temp));
        setObjectVisibility(buffer.document,showObject);
    } else {
        enabled = false;
        temp = ns.getPref("toggle.temp");
        ns.setTemp(url, enabled && temp);
        ns.setJSEnabled(url, enabled, false, ns.mustCascadeTrust(url, temp));
        setObjectVisibility(buffer.document,hideObject);
    }
}

interactive("ns-toggle-temp", "Allow a site temporary access to javascript",   function(I) {
    const ns = noscript_service;
    var urls = new Array();
    var level = ns.getPref("toolbarToggle", 3);
    if (!level) level = 3;
    const url = ns.getQuickSite(I.buffer.document.documentURI, level);
    if (url){
	urls.push(url);
	var scripts = I.buffer.document.getElementsByTagName("script");
	for(i = 0;i < scripts.length;i++) {
	    if (scripts[i].getAttribute("src")) {
		matches = scripts[i].getAttribute("src").split("/");
		if (matches[0] == "http:") {
		    urls.push(matches[2]);
		}
	    }
	}
	urls = unique(urls);
	while ((url2 = urls.pop())) {
	    ns_allow_temp(url2, I.buffer,I.P, (yield I.minibuffer.read ($prompt = "Allow "+url2+"? [Y/[N]]")));
	}
	reload(I.buffer, I.P);
    }
});

provide("noscript");
