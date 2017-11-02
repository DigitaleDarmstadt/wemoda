<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 31.08.16
 * Time: 14:07
 */

function get_blog_page_link()
{
    $posts = get_posts([
                           'numberposts' => -1,
                           'post_type'   => 'post',
                           'category'         => 1,
                       ]);
    $index = 0;
    foreach ($posts as $post) {
        ++$index;
        if($post->ID == get_the_ID())
            break;
    }
    $page = ceil($index / get_option('posts_per_page'));
    return "<a href='" . get_permalink( get_option('page_for_posts' ) ) . "page/" . $page . "'>ÜBERSICHT</a>";
}