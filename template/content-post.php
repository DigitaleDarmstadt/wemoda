<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 16:14
 */
?>
<article class="post-container" id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>
    <?php if (get_field('header_image')) {
        echo "<div class='header-image-container'><img class='header-image' src='" . get_field('header_image') . "'/></div>";
    }
    ?>

    <div class="post-meta-wrapper row nowrap">

        <div class="avatar"><?= get_avatar(get_the_author_meta('ID'), 55); ?></div>
        <div class="row vertical no-padding-inside">
            <span class="publish-data"><?php the_author_posts_link(); ?></span>
            <span class="publish-meta-wrapper">
                <span class="publish-meta last-small <?php if (!has_tag()) {
                    echo " last";
                } ?>"><?php the_time(get_option('date_format'));//WORKAROUND the_date ONLY OUTPUTS ONCE A DATE ?></span>
                <span class="publish-meta show-for-medium last tags"><?php the_tags('', '', ''); ?></span>
            </span>
        </div>
    </div>

    <h1><a class="blacklink" href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>

    <?php if (get_field('teaser_in_post')): ?>
        <div class="post-teaser">
            <?php the_field('teaser_text'); ?>
        </div>
    <?php endif; ?>
    <div class="post-content">
        <?php the_content(); ?>
    </div>

</article>
