const express = require('express')
const Router = express.Router()

Router.get('/', (req, res) => {
    if (req.query.header_id != undefined) {
        if (req.query.maintenance === '1') {
            res.render('./projects/timesheet/ejs/timesheet-maintenance')
        } else {
            res.render('./projects/timesheet/ejs/timesheet')
        }
    } else {
        res.render('./projects/timesheet/index')
    }
})

Router.get('/:id', (req, res) => {
    const url = require('url')
    if (req.query.maintenance === '1') {
        res.render('./projects/timesheet/ejs/index-maintenance')
    } else {
        res.render('./projects/timesheet/index')
    } 
})

Router.get('/:id/help', (req, res) => {
    res.render('./projects/timesheet/ejs/help-page')
})

module.exports = Router