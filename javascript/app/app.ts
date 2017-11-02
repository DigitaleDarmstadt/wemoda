/**
 * Created by neko on 26.08.16.
 */
/// <reference path="../vendor/jquery.d.ts" />
(function($){
    $(document).foundation();
    $(document).find('#responsive-menu').click(function (event) {
        $('.toggle-top-bar').click();
    });
})(jQuery);