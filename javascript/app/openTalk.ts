/**
 * Created by neko on 01.09.16.
 */

/// <reference path="../vendor/foundation.d.ts" />

(function ($) {
    if(new RegExp("#talk-[0-9]*").test(window.location.hash)) {
        $("#" + $(window.location.hash).parent().attr('id') + "-label").click();
        $(window.location.hash).find(".toggler").click();
    }
})(jQuery);