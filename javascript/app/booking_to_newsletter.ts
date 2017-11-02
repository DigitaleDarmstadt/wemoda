/**
 * Created by neko on 13.10.16.
 */
/// <reference path="../vendor/jquery.d.ts" />
(function ($) {

    function sendNewsletter() {
        //wait for the booking to be confirmed
        if (!$("div.em-booking-message-success").length) {
            setTimeout(sendNewsletter, 100);
            return;
        }
        $("#Newsletter input[type=\"submit\"]").click();
    }//sendNewsletter...

    if ($("div.event").length) {
        $("div.event .em-booking-submit").click(()=> {
            if ($("#newsletter_for_event").prop('checked')) {
                let name = $('input[name="user_name"]').val();
                let mail = $('input[name="user_email"]').val();
                let regex = /([^ ]*).+?([^ ]*.*)/g;
                let match = regex.exec(name);
                let name1 = match[1];
                let name2 = match[2];
                $('#E-Mail').val(mail);
                $('#Vorname').val(name1);
                $('#Nachname').val(name2);
                sendNewsletter();
            }
        });
    }
})(jQuery);