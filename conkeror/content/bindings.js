// -*- mode: java -*-

var keyTable = [];
keyTable[KeyEvent.DOM_VK_CANCEL] = "cancel";
keyTable[KeyEvent.DOM_VK_HELP] = "help";
keyTable[KeyEvent.DOM_VK_BACK_SPACE] = "back_space";
keyTable[KeyEvent.DOM_VK_TAB] = "tab";
keyTable[KeyEvent.DOM_VK_CLEAR] = "clear";
keyTable[KeyEvent.DOM_VK_RETURN] = "return";
keyTable[KeyEvent.DOM_VK_ENTER] = "enter";
keyTable[KeyEvent.DOM_VK_SHIFT] = "shift";
keyTable[KeyEvent.DOM_VK_CONTROL] = "control";
keyTable[KeyEvent.DOM_VK_ALT] = "alt";
keyTable[KeyEvent.DOM_VK_PAUSE] = "pause";
keyTable[KeyEvent.DOM_VK_CAPS_LOCK] = "caps_lock";
keyTable[KeyEvent.DOM_VK_ESCAPE] = "escape";
keyTable[KeyEvent.DOM_VK_SPACE] = "space";
keyTable[KeyEvent.DOM_VK_PAGE_UP] = "page_up";
keyTable[KeyEvent.DOM_VK_PAGE_DOWN] = "page_down";
keyTable[KeyEvent.DOM_VK_END] = "end";
keyTable[KeyEvent.DOM_VK_HOME] = "home";
keyTable[KeyEvent.DOM_VK_LEFT] = "left";
keyTable[KeyEvent.DOM_VK_UP] = "up";
keyTable[KeyEvent.DOM_VK_RIGHT] = "right";
keyTable[KeyEvent.DOM_VK_DOWN] = "down";
keyTable[KeyEvent.DOM_VK_PRINTSCREEN] = "printscreen";
keyTable[KeyEvent.DOM_VK_INSERT] = "insert";
keyTable[KeyEvent.DOM_VK_DELETE] = "delete";

  // DOM_VK_0 - DOM_VK_9 match their ascii values
keyTable[KeyEvent.DOM_VK_0] = "0";
keyTable[KeyEvent.DOM_VK_1] = "1";
keyTable[KeyEvent.DOM_VK_2] = "2";
keyTable[KeyEvent.DOM_VK_3] = "3";
keyTable[KeyEvent.DOM_VK_4] = "4";
keyTable[KeyEvent.DOM_VK_5] = "5";
keyTable[KeyEvent.DOM_VK_6] = "6";
keyTable[KeyEvent.DOM_VK_7] = "7";
keyTable[KeyEvent.DOM_VK_8] = "8";
keyTable[KeyEvent.DOM_VK_9] = "9";

keyTable[KeyEvent.DOM_VK_SEMICOLON] = "semicolon";
keyTable[KeyEvent.DOM_VK_EQUALS] = "equals";

keyTable[KeyEvent.DOM_VK_A] = "a";
keyTable[KeyEvent.DOM_VK_B] = "b";
keyTable[KeyEvent.DOM_VK_C] = "c";
keyTable[KeyEvent.DOM_VK_D] = "d";
keyTable[KeyEvent.DOM_VK_E] = "e";
keyTable[KeyEvent.DOM_VK_F] = "f";
keyTable[KeyEvent.DOM_VK_G] = "g";
keyTable[KeyEvent.DOM_VK_H] = "h";
keyTable[KeyEvent.DOM_VK_I] = "i";
keyTable[KeyEvent.DOM_VK_J] = "j";
keyTable[KeyEvent.DOM_VK_K] = "k";
keyTable[KeyEvent.DOM_VK_L] = "l";
keyTable[KeyEvent.DOM_VK_M] = "m";
keyTable[KeyEvent.DOM_VK_N] = "n";
keyTable[KeyEvent.DOM_VK_O] = "o";
keyTable[KeyEvent.DOM_VK_P] = "p";
keyTable[KeyEvent.DOM_VK_Q] = "q";
keyTable[KeyEvent.DOM_VK_R] = "r";
keyTable[KeyEvent.DOM_VK_S] = "s";
keyTable[KeyEvent.DOM_VK_T] = "t";
keyTable[KeyEvent.DOM_VK_U] = "u";
keyTable[KeyEvent.DOM_VK_V] = "v";
keyTable[KeyEvent.DOM_VK_W] = "w";
keyTable[KeyEvent.DOM_VK_X] = "x";
keyTable[KeyEvent.DOM_VK_Y] = "y";
keyTable[KeyEvent.DOM_VK_Z] = "z";

keyTable[KeyEvent.DOM_VK_CONTEXT_MENU] = "context_menu";

keyTable[KeyEvent.DOM_VK_NUMPAD0] = "numpad0";
keyTable[KeyEvent.DOM_VK_NUMPAD1] = "numpad1";
keyTable[KeyEvent.DOM_VK_NUMPAD2] = "numpad2";
keyTable[KeyEvent.DOM_VK_NUMPAD3] = "numpad3";
keyTable[KeyEvent.DOM_VK_NUMPAD4] = "numpad4";
keyTable[KeyEvent.DOM_VK_NUMPAD5] = "numpad5";
keyTable[KeyEvent.DOM_VK_NUMPAD6] = "numpad6";
keyTable[KeyEvent.DOM_VK_NUMPAD7] = "numpad7";
keyTable[KeyEvent.DOM_VK_NUMPAD8] = "numpad8";
keyTable[KeyEvent.DOM_VK_NUMPAD9] = "numpad9";
keyTable[KeyEvent.DOM_VK_MULTIPLY] = "multiply";
keyTable[KeyEvent.DOM_VK_ADD] = "add";
keyTable[KeyEvent.DOM_VK_SEPARATOR] = "separator";
keyTable[KeyEvent.DOM_VK_SUBTRACT] = "subtract";
keyTable[KeyEvent.DOM_VK_DECIMAL] = "decimal";
keyTable[KeyEvent.DOM_VK_DIVIDE] = "divide";
keyTable[KeyEvent.DOM_VK_F1] = "f1";
keyTable[KeyEvent.DOM_VK_F2] = "f2";
keyTable[KeyEvent.DOM_VK_F3] = "f3";
keyTable[KeyEvent.DOM_VK_F4] = "f4";
keyTable[KeyEvent.DOM_VK_F5] = "f5";
keyTable[KeyEvent.DOM_VK_F6] = "f6";
keyTable[KeyEvent.DOM_VK_F7] = "f7";
keyTable[KeyEvent.DOM_VK_F8] = "f8";
keyTable[KeyEvent.DOM_VK_F9] = "f9";
keyTable[KeyEvent.DOM_VK_F10] = "f10";
keyTable[KeyEvent.DOM_VK_F11] = "f11";
keyTable[KeyEvent.DOM_VK_F12] = "f12";
keyTable[KeyEvent.DOM_VK_F13] = "f13";
keyTable[KeyEvent.DOM_VK_F14] = "f14";
keyTable[KeyEvent.DOM_VK_F15] = "f15";
keyTable[KeyEvent.DOM_VK_F16] = "f16";
keyTable[KeyEvent.DOM_VK_F17] = "f17";
keyTable[KeyEvent.DOM_VK_F18] = "f18";
keyTable[KeyEvent.DOM_VK_F19] = "f19";
keyTable[KeyEvent.DOM_VK_F20] = "f20";
keyTable[KeyEvent.DOM_VK_F21] = "f21";
keyTable[KeyEvent.DOM_VK_F22] = "f22";
keyTable[KeyEvent.DOM_VK_F23] = "f23";
keyTable[KeyEvent.DOM_VK_F24] = "f24";
keyTable[KeyEvent.DOM_VK_NUM_LOCK] = "num_lock";
keyTable[KeyEvent.DOM_VK_SCROLL_LOCK] = "scroll_lock";
keyTable[KeyEvent.DOM_VK_COMMA] = "comma";
keyTable[KeyEvent.DOM_VK_PERIOD] = "period";
keyTable[KeyEvent.DOM_VK_SLASH] = "slash";
keyTable[KeyEvent.DOM_VK_BACK_QUOTE] = "back_quote";
keyTable[KeyEvent.DOM_VK_OPEN_BRACKET] = "open_bracket";
keyTable[KeyEvent.DOM_VK_BACK_SLASH] = "back_slash";
keyTable[KeyEvent.DOM_VK_CLOSE_BRACKET] = "close_bracket";
keyTable[KeyEvent.DOM_VK_QUOTE] = "quote";
keyTable[KeyEvent.DOM_VK_META] = "meta";

// some predefined key maps
var 	ctrlc_kmap    = [];
var 	ctrlx_kmap    = [];
var 	bookmark_kmap = [];
var 	four_kmap     = [];
var 	five_kmap     = [];
var 	help_kmap     = [];
var 	top_kmap      = [];
var 	input_kmap    = [];
var 	textarea_kmap = [];
var 	select_kmap   = [];

const MOD_CTRL = 0x1;
const MOD_ALT = 0x2;
const MOD_SHIFT = 0x4;

function make_key(charCode, keyCode, mods)
{
    var key = {};
    if (charCode)
	key.charCode = charCode.charCodeAt(0);
    else
	key.keyCode = keyCode;
    key.modifiers = mods;
    return key;
}

// Sorta dirty, bind key to either the keymap or command in the keymap, kmap
function define_key(kmap, key, keymap, cmd)
{
    var obj = {key: key};
    if (cmd)
	obj.command = cmd;
    else 
	obj.keymap = keymap;
    kmap.push(obj);
}

function initKmaps()
{
    define_key(help_kmap, make_key("b", null, 0), null, "describe-bindings");

    define_key(four_kmap, make_key("b", null, 0), null, "switch-to-buffer-other-window");

    define_key(ctrlx_kmap, make_key("b", null, 0), null, "switch-to-buffer"); 
    define_key(ctrlx_kmap, make_key("k", null, 0), null, "kill-buffer"); 
    define_key(ctrlx_kmap, make_key("f", null, MOD_CTRL), null, "find-url"); 
    define_key(ctrlx_kmap, make_key("c", null, MOD_CTRL), null, "quit"); 
    define_key(ctrlx_kmap, make_key("1", null, 0), null, "delete-other-windows"); 
    define_key(ctrlx_kmap, make_key("0", null, 0), null, "delete-window"); 
    define_key(ctrlx_kmap, make_key("2", null, 0), null, "split-window"); 
    define_key(ctrlx_kmap, make_key("o", null, 0), null, "other-window"); 
    define_key(ctrlx_kmap, make_key("v", null,MOD_CTRL), null, "open-url"); 
    define_key(ctrlx_kmap, make_key("x", null,MOD_CTRL), null, "exchange-point-and-mark"); 
    
    define_key(five_kmap, make_key("f", null, MOD_CTRL), null, "find-url-other-frame"); 
    define_key(five_kmap, make_key("0", null, 0), null, "delete-frame");
    define_key(five_kmap, make_key("2", null, 0), null, "make-frame-command");

    
    define_key(bookmark_kmap, make_key("m", null,0), null, "bookmark-current-url"); 
    define_key(bookmark_kmap, make_key("b", null, 0), null, "bookmark-jump"); 
    define_key(bookmark_kmap, make_key("l", null,0), null, "bookmark-bmenu-list"); 

    define_key(ctrlx_kmap, make_key("4", null, 0), four_kmap, null); 
    define_key(ctrlx_kmap, make_key("5", null, 0), five_kmap, null); 
    define_key(ctrlx_kmap, make_key("r", null, 0), bookmark_kmap, null); 

    define_key(top_kmap, make_key("h", null,MOD_CTRL), help_kmap, null);
    define_key(top_kmap, make_key("x", null,MOD_CTRL), ctrlx_kmap, null);
    define_key(top_kmap, make_key("c", null,MOD_CTRL), ctrlc_kmap, null); 

    define_key(top_kmap, make_key("u", null, 0), null, "copy-link-location");
    define_key(top_kmap, make_key(" ", null, MOD_ALT), null, "yank-to-clipboard");
    define_key(top_kmap, make_key("l", null, MOD_CTRL), null, "open-url");
    define_key(top_kmap, make_key("l", null, MOD_ALT), null, "numberedlinks-toggle");
    define_key(top_kmap, make_key("l", null, 0), null, "go-back");
    define_key(top_kmap, make_key("g", null,0), null, "open-url"); 
    define_key(top_kmap, make_key("i", null, 0), null, "view-source");
    define_key(top_kmap, make_key("s", null, MOD_CTRL), null, "isearch-forward");
    define_key(top_kmap, make_key("r", null, MOD_CTRL), null, "isearch-backward");
    define_key(top_kmap, make_key("B", null, MOD_SHIFT), null, "go-back");
    define_key(top_kmap, make_key("F", null, MOD_SHIFT), null, "go-forward");
    define_key(top_kmap, make_key("R", null, MOD_SHIFT), null, "revert-buffer");
    define_key(top_kmap, make_key("f", null, 0), null, "next-frame");
    define_key(top_kmap, make_key("g", null, MOD_CTRL), null, "stop-loading");
    define_key(top_kmap, make_key("1", null, 0), null, "numberedlinks-1");
    define_key(top_kmap, make_key("2", null, 0), null, "numberedlinks-2");
    define_key(top_kmap, make_key("3", null, 0), null, "numberedlinks-3");
    define_key(top_kmap, make_key("4", null, 0), null, "numberedlinks-4");
    define_key(top_kmap, make_key("5", null, 0), null, "numberedlinks-5");
    define_key(top_kmap, make_key("6", null, 0), null, "numberedlinks-6");
    define_key(top_kmap, make_key("7", null, 0), null, "numberedlinks-7");
    define_key(top_kmap, make_key("8", null, 0), null, "numberedlinks-8");
    define_key(top_kmap, make_key("9", null, 0), null, "numberedlinks-9");
    define_key(top_kmap, make_key("p", null, MOD_ALT), null, "buffer-previous");
    define_key(top_kmap, make_key("n", null, MOD_ALT), null, "buffer-next");
    define_key(top_kmap, make_key("c", null, 0), null, "copy-current-url");
    define_key(top_kmap, make_key("x", null, MOD_ALT), null, "execute-extended-command");
    define_key(top_kmap, make_key("g", null, MOD_CTRL), null, "keyboard-quit");
    define_key(top_kmap, make_key("a", null, MOD_CTRL), null, "beginning-of-line");
    define_key(top_kmap, make_key("e", null, MOD_CTRL), null, "end-of-line");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_ESCAPE, 0), null, "unfocus");

    // movement keys
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, 0), null, "cmd_scrollPageUp");
    define_key(top_kmap, make_key(" ", null, 0), null, "cmd_scrollPageDown");
    define_key(top_kmap, make_key(" ", null, MOD_CTRL), null, "set-mark-command");
    define_key(top_kmap, make_key("v", null,MOD_ALT), null, "cmd_scrollPageUp");
    define_key(top_kmap, make_key("v", null,MOD_CTRL), null, "cmd_scrollPageDown");
    define_key(top_kmap, make_key("p", null,MOD_CTRL), null, "cmd_scrollLineUp");
    define_key(top_kmap, make_key("n", null,MOD_CTRL), null, "cmd_scrollLineDown");
    define_key(top_kmap, make_key("b", null,MOD_CTRL), null, "cmd_scrollLeft");
    define_key(top_kmap, make_key("f", null,MOD_CTRL), null, "cmd_scrollRight");
    define_key(top_kmap, make_key("a", null,MOD_CTRL), null, "cmd_scrollBeginLine");
    define_key(top_kmap, make_key("e", null,MOD_CTRL), null, "cmd_scrollEndLine");
    define_key(top_kmap, make_key("<", null, MOD_ALT), null, "cmd_scrollTop");
    define_key(top_kmap, make_key(">", null, MOD_ALT), null, "cmd_scrollBottom");
    define_key(top_kmap, make_key("_", null, MOD_CTRL), null, "cmd_undo");
    define_key(top_kmap, make_key("y", null, MOD_CTRL), null, "cmd_paste");

    define_key(top_kmap, make_key("v", null, MOD_ALT), null, "cmd_movePageUp");
    define_key(top_kmap, make_key("v", null, MOD_CTRL), null, "cmd_movePageDown");
    define_key(top_kmap, make_key("b", null, MOD_ALT), null, "cmd_wordPrevious");
    define_key(top_kmap, make_key("f", null, MOD_ALT), null, "cmd_wordNext");

    define_key(top_kmap, make_key("w", null, 0), null, "cmd_copy");

    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_UP, MOD_SHIFT), null, "cmd_selectPageUp");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_DOWN, MOD_SHIFT), null, "cmd_selectPageDown");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_DELETE, MOD_SHIFT), null, "cmd_cut");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_DELETE, MOD_CTRL), null, "cmd_copy");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_INSERT, MOD_CTRL), null, "cmd_copy");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_HOME, MOD_SHIFT|MOD_CTRL), null, "cmd_selectTop");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_END, MOD_SHIFT|MOD_CTRL), null, "cmd_selectBottom");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_LEFT, MOD_CTRL|MOD_SHIFT), null, "cmd_selectWordPrevious");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT, MOD_CTRL|MOD_SHIFT), null, "cmd_selectWordNext");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_LEFT, MOD_SHIFT), null, "cmd_selectCharPrevious");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT, MOD_SHIFT), null, "cmd_selectCharNext");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_HOME, MOD_SHIFT), null, "cmd_selectBeginLine");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_END, MOD_SHIFT), null, "cmd_selectEndLine");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_UP, MOD_SHIFT), null, "cmd_selectLinePrevious");
    define_key(top_kmap, make_key(null, KeyEvent.DOM_VK_DOWN, MOD_SHIFT), null, "cmd_selectLineNext");

    define_key(top_kmap, make_key("a", null, MOD_ALT), null, "cmd_selectAll");

    // Input area keys
    define_key(input_kmap, make_key("a", null, MOD_CTRL), null, "cmd_beginLine");
    define_key(input_kmap, make_key("e", null, MOD_CTRL), null, "cmd_endLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, 0), 
	       null, "cmd_deleteCharBackward");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, MOD_ALT), 
	       null, "cmd_deleteWordBackward");
    define_key(input_kmap, make_key("d", null, MOD_CTRL), null, "cmd_deleteCharForward");
    define_key(input_kmap, make_key("d", null, MOD_ALT), null, "cmd_deleteWordForward");
    define_key(input_kmap, make_key("b", null, MOD_CTRL), null, "cmd_charPrevious");
    define_key(input_kmap, make_key("b", null, MOD_ALT), null, "cmd_WordPrevious");
    define_key(input_kmap, make_key("f", null, MOD_CTRL), null, "cmd_charNext");
    define_key(input_kmap, make_key("f", null, MOD_ALT), null, "cmd_WordNext");
    define_key(input_kmap, make_key("y", null, MOD_CTRL), null, "cmd_paste");
    define_key(input_kmap, make_key("w", null, MOD_ALT), null, "cmd_copy");
    define_key(input_kmap, make_key("u", null, MOD_CTRL), null, "cmd_deleteToBeginningOfLine");
    define_key(input_kmap, make_key("k", null, MOD_CTRL), null, "cmd_deleteToEndOfLine");

    // 101 keys
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_HOME,MOD_SHIFT), 
	       null, "cmd_selectBeginLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_END,MOD_SHIFT), null, "cmd_selectEndLine");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_BACK,MOD_CTRL), 
	       null, "cmd_deleteWordBackward");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT), 
	       null, "cmd_selectWordPrevious");
    define_key(input_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT),
	       null, "cmd_selectWordNext");

    // Nasty keys
    define_key(input_kmap, make_key("r", null, MOD_CTRL), null, "cmd_redo");
    define_key(input_kmap, make_key("a", null, MOD_ALT), null, "cmd_selectAll");

    // textarea keys
    define_key(textarea_kmap, make_key("a", null, MOD_CTRL), null, "cmd_beginLine");
    define_key(textarea_kmap, make_key("e", null, MOD_CTRL), null, "cmd_endLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, 0), 
	       null, "cmd_deleteCharBackward");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK_SPACE, MOD_ALT), 
	       null, "cmd_deleteWordBackward");
    define_key(textarea_kmap, make_key("d", null, MOD_CTRL), null, "cmd_deleteCharForward");
    define_key(textarea_kmap, make_key("d", null, MOD_ALT), null, "cmd_deleteWordForward");
    define_key(textarea_kmap, make_key("b", null, MOD_CTRL), null, "cmd_charPrevious");
    define_key(textarea_kmap, make_key("b", null, MOD_ALT), null, "cmd_WordPrevious");
    define_key(textarea_kmap, make_key("f", null, MOD_CTRL), null, "cmd_charNext");
    define_key(textarea_kmap, make_key("f", null, MOD_ALT), null, "cmd_WordNext");
    define_key(textarea_kmap, make_key("y", null, MOD_CTRL), null, "cmd_paste");
    define_key(textarea_kmap, make_key("w", null, MOD_ALT), null, "cmd_copy");
    define_key(textarea_kmap, make_key("u", null, MOD_CTRL), null, "cmd_deleteToBeginningOfLine");
    define_key(textarea_kmap, make_key("k", null, MOD_CTRL), null, "cmd_deleteToEndOfLine");
    define_key (textarea_kmap, make_key("n",null,MOD_CTRL), null, "cmd_lineNext");
    define_key (textarea_kmap, make_key("p",null,MOD_CTRL), null, "cmd_linePrevious");
    define_key (textarea_kmap, make_key("<",null,MOD_ALT), null, "cmd_moveTop");
    define_key (textarea_kmap, make_key(">",null,MOD_ALT), null, "cmd_moveBottom");
    define_key (textarea_kmap, make_key("v",null,MOD_ALT), null, "cmd_movePageUp");
    define_key (textarea_kmap, make_key("v",null,MOD_CTRL), null, "cmd_movePageDown");


    // 101 keys
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_HOME,MOD_SHIFT), 
	       null, "cmd_selectBeginLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_END,MOD_SHIFT), 
	       null, "cmd_selectEndLine");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_BACK,MOD_CTRL), 
	       null, "cmd_deleteWordBackward");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_LEFT,MOD_CTRL|MOD_SHIFT), 
	       null, "cmd_selectWordPrevious");
    define_key(textarea_kmap, make_key(null, KeyEvent.DOM_VK_RIGHT,MOD_CTRL|MOD_SHIFT),
	       null, "cmd_selectWordNext");
    define_key (textarea_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_UP,MOD_SHIFT),
		null, "cmd_selectPageUp");
    define_key (textarea_kmap, make_key(null, KeyEvent.DOM_VK_PAGE_DOWN,MOD_SHIFT),
		null, "cmd_selectPageDown");

    // Nasty keys
    define_key(textarea_kmap, make_key("r", null, MOD_CTRL), null, "cmd_redo");
    define_key(textarea_kmap, make_key("a", null, MOD_ALT), null, "cmd_selectAll");


    gCurrentKmap = top_kmap;
}

function genBindingsHelper(doc, kmap, prefix)
{
    try {
    for (var i=0; i<kmap.length; i++) {
	var command = kmap[i].command || "Prefix Command";;
	var key;
	if (kmap[i].key.charCode)
	    key = formatKey(kmap[i].key.charCode, kmap[i].key.modifiers);
	else
	    key = formatMods(kmap[i].key.modifiers) + keyTable[kmap[i].key.keyCode];

	doc.write("<TR><TD>")
	    doc.write(prefix.join(" ") + " " + key);
	doc.write("</TD><TD>")
	    doc.write(command);
	doc.write("</TD></TR>");

	if (kmap[i].keymap) {
	    var p = [];
	    for (var j in prefix) p[j] = prefix[j];
	    p.push(formatKey(kmap[i].key.charCode, kmap[i].key.modifiers));
	    genBindingsHelper(doc, kmap[i].keymap, p);
	}
    }
    } catch(e) {alert(e);}
}

function genAllBindings(kmap)
{
    genBindings(top_kmap, "Top Level");
    genBindings(input_kmap, "Text Box");
    genBindings(textarea_kmap, "Text Area");
}

function genBindings(kmap, name)
{
    try {
	var doc = _content.content.document;

	doc.write("<h1>" + name + " Key bindings</h1><p>");
	doc.write("<table border='1'>");
	doc.write("<tr><th>Key<th>Binding");
	genBindingsHelper(doc, kmap, []);
	doc.write("</table></p>");
    } catch(e) {alert(e);}
}
