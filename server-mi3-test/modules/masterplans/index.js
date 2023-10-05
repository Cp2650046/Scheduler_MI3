const Router = require('express').Router()
const controllers = require('./masterplan.controller')

Router.get("/get_data_plan", async (req, res) => {
    const data = await controllers.getDataPlan(req.query)
    res.send(data).status(200)
})

Router.post("/get_data", async (req, res) => {
    const data = await controllers.getData(req.body)
    res.send(data).status(200)
})

Router.post("/get_data_hr", async (req, res) => {
    const data = await controllers.getDataHr(req.body)
    res.send(data).status(200)
})

module.exports = Router;