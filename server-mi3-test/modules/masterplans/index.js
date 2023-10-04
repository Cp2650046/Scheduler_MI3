const Router = require('express').Router()
const controllers = require('./masterplan.controller')

Router.get("/get_data_plan", async (req, res) => {
    const data = await controllers.getDataPlan(req.query)
    res.send(data).status(200)
})

module.exports = Router;