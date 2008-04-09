require("content-buffer.js");
require("bindings/default/content-buffer/normal.js");

define_keymap("gmail_keymap", $parent = content_buffer_normal_keymap);

function gmail_label_go(buffer, label)
{
    buffer.window.content.location.hash = "#label/" + encodeURIComponent(label);
}
interactive("gmail-label-go",
            "Go to a GMail label.",
            function(I) {
              gmail_label_go(I.buffer, (yield I.minibuffer.read($prompt = "Go to label: ")));
            });

// Jumping
define_key(gmail_keymap, "C-c g", "gmail-label-go");

// Threadlist
define_key(gmail_keymap, "*", null, $fallthrough);

// Navigation
define_key(gmail_keymap, "u", null, $fallthrough);
define_key(gmail_keymap, "j", null, $fallthrough);
define_key(gmail_keymap, "k", null, $fallthrough);
define_key(gmail_keymap, "o", null, $fallthrough);
define_key(gmail_keymap, "n", null, $fallthrough);
define_key(gmail_keymap, "p", null, $fallthrough);

// Application
define_key(gmail_keymap, "c", null, $fallthrough);
define_key(gmail_keymap, "C-c c", "copy");
define_key(gmail_keymap, "/", null, $fallthrough);
define_key(gmail_keymap, "q", null, $fallthrough);
define_key(gmail_keymap, "?", null, $fallthrough);

// Actions
define_key(gmail_keymap, "x", null, $fallthrough);
define_key(gmail_keymap, "C-c x", "shell-command-on-file");
define_key(gmail_keymap, "s", null, $fallthrough);
define_key(gmail_keymap, "C-c s", "save");
define_key(gmail_keymap, "y", null, $fallthrough);
define_key(gmail_keymap, "e", null, $fallthrough);
define_key(gmail_keymap, "m", null, $fallthrough);
define_key(gmail_keymap, "!", null, $fallthrough);
define_key(gmail_keymap, "#", null, $fallthrough);
define_key(gmail_keymap, "r", null, $fallthrough);
define_key(gmail_keymap, "C-c r", "reload");
define_key(gmail_keymap, "f", null, $fallthrough);
define_key(gmail_keymap, "C-c f", "follow");
define_key(gmail_keymap, "S-n", null, $fallthrough);
define_key(gmail_keymap, ".", null, $fallthrough);
define_key(gmail_keymap, "S-i", null, $fallthrough);
define_key(gmail_keymap, "S-u", null, $fallthrough);


define_page_mode("gmail_mode", "GMail", $enable = function (buffer) {
    buffer.local_variables.content_buffer_normal_keymap = gmail_keymap;
});

auto_mode_list.push([/^https?:\/\/mail\.google\.com\//, gmail_mode]);
