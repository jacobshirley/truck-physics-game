const path = require("path");

module.exports = class MapLoader {
    constructor(jsonFile) {
        this.jsonFile = jsonFile;
        this.json = fetch(jsonFile).then(x => x.json());
        this.sprites = [];
    }

    async preload(loader) {
        let json = await this.json;

        let rootDir = path.dirname(this.jsonFile);

        for (var image of json.background) {
            loader.image(image.key, rootDir + "/" + image.path);
        }

        for (var image of json.foreground) {
            loader.image(image.key, rootDir + "/" + image.path);
        }
    }

    async create(_this, shapes) {
        let json = await this.json;

        for (var image of json.background) {
            let obj = _this.add.tileSprite(0, 0, _this.game.config.width, _this.game.config.height, image.key);

            obj.setOrigin(0, 0);
            obj.setScrollFactor(0, 0);

            this.sprites.push({sprite: obj, config: image});
        }

        for (var image of json.foreground) {
            let obj = _this.matter.add.image(image.offsetX, _this.game.config.height + image.offsetY, image.key, null, {shape: shapes[image.physicsKey] });

            obj.label = "ground";
        }
    }

    async update(camera) {
        for (var spriteObj of this.sprites) {
            const { config, sprite } = spriteObj;

            if (config.speedX) {
                sprite.tilePositionX += config.speedX;
            }

            if (config.speedY) {
                sprite.tilePositionY += config.speedY;
            }

            if (config.parallaxSpeedX) {
                sprite.tilePositionX = camera.scrollX * config.parallaxSpeedX;
            }

            if (config.parallaxSpeedY) {
                sprite.tilePositionY = camera.scrollY * config.parallaxSpeedY;
            }
        }
    }
}
