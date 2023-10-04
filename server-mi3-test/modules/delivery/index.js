const Router = require('express').Router()
const controllers = require('./delivery.controllers')

/* ---------- Delivery - Master ----------*/

Router.get("/master/vehicle", async (req, res)=>{
    const data = await controllers.masterVehicle(req.query)
    res.send(data).status(200)
})

Router.get("/master/vehicle_employee", async (req, res)=>{
    const data = await controllers.masterVehicleEmployee(req.query)
    res.send(data).status(200)
})

Router.post("/master_data/request_work_type/view", async (req, res)=>{
    const data = await controllers.getRequestWorkType()
    res.send(data).status(200)
})

Router.post("/master_data/request_work_type/create", async (req, res)=>{
    const data = await controllers.insertRequestWorkType(req.body)
    res.send(data).status(200)
})

/* ---------- Delivery - JOB ----------*/
Router.get("/job/fetch_job", async (req, res)=>{
    const data = await controllers.getListJob()
    res.send(data).status(200)
})

Router.post("/save_wrap_job", async (req, res)=>{
    const data = await controllers.saveWrapJOB(req.body)
    res.send(data).status(200)
})

/* ---------- Delivery - Datalist ----------*/
Router.get("/datalist/contact", async (req, res)=>{
    const data = await controllers.datalistContact(req.query)
    res.send(data).status(200)
})

Router.get("/datalist/address", async (req, res)=>{
    const data = await controllers.datalistAddress(req.query)
    res.send(data).status(200)
})

/* ---------- Delivery - DR ----------*/
Router.get("/dr/fetch_dr", async (req, res)=>{
    const data = await controllers.getListDR(req.query)
    res.send(data).status(200)
})

Router.get("/dr/manage", async (req, res)=>{
    const data = await controllers.getManageDR(req.query)
    res.send(data).status(200)
})

Router.post("/dr/save",  async (req, res)=>{
    const data = await controllers.saveDR(req.body)
    res.send(data).status(200)
})

Router.get("/dr/delete", async (req, res)=>{
    const data = await controllers.deleteDR(req.query)
    res.send(data).status(200)
})

Router.get('/dr/item', async (req, res)=>{
    const data = await controllers.getItemDR(req.query)
    res.send(data).status(200)
})

Router.get('/dr/edition', async (req, res)=>{
    const data = await controllers.getEditionDR(req.query)
    res.send(data).status(200)
})

/* ---------- Delivery - DO ----------*/
Router.get("/do/fetch_do", async (req, res)=>{
    const data = await controllers.getListDO(req.query)
    res.send(data).status(200)
})

Router.get("/do/manage", async (req, res)=>{
    const data = await controllers.getManageDO(req.query)
    res.send(data).status(200)
})

Router.post("/do/save",  async (req, res)=>{
    const data = await controllers.saveDO(req.body)
    res.send(data).status(200)
})

Router.get("/do/delete", async (req, res)=>{
    const data = await controllers.deleteDO(req.query)
    res.send(data).status(200)
})

Router.get("/do/update_delivery", async (req, res)=>{
    const data = await controllers.updateDelivery(req.query)
    res.send(data).status(200)
})

/* ---------- Delivery - Pallet ----------*/
Router.get("/get_return_pallet", async (req, res)=>{
    const data = await controllers.getReturnPallet()
    res.send(data).status(200)
})

Router.get("/get_delivery_pallet", async (req, res)=>{
    const data = await controllers.getDeliveryPallet()
    res.send(data).status(200)
})

Router.get("/save_return_pallet", async (req, res)=>{
    const sendData = { ...req.query, updated_emp_id: req.headers.user_account }
    const data = await controllers.saveReturnPallet(sendData)
    res.send(data).status(200)
})

module.exports = Router;