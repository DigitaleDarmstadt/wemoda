<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 14.10.16
 * Time: 12:08
 */

function livestream_time_register($wp_customize)
{
    $wp_customize->add_setting(
        'wemoda_livestream_from', [
            'default' => '0001-01-01T00:00']
    );
    $wp_customize->add_control(
        'wemoda_livestream_from',
        array(
            'label'    => 'Livestreambutton sichtbar von',
            'section'  => 'title_tagline',
            'settings' => 'wemoda_livestream_from',
            'type'     => 'datetime-local',
        )
    );
    $wp_customize->add_setting(
        'wemoda_livestream_to', [
            'default' => '0001-01-01T00:00']
    );
    $wp_customize->add_control(
        'wemoda_livestream_to',
        array(
            'label'    => 'Livestreambutton sichtbar bis',
            'section'  => 'title_tagline',
            'settings' => 'wemoda_livestream_to',
            'type'     => 'datetime-local',
        )
    );
}

add_action('customize_register', 'livestream_time_register');