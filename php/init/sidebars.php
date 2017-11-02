<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 25.08.16
 * Time: 15:25
 */

function wemoda_register_sidebars()
{
    register_sidebar([
                         'name'          => 'Kronkorken',
                         'id'            => "hero-bubble",
                         'description'   => 'Passe das Datum, Zeit, Ort und Farbe des Kronkorken an',
                         'class'         => '',
                         'before_widget' => '',
                         'after_widget'  => "\n",
                         'before_title'  => '',
                         'after_title'   => "\n",
                     ]);
    register_sidebar([
                         'name'          => 'Veranstalter Logos',
                         'id'            => "hoster-logos",
                         'description'   => '',
                         'class'         => '',
                         'before_widget' => '',
                         'after_widget'  => "\n",
                         'before_title'  => '',
                         'after_title'   => "\n",
                     ]);
    register_sidebar([
                         'name'          => 'Sponsoren Logos',
                         'id'            => "sponsors-logos",
                         'description'   => '',
                         'class'         => '',
                         'before_widget' => '',
                         'after_widget'  => "\n",
                         'before_title'  => '',
                         'after_title'   => "\n",
                     ]);
}

add_action('widgets_init', 'wemoda_register_sidebars');