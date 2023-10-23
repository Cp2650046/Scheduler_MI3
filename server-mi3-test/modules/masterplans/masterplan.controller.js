const models = require('./masterplan.models');

const getDataPlan = async (req)=>{
    const res = await models.getDataMachineModel(req)
    return res
}
const getData = async (req)=>{
    const res = await models.getDataModel(req)
    return res
}

const getDataHr = async(req)=>{
    const res = await models.getDataHrModel(req)
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

const checkTimeSheet = async(req)=>{
    const res = await models.checkTimeSheetModel(req)
    return res
}

const getPaperInfo =  async(req)=>{
    const res = await models.getPaperInfoModel(req)
    return res
}

const setPaperAndInkReady = async(req)=>{
    const res = await models.setPaperAndInkReadyModel(req)
    return res
}

module.exports = {
    getDataPlan,
    getData,
    getDataHr,
    sendDataPlanMove,
    sendDataPlanMoveThoseBehind,
    checkTimeSheet,
    getPaperInfo,
    setPaperAndInkReady
}