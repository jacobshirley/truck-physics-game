const TRUCK_SCALE = 1.1;
const CRATE_SCALE = 0.4;
const START_CRATE_X = 52;
const START_CRATE_Y = 432;
const LEVEL = "02";
const TESTING = true;
const WHEEL_ANGULAR_VELOCITY = Math.PI / 8;


const TruckLoader = require("./truck.js");

const parseVerticesFix = require("./parseVerticesFix.js");
const path = require("path");

const UIController = require("./ui.js");
const MapLoader = require("./maps.js");

const CrateLoader = require("./crates.js");
const Effects = require("./effects.js");

const { getRootBody } = require("./utils.js");

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

let gameState = {
    money: configJson.startMoney,
    crates: [],
    selectedCrates: [],
    maps: [ ...configJson.maps ],
    currentMap: null,
    time: 0,
    paused: false
};

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

    var leftArrowKey;
    var rightArrowKey;

    var chassis;
    var backWheel;
    var frontWheel;
    const Body = Phaser.Physics.Matter.Matter.Body;

    var clouds;
    var hills;
    var trees;

    var lastUpdate = -1;

    return new Phaser.Class({
        Extends: Phaser.Scene,
        key: mapId,
        loader: {},
        active: true,
        preload: async function preload ()
        {
            //this.load.setBaseURL('http://localhost');

            truckLoader.preload(this.load);
            crateLoader.preload(this.load);
            effects.preload(this.load);
            await map.preload(this.load, this.textures);

            this.load.json('shapes', 'assets/physics-objects.json');

            gameState.time = map.json.levelTime * 1000;
        },

        create: async function create ()
        {

            var shapes = this.cache.json.get('shapes');

            parseVerticesFix(Phaser.Physics.Matter.PhysicsEditorParser);
            effects.create(this.anims);
            map.create(this, shapes);

            this.objs = [];

            truckLoader.scale(TRUCK_SCALE, TRUCK_SCALE);
            let truck = truckLoader.create(this.matter, shapes, 200, 470, 0.2);

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
                        UI.select("finish");
                        UI.runFinishSequence(gameState);

                        gameState.paused = true;
                    }
                }
            });

            crateLoader.handleCollisions(this, truck.chassis, gameState);
            this.cameras.main.startFollow(truck.chassis, true, 1, 1, -200, 100);

            aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

            leftArrowKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
            rightArrowKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

            lastUpdate = Date.now();
        },

        update: async function update() {
            if (gameState.paused)
                return;

            let dtime = Date.now() - lastUpdate;
            lastUpdate = Date.now();
            gameState.time -= dtime;
            if (gameState.time < 0)
                gameState.time = 0;

            UI.updateId("time-left", (gameState.time / 1000).toFixed(1));

            if (dKey.isDown || rightArrowKey.isDown) {
                Body.setAngularVelocity( backWheel.body, WHEEL_ANGULAR_VELOCITY);
                Body.setAngularVelocity( frontWheel.body, WHEEL_ANGULAR_VELOCITY);
            }
            if (aKey.isDown || leftArrowKey.isDown) {
                Body.setAngularVelocity( backWheel.body, -WHEEL_ANGULAR_VELOCITY);
                Body.setAngularVelocity( frontWheel.body, -WHEEL_ANGULAR_VELOCITY);
            }

            await map.update(this.cameras.main);
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

const UI = new UIController({ onGameStart: () => {
    if (gameState.currentMap)
        game.scene.stop(gameState.currentMap);

    gameState.currentMap = gameState.maps.shift();
    gameState.paused = false;
    gameState.selectedCrates = [ ... gameState.crates ];

    game.scene.start(gameState.currentMap);
    UI.hide();
}, onNextMap: () => {
    UI.select("loadout");
    UI.crateSelector(gameState);
}, onTerminate: () => {
    gameState.crates = [];
    UI.select("finish");
    UI.runFinishSequence(gameState);
}, onRestart: () => {
    maps = [ ...configJson.maps ];

    gameState = {
        money: configJson.startMoney,
        crates: [],
        maps: [ ...configJson.maps ],
        currentMap: gameState
        .currentMap,
        time: -1,
        paused: false
    };

    UI.select("loadout");
    UI.crateSelector(gameState);
}, onFinish: () => {
    UI.select("highscores");
    UI.runHighscoresSequence(gameState);
}});

UI.crateSelector(gameState);
UI.select("loadout");
