/**
 * Created by neko on 16.09.16.
 */

/// <reference path="../vendor/jquery.d.ts" />
declare var stylesheet_directory_uri: string;
(function ($) {
    let particle_files = [
        stylesheet_directory_uri + "/img/icons/p001.png",
        stylesheet_directory_uri + "/img/icons/p002.png",
        stylesheet_directory_uri + "/img/icons/p003.png",
        stylesheet_directory_uri + "/img/icons/p004.png",
        stylesheet_directory_uri + "/img/icons/p005.png",
        stylesheet_directory_uri + "/img/icons/p006.png",
        stylesheet_directory_uri + "/img/icons/p007.png",
        stylesheet_directory_uri + "/img/icons/p008.png",
        stylesheet_directory_uri + "/img/icons/p009.png",
        stylesheet_directory_uri + "/img/icons/p010.png",
        stylesheet_directory_uri + "/img/icons/p011.png",
        stylesheet_directory_uri + "/img/icons/p012.png",
        stylesheet_directory_uri + "/img/icons/p013.png",
        stylesheet_directory_uri + "/img/icons/p014.png",
        stylesheet_directory_uri + "/img/icons/p015.png",
        stylesheet_directory_uri + "/img/icons/p016.png",
        stylesheet_directory_uri + "/img/icons/p017.png",
        stylesheet_directory_uri + "/img/icons/p018.png",
        stylesheet_directory_uri + "/img/icons/p019.png",
        stylesheet_directory_uri + "/img/icons/p020.png",
        stylesheet_directory_uri + "/img/icons/p021.png",
        stylesheet_directory_uri + "/img/icons/p022.png",
        stylesheet_directory_uri + "/img/icons/p023.png",
        stylesheet_directory_uri + "/img/kontakt-pfeile-links.svg",
        stylesheet_directory_uri + "/img/kontakt-pfeile-rechts.svg",
        stylesheet_directory_uri + "/img/hero-stage-pfeile.svg",
        stylesheet_directory_uri + "/img/wemoda_hero_V20161121.svg",
        stylesheet_directory_uri + "/img/wemoda_hero_V20170410.svg",
    ];
    function getFile():string {
        return particle_files[Math.floor(Math.random() * particle_files.length)];
    }
    let hero_anchor = $(".next-container");
    let hero_base = $("#Hero");
    let contact_anchor = $(".contact-container");
    let contact_base = $("#Kontakt");


    class Particle {
        obj: JQuery;

        constructor(public parent: JQuery, img: string,
                    public x: any = Math.random() * parent.width(),
                    public y: any= Math.random() * parent.width(),
                    public size: number = 20 + Math.random() * 20,
                    public degree: number = Math.random() * 360) {
            this.obj = $("<img class='pointer' src='" + img + "'/>");
            parent.append(this.obj);

            this.scale();
            this.rotate();
            this.move();


            setTimeout(() => this.obj.show(), 10);
        }

        rotate(degree: number = this.degree) {
            this.obj.css({
                '-webkit-transform': 'rotate(' + degree + 'deg)',
                '-moz-transform': 'rotate(' + degree + 'deg)',
                '-ms-transform': 'rotate(' + degree + 'deg)',
                '-o-transform': 'rotate(' + degree + 'deg)',
                'transform': 'rotate(' + degree + 'deg)',
                'zoom': 1
            });
        }

        scale(size: number = this.size) {
            this.obj.css({height: size});
        }

        move(x: number = this.x, y: number = this.y) {
            this.obj.css({left: this.x, top: this.y});
        }
    }

    let particles = [
        // //big below
        // new Particle(contact_anchor,particle_files[0],"80%","80%",80,-14),
        // new Particle(contact_anchor,particle_files[0],"10%","80%",90,55),
        //
        // //big above
        // new Particle(contact_anchor,particle_files[15],"80%","-10%",120,-136),
        // new Particle(contact_anchor,particle_files[1],"0%","-15%",100,-192),
        //
        // //right
        // new Particle(contact_anchor,particle_files[0],"100%","35%",45,-114),
        // new Particle(contact_anchor,particle_files[4],"109%","55%",50,-51),
        // new Particle(contact_anchor,particle_files[0],"122%","40%",67,-79),
        // new Particle(contact_anchor,particle_files[0],"100%","67%",83,-34),
        // new Particle(contact_anchor,particle_files[7],"112%","10%",80,-106),
        //
        // //left
        // new Particle(contact_anchor,particle_files[0],"0%","65%",57,87),
        // new Particle(contact_anchor,particle_files[0],"0%","25%",45,114),
        // new Particle(contact_anchor,particle_files[4],"-17%","15%",55,139),
        // new Particle(contact_anchor,particle_files[0],"-20%","65%",67,79),
        // new Particle(contact_anchor,particle_files[0],"-15%","83%",87,66),
        // new Particle(contact_anchor,particle_files[7],"-35%","40%",86,106),
        //
        //
        //
        // //HERO right
        // new Particle(hero_anchor,particle_files[0],"100%","30%",45,-95),
        // new Particle(hero_anchor,particle_files[4],"100%","45%",50,-51),
        // new Particle(hero_anchor,particle_files[0],"132%","0%",67,-108),
        // new Particle(hero_anchor,particle_files[0],"136%","26%",83,-86),
        // new Particle(hero_anchor,particle_files[7],"81%","2%",85,-120),
        // new Particle(hero_anchor,particle_files[0],"152%","7%",67,-95),
        // new Particle(hero_anchor,particle_files[15],"118%","26%",37,-101),
        // new Particle(hero_anchor,particle_files[0],"185%","0%",67,-104),
        // new Particle(hero_anchor,particle_files[11],"166%","18%",54,-78),
        //
        //
        // //HERO icons
        // new Particle(hero_anchor,particle_files[21],"109%","-6%",95,-5),
        // new Particle(hero_anchor,particle_files[20],"116%","51%",56,11),
        // new Particle(hero_anchor,particle_files[22],"159%","-9%",67,-24),
        // new Particle(hero_anchor,particle_files[19],"177%","29%",67,-24),
        // new Particle(hero_anchor,particle_files[18],"187%","-24%",50,0),
        new Particle(contact_anchor,particle_files[23],"-53%","20%","55%",0),
        new Particle(contact_anchor,particle_files[24],"82%","12%","80%",0),
        new Particle(hero_anchor,particle_files[27],"86%","-43%","132%",0),
    ];
    console.log(particles);
})(jQuery);