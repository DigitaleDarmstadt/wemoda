/**
 * Created by neko on 17.08.16.
 */
/// <reference path="../vendor/foundation.d.ts" />

    //YOUTUBE API: INSERT HERE FOR ONE JS LESS
//https://www.youtube.com/iframe_api
if (!window['YT']) {var YT = {loading: 0,loaded: 0};}if (!window['YTConfig']) {var YTConfig = {'host': 'http://www.youtube.com'};}if (!YT.loading) {YT.loading = 1;(function(){var l = [];YT.ready = function(f) {if (YT.loaded) {f();} else {l.push(f);}};window.onYTReady = function() {YT.loaded = 1;for (var i = 0; i < l.length; i++) {try {l[i]();} catch (e) {}}};YT.setConfig = function(c) {for (var k in c) {if (c.hasOwnProperty(k)) {YTConfig[k] = c[k];}}};var a = document.createElement('script');a.type = 'text/javascript';a.id = 'www-widgetapi-script';a.src = 'https:' + '//s.ytimg.com/yts/jsbin/www-widgetapi-vflLA-G2O/www-widgetapi.js';a.async = true;var b = document.getElementsByTagName('script')[0];b.parentNode.insertBefore(a, b);})();}
(function ($) {









class ion2sYoutube {
    constructor(public element:JQuery, public options:{}) {
        this._init();
        Foundation.registerPlugin(this, 'ion2sYoutube');
    }

    _init() {
        this.element.click(function (evt) {
            let obj = $(this);
            console.log(obj);
            let modal = $("#media-modal");
            let modal_content = $("#media-modal-content");

            modal_content.html("<div id='player'></div>");
            let player = new YT.Player('player', {
                videoId: obj.data('ion2s-youtube'),
                events: {
                    'onReady': (event)=>{
                        event.target.playVideo();
                        modal.foundation('open');
                    }
                }
            });


            evt.preventDefault();
        });
        this._events();
    }

    _events() {

    }

    destroy() {
        this.element.unbind('click');
        Foundation.unregisterPlugin(this);
    }
}
Foundation.plugin(ion2sYoutube, 'ion2sYoutube');
function onYouTubeIframeAPIReady() {

}
})(jQuery);