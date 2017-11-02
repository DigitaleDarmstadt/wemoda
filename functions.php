<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 11:45
 */

include "settings.php";

foreach (glob(__DIR__ . "/php/*/*.php") as $filename)
{
    include_once $filename;
}