

// minibuffer stuff
//
function exit_minibuffer (frame, exit)
{
    //XXX: minibuffer.completions defaults to a 0 element array.  possible bug here.
    var completion_mode_p = (frame.minibuffer.completions != null);
    var match = null;
    var val = frame.removeWhiteSpace (frame.minibuffer.input.value);
    if (completion_mode_p) {
        if (val.length == 0 && frame.minibuffer.default_match != null)
            val = frame.minibuffer.default_match;
        match = frame.findCompleteMatch (frame.minibuffer.completions, val);
    }
    frame.addHistory(val);
    var callback = frame.minibuffer.callback;
    frame.minibuffer.callback = null;
    frame.minibuffer.abort_callback = null;
    frame.minibuffer.exit = exit;
    frame.closeInput(true);
    if (callback) {
        if (completion_mode_p) {
            if (frame.minibuffer.allow_nonmatches) {
                callback.call (frame, match, val);
            } else if (match) {
                callback.call (frame, match);
            }
        } else {
            callback.call (frame, val);
        }
    }
}
interactive("exit-minibuffer", exit_minibuffer, ['current_frame', 'current_command']);


function minibuffer_history_next (frame)
{
    if (frame.minibuffer.history != null) {
        frame.minibuffer.history_index++;
        if (frame.minibuffer.history_index < frame.minibuffer.history.length) {
            frame.minibuffer.input.value = frame.minibuffer.history[frame.minibuffer.history_index];
        } else {
            frame.minibuffer.history_index = frame.minibuffer.history.length - 1;
        }
    }
}
interactive("minibuffer-history-next", minibuffer_history_next, ['current_frame']);


function minibuffer_history_previous (frame)
{
    if (frame.minibuffer.history != null) {
        frame.minibuffer.history_index--;
        if (frame.minibuffer.history_index >= 0) {
            frame.minibuffer.input.value = frame.minibuffer.history[frame.minibuffer.history_index];
        } else {
            frame.minibuffer.history_index = 0;
        }
    }
}
interactive("minibuffer-history-previous", minibuffer_history_previous, ['current_frame']);


function minibuffer_abort (frame)
{
    if (frame.minibuffer.abort_callback)
        frame.minibuffer.abort_callback();
    frame.minibuffer.abort_callback = null;
    frame.minibuffer.callback = null;
    frame.closeInput(true);
}
interactive("minibuffer-abort", minibuffer_abort, ['current_frame']);


function minibuffer_complete (frame, direction)
{
    function wrap(val, max)
    {
        if (val < 0)
            return max;
        if (val > max)
            return 0;
        return val;
    }

    var field = frame.minibuffer.input;
    var str = field.value;
    var enteredText = str.substring(0, field.selectionStart);
    var initialSelectionStart = field.selectionStart;
    //    if (typeof(direction) == 'undefined')
    direction = 1;

    if(! frame.minibuffer.completions || frame.minibuffer.completions.length == 0) return;

    frame.minibuffer.current_completions = frame.miniBufferCompleteStr (enteredText, frame.minibuffer.completions);
    frame.minibuffer.current_completion = frame.minibuffer.current_completion || 0; // TODO: set this based on contents of field?

    // deselect unambiguous part
    while (frame.minibuffer.current_completions.length ==
           frame.miniBufferCompleteStr (str.substring(0, field.selectionStart + 1),
                                       frame.minibuffer.completions).length &&
           field.selectionStart != field.value.length) {
        field.setSelectionRange (field.selectionStart + 1, field.value.length);
    }

    // if the above had no effect, cycle through options
    if (initialSelectionStart == field.selectionStart) {
        frame.minibuffer.current_completion =
            wrap (frame.minibuffer.current_completion + direction,
                  frame.minibuffer.current_completions.length - 1);
        //frame.minibuffer.current_completion = frame.minibuffer.current_completion + direction;
        if(! frame.minibuffer.current_completions[frame.minibuffer.current_completion]) return;
        field.value = frame.minibuffer.current_completions[frame.minibuffer.current_completion][0];
        field.setSelectionRange (enteredText.length, field.value.length);
    }
}
interactive("minibuffer-complete", minibuffer_complete, ['current_frame']);


function minibuffer_accept_match (frame)
{
    var field = frame.minibuffer.input;

    if (field.selectionStart == field.selectionEnd) {
        var start = field.selectionStart;
        // bleh
        field.value = field.value.substr (0, field.selectionStart) + " " + field.value.substr (field.selectionStart);
        field.setSelectionRange(start + 1, start + 1);
    } else {
        // When we allow non-matches it generally means the
        // completion takes an argument. So add a space.
        if (frame.minibuffer.allow_nonmatches && frame.minibuffer.input.value[frame.minibuffer.input.length-1] != " ")
            frame.minibuffer.input.value += " ";
        field.setSelectionRange (field.value.length, field.value.length);
    }
}
interactive("minibuffer-accept-match", minibuffer_accept_match, ['current_frame']);


function minibuffer_complete_reverse (frame)
{
    minibuffer_complete (frame, -1);
}
interactive("minibuffer-complete-reverse", minibuffer_complete_reverse, ['current_frame']);


function minibuffer_change (frame, event)
{
    // this command gets called by minibuffer.oninput, so the current value of
    // the field is whatever the user typed.
    //
    var enteredText = frame.minibuffer.input.value;
    var len = frame.minibuffer.input.value.length;

    // are there other viable options?
    if (frame.minibuffer.completions)
    {
        // here we check a flag set by minibuffer-backspace.  this is sort of
        // an inflexable solution, chaining us to this one particular
        // behavior.  perhaps instead of a flag, we could have a callback that
        // handles how to select the text.
        if (! frame.minibuffer.do_not_complete)
        {
            frame.minibuffer.current_completions =
                frame.miniBufferCompleteStr (frame.minibuffer.input.value, frame.minibuffer.completions);

            if (frame.minibuffer.current_completions.length != 0)
            {
                frame.minibuffer.input.value = frame.minibuffer.current_completions[0][0];
                frame.minibuffer.input.setSelectionRange (len, frame.minibuffer.input.value.length);
            }
        } else {
            frame.minibuffer.do_not_complete = false;
        }
    }
    // XXX: what is current_completion used for?
    frame.minibuffer.current_completion = null;
}
interactive ("minibuffer-change", minibuffer_change, ['current_frame', 'e']);


function minibuffer_backspace (frame, prefix) {
    frame.minibuffer.do_not_complete = true;
    doCommandNTimes (frame, prefix, 'cmd_deleteCharBackward');
}
interactive ("minibuffer-backspace", minibuffer_backspace, ['current_frame', 'p']);


