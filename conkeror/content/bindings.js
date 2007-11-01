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

// some predefined key maps
var 	ctrlc_kmap	   = null;
var 	ctrlw_kmap	   = null;
var 	ctrlx_kmap	   = null;
var 	four_kmap	   = null;
var 	five_kmap	   = null;
var 	help_kmap	   = null;
var 	input_kmap	   = null;
var 	textarea_kmap	   = null;
var 	select_kmap	   = null;
var 	numberedlinks_kmap = null;
var     top_esc_kmap   	   = null;
var     textarea_esc_kmap  = null;
var     input_esc_kmap     = null;
var     minibuffer_kmap    = null;
var     isearch_kmap       = null;
var     frameset_kmap      = null;

var universal_kmap = null;



// XXX: these context predicates are a problem now that all windows will be
//      coordinated by a single app-scope.  for example, what happens when you
//      start a search in one window and switch to another before completing
//      the search?
function numberedlinks_kmap_predicate (window, element) {
    return window.numberedlinks_minibuffer_active;
}

function isearch_kmap_predicate (window, element) {
    return window.isearch_active;
}

// XXX: this predicate is not as safe a check as it used to be when it was
//      done in window scope.  to-do: make it better.
function minibuffer_kmap_predicate (window, element) {
    try {
        return element.baseURI == "chrome://conkeror/content/conkeror.xul" &&
            element.className == 'textbox-input'; // minibuffer.input.inputField;
    } catch (e) { return false; }
}

function input_kmap_predicate (window, element) {
    // Use the input keymap for any input tag that
    // isn't a radio button or checkbox.
    try {
        var tag = element.tagName.toLowerCase();
        var type = element.getAttribute ("type");
        if (type != null) {type = type.toLowerCase();}
        return tag == "html:input" ||
            (tag == "input" &&
             type != "radio" &&
             type != "checkbox" &&
             type != "submit" &&
             type != "reset");
    } catch (e) { return false; }
}


function textarea_kmap_predicate (window, element) {
    try {
        return element.tagName == "TEXTAREA";
    } catch (e) { return false; }
}


function clearKmaps()
{
    ctrlc_kmap    	  = make_keymap();
    ctrlw_kmap    	  = make_keymap();
    ctrlx_kmap    	  = make_keymap();
    four_kmap     	  = make_keymap();
    five_kmap     	  = make_keymap();
    help_kmap     	  = make_keymap();
    top_kmap      	  = make_keymap();
    input_kmap            = make_context_keymap (input_kmap_predicate);
    textarea_kmap 	  = make_context_keymap (textarea_kmap_predicate);
    minibuffer_kmap       = make_context_keymap (minibuffer_kmap_predicate);
    select_kmap   	  = make_keymap();
    numberedlinks_kmap    = make_context_keymap (numberedlinks_kmap_predicate);
    isearch_kmap          = make_context_keymap (isearch_kmap_predicate);
    frameset_kmap         = make_keymap();

    top_esc_kmap   	  = make_keymap();
    textarea_esc_kmap     = make_keymap();
    input_esc_kmap        = make_keymap();

    universal_kmap        = make_keymap();

    context_kmaps = [numberedlinks_kmap,
                     isearch_kmap,
                     minibuffer_kmap,
                     input_kmap,
                     textarea_kmap];
}

// VI Keys for the heathens. Thanks to maxauthority on #conkeror for
// the patch.
function initViKmaps()
{
    clearKmaps();

    abort_key = kbd ("g",MOD_CTRL);

    // submaps
    define_key(top_kmap, kbd ("h",MOD_CTRL), help_kmap);
    define_key(top_kmap, kbd ("w",MOD_CTRL), ctrlw_kmap);
    define_key(top_kmap, kbd ("w",0),        ctrlw_kmap); 
    define_key(top_kmap, kbd ("f",0),        frameset_kmap);

	// same as emacs, since vi doesnt really have this
    define_key(help_kmap, kbd ("b",0),"describe-bindings");
    define_key(help_kmap, kbd ("i",0),"help-page");
    define_key(help_kmap, kbd ("t",0),"help-with-tutorial");

	// window/buffer managment
    // define_key(top_kmap, kbd ("q",0),"quit"); // like less
    define_key(top_kmap, kbd ("q",MOD_CTRL),"quit"); 
    define_key(top_kmap, kbd ("b",0),"switch-to-buffer"); 
    define_key(top_kmap, kbd ("d",0),"kill-buffer");  // Delete buffer
//     define_key(ctrlw_kmap, kbd ("w",0),"other-window"); // goes to other window in a split
//     define_key(ctrlw_kmap, kbd ("d",0),"delete-windows");  // removes a split
//     define_key(ctrlw_kmap, kbd ("D",0),"delete-other-windows");  // removes a split
//     define_key(ctrlw_kmap, kbd ("f",0),"split-flip");  // changes horizontal/vertical alignment of the splits
    define_key(ctrlw_kmap, kbd ("o",0),"find-url-other-frame"); 
//     define_key(ctrlw_kmap, kbd ("s",0),"split-window"); // splits a window in 2 halfes if there are 2 buffers in it
    define_key(ctrlw_kmap, kbd ("Q",0),"delete-frame");
    define_key(ctrlw_kmap, kbd ("n",0),"make-frame-command");

	// normal file marks, keys like in vi
    define_key(top_kmap, kbd ("m",0),"set-mark-command"); 
    define_key(top_kmap, kbd ("'",0),"exchange-point-and-mark"); 


	// browser commands
    define_key(top_kmap, kbd ("o",0),"open-url");
    define_key(top_kmap, kbd ("O",0),"find-url"); // same as above but in new buffer
	// opens a query which is not empty but prefilled with the current url which can be edited
    define_key(top_kmap, kbd ("O", MOD_CTRL),"find-alternate-url"); 
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE,0),"go-up");
    define_key(top_kmap, kbd ("h",0),"go-back");
    define_key(top_kmap, kbd ("l",0),"go-forward");
    define_key(top_kmap, kbd ("a",MOD_CTRL),"cmd_selectAll"); // not really vi like, but ggVG is even worse for select all
    define_key(top_kmap, kbd (",",MOD_CTRL),"toggle-numbered-links");
    define_key(top_kmap, kbd (".",MOD_CTRL),"toggle-numbered-images");
    define_key(top_kmap, kbd ("/",0),"isearch-forward");
    define_key(top_kmap, kbd ("\\",0),"view-source");
    define_key(top_kmap, kbd ("?",0),"isearch-backward");
    define_key(top_kmap, kbd ("r",0),"revert-buffer");
    define_key(top_kmap, kbd ("1",0),"numberedlinks-1");
    define_key(top_kmap, kbd ("2",0),"numberedlinks-2");
    define_key(top_kmap, kbd ("3",0),"numberedlinks-3");
    define_key(top_kmap, kbd ("4",0),"numberedlinks-4");
    define_key(top_kmap, kbd ("5",0),"numberedlinks-5");
    define_key(top_kmap, kbd ("6",0),"numberedlinks-6");
    define_key(top_kmap, kbd ("7",0),"numberedlinks-7");
    define_key(top_kmap, kbd ("8",0),"numberedlinks-8");
    define_key(top_kmap, kbd ("9",0),"numberedlinks-9");
    define_key(top_kmap, kbd (",",0),"goto-numbered-link");
    define_key(top_kmap, kbd (".",0),"copy-numbered-image-location");
    define_key(top_kmap, kbd ("u",0),"buffer-previous");
    define_key(top_kmap, kbd ("u", MOD_CTRL), "universal-argument");
    define_key(top_kmap, kbd ("i",0),"buffer-next");
    define_key(top_kmap, kbd ("p",MOD_CTRL),"buffer-previous");
    define_key(top_kmap, kbd ("n",MOD_CTRL),"buffer-next");
    define_key(top_kmap, kbd ("y",0),"copy-current-url");
    define_key(top_kmap, kbd ("Y",0),"copy-link-location");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_ESCAPE,0),"stop-loading");
    define_key(top_kmap, kbd ("g",MOD_CTRL),"unfocus"); //escape from a textfield
    define_key(top_kmap, kbd ( "=", 0),"text-reset");
    define_key(top_kmap, kbd ( "+", 0),"text-enlarge");
    define_key(top_kmap, kbd ( "-", 0),"text-reduce");

	// shows the query on the bottom with all conkeror commands
    define_key(top_kmap, kbd (":",0),"execute-extended-command");
    define_key(top_kmap, kbd (":",MOD_META),"eval-expression");

    // movement keys
    //define_key(top_kmap, kbd (" ",MOD_SHIFT),"cmd_scrollPageUp");
    define_key(top_kmap, kbd (" ",0),"cmd_scrollPageDown");
    define_key(top_kmap, kbd ("b",MOD_CTRL),"cmd_scrollPageUp");
    define_key(top_kmap, kbd ("f",MOD_CTRL),"cmd_scrollPageDown");
    define_key(top_kmap, kbd ("k",0),"cmd_scrollLineUp");
    define_key(top_kmap, kbd ("j",0),"cmd_scrollLineDown");
    define_key(top_kmap, kbd ("H",0),"cmd_scrollLeft");
    define_key(top_kmap, kbd ("L",0),"cmd_scrollRight");
    define_key(top_kmap, kbd ("0",0),"cmd_scrollBeginLine");
    define_key(top_kmap, kbd ("^",0),"cmd_scrollBeginLine");
    define_key(top_kmap, kbd ("$",0),"cmd_scrollEndLine");
    define_key(top_kmap, kbd ("g",0),"cmd_scrollTop");
    define_key(top_kmap, kbd ("G",0),"cmd_scrollBottom");


	// useful in caret mode
    define_key(top_kmap, kbd ("a",MOD_CTRL),"beginning-of-line");
    define_key(top_kmap, kbd ("e",MOD_CTRL),"end-of-line");
    define_key(top_kmap, kbd ("b",MOD_META),"cmd_wordPrevious");
    define_key(top_kmap, kbd ("f",MOD_META),"cmd_wordNext");

    define_key(top_kmap, kbd (KeyEvent.DOM_VK_PAGE_UP, MOD_SHIFT),"cmd_selectPageUp");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_PAGE_DOWN, MOD_SHIFT),"cmd_selectPageDown");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DELETE, MOD_SHIFT),"cmd_cut");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DELETE, MOD_CTRL),"cmd_copy");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_INSERT, MOD_CTRL),"cmd_copy");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_HOME, MOD_SHIFT|MOD_CTRL),"cmd_selectTop");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_END, MOD_SHIFT|MOD_CTRL),"cmd_selectBottom");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_LEFT, MOD_CTRL|MOD_SHIFT),"cmd_selectWordPrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_RIGHT, MOD_CTRL|MOD_SHIFT),"cmd_selectWordNext");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_LEFT, MOD_SHIFT),"cmd_selectCharPrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_RIGHT, MOD_SHIFT),"cmd_selectCharNext");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_HOME, MOD_SHIFT),"cmd_selectBeginLine");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_END, MOD_SHIFT),"cmd_selectEndLine");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_UP, MOD_SHIFT),"cmd_selectLinePrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DOWN, MOD_SHIFT),"cmd_selectLineNext");

    define_key(top_kmap, kbd(KeyEvent.DOM_VK_RETURN, MOD_CTRL), "follow-link-in-new-buffer");

    input_kmap.parent = top_kmap;

    // Input area keys - the same as for emacs
    define_key(input_kmap, kbd ("a",MOD_CTRL),"cmd_beginLine");
    define_key(input_kmap, kbd ("e",MOD_CTRL),"cmd_endLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, 0), "cmd_deleteCharBackward");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, MOD_META), "cmd_deleteWordBackward");
    define_key(input_kmap, kbd ("d",MOD_CTRL),"cmd_deleteCharForward");
    define_key(input_kmap, kbd ("d",MOD_META),"cmd_deleteWordForward");
    define_key(input_kmap, kbd ("b",MOD_CTRL),"cmd_charPrevious");
    define_key(input_kmap, kbd ("b",MOD_META),"cmd_wordPrevious");
    define_key(input_kmap, kbd ("f",MOD_CTRL),"cmd_charNext");
    define_key(input_kmap, kbd ("f",MOD_META),"cmd_wordNext");
    define_key(input_kmap, kbd ("y",MOD_CTRL),"cmd_paste");
    define_key(input_kmap, kbd ("w",MOD_META),"cmd_copy");
    define_key(input_kmap, kbd ("k",MOD_CTRL),"cmd_deleteToEndOfLine");

    // 101 keys
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_HOME,MOD_SHIFT), "cmd_selectBeginLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_END,MOD_SHIFT),"cmd_selectEndLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE,MOD_CTRL), "cmd_deleteWordBackward");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT),
	       "cmd_selectWordPrevious");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT), "cmd_selectWordNext");

    // Nasty keys
    define_key(input_kmap, kbd ("r",MOD_CTRL),"cmd_redo");

    // This must be at the end of input_kmap defs so it's matched last.
    define_key(input_kmap, kbd (match_any_unmodified_key), null, true);

    textarea_kmap.parent = input_kmap;

    // textarea keys - the same as for emacs
    define_key(textarea_kmap, kbd ("n",MOD_CTRL),"cmd_lineNext");
    define_key(textarea_kmap, kbd ("p",MOD_CTRL),"cmd_linePrevious");
    define_key(textarea_kmap, kbd ("<",MOD_META),"cmd_moveTop");
    define_key(textarea_kmap, kbd (">",MOD_META),"cmd_moveBottom");
    define_key(textarea_kmap, kbd ("v",MOD_META),"cmd_movePageUp");
    define_key(textarea_kmap, kbd ("v",MOD_CTRL),"cmd_movePageDown");

    // 101 keys
    define_key (textarea_kmap, kbd (KeyEvent.DOM_VK_PAGE_UP,MOD_SHIFT), "cmd_selectPageUp");
    define_key (textarea_kmap, kbd (KeyEvent.DOM_VK_PAGE_DOWN,MOD_SHIFT), "cmd_selectPageDown");

    // Nasty keys
    // define_key(textarea_kmap, kbd ("r",MOD_CTRL),"cmd_redo");

    init_minibuffer_keys ();

    init_numberedlinks_keys ();

    init_isearch_keys ();

    init_frameset_keys ();

    init_universal_arg_keys ();
}


function initKmaps()
{
    clearKmaps();

    abort_key = kbd ("g",MOD_CTRL);

    define_key(help_kmap, kbd ("b",0),"describe-bindings");
    define_key(help_kmap, kbd ("i",0),"help-page");
    define_key(help_kmap, kbd ("t",0),"help-with-tutorial");
    define_key(top_kmap, kbd ("\\",0),"view-source");

    define_key(ctrlx_kmap, kbd ("b",0),"switch-to-buffer"); 
    define_key(ctrlx_kmap, kbd ("k",0),"kill-buffer"); 
    define_key(ctrlx_kmap, kbd ("f",MOD_CTRL),"find-url"); 
    define_key(ctrlx_kmap, kbd ("c",MOD_CTRL),"quit"); 
//     define_key(ctrlx_kmap, kbd ("1",0),"delete-other-windows"); 
//     define_key(ctrlx_kmap, kbd ("0",0),"delete-window"); 
//     define_key(ctrlx_kmap, kbd ("2",0),"split-window"); 
//     define_key(ctrlx_kmap, kbd ("o",0),"other-window"); 
    define_key(ctrlx_kmap, kbd ("v",MOD_CTRL),"find-alternate-url"); 
    define_key(ctrlx_kmap, kbd ("x",MOD_CTRL),"exchange-point-and-mark"); 
    define_key(ctrlx_kmap, kbd ("h",0),"cmd_selectAll");
    define_key(ctrlx_kmap, kbd ("b",MOD_CTRL),"list-buffers"); 
    define_key(ctrlx_kmap, kbd ("s",MOD_CTRL),"save-page");
    
    define_key(five_kmap, kbd ("f",MOD_CTRL),"find-url-other-frame"); 
    define_key(five_kmap, kbd ("0",0),"delete-frame");
    define_key(five_kmap, kbd ("2",0),"make-frame-command");

    define_key(ctrlx_kmap, kbd ("4",0), four_kmap); 
    define_key(ctrlx_kmap, kbd ("5",0), five_kmap); 

    define_key(top_kmap, kbd ("h",MOD_CTRL), help_kmap);
    define_key(top_kmap, kbd ("x",MOD_CTRL), ctrlx_kmap);
    define_key(top_kmap, kbd ("c",MOD_CTRL), ctrlc_kmap); 
    define_key(top_kmap, kbd ("f",0),        frameset_kmap);

    define_key(top_kmap, kbd ("u",0),"go-up");
    define_key(top_kmap, kbd ("u", MOD_CTRL), "universal-argument");
    define_key(top_kmap, kbd (" ",MOD_META),"yank-to-clipboard");
    define_key(top_kmap, kbd ("g",0),"open-url");
    define_key(top_kmap, kbd ("l",MOD_META),"toggle-numbered-links");
    define_key(top_kmap, kbd ("l",MOD_CTRL | MOD_META),"toggle-numbered-images");
    define_key(top_kmap, kbd ("l",0),"go-back");
    define_key(top_kmap, kbd ("s",MOD_CTRL),"isearch-forward");
    define_key(top_kmap, kbd ("r",MOD_CTRL),"isearch-backward");
    define_key(top_kmap, kbd ("B",0),"go-back");
    define_key(top_kmap, kbd ("F",0),"go-forward");
    define_key(top_kmap, kbd ("R",0),"revert-buffer");
    define_key(top_kmap, kbd ("1",0),"numberedlinks-1");
    define_key(top_kmap, kbd ("2",0),"numberedlinks-2");
    define_key(top_kmap, kbd ("3",0),"numberedlinks-3");
    define_key(top_kmap, kbd ("4",0),"numberedlinks-4");
    define_key(top_kmap, kbd ("5",0),"numberedlinks-5");
    define_key(top_kmap, kbd ("6",0),"numberedlinks-6");
    define_key(top_kmap, kbd ("7",0),"numberedlinks-7");
    define_key(top_kmap, kbd ("8",0),"numberedlinks-8");
    define_key(top_kmap, kbd ("9",0),"numberedlinks-9");
    define_key(top_kmap, kbd ("n",0),"goto-numbered-link");
    define_key(top_kmap, kbd ("i",0),"copy-numbered-image-location");
    define_key(top_kmap, kbd ("p",MOD_META),"buffer-previous");
    define_key(top_kmap, kbd ("n",MOD_META),"buffer-next");
    define_key(top_kmap, kbd ("c",0),"copy-current-url");
    define_key(top_kmap, kbd ("C",0),"copy-link-location");
    define_key(top_kmap, kbd ("x",MOD_META),"execute-extended-command");
    define_key(top_kmap, kbd ("g",MOD_CTRL),"keyboard-quit");
    define_key(top_kmap, kbd ( KeyEvent.DOM_VK_ESCAPE, 0),"unfocus");
    define_key(top_kmap, kbd ( "=", 0),"text-reset");
    define_key(top_kmap, kbd ( "+", 0),"text-enlarge");
    define_key(top_kmap, kbd ( "-", 0),"text-reduce");

    // movement keys
    define_key(top_kmap, kbd ( KeyEvent.DOM_VK_BACK_SPACE, 0),"cmd_scrollPageUp");
    define_key(top_kmap, kbd (" ",0),"cmd_scrollPageDown");
    define_key(top_kmap, kbd (" ",MOD_CTRL),"set-mark-command");
    define_key(top_kmap, kbd ("v",MOD_META),"cmd_scrollPageUp");
    define_key(top_kmap, kbd ("v",MOD_CTRL),"cmd_scrollPageDown");
    define_key(top_kmap, kbd ("p",MOD_CTRL),"cmd_scrollLineUp");
    define_key(top_kmap, kbd ("n",MOD_CTRL),"cmd_scrollLineDown");
    define_key(top_kmap, kbd ("b",MOD_CTRL),"cmd_scrollLeft");
    define_key(top_kmap, kbd ("f",MOD_CTRL),"cmd_scrollRight");
    define_key(top_kmap, kbd ("a",MOD_CTRL),"beginning-of-line");
    define_key(top_kmap, kbd ("e",MOD_CTRL),"end-of-line");
    define_key(top_kmap, kbd ("<",MOD_META),"cmd_scrollTop");
    define_key(top_kmap, kbd (">",MOD_META),"cmd_scrollBottom");
    define_key(top_kmap, kbd ("_",MOD_CTRL),"cmd_undo");
    define_key(top_kmap, kbd ("y",MOD_CTRL),"cmd_paste");

    define_key(top_kmap, kbd ("b",MOD_META),"cmd_wordPrevious");
    define_key(top_kmap, kbd ("f",MOD_META),"cmd_wordNext");

    define_key(top_kmap, kbd (":",MOD_META),"eval-expression");

    define_key(top_kmap, kbd ("w",MOD_META),"cmd_copy");
    define_key(top_kmap, kbd ("w",MOD_CTRL),"cmd_cut");

    define_key(top_kmap, kbd (KeyEvent.DOM_VK_PAGE_UP, MOD_SHIFT),"cmd_selectPageUp");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_PAGE_DOWN, MOD_SHIFT),"cmd_selectPageDown");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DELETE, MOD_SHIFT),"cmd_cut");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DELETE, MOD_CTRL),"cmd_copy");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_INSERT, MOD_CTRL),"cmd_copy");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_HOME, MOD_SHIFT|MOD_CTRL),"cmd_selectTop");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_END, MOD_SHIFT|MOD_CTRL),"cmd_selectBottom");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_LEFT, MOD_CTRL|MOD_SHIFT),"cmd_selectWordPrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_RIGHT, MOD_CTRL|MOD_SHIFT),"cmd_selectWordNext");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_LEFT, MOD_SHIFT),"cmd_selectCharPrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_RIGHT, MOD_SHIFT),"cmd_selectCharNext");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_HOME, MOD_SHIFT),"cmd_selectBeginLine");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_END, MOD_SHIFT),"cmd_selectEndLine");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_UP, MOD_SHIFT),"cmd_selectLinePrevious");
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_DOWN, MOD_SHIFT),"cmd_selectLineNext");

    define_key(top_kmap, kbd(KeyEvent.DOM_VK_RETURN, MOD_CTRL), "follow-link-in-new-buffer");

    // Input area keys
    define_key(input_kmap, kbd ("a",MOD_CTRL),"cmd_beginLine");
    define_key(input_kmap, kbd ("e",MOD_CTRL),"cmd_endLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, 0), "cmd_deleteCharBackward");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, MOD_META), "cmd_deleteWordBackward");
    define_key(input_kmap, kbd ("d",MOD_CTRL),"cmd_deleteCharForward");
    define_key(input_kmap, kbd ("d",MOD_META),"cmd_deleteWordForward");
    define_key(input_kmap, kbd ("b",MOD_CTRL),"cmd_charPrevious");
    define_key(input_kmap, kbd ("b",MOD_META),"cmd_wordPrevious");
    define_key(input_kmap, kbd ("f",MOD_CTRL),"cmd_charNext");
    define_key(input_kmap, kbd ("f",MOD_META),"cmd_wordNext");
    define_key(input_kmap, kbd ("y",MOD_CTRL),"cmd_paste");
    define_key(input_kmap, kbd ("w",MOD_META),"cmd_copy");
    define_key(input_kmap, kbd ("k",MOD_CTRL),"cmd_deleteToEndOfLine");

    // 101 keys
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_HOME,MOD_SHIFT), "cmd_selectBeginLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_END,MOD_SHIFT),"cmd_selectEndLine");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE,MOD_CTRL), "cmd_deleteWordBackward");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT),
	       "cmd_selectWordPrevious");
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT), "cmd_selectWordNext");

    // Nasty keys
    define_key(input_kmap, kbd ("r",MOD_CTRL),"cmd_redo");

    // This must be at the end of input_kmap defs so it's matched last.
    define_key(input_kmap, kbd (match_any_unmodified_key), null, true);

    textarea_kmap.parent = input_kmap;

    // textarea keys
    define_key(textarea_kmap, kbd ("n",MOD_CTRL),"cmd_lineNext");
    define_key(textarea_kmap, kbd ("p",MOD_CTRL),"cmd_linePrevious");
    define_key(textarea_kmap, kbd ("<",MOD_META),"cmd_moveTop");
    define_key(textarea_kmap, kbd (">",MOD_META),"cmd_moveBottom");
    define_key(textarea_kmap, kbd ("v",MOD_META),"cmd_movePageUp");
    define_key(textarea_kmap, kbd ("v",MOD_CTRL),"cmd_movePageDown");
    define_key(textarea_kmap, kbd (" ",MOD_META),"yank-to-clipboard");

    // 101 keys
    define_key (textarea_kmap, kbd (KeyEvent.DOM_VK_PAGE_UP,MOD_SHIFT), "cmd_selectPageUp");
    define_key (textarea_kmap, kbd (KeyEvent.DOM_VK_PAGE_DOWN,MOD_SHIFT), "cmd_selectPageDown");




    init_minibuffer_keys ();

    init_numberedlinks_keys ();

    init_isearch_keys ();

    init_frameset_keys ();

    init_universal_arg_keys ();
}


function init_minibuffer_keys () {
    // minibuffer bindings
    //
    define_key (minibuffer_kmap, kbd  (KeyEvent.DOM_VK_RETURN,0), "exit-minibuffer");
    define_key (minibuffer_kmap, kbd  ("p",MOD_META), "minibuffer-history-previous");
    define_key (minibuffer_kmap, kbd  ("n",MOD_META), "minibuffer-history-next");
    define_key (minibuffer_kmap, kbd  (KeyEvent.DOM_VK_ESCAPE, 0), "minibuffer-abort");
    define_key (minibuffer_kmap, kbd  ("g",MOD_CTRL), "minibuffer-abort");
    define_key (minibuffer_kmap, kbd  (KeyEvent.DOM_VK_TAB, 0), "minibuffer-complete");
    define_key (minibuffer_kmap, kbd  (KeyEvent.DOM_VK_TAB, MOD_SHIFT), "minibuffer-complete-reverse");
    define_key (minibuffer_kmap, kbd  (" ", 0), "minibuffer-accept-match");

    // Because we programmatically modify the selection during minibuffer
    // completion, certain keys need to be handled specially, notably
    // backspace.  This is currently done by setting a flag in
    // minibuffer-backspace, and a course of action being taken based on this
    // flag in the handler for the textbox's oninput.  Using a flag is a
    // rather rigid system, so maybe we can come up with something more
    // flexable, involving, say, functions that carry out the desired
    // behavior.
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, 0), "minibuffer-backspace");

    minibuffer_kmap.parent = input_kmap;
}


function init_numberedlinks_keys () {
    // numbered links bindings
    //
    define_key (numberedlinks_kmap, kbd (KeyEvent.DOM_VK_RETURN,MOD_META), "numberedlinks-focus");
    define_key (numberedlinks_kmap, kbd (KeyEvent.DOM_VK_RETURN,0), "numberedlinks-follow");
    define_key (numberedlinks_kmap, kbd (KeyEvent.DOM_VK_RETURN,MOD_CTRL), "numberedlinks-follow-other-buffer");
    define_key (numberedlinks_kmap, kbd (KeyEvent.DOM_VK_RETURN,MOD_CTRL + MOD_META),"numberedlinks-follow-other-frame");
    define_key (numberedlinks_kmap, kbd ("v",MOD_CTRL), "numberedlinks-save");
    // we also want to consume TAB but ignore it.  there should be a general command for this.
    numberedlinks_kmap.parent = minibuffer_kmap;
}


function init_isearch_keys () {
    // isearch bindings
    //
    define_key (isearch_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE,0), "isearch-backspace");
    define_key (isearch_kmap, kbd ("r", MOD_CTRL), "isearch-backward");
    define_key (isearch_kmap, kbd ("s", MOD_CTRL), "isearch-forward");
    define_key (isearch_kmap, kbd ("g", MOD_CTRL), "isearch-abort");
    define_key (isearch_kmap, kbd (KeyEvent.DOM_VK_ESCAPE, 0), "isearch-abort");
    define_key (isearch_kmap, kbd (match_any_unmodified_key), "isearch-add-character");
    define_key (isearch_kmap, kbd (match_any_key), "isearch-done");
}


function init_frameset_keys () {
    define_key(frameset_kmap, kbd ("f",0),"next-frameset-frame");
    define_key(frameset_kmap, kbd ("i",0),"next-iframe");
    define_key(frameset_kmap, kbd (KeyEvent.DOM_VK_RETURN,0), "open-frameset-frame-in-current-buffer");
    define_key(frameset_kmap, kbd (KeyEvent.DOM_VK_RETURN,MOD_CTRL), "open-frameset-frame-in-new-buffer");
    define_key(frameset_kmap, kbd (KeyEvent.DOM_VK_RETURN,MOD_CTRL | MOD_META), "open-frameset-frame-in-new-frame");
    define_key(frameset_kmap, kbd ("c",0), "copy-frameset-frame-location");
    define_key(frameset_kmap, kbd ("t", 0), "frameset-focus-top");
}


function init_universal_arg_keys ()
{
    define_key(universal_kmap, kbd ("u", MOD_CTRL), "universal-argument-more");
    define_key(universal_kmap, kbd ("1", 0), "universal-digit");
    define_key(universal_kmap, kbd ("2", 0), "universal-digit");
    define_key(universal_kmap, kbd ("3", 0), "universal-digit");
    define_key(universal_kmap, kbd ("4", 0), "universal-digit");
    define_key(universal_kmap, kbd ("5", 0), "universal-digit");
    define_key(universal_kmap, kbd ("6", 0), "universal-digit");
    define_key(universal_kmap, kbd ("7", 0), "universal-digit");
    define_key(universal_kmap, kbd ("8", 0), "universal-digit");
    define_key(universal_kmap, kbd ("9", 0), "universal-digit");
    define_key(universal_kmap, kbd ("0", 0), "universal-digit");
    define_key(universal_kmap, kbd ("-", 0), "universal-negate");
}

/* FIXME: All of this genBindings stuff should operate on a particular
   buffer, rather than the current selected buffer. */
function genBindingsHelper(window, doc, kmap, prefix)
{
    try {
    for (var i=0; i<kmap.length; i++) {
        //fallthrough keys are used by context-maps like input-kmap to ensure
        //that ordinary, unmodified characters will go to the input widget
        //instead of top_kmap.  Therefore we don't display these keys in the
        //help screen.
        //
        if (kmap[i].fallthrough) continue;
        if (kmap[i].key.match_function) continue;
	var command = kmap[i].command || "Prefix Command";;
	var key;
	if (kmap[i].key.charCode)
	    key = window.formatKey(kmap[i].key.charCode, kmap[i].key.modifiers);
	else
	    key = window.formatMods(kmap[i].key.modifiers) + keyTable[kmap[i].key.keyCode];

	doc.write("<TR><TD>")
	    doc.write(prefix.join(" ") + " " + key);
	doc.write("</TD><TD>")
	    doc.write(command);
	doc.write("</TD></TR>");

	if (kmap[i].keymap) {
	    var p = [];
	    for (var j in prefix) p[j] = prefix[j];
	    p.push(window.formatKey(kmap[i].key.charCode, kmap[i].key.modifiers));
	    genBindingsHelper(window, doc, kmap[i].keymap, p);
	}
    }
    } catch(e) {window.alert(e);}
}

function genAllBindings(window, kmap)
{
  genBindings(window, top_kmap, "Top Level");
  genBindings(window, input_kmap, "Text Box");
  genBindings(window, textarea_kmap, "Text Area");
}

function genBindings(window, kmap, name)
{
    try {
	var doc = window.content.document;

	doc.write("<h1>" + name + " Key bindings</h1><p>");
	doc.write("<table border='1'>");
	doc.write("<tr><th>Key<th>Binding");
	genBindingsHelper(window, doc, kmap, []);
	doc.write("</table></p>");
    } catch(e) {window.alert(e);}
}

//// ESCAPE bindings

function add_escape_bindings()
{
    define_key(top_kmap, kbd (KeyEvent.DOM_VK_ESCAPE, 0), top_esc_kmap);
    define_key(input_kmap, kbd (KeyEvent.DOM_VK_ESCAPE, 0), input_esc_kmap);
    define_key(textarea_kmap, kbd (KeyEvent.DOM_VK_ESCAPE, 0), textarea_esc_kmap);

    // Top
    define_key(top_esc_kmap, kbd (" ",0),"yank-to-clipboard");
    define_key(top_esc_kmap, kbd ("l",0),"toggle-numbered-links");
    define_key(top_esc_kmap, kbd ("p",0),"buffer-previous");
    define_key(top_esc_kmap, kbd ("n",0),"buffer-next");
    define_key(top_esc_kmap, kbd ("x",0),"execute-extended-command");
    define_key(top_esc_kmap, kbd ("v",0),"cmd_scrollPageUp");
    define_key(top_esc_kmap, kbd ("<",0),"cmd_scrollTop");
    define_key(top_esc_kmap, kbd (">",0),"cmd_scrollBottom");
    define_key(top_esc_kmap, kbd ("v",0),"cmd_movePageUp");
    define_key(top_esc_kmap, kbd ("b",0),"cmd_wordPrevious");
    define_key(top_esc_kmap, kbd ("f",0),"cmd_wordNext");

    // Input
    define_key(input_esc_kmap, kbd (KeyEvent.DOM_VK_BACK_SPACE, 0), "cmd_deleteWordBackward");
    define_key(input_esc_kmap, kbd ("d",0),"cmd_deleteWordForward");
    define_key(input_esc_kmap, kbd ("b",0),"cmd_wordPrevious");
    define_key(input_esc_kmap, kbd ("f",0),"cmd_wordNext");
    define_key(input_esc_kmap, kbd ("w",0),"cmd_copy");

    textarea_esc_kmap.parent = input_esc_kmap;

    // Textarea
    // define_key(textarea_esc_kmap, kbd ("d",0),"cmd_deleteWordForward");
    // define_key(textarea_esc_kmap, kbd ("b",0),"cmd_wordPrevious");
    // define_key(textarea_esc_kmap, kbd ("f",0),"cmd_wordNext");
    // define_key(textarea_esc_kmap, kbd ("w",0),"cmd_copy");
    define_key(textarea_esc_kmap, kbd ("<",0),"cmd_moveTop");
    define_key(textarea_esc_kmap, kbd (">",0),"cmd_moveBottom");
    define_key(textarea_esc_kmap, kbd ("v",0),"cmd_movePageUp");
}


initKmaps();

