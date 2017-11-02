<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 13.10.16
 * Time: 13:39
 */
get_header();
echo "<section class=\"blog-content  multipost\">";
while (have_posts()) : the_post();
    ?>
    <article class="post-container" id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>
        <div class="post">
            <div class="post-content">
                <?php the_content(); ?>
            </div>
        </div>
    </article>
    <?php
endwhile;
echo "</div>";
get_footer(); ?>