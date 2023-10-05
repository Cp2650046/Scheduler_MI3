const models = require('./masterplan.models');
const services = require('./masterplan.services');

const getDataPlan = async (req)=>{
    const res = await models.getDataMachineModel(req)
    return res
}
const getData = async (req)=>{
    const res = await models.getDataModel(req)
    return res
}

const getDataHr = async(req)=>{
    const res = await models.getdataHrModel(req)
    return res
}

module.exports = {
    getDataPlan,
    getData,
    getDataHr
}