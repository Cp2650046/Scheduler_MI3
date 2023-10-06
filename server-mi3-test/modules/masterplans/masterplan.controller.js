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

const sendDataPlanMove = async(req)=>{
    const res = await models.sendDataPlanMoveModel(req)
    return res
}

const sendDataPlanMoveThoseBehind = async(req)=>{
    const res = await models.sendDataPlanMoveThoseBehindModel(req)
    return res
}

module.exports = {
    getDataPlan,
    getData,
    getDataHr,
    sendDataPlanMove,
    sendDataPlanMoveThoseBehind
}