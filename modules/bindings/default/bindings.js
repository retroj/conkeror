/**
 * (C) Copyright 2007-2008 Jeremy Maitin-Shepard
 * (C) Copyright 2009-2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

/*
 * define keymaps
 */

define_keymap("sequence_help_keymap");
define_keymap("sequence_abort_keymap");

define_keymap("default_base_keymap");

define_keymap("default_help_keymap");

define_keymap("default_global_keymap", $parent = default_base_keymap);

define_keymap("text_keymap");
define_keymap("formfill_keymap");

define_keymap("content_buffer_normal_keymap");
define_keymap("content_buffer_form_keymap", $display_name = "form");
define_keymap("content_buffer_anchor_keymap", $display_name = "anchor");
define_keymap("content_buffer_button_keymap", $display_name = "button");
define_keymap("content_buffer_checkbox_keymap", $display_name = "checkbox", $notify);
define_keymap("content_buffer_select_keymap", $display_name = "select", $notify);
define_keymap("content_buffer_text_keymap", $display_name = "text", $notify,
              $parent = text_keymap);
define_keymap("content_buffer_textarea_keymap", $display_name = "textarea", $notify,
              $parent = content_buffer_text_keymap);
define_keymap("content_buffer_richedit_keymap", $display_name = "richedit", $notify,
              $parent = content_buffer_textarea_keymap);
define_keymap("content_buffer_embed_keymap", $display_name = "embed", $notify);

define_keymap("special_buffer_keymap");
define_keymap("download_buffer_keymap", $parent = special_buffer_keymap);
define_keymap("help_buffer_keymap", $parent = special_buffer_keymap);

define_keymap("minibuffer_base_keymap", $parent = text_keymap);
define_keymap("minibuffer_keymap", $parent = minibuffer_base_keymap);
define_keymap("minibuffer_space_completion_keymap");
define_keymap("hint_keymap", $parent = text_keymap);
define_keymap("hint_quote_next_keymap");
define_keymap("isearch_keymap");

define_keymap("single_character_options_minibuffer_keymap");
define_keymap("minibuffer_message_keymap");
define_keymap("read_buffer_keymap", $parent = minibuffer_keymap);


define_keymap("caret_keymap");

define_keymap("quote_next_keymap", $notify);
define_keymap("quote_keymap", $notify);


/*
 * load bindings
 */

load("basic-commands.js");

load("global.js");
load("text.js");
load("formfill.js");

load("content-buffer/normal.js");
load("content-buffer/anchor.js");
load("content-buffer/form.js");
load("content-buffer/text.js");
load("content-buffer/checkbox.js");
load("content-buffer/textarea.js");
load("content-buffer/richedit.js");
load("content-buffer/select.js");
load("content-buffer/button.js");
load("content-buffer/embed.js");

load("minibuffer.js");
load("hints.js");
load("isearch.js");
load("universal-argument.js");

load("content-buffer/element.js");
load("content-buffer/zoom.js");

load("special-buffer.js");
load("help-buffer.js");
load("download-buffer.js");

load("caret.js");
load("quote.js");


provide("bindings");
