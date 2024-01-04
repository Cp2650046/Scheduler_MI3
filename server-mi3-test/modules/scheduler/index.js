const Router = require('express').Router()
const controllers = require('./scheduler.controllers')

Router.get("/get_menu", async (req, res) => {
    // res.send(req.query.machine_type);
    const data = await controllers.getMenu(req.query.empID)
    res.send(data).status(200)
})

Router.get("/get_data", async (req, res) => {
    // res.send(req.query.machine_type);
    const data = await controllers.getData(req.query.machineType)
    res.send(data).status(200)
})

Router.get("/get_machine", async (req, res) => {
    const data = await controllers.getMachine(req.query.machineType)
    res.send(data).status(200)
})

Router.post("/get_plan_search", async (req, res) => {
    // res.send("test get plan search");
    const data = await controllers.getPlanSearch(req.body)
    res.send(data).status(200)
})

Router.post("/insert_plan", async (req, res) => {
    // res.send("test insert plan");
    const data = await controllers.insertPlan(req.body)
    res.send(data).status(200)
})

Router.post("/update_plan", async (req, res) => {
    // res.send("test update plan");
    const data = await controllers.updatePlan(req.body)
    res.send(data).status(200)
})

Router.get("/delete_plan", async (req, res) => {
    const data = await controllers.deletePlan(req.query)
    res.send(data).status(200)
})

Router.get("/get_data_job", async (req, res) => {
    // res.send("test get data job");
    const data = await controllers.getDataJob(req.query.jobid)
    res.send(data).status(200)
})

Router.get("/get_capacity_labor", async (req, res) => {
    // res.send("test get data job");
    const data = await controllers.getCapacityLabor(req.query)
    res.send(data).status(200)
})

Router.get("/get_item", async (req, res) => {
    // res.send("test get item");
    const data = await controllers.getItem(req.query)
    res.send(data).status(200)
})

Router.post("/cancel_plan", async (req, res) => {
    const data = await controllers.cancelPlan(req.body)
    res.send(data).status(200)
})

Router.get("/get_next_machine", async (req, res) => {
    const data = await controllers.getNextMachineList()
    res.send(data).status(200)
})

Router.get("/get_default_machine", async (req, res) => {
    const data = await controllers.getDefaultMachineList()
    res.send(data).status(200)
})

Router.get("/get_menu_group_data", async (req, res) => {
    const data = await controllers.getMenuGroupData(req.query.menuID)
    res.send(data).status(200)
})

Router.post("/get_data_to_excel", async (req, res) => {
    const data = await controllers.getDataToExcel(req.body)
    res.send(data).status(200)
})

Router.post("/update_multi_plan", async (req, res) => {
    const data = await controllers.updateMultiPlan(req.body)
    res.send(data).status(200)
})

Router.post("/delete_multi_plan", async (req, res) => {
    const data = await controllers.deleteMultiPlan(req.body)
    res.send(data).status(200)
})

Router.post("/cancel_multi_plan", async (req, res) => {
    const data = await controllers.cancelMultiPlan(req.body)
    res.send(data).status(200)
})

Router.get("/get_work_type", async (req, res) => {
    const data = await controllers.getWorkType(req.query.menu_id)
    res.send(data).status(200)
})

Router.get("/get_act_code", async (req, res) => {
    const data = await controllers.getCaseInActCode()
    res.send(data).status(200)
})

Router.get("/get_job_status", async (req, res) => {
    const data = await controllers.getJobStatus()
    res.send(data).status(200)
})

Router.get("/get_saddle", async (req, res) => {
    const data = await controllers.getSaddle()
    res.send(data).status(200)
})

module.exports = Router;