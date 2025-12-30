
const Phaser = require("phaser");

const TruckLoader = require("./truck.js");

const parseVerticesFix = require("./parseVerticesFix.js");
const path = require("path");

const UIController = require("./ui.js");
const MapLoader = require("./maps.js");

const CrateLoader = require("./crates.js");
const Effects = require("./effects.js");

const { getRootBody } = require("./utils.js");

let config = {
    autoPlay: false,
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: document.body,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
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

let game = new Phaser.Game(config);
let maps = [ ...configJson.maps ];

// Handle window resize to keep game fullscreen
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

async function createScene(mapId) {

    let truckLoader = new TruckLoader();
    let crateLoader = new CrateLoader();
    let effects = new Effects();
    let path = "assets/world/maps/" + mapId + "/" + mapId + ".json";
    let map = new MapLoader(path, await fetch(path).then(x => x.json()));

    let aKey;
    let dKey;

    let leftArrowKey;
    let rightArrowKey;

    let chassis;
    let backWheel;
    let frontWheel;
    const Body = Phaser.Physics.Matter.Matter.Body;

    let clouds;
    let hills;
    let trees;

    let lastUpdate = -1;

    return new Phaser.Class({
        Extends: Phaser.Scene,
        key: mapId,
        loader: {},
        active: true,
        preload: async function preload ()
        {
            truckLoader.preload(this.load);
            crateLoader.preload(this.load);
            effects.preload(this.load);
            await map.preload(this.load, this.textures);

            this.load.json('shapes', 'assets/physics-objects.json');

            gameState.time = map.json.levelTime * 1000;
        },

        create: async function create ()
        {

            let shapes = this.cache.json.get('shapes');

            parseVerticesFix(Phaser.Physics.Matter.PhysicsEditorParser);
            effects.create(this.anims);

            map.create(this, shapes);

            truckLoader.scale(configJson.truck.scale, configJson.truck.scale);
            let truck = truckLoader.create(this, shapes, configJson.truck.startX, configJson.truck.startY, configJson.truck.springConst);

            let i = 0;

            chassis = truck.chassis;
            backWheel = truck.backWheel;
            frontWheel = truck.frontWheel;

            let startCratePos = chassis.body.parts.find(x => x.label == "cratePosition").position;

            let CRATE_SIZE = 100 * configJson.crate.scale;
            for (let crateObj of gameState.crates) {
                let x = startCratePos.x + ((i % 2) * CRATE_SIZE);
                let y = startCratePos.y - (Math.floor((i / 2)) * CRATE_SIZE);

                crateLoader.create(this.matter, { x, y, shapes, type: crateObj.name, scale: configJson.crate.scale });

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
            this.cameras.main.startFollow(truck.chassis, true, 1, 1, -200, 150);

            map.createForeground(this, shapes);

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

            const WHEEL_ANGULAR_VELOCITY = configJson.truck.wheelVelocity;

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

function nextMap(mapId, crates) {
    if (gameState.currentMap)
        game.scene.stop(gameState.currentMap);

    gameState.currentMap = mapId || gameState.maps.shift();
    gameState.paused = false;
    gameState.crates = typeof crates != "undefined" ? crates : gameState.crates;
    gameState.selectedCrates = crates ? [...crates] : [ ...gameState.crates ];

    game.scene.start(mapId || gameState.currentMap);

    UI.hide();
}

const UI = new UIController({ onGameStart: () => {
    nextMap();
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

run().then(() => {
    UI.crateSelector(gameState);
    UI.select("loadout");
    //nextMap("map_02", [...configJson.crates]);
});
