<?php
/**
 * Created by PhpStorm.
 * User: neko
 * Date: 05.09.16
 * Time: 11:47
 */
if (function_exists("register_field_group")) {
    register_field_group([
        'id'         => 'acf_autoren-talks',
        'title'      => 'Autoren (Talks)',
        'fields'     => [
            [
                'key'   => 'field_57c414cb4ffae',
                'label' => 'Autoren',
                'name'  => 'autoren',
                'type'  => 'authors',
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'post',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'normal',
            'layout'         => 'no_box',
            'hide_on_screen' => [
            ],
        ],
        'menu_order' => 0,
    ]);
    register_field_group([
        'id'         => 'acf_cats',
        'title'      => 'Cats',
        'fields'     => [
            [
                'key'            => 'field_57beecc4c02fe',
                'label'          => 'Datum',
                'name'           => 'date',
                'type'           => 'date_picker',
                'required'       => 1,
                'date_format'    => 'yymmdd',
                'display_format' => 'dd.mm.yy',
                'first_day'      => 1,
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'ef_taxonomy',
                    'operator' => '==',
                    'value'    => 'category',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'acf_after_title',
            'layout'         => 'default',
            'hide_on_screen' => [
                0 => 'permalink',
                1 => 'excerpt',
                2 => 'custom_fields',
                3 => 'discussion',
                4 => 'comments',
                5 => 'revisions',
                6 => 'slug',
                7 => 'format',
                8 => 'tags',
                9 => 'send-trackbacks',
            ],
        ],
        'menu_order' => 0,
    ]);
    register_field_group([
        'id'         => 'acf_teaser',
        'title'      => 'Teaser',
        'fields'     => [
            [
                'key'          => 'field_57cfd20348a2a',
                'label'        => 'Header Bild',
                'name'         => 'header_image',
                'type'         => 'image',
                'instructions' => 'Dieses Bild wird über dem Beitrag angezeigt... es sollte nichts Wichtiges enthalten und den Leser nur zum lesen anregen.',
                'save_format'  => 'url',
                'preview_size' => 'full',
                'library'      => 'all',
            ],
            [
                'key'           => 'field_57c3dc706705b',
                'label'         => 'Teaser',
                'name'          => 'teaser_text',
                'type'          => 'textarea',
                'default_value' => '',
                'placeholder'   => '',
                'maxlength'     => '',
                'rows'          => '',
                'formatting'    => 'none',
            ],
            [
                'key'           => 'field_57c3dc886705c',
                'label'         => 'im Beitrag?',
                'name'          => 'teaser_in_post',
                'type'          => 'true_false',
                'instructions'  => 'Soll der Teaser auch im Beitrag zu sehen sein?',
                'message'       => '',
                'default_value' => 1,
            ],
            [
                'key'           => 'field_67c3dc886705c',
                'label'         => 'Kurzbeitrag?',
                'name'          => 'fuenfminutenbeitrag',
                'type'          => 'true_false',
                'instructions'  => 'Ist dies ein Kurzbeitrag? (nur relevant bei Talks)<br>Dies färbt den Beitrag grau und stellt ihn ans Ende. Außerdem werden keine Autoren angezeigt und es gibt kein ausklappbares Content-Element (Der gesamte Inhalt wird direkt ausgegeben)',
                'message'       => '',
                'default_value' => 0,
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'post',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'acf_after_title',
            'layout'         => 'no_box',
            'hide_on_screen' => [
                0 => 'excerpt',
                1 => 'custom_fields',
                2 => 'revisions',
                3 => 'slug',
                4 => 'format',
                5 => 'categories',
                6 => 'tags',
                7 => 'send-trackbacks',
            ],
        ],
        'menu_order' => 0,
    ]);
    register_field_group([
        'id'         => 'acf_veranstaltung',
        'title'      => 'Veranstaltung',
        'fields'     => [
            [
                'key'             => 'field_57beee46ade57',
                'label'           => 'Veranstaltung',
                'name'            => 'veranstaltung',
                'type'            => 'taxonomy',
                'instructions'    => 'Wenn hier eine Veranstaltung ausgewählt wurde, dann wird dieser Post/dieses Media Objekt auf der Frontseite angezeigt und nicht mehr im Blog.',
                'taxonomy'        => 'category',
                'field_type'      => 'select',
                'allow_null'      => 0,
                'load_save_terms' => 0,
                'return_format'   => 'id',
                'multiple'        => 0,
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'ef_media',
                    'operator' => '==',
                    'value'    => 'all',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'post',
                    'order_no' => 0,
                    'group_no' => 1,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'side',
            'layout'         => 'default',
            'hide_on_screen' => [
                0  => 'permalink',
                1  => 'excerpt',
                2  => 'custom_fields',
                3  => 'discussion',
                4  => 'comments',
                5  => 'slug',
                6  => 'author',
                7  => 'format',
                8  => 'categories',
                9  => 'tags',
                10 => 'send-trackbacks',
            ],
        ],
        'menu_order' => 0,
    ]);
    register_field_group([
        'id'         => 'acf_youtube',
        'title'      => 'Youtube',
        'fields'     => [
            [
                'key'           => 'field_57c7e3bb9a129',
                'label'         => 'Youtube Link',
                'name'          => 'youtube_link',
                'type'          => 'text',
                'instructions'  => 'Wenn du hier einen Youtube-link einfügst, dann wird das Bild als Vorschau verwendet und es öffnet sich ein Youtube-video beim Klicken.
	Erlaubte Formate sind Langer Link/Kurzlink/ID:
	https://www.youtube.com/watch?v=00KBHNy4kW4
	https://youtu.be/00KBHNy4kW4
	00KBHNy4kW4',
                'default_value' => '',
                'placeholder'   => 'Leer lassen wenn kein dies Youtube-Thumbnail ist',
                'prepend'       => '',
                'append'        => '',
                'formatting'    => 'none',
                'maxlength'     => '',
            ],
            [
                'key'          => 'field_57c7f426be827',
                'label'        => '',
                'name'         => 'validated_youtube_link',
                'type'         => 'hidden',
                'instructions' => 'Hier wird die VideoID gespeichert, sobald sie bestätigt ist...',
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'ef_media',
                    'operator' => '==',
                    'value'    => 'all',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'acf_after_title',
            'layout'         => 'default',
            'hide_on_screen' => [
            ],
        ],
        'menu_order' => 0,
    ]);
    register_field_group([
        'id'         => 'acf_autoaccepter',
        'title'      => 'AutoAccepter',
        'fields'     => [
            [
                'key'           => 'field_57d7d4e254c44',
                'label'         => 'Überschrift zur Anmeldung',
                'name'          => 'ticket_title',
                'type'          => 'text',
                'required'      => 1,
                'default_value' => '',
                'placeholder'   => 'e.g. Anmeldung zum Webmontag:',
                'prepend'       => '',
                'append'        => '',
                'formatting'    => 'html',
                'maxlength'     => '',
            ],
            [
                'key'           => 'field_57d7ac4f7c5f1',
                'label'         => '',
                'name'          => 'automatic_accept',
                'type'          => 'number',
                'default_value' => 400,
                'required'      => 1,
                'placeholder'   => '',
                'prepend'       => 'Automatische Annahmen:',
                'append'        => '',
                'min'           => '',
                'max'           => '',
                'step'          => '',
            ],
            [
                'key'           => 'field_57d7b2b90323f',
                'label'         => 'Offene Plätze',
                'name'          => 'open_tickets_text',
                'type'          => 'textarea',
                'required'      => 1,
                'default_value' => '',
                'placeholder'   => 'Dieser Text wird angezeigt, wenn noch offene Plätze verfügbar sind. | Platzhalter: [gebucht] [maximal] [frei]',
                'maxlength'     => '',
                'rows'          => 3,
                'formatting'    => 'br',
            ],
            [
                'key'           => 'field_57d7b2e803240',
                'label'         => 'Geschlossene Tickets',
                'name'          => 'close_tickets_text',
                'type'          => 'textarea',
                'required'      => 1,
                'default_value' => '',
                'placeholder'   => 'Dieser Text wird angezeigt, wenn alle Plätze ausgebucht sind (Automatische Annahme). Von hier an werden neue Anfragen in die Warteschlange eingereiht. | Platzhalter: [gebucht] [maximal] [frei]',
                'maxlength'     => '',
                'rows'          => 3,
                'formatting'    => 'br',
            ],
        ],
        'location'   => [
            [
                [
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'event',
                    'order_no' => 0,
                    'group_no' => 0,
                ],
            ],
        ],
        'options'    => [
            'position'       => 'side',
            'layout'         => 'default',
            'hide_on_screen' => [],
        ],
        'menu_order' => 0,
    ]);

}
