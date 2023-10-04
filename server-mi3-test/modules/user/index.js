const Router = require('express').Router()
const { saveUser, saveProject } = require('./user.controllers')

Router.post("/saveuser", async (req, res)=>{
    const data = await saveUser(req.body)
    res.send(data).status(200)
})

Router.get("/saveproject", async (req, res)=>{
    const data = await saveProject(req.query)
    res.send(data).status(200)
})

module.exports = Router;