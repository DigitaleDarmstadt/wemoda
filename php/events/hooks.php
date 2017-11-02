<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 12.09.16
 * Time: 17:31
 */


function em_booking_form_custom_hook(EM_Event $EM_Event)
{
    ?>
    <h3><?= get_field('ticket_title', $EM_Event->post_id) ?></h3>
    <div class="event-description">
        <?php
        $automator = intval(get_field('automatic_accept', $EM_Event->post_id));
        $frei = $automator - $EM_Event->get_bookings()->get_booked_spaces();
        if ($frei < 0) {
            $frei = 0;
        }

        $message = "";
        if ($EM_Event->get_bookings()->get_booked_spaces() < $automator) {
            $message = get_field('open_tickets_text', $EM_Event->post_id);
        } else {
            $message = get_field('close_tickets_text', $EM_Event->post_id);
        }
        $message = preg_replace('/\[gebucht\]/i', $EM_Event->get_bookings()->get_booked_spaces(), $message);
        $message = preg_replace('/\[maximal\]/i', $automator, $message);
        $message = preg_replace('/\[frei\]/i', $frei, $message);
        echo $message;
        ?>
    </div>
    <input required type="text" name="user_name" value="" placeholder="DEIN NAME">
    <input required type="text" name="user_email" value="" placeholder="DEINE E-MAIL-ADRESSE">
    <input type="text" name="booking_comment" value="" placeholder="DEIN UNTERNEHMEN"/>
    <div class="checkbox"><input type="checkbox" name="newsletter_for_event" id="newsletter_for_event"/>
        <label for="newsletter_for_event">Ich möchte mich außerdem noch für den Newsletter anmelden.</label></div>
    <?php
}

function add_redirect_to_homepage_on_inactive_pages($content)
{
    //deactivated pages redirect to homepage (can't rewrite whole plugins that require these sites ^^"
    if (preg_match('/DEACTIVATED/', $content)) {
        return "<script>window.location.replace('/');</script>";
    }
    return $content;
}


add_filter('em_booking_form_custom', 'em_booking_form_custom_hook', 1, 1);
add_filter('the_content', 'add_redirect_to_homepage_on_inactive_pages', 3, 1);

