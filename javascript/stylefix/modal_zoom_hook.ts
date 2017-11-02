/**
 * Created by neko on 14.09.16.
 */
(function ($) {
    function getMeta(name: string): JQuery {
        return $(document.querySelector("meta[name='" + name + "']"));
    }

    function swap_attr(tag: JQuery, attr1: string, attr2: string) {
        let bubble: string = tag.attr(attr1);
        tag.attr(attr1, <string>tag.attr(attr2));
        tag.attr(attr2, bubble);
    }

    let tag = getMeta('viewport');
    let position = 0;
    $(document).on('open.zf.reveal', '[data-reveal]', function () {
        swap_attr(tag, 'content', 'data-alt-content');
        position = $(document).scrollTop();
        // alert(position);
    });
    $(document).on('closed.zf.reveal', '[data-reveal]', function () {
        swap_attr(tag, 'content', 'data-alt-content');
        $('html, body').animate({
            scrollTop: position
        }, 'fast');
    });
})(jQuery);