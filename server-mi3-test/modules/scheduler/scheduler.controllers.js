const models = require('./scheduler.models')
const services = require('./scheduler.services')

const getMenu = async (req) => {
    const res = await models.getMenuModel(req)
    let data = await models.getDefaultMachineListModel(res.menuIdArray);
    result = {
        machineList: data.machineList,
        machineTypeList: data.machineTypeList,
        userGroupId: res.userGroupId,
        menuList: res.menuList,
        saddleList: data.saddleList
    }
    return result
}

const getData = async (req) => {
    const res = await models.getDataModel(req)
    return res
}

const getMachine = async (req) => {
    const res = await models.getMachineModel(req)
    return res
}

const getPlanSearch = async (req) => {
    const { menuID } = req
    var res
    if (menuID === '47') {
        res = await models.getCaseInPlanSearchModel(req);
    } else {
        res = await models.getPlanSearchModel(req);
    }
    console.log(res);
    // res.planList = await services.chkValuePlanList(res.planList);
    return res
}

const insertPlan = async (req) => {
    const { menu_id } = req
    // var numRow = await services.chkIsCaseIn(req.e_machine_id);
    var res
    // if (numRow === 0) {
    if (req.is_printing !== undefined && req.is_printing === 1) {
        res = {
            success: 0,
            msg: "ส่วนของ Printing ยังปรับปรุงอยู่"
        }
    } else {
        if (menu_id === '47') {
            res = await models.insertCaseInPlanModel(req);
        } else {
            res = await models.insertPlanModel(req);
        }

        if (res.success === 1) {
            await models.insertLogMachinePlanningModel(res);
        }
    }
    return res
}

const updatePlan = async (req) => {
    const res = await models.updatePlanModel(req)
    if (res.success === 1) {
        await models.insertLogMachinePlanningModel(res);
    }
    return res
}

const deletePlan = async (req) => {
    const numRow = await services.chkTimesheet(req.plan_id)
    var res
    if (numRow === 0) {
        res = await models.deletePlanModel(req)
        if (res.success === 1) {
            await models.insertLogMachinePlanningModel(res);
        }
    } else {
        res = {
            success: 2
        }
    }
    return res
}

const getDataJob = async (req) => {
    const res = await models.getDataJobModel(req)
    return res
}

const getCapacityLabor = async (req) => {
    const res = await models.getCapacityLaborModel(req)
    return res
}

const getItem = async (req) => {
    const res = await models.getItemModel(req)
    return res
}

const cancelPlan = async (req) => {
    const numRow = await services.chkTimesheet(req.plan_id)
    var res
    if (numRow === 0) {
        res = await models.cancelPlanModel(req)
        if (res.success === 1) {
            await models.insertLogMachinePlanningModel(res);
        }
    } else {
        res = {
            success: 2
        }
    }
    return res
}

const getNextMachineList = async () => {
    const res = await models.getNextMachineListModel()
    return res
}

const getDefaultMachineList = async () => {
    const res = await models.getDefaultMachineListModel()
    return res
}

const getMenuGroupData = async (menuID) => {
    var res = {}
    res.responseText = await models.getMachineType(menuID)
    res.group_data = await models.getGroupData(menuID)
    return res
}

const getDataToExcel = async (req) => {
    const res = await models.getDataToExcelModel(req)
    return res
}

const updateMultiPlan = async (req) => {
    const res = await models.updateMultiPlanModel(req)
    return res
}

const cancelMultiPlan = async (req) => {
    const res = await models.cancelMultiPlanModel(req)
    return res
}

const deleteMultiPlan = async (req) => {
    const res = await models.deleteMultiPlanModel(req)
    return res
}

const getWorkType = async (req) => {
    const res = await models.getWorkTypeModel(req)
    return res
}

const getCaseInActCode = async () => {
    const res = await models.getCaseInActCodeModel()
    return res
}

const getJobStatus = async () => {
    const res = await models.getJobStatusModel()
    return res
}

const getSaddle = async () => {
    const res = await models.getSaddleModel()
    return res
}


module.exports = {
    getMenu,
    getData,
    getPlanSearch,
    insertPlan,
    updatePlan,
    deletePlan,
    getMachine,
    getDataJob,
    getCapacityLabor,
    getItem,
    cancelPlan,
    getNextMachineList,
    getDefaultMachineList,
    getMenuGroupData,
    getDataToExcel,
    updateMultiPlan,
    deleteMultiPlan,
    cancelMultiPlan,
    getWorkType,
    getCaseInActCode,
    getJobStatus,
    getSaddle
}