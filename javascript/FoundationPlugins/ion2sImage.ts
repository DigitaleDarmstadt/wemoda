/**
 * Created by neko on 17.08.16.
 */
/// <reference path="../vendor/foundation.d.ts" />


(function ($) {
    class ion2sImage {
        constructor(public element: JQuery, public options: {}) {
            this._init();
            Foundation.registerPlugin(this, 'ion2sImage');
        }

        _init() {
            this.element.click(function (evt) {
                let modal = $("#media-modal");
                let modal_content = $("#media-modal-content");

                modal_content.html("");
                let i = new Image();
                var _this = this;
                i.onprogress = (event)=> {
                    let percentage = 0;
                    console.log(event);
                    if (event.lengthComputable) {
                        percentage = event.loaded / event.total * 100;
                    }
                    console.log(percentage);
                    _this.height(percentage + "%");
                };
                i.src = evt.currentTarget.href;
                modal_content.append(i);
                i.onload = () => modal.foundation('open');


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

    Foundation.plugin(ion2sImage, 'ion2sImage');
})(jQuery);