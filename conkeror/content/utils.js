// -*- mode: java -*-

var gBrowser = null;

function getAccessibility(node)
{
    var acc_serv = Components.classes["@mozilla.org/accessibilityService;1"]
	.createInstance(Components.interfaces.nsIAccessibilityService);
    
    var o = new Object();
    var i = acc_serv.getAccessibleFor(node, o);
//     alert(i);
    return i;
//     var x = new Object();
//     var y = new Object();
//     var w = new Object();;
//     var h = new Object();;

//     acc.getBounds(x,y,w,h);
//     alert(x.value + " " + y.value + " " + w.value + " " + h.value);
}


function getBrowser()
{
    if (gBrowser == null)
	gBrowser = document.getElementById("content");
    return gBrowser;
}

function getWebNavigation ()
{
  try {
    return getBrowser().webNavigation;
  } catch (e) {
      window.alert(e);
    return null;
  }    
}
