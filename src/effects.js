module.exports = class Effects {
    preload(loader) {
        loader.spritesheet('explosion', 'assets/animations/boom3.png', {frameWidth: 128, frameHeight: 128 });
    }

    create(anims) {
        var config = {
            key: 'explode',
            frames: anims.generateFrameNumbers('explosion'),
            frameRate: 40,
            yoyo: false,
            repeat: 0
        };

        anims.create(config);
    }

    static explode(scene, gameObject, { explosionForce, hasPhysics, objects, destroyObject }) {
        let sprite = scene.add.sprite(gameObject.x, gameObject.y - 50, 'exploding').setScale(2);

        sprite.once('animationcomplete', () => {
            sprite.destroy();
        });

        sprite.anims.load('explode');
        sprite.anims.play('explode');

        if (hasPhysics) {
            for (var obj of objects) {
                let dx = obj.x - gameObject.x;
                let dy = obj.y - gameObject.y;

                let dist = Math.sqrt((dx * dx) + (dy * dy));

                let EXPLOSION_FORCE = (explosionForce || 50) / (dist / 100);

                let vel = obj.body.velocity;
                vel.x += (dx/dist) * EXPLOSION_FORCE;
                vel.y += (dy/dist) * EXPLOSION_FORCE;

                obj.setVelocity(vel.x, vel.y);
            }
        }

        if (destroyObject) {
            gameObject.destroy();
        }
    }
}
