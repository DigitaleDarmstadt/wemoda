<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 02.09.16
 * Time: 15:58
 */

function background_color_register($wp_customize)
{
    $wp_customize->add_setting(
        'wemoda_hero_background', [
                                    'default' => '#cacaca']
    );
    $wp_customize->add_control(
        new WP_Customize_Color_Control(
            $wp_customize, 'wemoda_hero_background', [
                             'default'  => '#cacaca',
                             'label'    => "Die Hintergrundfarbe des Heros",
                             'section'  => 'title_tagline',
                             'settings' => 'wemoda_hero_background']
        )
    );
}

add_action('customize_register', 'background_color_register');