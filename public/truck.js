module.exports = class TruckLoader {
    constructor() {

    }

    preload(loader) {
        loader.image('chassis', 'assets/truck/truck_1/truck_1_body_lights_on_yellow.png');
        loader.image('wheel', 'assets/truck/truck_1/truck_1_wheel.png');
    }

    create(matter, shapes, x, y) {
        let chassis = matter.add.image(x, y, "chassis", null, { shape: shapes.truck });

        let frontWheel = matter.add.image(x + 150, 95, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        let backWheel = matter.add.image(x - 155, 95, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        const spring = 0.5;

        matter.add.constraint(chassis.body, frontWheel.body, 5, spring, { pointA: { x: 120, y: 85 } });
        matter.add.constraint(chassis.body, backWheel.body, 5, spring, { pointA: { x: -150, y: 85 } });

        return { chassis, frontWheel, backWheel };
    }
}
