module.exports = class TruckLoader {
    constructor() {

    }

    preload(loader) {
        loader.image('chassis', 'assets/truck/truck_2/Chassis.png');
        loader.image('wheel', 'assets/truck/truck_2/Wheel.png');
    }

    create(matter, shapes, x, y) {
        let chassis = matter.add.image(x, y, "chassis", null, { shape: shapes.chassis, ...shapes.chassis });

        let frontWheel = matter.add.image(x + 120, y + 95, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        let backWheel = matter.add.image(x - 180, y + 95, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        const spring = 0.5;

        matter.add.constraint(chassis.body, frontWheel.body, 5, spring, { pointA: { x: 120, y: 95 } });
        matter.add.constraint(chassis.body, backWheel.body, 5, spring, { pointA: { x: -180, y: 95 } });

        return { chassis, frontWheel, backWheel };
    }
}
