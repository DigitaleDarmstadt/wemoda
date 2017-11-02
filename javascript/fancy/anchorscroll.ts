/**
 * Created by neko on 13.09.16.
 */
function scrollToAnchor(href: string, e: Event) {
    let $ = jQuery;
    let bonus = $("nav").outerHeight();
    $('html, body').animate({
        scrollTop: $(href).offset().top - bonus
    }, 300, () => {
        setTimeout(()=> {
            $('html, body').scroll();
        }, 230);
    });//reshow menu after scroll...
    if (e) {
        e.preventDefault();
    }
}
(function ($) {
    $('.anchor-scroll').on('click', function (e) {
        var href = /#.*/.exec($(this).attr('href'))[0];
        scrollToAnchor(href, e);
    });
})(jQuery);