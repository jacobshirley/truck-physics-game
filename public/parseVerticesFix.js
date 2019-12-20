const Body = Phaser.Physics.Matter.Matter.Body;
const Vector = Phaser.Physics.Matter.Matter.Vector;
const Common = Phaser.Physics.Matter.Matter.Common;
const Vertices = Phaser.Physics.Matter.Matter.Vertices;
const Bounds = Phaser.Physics.Matter.Matter.Bounds;
const Bodies = Phaser.Physics.Matter.Matter.Bodies;

module.exports =  function parseVerticesFix(PhysicsEditorParser) {


    function test(vertexSets, options)
    {



        console.log(Vector);

        var i, j, k, v, z;
        var parts = [];

        options = options || {};

        for (v = 0; v < vertexSets.length; v += 1)
        {
            let pos = Vertices.centre(vertexSets[v]);
            let verts = vertexSets[v];//map(vert => ({...vert, x: vert.x - pos.x, y: vert.y - pos.y}));

            /*parts.push(Body.create(Common.extend({
                position: pos,
                vertices: verts
            }, options)));*/
            parts.push(Bodies.fromVertices(pos.x, pos.y, verts, options));
        }

        // flag coincident part edges
        var coincidentMaxDist = 5;

        for (i = 0; i < parts.length; i++)
        {
            var partA = parts[i];

            for (j = i + 1; j < parts.length; j++)
            {
                var partB = parts[j];

                if (Bounds.overlaps(partA.bounds, partB.bounds))
                {
                    var pav = partA.vertices,
                        pbv = partB.vertices;

                    // iterate vertices of both parts
                    for (k = 0; k < partA.vertices.length; k++)
                    {
                        for (z = 0; z < partB.vertices.length; z++)
                        {
                            // find distances between the vertices
                            var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
                                db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));

                            // if both vertices are very close, consider the edge concident (internal)
                            if (da < coincidentMaxDist && db < coincidentMaxDist)
                            {
                                pav[k].isInternal = true;
                                pbv[z].isInternal = true;
                            }
                        }
                    }

                }
            }
        }

        return parts;
    }

    PhysicsEditorParser.parseVertices = test;
}
