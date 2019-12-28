module.exports = class TruckLoader {
    constructor() {
        this.scaleX = this.scaleY = 1;
    }

    preload(loader) {
        loader.image('chassis', 'assets/truck/truck_2/Chassis.png');
        loader.image('wheel', 'assets/truck/truck_2/Wheel.png');
    }

    scale(x, y) {
        this.scaleX = x;
        this.scaleY = y;
    }

    create(matter, shapes, x, y, spring) {
        let chassis = matter.add.image(x, y, "chassis", null, { shape: shapes.chassis, ...shapes.chassis });

        const WHEEL_1_X = 60 * this.scaleX;
        const WHEEL_2_X = -90 * this.scaleX;
        const WHEEL_Y = 50 * this.scaleY;

        let frontWheel = matter.add.image(x + WHEEL_1_X, y + WHEEL_Y, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        let backWheel = matter.add.image(x + WHEEL_2_X, y + WHEEL_Y, 'wheel', null, {shape: shapes.wheel, ...shapes.wheel });

        chassis.setScale(this.scaleX, this.scaleY);
        backWheel.setScale(this.scaleX, this.scaleY);
        frontWheel.setScale(this.scaleX, this.scaleY);

        matter.add.constraint(chassis.body, frontWheel.body, 0, spring, { pointA: { x: WHEEL_1_X, y: WHEEL_Y, stiffness: spring, length: 0 } });

        matter.add.constraint(chassis.body, backWheel.body, 0, spring, { pointA: { x: WHEEL_2_X, y: WHEEL_Y, stiffness: spring, length: 0 } });
        
        return { chassis, frontWheel, backWheel };
    }
}
