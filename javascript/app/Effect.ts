/**
 * Created by neko on 18.08.16.
 */
/// <reference path="../vendor/jquery.d.ts" />
(function($) {
let particles = ["/img/pointer_01.png",
    "/img/cloud_01.png",
    "/img/symbol_01.png",
];

function getParticle():string {
    return particles[Math.floor(Math.random() * particles.length)];
}


let effectFadeObject = $(".effect-fade-spawn");

class FadeParticle {
    obj:JQuery;
    x:number;
    y:number;
    opacity:number;
    interval:number;
    decay:boolean;
    speed:number;

    constructor(public parent:JQuery, img:string) {
        this.obj = $("<img class='pointer' src='" + img + "'/>");
        parent.append(this.obj);
        this.opacity = 0;
        this.decay = false;

        this.x = Math.random() * parent.width();
        this.y = Math.random() * parent.height();

        let size = 20 + Math.random() * 20;
        this.speed = Math.floor(3 + 3 * Math.random());
        this.obj.css({left: this.x, top: this.y});
        if (Math.random() > 0.5) {
            this.obj.css({height: size + "px"});
        } else {
            this.obj.css({width: size + "px"});
        }
        let degree = Math.random() * 360;
        this.obj.css({
            '-webkit-transform': 'rotate(' + degree + 'deg)',
            '-moz-transform': 'rotate(' + degree + 'deg)',
            '-ms-transform': 'rotate(' + degree + 'deg)',
            '-o-transform': 'rotate(' + degree + 'deg)',
            'transform': 'rotate(' + degree + 'deg)',
            'zoom': 1
        });

        this.interval = setInterval(() => this.move(), 200);

        setTimeout(() => this.obj.show(), 250);
    }

    move() {
        if (this.decay) {
            if (this.opacity <= 0) {
                clearInterval(this.interval);
                this.obj.remove();
            }
            this.opacity -= this.speed;
        } else {
            this.opacity += this.speed;
            if (this.opacity >= 100) {
                this.decay = true;
            }
        }
        this.obj.css({opacity: this.opacity * 0.01});
    }

}

function createFadeParticle() {
    effectFadeObject.each(function(){
        new FadeParticle($(this), getParticle());
    });
}


function createParticleAgain() {
    createFadeParticle();
    setTimeout(createParticleAgain, 250 + Math.random() * 750);
}

// TODO: ACTIVATE
// createParticleAgain();

})( jQuery );