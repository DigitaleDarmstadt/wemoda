/**
 * Created by neko on 26.08.16.
 */
/// <reference path="../vendor/jquery.d.ts" />

declare var _:any;

( function ($) {

    // function colorPicker(){
    //     $(".color-field").wpColorPicker();
    // }
    // $( document ).on( 'widget-added widget-updated', (event,widget)=>{
    //     console.log(event,widget);
    //     widget.find('.color-field').wpColorPicker();
    // });
    // $(".color-field").ready((event)=>{
    //     console.log(event);
    //     event.target.wpColorPicker();
    // });

    function initColorPicker(widget) {
        widget.find('.color-field').wpColorPicker({
            change: _.throttle(function () {
                $(this).trigger('change');
            }, 700, {leading: false}),
            palettes: ['#000000',//WEIß
                '#FFFFFF',//SCHWARZ
                '#F9B000',//ORANGE
                '#97C666',//GRÜN
                '#5FC4E0',//BLAU
                '#C3D200',//LEMON
                '#77C4B0',//GRÜNBLAU
                '#FFED00',//GELB
            ]
        });
    }

    // function initDatePicker(widget) {
    //     widget.find('.date-field').datepicker({
    //         dateFormat: 'dd.mm.yy',
    //         change: $.throttle(function () {
    //             $(this).trigger('change');
    //         }, 700)
    //     }).each((i,o)=>{console.log(i,o);});
    // }

    function onFormUpdate(event, widget) {
        console.log("EVENT:", event, widget);
        initColorPicker(widget);
        // initDatePicker(widget);
    }

    $(document).on('widget-added widget-updated', onFormUpdate);

    $(document).ready(function () {
        $('#widgets-right .widget:has(.color-field)').each(function () {
            initColorPicker($(this));
        });
        // $('#widgets-right .widget:has(.date-field)').each(function () {
        //     initDatePicker($(this));
        // });

    });
    // console.log($('.date-field'));
    // $('.date-field').datepicker({
    //     dateFormat: 'dd.mm.yyyy'
    // });

}(jQuery) );

// jQuery(document).ready(function() {
// });