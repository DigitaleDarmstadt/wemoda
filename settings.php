<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 29.08.16
 * Time: 15:21
 */

$monthnames = [
    1=>'Januar',
    2=>'Februar',
    3=>'März',
    4=>'April',
    5=>'Mai',
    6=>'Juni',
    7=>'Juli',
    8=>'August',
    9=>'September',
    10=>'Oktober',
    11=>'November',
    12=>'Dezember',
];

function monthnames($month){
    global $monthnames;
    return $monthnames[(int)$month];
}