<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 31.08.16
 * Time: 11:32
 */

function get_prev_next()
{
    global $wp_query;
    $paginate_links = null;
    if (is_single()) {
        return "<ul class=\"page-numbers single\">"
               . "<li>" . get_next_post_link('%link', 'VORHERIGER POST', true) . "</li>"
               // . "<li>" . get_next_post_link('%link', '%title', true) . "</li>"
               . "<li>". get_blog_page_link() . "</li>"
               . "<li>". get_previous_post_link('%link', 'NÄCHSTER POST', true) . "</li>"
               // . "<li>". get_previous_post_link('%link', '%title', true) . "</li>"
               . "</ul>";
    } else {
        $paginate_links = paginate_links([
                                             'base'      => str_replace(PHP_INT_MAX, '%#%', html_entity_decode(get_pagenum_link(PHP_INT_MAX))),
                                             'current'   => max(1, get_query_var('paged')),
                                             'total'     => $wp_query->max_num_pages,
                                             'mid_size'  => 1,
                                             'prev_next' => true,
                                             'prev_text' => "NEUER",
                                             'next_text' => "ÄLTER",
                                             'type'      => 'array',
                                         ]);
        $paginator = "<ul class=\"page-numbers\">";

        $pos = "NEWER";
        $holdNext = true;

        if(count($paginate_links)) {
            //first
            if (!preg_match("/class=['\"]page-numbers current['\"]/", $paginate_links[0])) {//erste seite nicht ausgewählt
                $paginate_links[1] = preg_replace('/class=[\'"]page-numbers[\'"]/', 'class=\'page-numbers hold\'', $paginate_links[1]);
            }
            //last
            $has = count($paginate_links) - 1;
            if (!preg_match("/class=['\"]page-numbers current['\"]/", $paginate_links[ $has ])) {//erste seite nicht ausgewählt
                $paginate_links[ $has - 1 ] = preg_replace('/class=[\'"]page-numbers[\'"]/', 'class=\'page-numbers hold\'', $paginate_links[ $has - 1 ]);
            }
        }else{
            $paginate_links = [];
        }
        $paginator .= "<li>" . implode('</li><li>', $paginate_links) . "</li>";


        $paginator .= "</ul>";
    }

    return $paginator;
}