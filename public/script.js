const SCALE = 1.1;

const TruckLoader = require("./truck.js");

const parseVerticesFix = require("./parseVerticesFix.js");
const path = require("path");

const $ = require("jquery");

var config = {
    autoPlay: false,
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: true
        }
    }
};

//Truck assets: https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1h5i465d8p3q4v6n41

//Boulder assets: https://www.freepik.com/free-vector/stones-cartoon_997676.htm

//Cabbage for crate:  https://webstockreview.net/explore/cabbage-clipart-cartoon/

//Diamond: https://opengameart.org/content/diamond

const CRATES = [
    {
        "name": "cabbage",
        "path": "Cabbage.png",
        "price": "200",
        "reward": "300"
    },
    {
        "name": "diamond",
        "path": "Diamond.png",
        "price": "1000",
        "reward": "1500"
    },
    {
        "name": "explosives",
        "path": "Explosives.png",
        "price": "1000",
        "reward": "2000"
    }
];

var crates = [];
var placements = 1;

for (var crate of CRATES) {
    var $crate = $('<div class="crate" name="' + crate.name + '">' +
                        '<img src="assets/world/crates/' + crate.path + '" />' +
                        '<div class="price">- £' + crate.price + '</div>' +
                        '<div class="reward">+ £' + crate.reward + '</div>' +
                        '</div>');

    $crate.hover((crate => e => {
        $(".crate-placement.active").append('<img src="assets/world/crates/' + crate.path + '" />');
    })(crate), function () {
        $(".crate-placement.active").empty();
    });

    $crate.click((crate => e => {
        $(".crate-placement.active").removeClass("active");

        placements++;

        crates.push(crate);

        $("#placements").append('<div class="crate-placement pos-' + placements + ' active"><img src="assets/world/crates/' + crate.path + '" /></div>');
    })(crate));

    $("#crates").append($crate);
}

var game = new Phaser.Game(config);

game.scene.add("main", {
    preload: preload,
    create: create,
    update
});

$("#start-game").click(e => {
    $("#main-menu").addClass("d-none");
    $("#loadout").toggleClass("d-none");
});

$("#start-game-loadout").click(e => {
    $("#menu").addClass("d-none");
    game.scene.start("main");
});

//game.scene.start("boot");

const MapLoader = require("./MapLoader.js");

let map01 = new MapLoader("assets/world/maps/map_01/map_01.json");
let truckLoader = new TruckLoader();

async function preload ()
{
    //this.load.setBaseURL('http://localhost');

    truckLoader.preload(this.load);

    this.load.image('crate_diamond', 'assets/world/crates/Diamond.png');
    this.load.image('crate_explosives', 'assets/world/crates/Explosives.png');
    this.load.image('crate_cabbage', 'assets/world/crates/Cabbage.png');

    //this.load.image('background_1', 'assets/world/maps/background_01.png');
    await map01.preload(this.load);

    this.load.json('shapes', 'assets/truck/truck.json');

    this.load.spritesheet('explosion', 'assets/animations/boom3.png', {frameWidth: 128, frameHeight: 128 });
}

var aKey;
var dKey;

var chassis;
var backWheel;
var frontWheel;
var Body;

var clouds;
var hills;
var trees;

async function create ()
{
    var shapes = this.cache.json.get('shapes');

    Body = Phaser.Physics.Matter.Matter.Body;
    Vector = Phaser.Physics.Matter.Matter.Vector;
    Common = Phaser.Physics.Matter.Matter.Common;
    Vertices = Phaser.Physics.Matter.Matter.Vertices;
    Bounds = Phaser.Physics.Matter.Matter.Bounds;
    PhysicsEditorParser = Phaser.Physics.Matter.PhysicsEditorParser;
    let Vector2 = Phaser.Math.Vector2;
    parseVerticesFix(PhysicsEditorParser);

    await map01.create(this, shapes);

    this.objs = [];

    truckLoader.scale(1.2, 1.2);
    let truck = truckLoader.create(this.matter, shapes, 200, 470, 0.2);

    this.objs.push(truck.chassis);
    this.objs.push(truck.backWheel);
    this.objs.push(truck.frontWheel);

    let i = 0;

    for (var crateObj of crates) {
        let x = -30 + 200 + ((i % 2) * 50);
        let y = 432 - (Math.floor((i / 2)) * 50);
        let obj = this.matter.add.image(x, y, 'crate_' + crateObj.name, null, {shape: shapes.crate });
        obj.setScale(0.5);
        obj.body.label = 'crate_' + crateObj.name + "_" + i;
        i++;
    }

    function getRootBody (body)
    {
        if (body.parent === body) { return body; }
        while (body.parent !== body)
        {
            body = body.parent;
        }
        return body;
    }

    function getCrateType(body) {
        return body.label.includes("crate_") ? body.label.split("_")[1] : null;
    }

    chassis = truck.chassis;
    backWheel = truck.backWheel;
    frontWheel = truck.frontWheel;

    this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
        bodyA = getRootBody(bodyA);
        bodyB = getRootBody(bodyB);

        if ((getCrateType(bodyA) && bodyB.label == "foreground") || (getCrateType(bodyB) && bodyA.label == "foreground")) {
            let crateBody = getCrateType(bodyA) ? bodyA : bodyB;
            let crateType = getCrateType(bodyA) || getCrateType(bodyB);

            if (crateType == "explosives") {
                let sprite = this.add.sprite(crateBody.gameObject.x, crateBody.gameObject.y - 50, 'exploding').setScale(2);

                sprite.once('animationcomplete', () => {
                    sprite.destroy();
                });

                sprite.anims.load('explode');
                sprite.anims.play('explode');

                let dx = chassis.x - crateBody.gameObject.x;
                let dy = chassis.y - crateBody.gameObject.y;

                let dist = Math.sqrt((dx * dx) + (dy * dy));

                let force = 50 / (dist / 100);

                chassis.setVelocity((dx/dist) * force, (dy/dist) * force);

                crateBody.gameObject.destroy();
            }
        }
    });

    this.cameras.main.startFollow(truck.chassis, true, 1, 1, -200, 70);


    let crate = this.objs[3];

    let SCALE = 1;

    for (var obj of this.objs) {
        //obj.setScale(SCALE, SCALE);
    }

    var config = {
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion'),
        frameRate: 24,
        yoyo: false,
        repeat: 0
    };

    let anim = this.anims.create(config);

    aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    //this.add.image(50, 50, 'trucks');
}

async function update() {
    const FORCE = Math.PI / 10;
    if (dKey.isDown) {
        Body.setAngularVelocity( backWheel.body, FORCE);
        Body.setAngularVelocity( frontWheel.body, FORCE);
        //chassis.applyForceFrom(chassis.body.position, new Phaser.Math.Vector2(50, 90));
    }
    if (aKey.isDown) {
        Body.setAngularVelocity( backWheel.body, -FORCE);
        Body.setAngularVelocity( frontWheel.body, -FORCE);

        //chassis.applyForceFrom(chassis.body.position, new Phaser.Math.Vector2(50, 90));
    }

    await map01.update(this.cameras.main);

    //clouds.tilePositionX += 0.1;
    //hills.tilePositionX = this.cameras.main.scrollX * 0.3;
    //trees.tilePositionX = this.cameras.main.scrollX * 0.5;
}
