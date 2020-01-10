const path = require("path");

module.exports = class MapLoader {
    constructor(root, json) {
        this.root = root;
        this.json = json;
        this.sprites = [];
        this.foreground = [];
    }

    preload(loader, textures) {
        let json = this.json;

        let root = path.dirname(this.root);

        for (var image of json.background) {
            loader.image(this.root + image.key, root + "/" + image.path);
        }

        for (var image of json.foreground) {
            loader.image(this.root + image.key, root + "/" + image.path);
        }
    }

    async create(_this, shapes) {
        let json = this.json;

        for (var image of json.background) {
            let obj = _this.add.tileSprite(0, 0, _this.game.config.width, _this.game.config.height, this.root+image.key);

            obj.setOrigin(0, 0);
            obj.setScrollFactor(0, 0);

            this.sprites.push({sprite: obj, config: image});
        }

        for (var image of json.foreground) {
            let obj = _this.matter.add.image(image.offsetX, _this.game.config.height + image.offsetY, this.root+image.key, null, {shape: shapes[image.physicsKey || image.key] });

            obj.label = "ground";

            this.foreground.push(obj);
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
