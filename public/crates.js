const Effects = require("./effects.js");
const { getRootBody } = require("./utils.js");

function getCrateType(body) {
    return body.label.includes("crate_") ? body.label.split("_")[1] : null;
}

class CrateLoader {
    constructor() {
        this.crates = [];
    }

    handleCollisions(scene, chassis, gameState) {
        scene.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            bodyA = getRootBody(bodyA);
            bodyB = getRootBody(bodyB);

            if ((getCrateType(bodyA) && bodyB.label.includes("foreground")) || (getCrateType(bodyB) && bodyA.label.includes("foreground"))) {
                let crateBody = getCrateType(bodyA) ? bodyA : bodyB;
                let crateType = getCrateType(bodyA) || getCrateType(bodyB);

                if (crateType == "explosives") {
                    this.explode(scene, crateBody.gameObject, { explosionForce: 50, hasPhysics: true, objects: [chassis], destroyObject: true});
                }

                let toBeRemoved = gameState.crates.findIndex(x => x.name == crateType);
                gameState.crates.splice(toBeRemoved, 1);
            }
        });
    }

    explode(scene, gameObject, config) {
        Effects.explode(scene, gameObject, config);
    }

    preload(loader) {
        loader.image('crate_diamond', 'assets/world/crates/Diamond.png');
        loader.image('crate_explosives', 'assets/world/crates/Explosives.png');
        loader.image('crate_cabbage', 'assets/world/crates/Cabbage.png');
    }

    create(matter, { x, y, type, shapes, scale }) {
        type = type.toLowerCase();
        let obj = matter.add.image(x, y, 'crate_' + type, null, { shape: shapes.crate });

        if (typeof scale != 'undefined')
            obj.setScale(scale);

        obj.body.label = 'crate_' + type;
    }

    update() {}
}

module.exports = CrateLoader;
