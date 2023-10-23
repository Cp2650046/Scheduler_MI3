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

Router.post("/send_data", async (req, res) => {
    const data = await controllers.sendDataPlanMove(req.body)
    res.send(data).status(200)
})

Router.post("/send_data_moveAllThoseBehind", async (req, res) => {
    const data = await controllers.sendDataPlanMoveThoseBehind(req.body)
    res.send(data).status(200)
})

Router.post("/check_time_sheet", async (req, res) => {
    const data = await controllers.checkTimeSheet(req.body)
    res.send(data).status(200)
})

Router.post("/get_paper_info", async (req, res) => {
    const data = await controllers.getPaperInfo(req.body)
    res.send(data).status(200)
})

Router.post("/set_paper_and_ink_ready", async (req, res) => {
    const data = await controllers.setPaperAndInkReady(req.body)
    res.send(data).status(200)
})





module.exports = Router;