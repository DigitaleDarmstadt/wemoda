<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 01.09.16
 * Time: 12:09
 */


//CAUTION! nekothumber.php HAS TO BE IN PAGE ROOT, GENERATES thumbs FOLDER
function get_thumb_link($lnk, $size = null)
{
    $width = 185;
    $height = 185;

    if (!is_null($size)) {
        if (is_array($size)) {
            if(isset($size['w']))
                $width = $size['w'];
            if(isset($size['width']))
                $width = $size['width'];
            if(isset($size[0]))
                $width = $size[0];
            if(isset($size['h']))
                $height = $size['h'];
            if(isset($size['height']))
                $height = $size['height'];
            if(isset($size[1]))
                $height = $size[1];
        }else{
            $width = $height = (int) $size;
        }
    }
    $url = parse_url($lnk);
    //use own thumbnail generator because wordpress doesn't really works with custom sizes... sorry wordpress
    return get_template_directory_uri() . "/nekothumber.php?img=" . $url['path'] . "&width=$width&height=$height";
}