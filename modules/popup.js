
function popup_manager(frame)
{
    this.frame = frame;
    this.container = create_XUL(frame, "popupset");
    frame.document.documentElement.appendChild(this.container);
    this.active_popup = null;
}

define_keywords("$lose_focus_callback", "$gain_focus_callback");
popup_manager.prototype = {
    create : function () {
        var node = create_XUL(this.frame, "popup");
        var obj = this;
        node.addEventListener("popupshowing", function () {
                obj.active_popup = node;
            },
            true /* capture */,
            false /* ignore untrusted events */);
        node.addEventListener("popuphidden", function () {
                if (obj.active_popup == node)
                    obj.active_popup = null;
            },
            true /* capture */,
            false /* ignore untrusted events */);
        this.container.appendChild(node);
        return node;
    },
    remove : function (popup) {
        this.container.removeChild(popup);
    },
    show_absolute : function (popup, x, y) {
        popup.showPopup(this.frame.document.documentElement, x, y);
    },
    show_relative : function (popup, element, anchor, align) {
        popup.showPopup(element, -1, -1, anchor, align);
    }
};

function popup_initialize_frame(frame)
{
    frame.popups = new popup_manager(frame);
}

add_hook("frame_initialize_early_hook", popup_initialize_frame);
