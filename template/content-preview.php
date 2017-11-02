<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 26.08.16
 * Time: 17:43
 */

$header_image = get_field('header_image');
$thumbnail_image = get_the_post_thumbnail_url();

if ($thumbnail_image == "") {
    $thumbnail_image = $header_image;
}
if ($header_image == "") {
    $header_image = $thumbnail_image;
}

$header_thumb = get_thumb_link($header_image, ['width' => 1000, 'h' => 370]);
$thumbnail_thumb = get_thumb_link($thumbnail_image, ['width' => 500, 'h' => 500]);

?>

<article class="post-container row stack" id="post-<?php the_ID(); ?>" <?php post_class('blogpost-entry'); ?>>

    <?php if ($thumbnail_image != "" || $header_image != "") { ?>
        <div class="prev-image-container  small-12 large-4"><a class="prev-image"
                                                               href="<?php the_permalink(); ?>"
                                                               title="<?php the_title_attribute(); ?>">
                <?php //= "<img src='" . get_thumb_link(get_the_post_thumbnail_url(), ['width' => 500, 'h' => 500]) . "' alt=''/>"; ?>
                <img alt="" SRC="<?php echo $header_thumb; ?>"
                     data-interchange="[<?php echo $header_thumb; ?>, small], [<?php echo $thumbnail_thumb; ?>, large]">
            </a>
        </div>
        <?php
    } ?>

    <div class="small-12 <?php if ($thumbnail_image != "") {
        echo "large-8";
    } ?>">
        <div class="row vertical post">
        <span class="publish-meta-wrapper">
            <span
                class="publish-meta"><?php the_time(get_option('date_format'));//WORKAROUND the_date ONLY OUTPUTS ONCE A DATE ?></span>
            <span class="publish-meta last-small <?php if (!has_tag()) {
                echo " last";
            } ?>"><?php the_author_posts_link(); ?></span>
            <span class="publish-meta show-for-medium last tags"><?php the_tags('', '', ''); ?></span>
        </span>
            <h1><a class="blacklink" href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>
            <?php if (!empty(get_field('teaser_text'))) { ?>
                <div class="post-teaser-preview">
                    <?php the_field('teaser_text'); ?>
                </div>
                <?php if (!empty(get_the_content())) { ?>
                    <a class="align-self-bottom" href="<?php the_permalink(); ?>">
                        <div class="more align-self-bottom">MEHR</div>
                    </a>
                <?php } ?>
            <?php } else { ?>
                <div class="post-content">
                    <?php the_content("MEHR"); ?>
                </div>
            <?php } ?>
        </div>
    </div>
</article>
