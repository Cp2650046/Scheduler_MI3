const express = require('express');
const Router = express.Router();

Router.get('/', (req, res) => {
    res.render('./projects/master_plans/master-plan-afterpress');
})

module.exports = Router;