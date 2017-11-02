/**
 * Created by neko on 07.10.16.
 */
(function ($) {
    if(document.documentMode){
        $("body").addClass("fix-image");
        $("body").addClass("fix-flexbox");
    }

    if(/Safari/.test(navigator.userAgent) || /Edge/.test(navigator.userAgent) && (!/Chrome/.test(navigator.userAgent))){
        $("body").addClass("fix-image");
    }

})(jQuery);