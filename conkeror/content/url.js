// -*- mode: java -*-
/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

function onUrlKeyPress(event)
{
    var field = document.getElementById("input-field");
//     var urlbar = document.getElementById("input-toolbox");

    if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
	try{
	    var url = field.value;
	    closeUrlBar();
	    getWebNavigation().loadURI(url, nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
	} catch (e) {window.alert(e);}
	//    } else if (event.keyCode == KeyEvent.DOM_VK_TAB) {
	// paste current url
    } else if (event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_RETURN
	       || event.keyCode == KeyEvent.DOM_VK_TAB 
	       || event.keyCode == KeyEvent.DOM_VK_ESCAPE
	       || (event.ctrlKey && (event.charCode == 103))) {
	closeUrlBar();
	event.preventDefault();
	event.preventBubble();
//     } else if (event.ctrlKey && event.charCode == 121) { // C-y
// 	field.value += gBrowser.currentURI.spec;
// 	event.preventDefault();
    }


}

function closeUrlBar()
{
    closeInput(true, true);
}

// function focusUrlBar()
// {
//     var url = document.getElementById("input-field");
//     var urlbar = document.getElementById("url-toolbox");
//     urlbar.hidden = false;
//     url.focus();
//     url.value = getWebNavigation().currentURI.spec;
// }
