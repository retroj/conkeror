
var keyTable = [];
var KeyEvent = Components.interfaces.nsIDOMKeyEvent;
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

var context_kmaps = [];
var top_kmap = null;
var abort_key = null;

const MOD_CTRL = 0x1;
const MOD_META = 0x2;
const MOD_SHIFT = 0x4;

// Key Matching Functions.  These are functions that may be passed to kbd
// in place of key code or char code.  They take an event object as their
// argument and turn true if the event matches the class of keys that they
// represent.
//
function match_any_key (event)
{
    return true;
}

function metaPressed (event)
{
    return event.altKey || event.metaKey;
}

function getMods(event)
{
    // Take the shift key into account when building the charCode, so it can
    // be said that the shift key has already been processed.  Don't include
    // it in the mods if charCode exists in the event.
    return (event.ctrlKey ? MOD_CTRL:0) |
	(metaPressed(event) ? MOD_META:0) |
	((event.shiftKey && !event.charCode) ? MOD_SHIFT: 0);
}

function keyMatch(key, event)
{
    return (((key.charCode && event.charCode == key.charCode) ||
             (key.keyCode && event.keyCode == key.keyCode)) &&
            getMods(event) == key.modifiers) ||
        (key.match_function && key.match_function (event));
}

function getKeyBinding(kmap, event)
{
    for (var i=0; i<kmap.length; i++) {
	if (keyMatch(kmap[i].key, event)) {
	    return kmap[i];
	}
    }
    if (kmap.parent)
    {
        return getKeyBinding (kmap.parent, event);
    }
    return null;
}

function match_any_unmodified_key (event)
{
    try {
        return event.charCode &&
            !metaPressed(event) &&
            !event.ctrlKey;
    } catch (e) { return false; }
}

function kbd (keyCode, mods)
{
    var key = {};
    if (typeof keyCode == "function")
        key.match_function = keyCode;
    else if (typeof keyCode == "string")
	key.charCode = keyCode.charCodeAt(0);
    else
	key.keyCode = keyCode;

    if (mods)
        key.modifiers = mods;
    else
        key.modifiers = 0;

    return key;
}

// bind key to either the keymap or command in the keymap, kmap
function define_key (kmap, key, cmd, fallthrough)
{
    for (var i = 0; i < kmap.length; i++) {
        if ((((kmap[i].key.charCode && key.charCode &&
               kmap[i].key.charCode == key.charCode) ||
              (kmap[i].key.keyCode && key.keyCode &&
               kmap[i].key.keyCode == key.keyCode)) &&
             kmap[i].key.modifiers == key.modifiers) ||
            (kmap[i].key.match_function && key.match_function &&
             kmap[i].key.match_function == key.match_function)) {
            if (typeof cmd == "string" ||
                typeof cmd == "function")
            {
                kmap[i].command = cmd;
                kmap[i].keymap = null;
            } else {
                kmap[i].command = null;
                kmap[i].keymap = cmd;
            }
            kmap[i].fallthrough = fallthrough;
            return;
        }
    }
    var obj = {key: key,
               fallthrough: fallthrough};
    if (typeof cmd == "string"
	|| typeof cmd == "function")
            obj.command = cmd;
    else 
            obj.keymap = cmd;
    kmap.push(obj);
}

function make_keymap ()
{
    var k = [];
    k.parent = null;
    return k;
}

function make_context_keymap (predicate)
{
    var k = make_keymap();
    k.predicate = predicate;
    return k;
}

