<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:41
 */

get_header(); ?>

<section class="blog-content <?php if(is_single()){echo " singlepost";}else{echo " multipost";} ?>">
    <?php query_posts($query_string . '&cat=1');

    if (have_posts()) {

        /* Start the Loop */
        while (have_posts()) {
            the_post();
            get_template_part('template/content', is_single() ? 'post' : 'preview');
        }
    } else {
        get_template_part('template-parts/content', 'none');
    } 
    echo get_prev_next(); ?>

</section>

<?php get_footer(); ?>
