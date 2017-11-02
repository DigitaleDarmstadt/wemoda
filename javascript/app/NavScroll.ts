/**
 * Created by neko on 02.09.16.
 */

/// <reference path="../vendor/foundation.d.ts" />

// two //* first block, one /* second block
//*
function throttle(fn, threshold, scope) {
    threshold || (threshold = 250);
    var last, deferTimer;

    return function () {
        var context = scope || this;
        var now = +new Date, args = arguments;

        if (last && now < last + threshold) {
            // Hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}
const enum direction{
    up,
    down
}
let isMobile = false;
(function ($) {
    // let NavBarBlank = document.getElementById("Navigation");
    let NavBar = $("#nav-wrapper");
    let Dropdown = NavBar.find(".top-bar-left");
    let ResponsiveMenuButton = NavBar.find("[data-responsive-toggle='responsive-menu']");
    let oldposition = 0;
    $(window).scroll(throttle(function (event) {
        //window.scrollY
        let scrollPos = window.scrollY;
        if (!scrollPos) {
            scrollPos = document.documentElement.scrollTop;
        }
        let dir = (oldposition >= scrollPos) ? direction.up : direction.down;
        oldposition = scrollPos;

        //activate fix when scrolled higher than default ;3
        if(!isMobile){
            if(scrollPos < 0){
                console.log("ISMOBIDE");
                isMobile = true;
            }
        }

        //let NavTop = NavBar.offset().top;
        let NavHeight = NavBar.outerHeight();

        if (direction.down == dir) {
            if((Dropdown.css('display') != 'block' || ResponsiveMenuButton.css('display') != 'block' )&& !isMobile || (isMobile && scrollPos > 10))
            {//only scroll out of view when the menu is closed ;3
                NavBar.css({'top': (-NavHeight) + "px"});
            }else if(isMobile){
                NavBar.css({'top': 0 + "px"});
            }
            // let npos = NavTop;
            // if(NavTop + NavHeight < scrollPos) {
            //     npos = scrollPos - NavHeight;
            // }
            // NavBar.css({'position':'absolute','top':npos});
        } else {
            NavBar.css({'top': 0 + "px"});
            // if(NavTop > scrollPos) {
            // NavBar.css({'position': 'fixed', 'top': 0});
            // }
        }


        // let NavBot = (NavTop + NavHeight);
        // if (NavTop > scrollPos) {
        //     NavBarBlank.style.top = window.scrollY + "px";
        // } else if (NavBot < scrollPos) {
        //     NavBarBlank.style.top = window.scrollY - NavHeight + "px";
        // }
    },250));
})(jQuery);
/*/
 console.log("NEVER");
 function throttle(fn, threshold, scope) {
 threshold || (threshold = 250);
 var last, deferTimer;

 return function () {
 var context = scope || this;
 var now = +new Date, args = arguments;

 if (last && now < last + threshold) {
 // Hold on to it
 clearTimeout(deferTimer);
 deferTimer = setTimeout(function () {
 last = now;
 fn.apply(context, args);
 }, threshold);
 } else {
 last = now;
 fn.apply(context, args);
 }
 };
 }
 (function ($) {
 let NavBar = $("#Navigation");
 let time = 10;
 $(window).scroll(throttle(function () {
 //window.scrollY
 let scrollPos = window.scrollY;
 let NavTop = parseInt(NavBar.css('top'));
 let NavHeight = parseInt(NavBar.outerHeight());
 let NavBot = (NavTop + NavHeight);
 if (NavTop > scrollPos) {
 NavBar.animate({top: window.scrollY}, time);
 } else if (NavBot < scrollPos) {
 NavBar.animate({top: window.scrollY - NavHeight}, time);
 }
 }, time, this));

 })(jQuery);

 //*/