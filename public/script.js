const TRUCK_SCALE = 1.1;
const CRATE_SCALE = 0.6;
const START_CRATE_X = 52;
const START_CRATE_Y = 432;
const LEVEL = "02";
const TESTING = true;
const WHEEL_ANGULAR_VELOCITY = Math.PI / 8;


const TruckLoader = require("./truck.js");

const parseVerticesFix = require("./parseVerticesFix.js");
const path = require("path");

const UIController = require("./ui.js");
const MapLoader = require("./MapLoader.js");

const CrateLoader = require("./crates.js");
const Effects = require("./effects.js");

const { getRootBody } = require("./utils.js");

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

const configJson = require("../config.json");

var placements = 1;

var game = new Phaser.Game(config);



let maps = [ ...configJson.maps ];

async function createScene(mapId) {

    let truckLoader = new TruckLoader();
    let crateLoader = new CrateLoader();
    let effects = new Effects();
    let path = "assets/world/maps/" + mapId + "/" + mapId + ".json";
    let map = new MapLoader(path, await fetch(path).then(x => x.json()));

    var aKey;
    var dKey;

    var chassis;
    var backWheel;
    var frontWheel;
    var Body;

    var clouds;
    var hills;
    var trees;

    return new Phaser.Class({
        Extends: Phaser.Scene,
        key: mapId,
        loader: {},
        active: true,
        preload: async function preload ()
        {
            //this.load.setBaseURL('http://localhost');

            console.log(this.cache.json.get('shapes'));

            truckLoader.preload(this.load);
            crateLoader.preload(this.load);
            effects.preload(this.load);
            await map.preload(this.load, this.textures);

            this.load.json('shapes', 'assets/truck/truck.json');
        },

        create: async function create ()
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

            map.create(this, shapes);

            this.objs = [];

            truckLoader.scale(TRUCK_SCALE, TRUCK_SCALE);
            let truck = truckLoader.create(this.matter, shapes, 200, 470, 0.2);

            //this.objs.push(truck.chassis);
            //this.objs.push(truck.backWheel);
            //this.objs.push(truck.frontWheel);

            let i = 0;

            chassis = truck.chassis;
            backWheel = truck.backWheel;
            frontWheel = truck.frontWheel;

            let startCratePos = chassis.body.parts.find(x => x.label == "cratePosition").position;

            let CRATE_SIZE = 100 * CRATE_SCALE;
            for (var crateObj of gameState.crates) {
                let x = startCratePos.x + ((i % 2) * CRATE_SIZE);
                let y = startCratePos.y - (Math.floor((i / 2)) * CRATE_SIZE);

                crateLoader.create(this.matter, { x, y, shapes, type: crateObj.name, scale: CRATE_SCALE });

                i++;
            }

            this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
                if (gameState.paused)
                    return;

                let rootBodyA = getRootBody(bodyA);
                let rootBodyB = getRootBody(bodyB);

                if (bodyA.label == "finish" || bodyB.label == "finish") {
                    if (rootBodyA.label == "chassis" || rootBodyB.label == "chassis") {
                        UI.select("win");
                        UI.runFinishSequence(gameState);
                        gameState.paused = true;
                        console.log(gameState.crates);
                    }
                }
            });

            crateLoader.handleCollisions(this, truck.chassis, gameState);
            this.cameras.main.startFollow(truck.chassis, true, 1, 1, -200, 70);

            var config = {
                key: 'explode',
                frames: this.anims.generateFrameNumbers('explosion'),
                frameRate: 30,
                yoyo: false,
                repeat: 0
            };

            let anim = this.anims.create(config);

            aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            //this.add.image(50, 50, 'trucks');
        },

        update: async function update() {
            if (dKey.isDown) {
                Body.setAngularVelocity( backWheel.body, WHEEL_ANGULAR_VELOCITY);
                Body.setAngularVelocity( frontWheel.body, WHEEL_ANGULAR_VELOCITY);
            }
            if (aKey.isDown) {
                Body.setAngularVelocity( backWheel.body, -WHEEL_ANGULAR_VELOCITY);
                Body.setAngularVelocity( frontWheel.body, -WHEEL_ANGULAR_VELOCITY);
            }

            await map.update(this.cameras.main);

            //clouds.tilePositionX += 0.1;
            //hills.tilePositionX = this.cameras.main.scrollX * 0.3;
            //trees.tilePositionX = this.cameras.main.scrollX * 0.5;
        }
    });
}

async function run() {
    let scenes = await Promise.all(maps.map(x => {
        return createScene(x);
    }));

    for (let i = 0; i < scenes.length; i++) {
        game.scene.add(maps[i], scenes[i]);
    }
}

run();
//game.scene.start(maps[0]);

//game.scene.start("map_01");

//game.scene.remove(maps[0]);
//game.scene.start(maps[1]);//*/

const UI = new UIController({ onGameStart: () => {
    if (gameState.currentMap) {
        game.scene.remove(gameState.currentMap);
    }
    gameState.currentMap = maps.shift();

    gameState.time = gameState.currentMap.levelTime;

    gameState.paused = false;

    //game.scene.add(gameState.currentMap, createScene(gameState.currentMap));
    game.scene.start(gameState.currentMap);

    //UI.select("win");
    UI.hide();
    //UI.runFinishSequence(gameState);
//    game.scene.restart("main");
} });

const gameState = {
    money: configJson.startMoney,
    crates: [configJson.crates[2]],
    currentMap: null,
    time: configJson.maps[0].levelTime * 1000,
    paused: false
};

UI.crateSelector(gameState, () => {

});

UI.updateId("money", "£" + gameState.money);

UI.select("win");
UI.runFinishSequence(gameState);
