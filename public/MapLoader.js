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
            textures.remove(image.key);
            loader.image(image.key, root + "/" + image.path);
        }

        for (var image of json.foreground) {
            textures.remove(image.key);
            loader.image(image.key, root + "/" + image.path);
        }
    }

    async create(_this, shapes) {
        let json = this.json;

        while (this.sprites.length > 0) {
            this.sprites.pop().sprite.destroy();
        }

        while (this.foreground.length > 0) {
            this.foreground.pop().destroy();
        }

        for (var image of json.background) {
            let obj = _this.add.tileSprite(0, 0, _this.game.config.width, _this.game.config.height, image.key);

            obj.setOrigin(0, 0);
            obj.setScrollFactor(0, 0);

            this.sprites.push({sprite: obj, config: image});
        }

        for (var image of json.foreground) {
            let obj = _this.matter.add.image(image.offsetX, _this.game.config.height + image.offsetY, image.key, null, {shape: shapes[image.physicsKey || image.key] });

            obj.label = "ground";

            this.foreground.push(obj);

            console.log(this.foreground);
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
