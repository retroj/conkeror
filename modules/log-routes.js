/**
 * (C) Copyright 2010 John J. Foerch
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
**/

log_routes.interactive_error = function (text, context) {
    context.window.minibuffer.message(text);
};

log_routes.ui_status = function (text, context) {
    context.window.minibuffer.message(text);
};

log_routes.user_message = function (text, context) {
    context.window.minibuffer.message(text);
};
