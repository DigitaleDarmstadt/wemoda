<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 14:11
 */

get_header();
//Kategorien holen
$categories = get_categories([
    'orderby'      => 'name',
    'order'        => 'ASC',
    'hide_empty'   => false,
    'hierarchical' => false,
    'exclude'      => 1,//Uncategorized
]);

//TODO: TELL A FRIEND TEXT: (marked)
$tell_a_friend_text = <<<EOT
Hey,
demnächst findet der nächste Webmontag Darmstadt statt. Alle Infos unter www.wemoda.de!
EOT;
?>


<div id="Hero" class="hero effect-fade-spawn">
    <div class="width-wrapper">
        <div class="headers">
            <div class="header-big"><?php bloginfo('name'); ?></div>
            <div class="header-thin"><?php bloginfo('description'); ?></div>
        </div>
        <div class="hero-content">
            <div class="hero-left-area">
                <span class="hashtag">#wemoda</span>
                <div class="hero-left-buttons">
                    <a href="https://twitter.com/wemo_da" class="hero-left-button" target="_blank"
                       rel='noopener noreferrer'><span class="twitter"></span></a>
                    <a href="https://www.facebook.com/WebmontagDA" class="hero-left-button" target="_blank"
                       rel='noopener noreferrer'><span
                            class="facebook"></span></a>
                    <a href="mailto:?subject=Webmontag&body=<?= rawurlencode($tell_a_friend_text); ?>"
                       class="hero-left-button" id="tell-a-friend-button"><span class="email"></span></a>
                </div>
                <?php
                $from = strtotime(get_theme_mod('wemoda_livestream_from'));
                $now = strtotime(date('Y-m-d H:i'));
                $to = strtotime(get_theme_mod('wemoda_livestream_to'));
                if ($from < $now && $now < $to) {
                    echo '<a class="livestream-button" href="' . get_permalink(get_page_by_path('livestream')->ID) . '">Livestream</a>';
                }
                ?>

                <a class="more" href="https://www.eventbrite.de/e/liebe-ist-digital-alles-uber-liebe-sex-und-bindungsangst-beim-funften-wemoda-tickets-39040803093" target="_blank" rel="noopener noreferrer">JETZT ANMELDEN</a>
            </div>
            <?php dynamic_sidebar('hero-bubble'); ?>
        </div>
    </div>
</div>
<section id="Info">
    <?php $post = get_page_by_path('info');//INFO ?>
    <h2>Info</h2>
    <div class="row nowrap align-top">
        <?php if (get_the_post_thumbnail_url($post->ID)): ?><img class="show-for-large"
                                                                 src='<?= get_the_post_thumbnail_url($post->ID); ?>'
                                                                 alt=""/><?php endif; ?>
        <div class="text"><?php

            $content = apply_filters('the_content', $post->post_content);
            $title = apply_filters('the_title', $post->post_title);
            echo "<h3>$title</h3>";
            echo $content;
            ?></div>
    </div>

    <?php

    if (class_exists('EM_Events')) {
        $events = EM_Events::get([]);
        if (count($events) > 0) {
            echo "<div class=\"event\">";
            $event = $events[0];//wir wollen nur das erste event c:
            $bookings = $event->get_bookings();
            $automator = intval(get_field('automatic_accept', $event->post_id));
            if ($bookings->get_booked_spaces() < $automator) {
                //Buchungen brauchen keine Bestätigung... Limit noch nicht erreicht...
                update_option('dbem_bookings_approval', "0");
            } else {
                //Buchungen brauchen eine Bestätigung... Limit erreicht...
                update_option('dbem_bookings_approval', "1");
            }
            ob_start();
            $template = em_locate_template('placeholders/bookingform.php', true, ['EM_Event' => $event]);
            EM_Bookings::enqueue_js();
            $replace = ob_get_clean();
            echo $replace;
            echo "</div>";
        }
    }
    ?>

</section>
<section id="Talks">
    <h2>Talks</h2>
    <?php
    $years = [];
    //kategorien einsortieren wenn posts vorhanden sind, diese direkt unterordnen
    foreach ($categories as $category) {
        $date = get_field('date', $category);
        preg_match("/([0-9]{4})([0-9]{2})([0-9]{2})/", $date, $matches);
        $year = $matches[1];
        $month = $matches[2];
        $day = $matches[3];
        $posts = get_posts([
            'numberposts' => -1,
            'post_type'   => 'post',
            'meta_query'  => [
                'relation' => 'AND',
                [
                    'key'     => 'veranstaltung',
                    'value'   => $category->term_id,
                    'compare' => '=',
                ]],
        ]);
        if (!empty($posts)) {
            //sort 5min-entries to the bottom ;3
            usort($posts, function ($a, $b) {
                return get_field('fuenfminutenbeitrag', $a->ID) - get_field('fuenfminutenbeitrag', $b->ID);
            });
            $years[ (int)$year ][] = ['date' => ['year' => $year, 'month' => $month, 'day' => $day], 'cat' => $category, 'posts' => $posts];
        }
    }
    foreach ($years as &$year) {
        usort($year, function ($a, $b) {
            $dateA = $a['date'];
            $intA = (int)($dateA['month'] . $dateA['day']);
            $dateB = $b['date'];
            $intB = (int)($dateB['month'] . $dateB['day']);

            return $intB - $intA;
        });
    }
    unset($year);
    uksort($years,function($a,$b){return $b-$a;});


    $isFirst = true;
    //geordnet ausgeben
    //      LABELS
    ?>
    <ul class="tabs" data-tabs id="talks-tabs"><?php foreach ($years as $year): $dateYear = $year[0]['date']['year'];
            echo "<li class='tabs-title" . ($isFirst ? ' is-active' : '') . "'><a href='#panel-talk-$dateYear' aria-selected='true'>$dateYear</a></li>";
            $isFirst = false;
        endforeach; ?></ul>


    <div class="tabs-content" data-tabs-content="talks-tabs">
        <?php //      TABS
        $isFirst = true;
        foreach ($years as $year) {
            echo "<div class='tabs-panel" . ($isFirst ? ' is-active' : '') . "' id='panel-talk-" . $year[0]['date']['year'] . "'>";

            foreach ($year as $category) {
                echo "<h3 class='talk-heading'>" . $category['date']['day'] . ". " . monthnames($category['date']['month']) . ": " . $category['cat']->name . "</h3>";
                echo "<div class='talk-intro'>" . $category['cat']->description . "</div>";
                foreach ($category['posts'] as $post) {
                    setup_postdata($post);
                    $more = 1;//we don't really want to strip off the subs... we want to do it on our own with a custom more button...
                    if (get_field('fuenfminutenbeitrag', $post->ID)) {
                        echo "<div id='talk-" . get_the_ID() . "' class='talk-box dark row align-top fuenf-minuten-talk'>";
                        if (has_post_thumbnail()) {
                            echo "<img class='show-for-large small-3' src='" . get_thumb_link(get_the_post_thumbnail_url(), ['width' => 260, 'height' => 380]) . "' alt=''/>";
                        }
                        echo "<div class='talk-box-content row vertical'>";
                        the_title("<h3 class='talk-box-heading first'>", "</h3>");
                        echo "<div class='text'>";
                        if (!empty(get_field('teaser_text'))) {
                            the_field('teaser_text');
                        }
                        the_content();

                        echo "</div>";//<div class='text'>
                        echo "<a class='more perm-link' href='#talk-" . get_the_ID() . "' style='position:relative; align-self: flex-start;'>PERMANENTLINK</a>";
                        echo "</div>";//<div class='talk-box-content row vertical'>
                        echo "</div>";//<div id='talk-" . get_the_ID() . "' class='talk-box light row align-top 5-min-talk'>
                    } else {
                        echo "<div id='talk-" . get_the_ID() . "' class='talk-box light row align-top'>";
                        if (has_post_thumbnail()) {
                            echo "<img class='show-for-large small-3' src='" . get_thumb_link(get_the_post_thumbnail_url(), ['width' => 260, 'height' => 380]) . "' alt=''/>";
                        }
                        echo "<div class='talk-box-content row vertical'>";
                        the_title("<h3 class='talk-box-heading first'>", "</h3>");

                        echo "<div class='row columns-small-only'>";
                        echo "<div class='talk-box-person'>";
                        if (json_decode(get_field("autoren"), true)) {
                            foreach (json_decode(get_field("autoren"), true) as $author) {
                                echo "<div class='name'>" . $author['name'] . "</div>";
                                echo "<a href='" . $author['link'] . "' target='_blank' rel='noopener noreferrer'>" . $author['label'] . "</a>";
                            }
                        }
                        echo "</div>";//<div class='talk-box-person'>
                        if (!empty(get_field('teaser_text'))) {
                            echo "<div class='text'>";
                            the_field('teaser_text');
                            echo "</div>";//<div class='text'>
                            echo "</div>";//<div class='row columns-small-only'>
                            if (!empty(get_the_content())) {
                                echo "<div class='expander toggleme'>";
                                the_content();
                                echo "</div>";//<div class='expander'>
                                echo "<a class='more perm-link' href='#talk-" . get_the_ID() . "'>PERMANENTLINK</a>";
                                echo "<div class='more align-self-bottom toggler' data-toggle='WENIGER'>MEHR</div>";
                            } else {
                                echo "<a class='more perm-link' href='#talk-" . get_the_ID() . "'>PERMANENTLINK</a>";
                            }
                        } else {
                            echo "<div class='text'>";
                            $content = get_the_content();
                            $replaced = preg_replace('/<span id="more-[0-9]*"><\/span>/', '</div></div><div class=\'expander toggleme\'>', $content);
                            if ($content != $replaced) {//there is a more...
                                $replaced .= "</div>";
                                $replaced .= "<a class='more perm-link' href='#talk-" . get_the_ID() . "'>PERMANENTLINK</a>";
                                $replaced .= "<div class='more align-self-bottom toggler'data-toggle='WENIGER'>MEHR</div>";
                            } else {//there is no more
                                $replaced .= "</div>";//<div class='text'>
                                $replaced .= "</div>";//<div class='row columns-small-only'>
                                $replaced .= "<a class='more perm-link' href='#talk-" . get_the_ID() . "'>PERMANENTLINK</a>";
                            }
                            echo $replaced;

                        }

                        echo "</div>";//<div class='talk-box-content row vertical'>
                        echo "</div>";//<div class='talk-box light row'>
                    }
                    wp_reset_postdata();
                }

            }
            $isFirst = false;
            echo "</div>";
        }
        ?>
    </div>

    <?php ?>
</section>
<section id="Media">
    <h2>Media</h2>

    <?php

    $years = [];
    foreach ($categories as $category) {

        $date = get_field('date', $category);
        preg_match("/([0-9]{4})([0-9]{2})([0-9]{2})/", $date, $matches);
        $year = $matches[1];
        $month = $matches[2];
        $day = $matches[3];

        $query_medias_args = [
            'post_type'      => 'attachment',
            'post_mime_type' => 'image',
            'post_status'    => 'inherit',
            'posts_per_page' => -1,
            'meta_query'     => [
                'relation' => 'AND',
                [
                    'key'     => 'veranstaltung',
                    'value'   => $category->term_id,
                    'compare' => '=',
                ]],
        ];

        $query_medias = new WP_Query($query_medias_args);

        $images = [];
        $videos = [];
        foreach ($query_medias->posts as $media) {
            $youtubeLinkField = get_field('youtube_link', $media->ID);
            $youtubeLinkValidated = get_field('validated_youtube_link', $media->ID);
            $youtubeID = "";
            //GET THE ID FROM YOUTUBE LINK
            //https://www.youtube.com/watch?v=00KBHNy4kW4
            //https://youtu.be/00KBHNy4kW4
            //00KBHNy4kW4
            //ALL 3 ARE VALID AND THEN BE CHECKED FOR AVAILABILITY
            preg_match("/^(?:http[s]?:\\/\\/)?(?:www.youtube.com\\/watch\\?v=|youtu.be\\/)?((?:(?!\\&)(?:.))+)\\&?(?:.)*$/", $youtubeLinkField, $matches);
            if (count($matches)) {
                $youtubeID = $matches[1];
            }
            if ($youtubeID != $youtubeLinkValidated) {//if not validated... then validate...
                if (validYoutube($youtubeID)) {
                    update_field('validated_youtube_link', $youtubeID, $media->ID);
                } else {
                    $youtubeID = '';
                }
            }
            $insert['target'] = wp_get_attachment_url($media->ID);
            if ($youtubeID) {//YOUTUBE
                //use own thumbnail generator because wordpress doesn't really works with custom sizes... sorry wordpress
                $insert['thumbnail'] = get_thumb_link($insert['target'], ['width' => 640, 'height' => 360]);
                $insert['target'] = $youtubeID;
                $videos[] = $insert;
            } else {//IMAGE
                //use own thumbnail generator because wordpress doesn't really works with custom sizes... sorry wordpress
                $insert['thumbnail'] = get_thumb_link($insert['target'], 256);
                $images[] = $insert;
            }
        }

        if (!(empty($images) && empty($videos))) {
            $years[ (int)$year ][] = ['date' => ['year' => $year, 'month' => $month, 'day' => $day], 'cat' => $category, 'images' => $images, 'videos' => $videos];
        }
    }

    foreach ($years as &$year) {
        usort($year, function ($a, $b) {
            $dateA = $a['date'];
            $intA = (int)($dateA['month'] . $dateA['day']);
            $dateB = $b['date'];
            $intB = (int)($dateB['month'] . $dateB['day']);

            return $intB - $intA;
        });
    }
    unset($year);
    uksort($years,function($a,$b){return $b-$a;});


    $isFirst = true;

    echo "<ul class='tabs' data-tabs id='media-tabs'>";
    foreach ($years as $year) {
        $dateYear = $year[0]['date']['year'];
        echo "<li class='tabs-title" . ($isFirst ? ' is-active' : '') . "'><a href='#panel-media-$dateYear' aria-selected='true'>$dateYear</a></li>";
        $isFirst = false;
    }
    echo "</ul>";
    echo "<div class='tabs-content' data-tabs-content='media-tabs'>";

    $isFirst = true;
    foreach ($years as $year) {
        echo "<div class='media-panel tabs-panel" . ($isFirst ? ' is-active' : '') . "' id='panel-media-" . $year[0]['date']['year'] . "'>";

        foreach ($year as $category) {
            echo "<div class='media-container-wrap'>";
            echo "<h3 class='media-heading'>" . $category['date']['day'] . ". " . monthnames($category['date']['month']) . ": " . $category['cat']->name . "</h3>";
            $cat_id = $category['date']['day'] . "_" . $category['date']['month'] . "_" . $category['date']['year'];
            //images
            if (count($category['images'])) {
                echo "<div class='media-container-wrap'>";
                echo "<h3 id='media_" . $cat_id . "_images' class='media-type-text'>Fotos</h3>";
                echo "<div class='row media-images toggled toggleme'>";
                foreach ($category['images'] as $image) {
                    echo "<a class='image' href='" . $image['target'] . "' data-ion2s-image='true'><img src='" . $image['thumbnail'] . "'/></a>";
                }
                echo "</div>";
                echo "<a href='#media_" . $cat_id . "_images' class='media-more anchor-scroll toggler' data-toggle='WENIGER'>MEHR</a>";
                echo "</div>";
            }
            //--images
            //videos
            if (count($category['videos'])) {
                echo "<div class='media-container-wrap'>";
                echo "<h3 id='media_" . $cat_id . "_videos' class='media-type-text'>Videos</h3>";
                echo "<div class='row media-videos toggled toggleme'>";
                foreach ($category['videos'] as $video) {
                    echo "<a class='video' href='https://youtu.be/" . $video['target'] . "' rel='noopener noreferrer' target='_blank' data-ion2s-youtube='" . $video['target'] . "'><img src='" . $video['thumbnail'] . "'/></a>";
                }
                echo "</div>";
                echo "<a href='#media_" . $cat_id . "_videos' class='media-more anchor-scroll toggler' data-toggle='WENIGER'>MEHR</a>";
                echo "</div>";
            }
            echo "</div>";
            //--videos
        }
        $isFirst = false;
        echo "</div>";//TABS PANEL
    }
    echo "</div>";//TABS CONTENT

    ?>

</section>
<section id="Sponsoren">
    <h2>Sponsoren</h2>
    <div class="sponsors">
        <?php dynamic_sidebar('sponsors-logos'); ?>
    </div>

</section>
<section id="Kontakt" class="effect-fade-spawn">
    <h2>Kontakt</h2>
    <div class="align-center row">
        <div class="contact-container">
            <div
                style="position: absolute;"></div><?php //und schon wieder muss das alignment in einem browser gefixt werden... ?>
            <div class="contact-center">
                <span class="contact-text">DU HAST FRAGEN?</span>
                <span class="contact-text">MÖCHTEST EINEN<br>VORTRAG HALTEN<br>ODER MITMACHEN?</span>
                <span class="contact-text contact-slim">MELDE DICH BEI:</span>
                <a href="mailto:<?php bloginfo('admin_email'); ?>"
                   class="contact-text contact-mail under-link"><?php bloginfo('admin_email'); ?></a>
            </div>
        </div>
    </div>
</section>
<section id="Newsletter">
    <h2>NEWSLETTER</h2>
    <div class="align-center row align-top nowrap">
        <img src="<?php echo get_template_directory_uri(); ?>/img/newsletter-krone.png" alt="Nichts Verpassen"
             class="show-for-large info-bubble"/>
        <form class="form" data-abide novalidate
              action="//ion2s.us11.list-manage.com/subscribe/post?u=c272114d8298d396ca7f41ec4&amp;id=cf29b8d81a"
              method="post">
            <div class="promoter"><span class="question">Wann ist wieder Webmontag in Darmstadt?</span>
                <span class="abo">Abonniere den <span class="hashtag">#wemoda</span>-Newsletter und erfahre es als erster.</span>
            </div>

            <div data-abide-error class="alert callout" style="display: none;">
                <p><i class="fi-alert"></i> Ups, da stimmt etwas nicht.</p>
            </div>
            <div class="">
                <div class="">
                    <label>
                        <input required id="E-Mail" name="EMAIL" pattern="email" type="text"
                               placeholder="DEINE E-MAIL-ADRESSE">
                        <span class="form-error">
                            Das sieht aber nicht nach einer E-Mail-Adresse aus.
                        </span>
                    </label>
                </div>
                <div class="">
                    <label>
                        <input required id="Vorname" name="FNAME" pattern="text" type="text" placeholder="DEIN VORNAME">
                        <span class="form-error">
                            Na dein Vorname ist doch bestimmt länger?
                        </span>
                    </label>
                </div>
                <div class="">
                    <label>
                        <input required id="Nachname" name="LNAME" pattern="text" type="text"
                               placeholder="DEIN NACHNAME">
                        <span class="form-error">
                            Na dein Nachname ist doch bestimmt länger?
                        </span>
                    </label>
                </div>
                <div style="position: absolute; left: -5000px;">
                    <input type="text" name="b_c272114d8298d396ca7f41ec4_cf29b8d81a" tabindex="-1" value="">
                </div>
                <div class="input-group-button">
                    <input type="submit" class="form-button" value="NEWSLETTER ABONNIEREN">
                </div>
            </div>
        </form>
    </div>
</section>

<?php get_footer(); ?>
