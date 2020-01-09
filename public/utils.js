function getRootBody (body)
{
    if (body.parent === body) { return body; }
    while (body.parent !== body)
    {
        body = body.parent;
    }
    return body;
}

module.exports = { getRootBody };
