<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:52
 */


//LIMIT WP
remove_action( 'wp_head', 'feed_links');

remove_action( 'wp_head', 'rsd_link');

remove_action( 'wp_head', 'wlwmanifest_link');

remove_action( 'wp_head', 'wp_shortlink_wp_head');

remove_action( 'wp_head', 'wp_generator');