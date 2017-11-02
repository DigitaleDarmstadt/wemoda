<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:46
 */
?><!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
<head>
    <meta charset="<?php bloginfo('charset'); ?>"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
          data-alt-content="width=device-width, initial-scale=1.0" name='viewport'/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="HandheldFriendly" content="true"/>
    <meta name="MobileOptimzied" content="width"/>
    <script type="text/javascript">
        var stylesheet_directory_uri = "<?= get_template_directory_uri(); ?>";
    </script>
    <?php wp_head(); ?>
    <style>
        /*Custom theme mod options*/
        #Hero {
            background-color: <?= get_theme_mod('wemoda_hero_background'); ?>;
        }

        <?php
        if(is_user_logged_in()){
            echo ".perm-link{display: block !important;}";
        }?>
    </style>
    <title>Webmontag Darmstadt</title>
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
</head>
<body <?php body_class();
if(is_page('frontpage')){
    echo 'id="Home"';
}
    ?>
>
<div class="reveal" id="media-modal" data-reveal data-animation-in="fade-in" data-animation-out="fade-out"
     data-reset-on-close="true">
    <div class="close" data-close></div>
    <div id="media-modal-content">

    </div>
</div>

<div id="nav-wrapper">
    <nav id="Navigation" class="top-bar align-center stacked">
        <div class="top-bar-title mobile-top-bar">
            <a class="anchor-scroll" href="<?php echo get_site_url(); ?>/#Home" data-toggle><img
                    src="<?php echo get_template_directory_uri(); ?>/img/logo_webmontag.png" alt="Webmontag"
                    width="77px"
                    height="78px"/></a>
            <span data-responsive-toggle="responsive-menu" data-hide-for="medium">
          <button class="menu-icon dark toggle-top-bar" type="button" data-toggle></button>
        </span>
        </div>
        <div class="top-bar-left" id="responsive-menu">
            <ul class="dropdown menu vertical-for-small-only menu-transition-for-mobile">
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Info"
                                                     class="menu-button anchor-scroll">Info</a>
                </li>
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Talks"
                                                     class="menu-button anchor-scroll">Talks</a></li>
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Media"
                                                     class="menu-button anchor-scroll">Media</a></li>
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Sponsoren"
                                                     class="menu-button anchor-scroll">Sponsoren</a>
                </li>
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Kontakt"
                                                     class="menu-button anchor-scroll">Kontakt</a>
                </li>
                <li class="expand-for-small-only"><a href="<?php echo get_site_url(); ?>/#Newsletter"
                                                     class="menu-button anchor-scroll">Newsletter</a>
                </li>
                <li class="expand-for-small-only"><a href="<?php echo get_page_uri(get_option('page_for_posts')); ?>"
                                                     class="menu-button">Blog</a></li>
            </ul>
        </div>
    </nav>
</div>