/**
 * Created by neko on 17.08.16.
 */
/// <reference path="../vendor/foundation.d.ts" />
// (function ($) {
// class ion2sToggle{
//     constructor(public element: JQuery,public options: {}){
//         this._init();
//         Foundation.registerPlugin(this, 'ion2sToggle');
//     }
//
//     _init(){
//         this.element.click(function (evt) {
//             let obj = $(this);
//             let target = obj;
//             let num = parseInt(obj.data('ion2s-target'));
//             if (num) {
//                 while (num > 0) {
//                     target = target.next();
//                     --num;
//                 }
//                 while (num < 0) {
//                     target = target.prev();
//                     ++num;
//                 }
//             }
//             target.toggleClass(obj.data('ion2s-toggle'));
//             let alt = obj.data('ion2s-alt-content');
//             if (alt) {
//                 obj.data('ion2s-alt-content', obj.html());
//                 obj.html(alt);
//             }
//         });
//         this._events();
//     }
//     _events(){
//
//     }
//     destroy(){
//         this.element.unbind('click');
//         Foundation.unregisterPlugin(this);
//     }
// }
//
// Foundation.plugin(ion2sToggle, 'ion2sToggle');
// })(jQuery);

(function ($) {
    $(".toggler").click(function () {
        let _this = $(this);
        if (_this.hasClass("toggleme")) {
            _this.toggleClass("toggled");
        } else {
            _this.siblings(".toggleme").toggleClass("toggled");
        }
        let exchangeText: string = _this.data("toggle");
        if (exchangeText == "") {
            _this.data("toggle", _this.html());
            return;
        }
        _this.data("toggle", _this.html());
        _this.html(exchangeText);
    });
})(jQuery);

