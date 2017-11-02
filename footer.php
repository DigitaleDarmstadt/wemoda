<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:46
 */

?>
<footer id="Footer">
    <div class="hoster">
        <h3>Veranstalter</h3>
        <a href="http://www.digitale-darmstadt.de/" class="under-link" id="Digitale-Darmstadt-footer" target="_blank" rel="noopener noreferrer">Digitale
            Darmstadt e.V.</a>
        <div class="hoster-logos">
            <?php dynamic_sidebar('hoster-logos'); ?>
        </div>
    </div>

    <div class="grey">
        <div class="arrow-ltr toggleme toggler">
            IMPRESSUM
        </div>
        <div class="impressum">
            <?php
            echo apply_filters('the_content', get_page_by_path('impressum')->post_content);
            ?>
        </div>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
