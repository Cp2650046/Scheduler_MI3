const express = require('express');
const Router = express.Router();

Router.get('/', (req, res) => {
    res.render('./projects/scheduler/main-menu');
});

Router.get('/:machineTypeID', (req, res) => {
    const machineTypeID = req.params.machineTypeID
    res.render('./projects/scheduler/index',{machineTypeID});
})

module.exports = Router;