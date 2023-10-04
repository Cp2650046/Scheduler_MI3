
const Router = require('express').Router()
const controllers = require('./pl.controllers')
const moment = require('moment')
const multer = require('multer')


// const multer = require('multer')
// const upload = multer({ dest: './uploads-timesheet' })
// var type = upload.array('sheet_upload');
Router.get("/get_multi_process", async (req, res) => {
    const data = await controllers.getMultiProcess(req.query.plan_id)
    res.send(data).status(200)
})

Router.get("/prepare_pre_pallet", async (req, res) => {
    const data = await controllers.preparePrePallet(req.query.header_id)
    res.send(data).status(200)
})

Router.get("/get_timesheet_pallet_type", async (req, res) => {
    const data = await controllers.getTimesheetPalletType(req.body)
    res.send(data).status(200)
})

Router.post("/insert_pre_pallet", async (req, res) => {
    const data = await controllers.insertPrepallet(req.body)
    res.send(data).status(200)
});

Router.get("/list_pallet_timesheet", async (req, res) => {
    const data = await controllers.getListPrepallet(req.query)
    res.send(data).status(200)
})

Router.post("/delete_pallet", async (req, res) =>{
    const data = await controllers.deletePallet(req.body)
    res.send(data).status(200)
})

Router.post("/update_pallet_qty_timesheet", async (req, res) =>{
    const data = await controllers.updatetPalletQtyTimsheet(req.body)
    res.send(data).status(200)
})

Router.post("/update_pallet_remark_id_timesheet", async (req, res) =>{
    const data = await controllers.updatetPalletTypePalletTimsheet(req.body)
    res.send(data).status(200)
})

const upload = multer({
                        storage:multer.diskStorage({
                                destination: function (req, files, cb) {   
                                    // cb(null, './uploads-timesheet/')
                                    cb(null, '//192.168.5.25/www/planning/timesheet/upload_timesheet/')
                                },
                                filename: function (req, files, cb) {
                                    // console.log(files)
                                    cb(null, moment().format("Ymd") + '_' + req.body.header_id + '_' +files.originalname)
                                }
                        }) 
                });
Router.post("/upload_img",upload.array('sheet_upload'),async (req, res) =>{
    const data = await controllers.uploadImage(req)
    res.send(data).status(200)
})

module.exports = Router;