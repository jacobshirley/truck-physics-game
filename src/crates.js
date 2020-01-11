const Effects = require("./effects.js");
const config = require("../config.json");
const { getRootBody } = require("./utils.js");

function getCrateType(body) {
    return body.label.includes("crate_") ? body.label.split("_")[1] : null;
}

class CrateLoader {
    constructor() {
    }

    handleCollisions(scene, chassis, gameState) {
        let ignored = [];

        scene.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            let oBodyA = bodyA;
            let oBodyB = bodyB;

            bodyA = getRootBody(bodyA);
            bodyB = getRootBody(bodyB);

            if ((getCrateType(bodyA) && bodyB.label.includes("foreground")) || (getCrateType(bodyB) && bodyA.label.includes("foreground"))) {
                if (oBodyA.label == "finish" || oBodyB.label == "finish") {
                    return;
                }
                let crateBody = getCrateType(bodyA) ? bodyA : bodyB;
                let crateType = getCrateType(crateBody);

                if (ignored.indexOf(crateBody.id) != -1)
                    return;

                ignored.push(crateBody.id);

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
        for (let crate of config.crates) {
            loader.image('crate_' + crate.name, config.crateDir + crate.path);
        }
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
