<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 16:29
 */

function wemoda_scripts()
{

    wp_enqueue_style('main-stylesheet', get_template_directory_uri() . '/stylesheets/app.css', [], '2.6.1', 'all');

    // Deregister the jquery version bundled with WordPress.
    wp_deregister_script('jquery');
    wp_enqueue_script('jquery', 'http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js', [], '2.1.0', false);
    wp_enqueue_script('youtube', 'https://www.youtube.com/iframe_api', [], '2.1.0', false);



    wp_enqueue_script('foundation', get_template_directory_uri() . '/javascript/app.js', ['jquery', 'jquery-ui-datepicker'], '2.6.1', true);

}

function wemoda_admin_init()
{
    add_editor_style('stylesheets/app.css');
}




add_action('wp_enqueue_scripts', 'wemoda_scripts');
add_action('admin_init', 'wemoda_admin_init');