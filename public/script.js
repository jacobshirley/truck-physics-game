var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create
    }
};

//Truck assets: https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1h5i465d8p3q4v6n41



var game = new Phaser.Game(config);

function preload ()
{
    //this.load.setBaseURL('http://localhost');

    this.load.image('trucks', 'assets/truck/truck_1/truck_1_body_lights_on_yellow.png');
    this.load.image('wheel', 'assets/truck/truck_1/truck_1_wheel.png');
    this.load.json('shapes', 'assets/truck/truck.json');
}

function create ()
{
    var shapes = this.cache.json.get('shapes');

    this.matter.world.setBounds(0, 0, game.config.width, game.config.height);

    this.matter.add.rectangle(0, game.config.height, game.config.width, 100, { restitution: 0.9, isStatic: true });

    this.objs = [];

    this.objs.push(this.matter.add.image(200, 0, 'trucks', {shape: shapes.truck}));
    this.objs.push(this.matter.add.image(250, 50, 'wheel', {shape: shapes.wheel}));

    var cat1 = this.matter.world.nextCategory();

    //this.objs[0].body.collisionFilter = { group: cat1 };
    //this.objs[1].body.collisionFilter = { group: cat1 };

    var Body = Phaser.Physics.Matter.Matter.Body;
    var Bodies = Phaser.Physics.Matter.Matter.Bodies;
    var Composite = Phaser.Physics.Matter.Matter.Composite;

    var composite = Composite.create();

    Composite.addBody(composite, this.objs[0].body);
    Composite.addBody(composite, this.objs[1].body);

    this.matter.add.constraint(this.objs[0].body, this.objs[1].body, 10, 0.2, {
      pointA: { x: 10, y: 0 }
    });

    this.matter.world.add(composite);

    for (var obj of this.objs) {
        obj.setScale(0.1, 0.1);
    }

    //this.add.image(50, 50, 'trucks');
}
