
function frame_initialize(frame)
{
    frame.conkeror = conkeror;
    run_hooks(frame_initialize_early_hook, frame);
    run_hooks(frame_initialize_hook, frame);
    frame.setTimeout(function(){run_hooks(frame_initialize_late_hook, frame);},0);
}
