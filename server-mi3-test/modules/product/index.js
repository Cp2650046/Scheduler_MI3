const Router = require('express').Router()
const { test } = require('./product.controllers')

Router.get("/", async (req, res)=>{
    const data = await test(req)
    res.send(data).status(200)
})
module.exports = Router;