const express = require('express')
const Router = express.Router()

Router.get('/', (req, res)=>{
    res.render('./projects/delivery/index')
})

/* ---------- Delivery - DR ----------*/
Router.get('/dr', (req, res)=>{
    const { job_id } = req.query
    if(typeof job_id === 'undefined'){
        res.render('./projects/delivery/main/job_main')
    }
    if(typeof job_id === 'string'){
        res.render('./projects/delivery/dr/dr_main', { job_id })
    }
})

Router.get('/dr/manage', (req, res)=>{
    const { action, job_id, dr_number } = req.query
    res.render('./projects/delivery/dr/dr_manage', { action, job_id, dr_number })
})

Router.get('/do', (req, res)=>{
    res.render('./projects/delivery/do/do_main')
})

Router.get('/do/request/:request_type', (req, res)=>{
    res.render('./projects/delivery/do/do_request', { request_type: req.params.request_type })
})

Router.get('/do/order/:request_type', (req, res)=>{
    res.render('./projects/delivery/do/do_order', { request_type: req.params.request_type })
})

Router.get('/do/manage', (req, res)=>{
    const { action, type_do, dr_number, do_number } = req.query
    res.render('./projects/delivery/do/do_manage', { action, type_do, dr_number, do_number })
})

Router.get('/return/return_pallet', (req, res)=>{
    res.render('./projects/delivery/return/return_pallet')
})

Router.get('/report/report_return_pallet', (req, res)=>{
    res.render('./projects/delivery/report/report_return_pallet')
})

/*
Router.get('/master', (req, res)=>{
    res.render('./projects/delivery/master')
})

Router.get('/dr/request/', (req, res)=>{
    res.render('./projects/delivery/dr/request', { job_id: req.query.job_id })
})

Router.post('/dr/request/create', (req, res)=>{
   //console.log(req.body)
   res.render('./projects/delivery/dr/dr_create', { job_id: req.body.job_id })
})
*/
module.exports = Router