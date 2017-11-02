<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 16:30
 */
function wemoda_theme_support()
{
//    add_theme_support('html5', [
//        'search-form',
//        'comment-form',
//        'comment-list',
//        'gallery',
//        'caption',
//    ]);

//    add_theme_support('title-tag');

    add_theme_support('post-thumbnails');

}

add_action('after_setup_theme', 'wemoda_theme_support');


// unregister all widgets
function unregister_default_widgets()
{
    unregister_widget('WP_Widget_Pages');
    unregister_widget('WP_Widget_Calendar');
    unregister_widget('WP_Widget_Archives');
    unregister_widget('WP_Widget_Meta');
    unregister_widget('WP_Widget_Search');
    unregister_widget('WP_Widget_Text');
    unregister_widget('WP_Widget_Categories');
    unregister_widget('WP_Widget_Recent_Posts');
    unregister_widget('WP_Widget_Recent_Comments');
    unregister_widget('WP_Widget_RSS');
    unregister_widget('WP_Widget_Tag_Cloud');
    unregister_widget('WP_Nav_Menu_Widget');
}

add_action('widgets_init', 'unregister_default_widgets', 11);