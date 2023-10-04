const models = require('./masterplan.models');
const services = require('./masterplan.services');

const getDataPlan = async (req)=>{
    const res = await models.getDataModel(req)
    return res
}

module.exports = {
    getDataPlan
}