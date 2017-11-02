<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:52
 */

//add_filter( 'show_admin_bar' , '__return_false');

/**
 * REGEX MAGIC <3
 * @var $content string input html data
 *
 * @return string added rel='noopener noreferrer' to all a tags without a rel
 *
 */
function add_secure_rel_to__blank_anchor_target($content){
    //insert -> rel='noopener noreferrer' into <a **** target="_blank" ***** HERE>
    //
    //find <a
    //try to match anything bot not "rel"
    //try to match target="_blank" (or with ''s)
    //after that no "rel" again
    //and finally >
    //not put <a, the meta of this tag, the insert and > as the result
    return preg_replace("/(<a )(((?!rel).)*?target=(?<bracket>[\"'])_blank(?P=bracket)((?!rel).?)*?)?(>)/","$1$2 rel='noopener noreferrer'$6",$content);
}

add_filter( 'the_content', 'add_secure_rel_to__blank_anchor_target' );



function set_category_on_post_based_on_dropdown_select($pid){
    $field = get_field('veranstaltung',$pid);
    if($field == '')//uncategorized if BLOG
        $field = 1;
    wp_set_post_categories($pid,[$field],false);
}

add_filter('save_post','set_category_on_post_based_on_dropdown_select');