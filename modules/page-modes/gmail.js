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

define_key(gmail_keymap, "C-c g", "gmail-label-go");
define_key(gmail_keymap, "j", null, $fallthrough);
define_key(gmail_keymap, "k", null, $fallthrough);
define_key(gmail_keymap, "u", null, $fallthrough);
define_key(gmail_keymap, "n", null, $fallthrough);
define_key(gmail_keymap, "p", null, $fallthrough);
define_key(gmail_keymap, "r", null, $fallthrough);
define_key(gmail_keymap, "C-c r", "reload");
define_key(gmail_keymap, "a", null, $fallthrough);
define_key(gmail_keymap, "?", null, $fallthrough);

define_page_mode("gmail_mode", "GMail", $enable = function (buffer) {
    buffer.local_variables.content_buffer_normal_keymap = gmail_keymap;
});

auto_mode_list.push([/^https?:\/\/mail\.google\.com\//, gmail_mode]);
