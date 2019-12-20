const TruckLoader = require("./truck.js");

const parseVerticesFix = require("./parseVerticesFix.js");
const path = require("path");

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update
    }
};

//Truck assets: https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1h5i465d8p3q4v6n41

//Boulder assets: https://www.freepik.com/free-vector/stones-cartoon_997676.htm

var game = new Phaser.Game(config);

const MapLoader = require("./MapLoader.js");

let map01 = new MapLoader("assets/world/maps/map_01/map_01.json");
let truckLoader = new TruckLoader();

async function preload ()
{
    //this.load.setBaseURL('http://localhost');

    truckLoader.preload(this.load);

    this.load.image('crate', 'assets/crates/crate_01.png');

    //this.load.image('background_1', 'assets/world/maps/background_01.png');
    await map01.preload(this.load);

    this.load.json('shapes', 'assets/truck/truck.json');
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

    parseVerticesFix(PhysicsEditorParser);

    await map01.create(this, shapes);

    this.objs = [];

    let truck = truckLoader.create(this.matter, shapes, 200, 200);

    this.objs.push(truck.chassis);
    this.objs.push(truck.backWheel);
    this.objs.push(truck.frontWheel);
    this.objs.push(this.matter.add.image(100, 0, 'crate', null, {shape: shapes.crate }));

    this.cameras.main.startFollow(truck.chassis, true, 1, 1, 0, 20);

    chassis = truck.chassis;
    backWheel = truck.backWheel;
    frontWheel = truck.frontWheel;
    let crate = this.objs[3];

    let SCALE = 0.3;

    for (var obj of this.objs) {
        obj.setScale(SCALE, SCALE);
    }

    aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    //this.add.image(50, 50, 'trucks');
}

async function update() {
    if (dKey.isDown) {
        Body.setAngularVelocity( backWheel.body, Math.PI/6);
        Body.setAngularVelocity( frontWheel.body, Math.PI/6);
        //chassis.applyForceFrom(chassis.body.position, new Phaser.Math.Vector2(50, 90));
    }
    if (aKey.isDown) {
        Body.setAngularVelocity( backWheel.body, -Math.PI/6);
        Body.setAngularVelocity( frontWheel.body, -Math.PI/6);

        //chassis.applyForceFrom(chassis.body.position, new Phaser.Math.Vector2(50, 90));
    }

    await map01.update(this.cameras.main);

    //clouds.tilePositionX += 0.1;
    //hills.tilePositionX = this.cameras.main.scrollX * 0.3;
    //trees.tilePositionX = this.cameras.main.scrollX * 0.5;
}
