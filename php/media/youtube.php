<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 01.09.16
 * Time: 11:02
 */


function validYoutube($videoID)
{
    $theURL = "http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=$videoID&format=json";
    $headers = get_headers($theURL);

    if (substr($headers[0], 9, 3) !== "404") {
        return true;
    } else {
        return false;
    }
}
