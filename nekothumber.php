<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 24.08.16
 * Time: 17:29
 */

$size = 185;
$newWidth = $size;
$newHeight = $size;
if (!isset($_GET['img'])) {
    die("ERROR");
}
if (isset($_GET['size'])) {
    $size = $_GET['size'];
    $newWidth = $size;
    $newHeight = $size;
} elseif (isset($_GET['width']) && isset($_GET['height'])) {
    $newWidth = $_GET['width'];
    $newHeight = $_GET['height'];
} elseif (isset($_GET['width'])) {
    $size = $_GET['width'];
    $newWidth = $size;
    $newHeight = $size;
} elseif (isset($_GET['height'])) {
    $size = $_GET['height'];
    $newWidth = $size;
    $newHeight = $size;
}
$imageFile = $_SERVER['DOCUMENT_ROOT'] . $_GET['img'];
if (!file_exists($imageFile)) {
    die("cannot find image...");
}
$thumbFile =dirname(__FILE__) . "/thumbs" . $_GET['img'] . "." . $newWidth . "x" . $newHeight . ".thumb.jpeg";
// --- /some/image/blob.png -> /thumbs/some/image/blob.png.250.thumb.jpeg
if (!file_exists(dirname($thumbFile))) {
    mkdir(dirname($thumbFile), 0777, true);
}


if (file_exists($thumbFile) && filemtime($thumbFile) > filemtime($imageFile)) {
    //preview younger (higher creation time) than original image
    header('Content-Type: image/jpeg');
    readfile($thumbFile);
} else {
    //GENERATE IF NOT EXIST

// Neue Größe berechnen
    list($width, $height) = getimagesize($imageFile);

    $sx = 0;
    $sy = 0;
    $factoredWidth = $width;
    $factoredHeight = $height;
    if ($width / $newWidth < $height / $newHeight) {
        $factor = $width / $newWidth;
        $factoredHeight = $newHeight * $factor;
        $sy = ($height - $factoredHeight) / 2;
    } else {
        $factor = $height / $newHeight;
        $factoredWidth = $newWidth * $factor;
        $sx = ($width - $factoredWidth) / 2;
    }
// Bild laden
    $thumb = imagecreatetruecolor($newWidth, $newHeight);
    imagefill($thumb, 0, 0, imagecolorallocatealpha($thumb,255,255,255,0));
    $source = false;
    if (strpos($imageFile, '.png')) {
        $source = imagecreatefrompng($imageFile);
    }
    if (strpos($imageFile, '.jpeg') || strpos($imageFile, '.jpg')) {
        $source = imagecreatefromjpeg($imageFile);
    }
    if (!$source) {
        die("CANNOT LOAD IMAGE...");
    }

// Skalieren
    if (!imagecopyresized($thumb, $source, 0, 0, $sx, $sy, $newWidth, $newHeight, $factoredWidth, $factoredHeight)) {
        die("resize");
    }

// Ausgabe
    if (!@imagejpeg($thumb, $thumbFile)) {
        header('CACHE: error, could not save thumb... will regenerate every time...:');
    }
    header('Content-Type: image/jpeg');
    if (!imagejpeg($thumb)) {
        die("render");
    }
}