const models = require('./timesheet.models')

const getMachineType = async (req) => {
    const res = await models.getMachineTypeModel(req)
    return res
}

const getMachines = async (req) => {
    const res = await models.getMachinesModel(req)
    return res
}

const getWorkers = async (req) => {
    const res = await models.getWorkersModel(req)
    return res
}

const getPlans = async (req) => {
    const res = await models.getPlansModel(req)
    return res
}

const getPaperStatus = async (req) => {
    const res = await models.getPaperStatusModel(req)
    return res
}

const clearWorker = async (req) => {
    const res = await models.clearWorkerModel(req)
    return res
}

const insertHeader = async (req) => {
    const res = await models.insertHeaderModel(req)
    return res
}

const insertChecklist = async (req) => {
    const res = await models.insertChecklistModel(req)
    return res
}

const getHeader = async (req) => {
    const res = await models.getHeaderModel(req)
    return res
}

const insertTimesheetItem = async (req) => {
    const res = await models.insertTimesheetItemModel(req)
    return res
}

const updateQuantity = async (req) => {
    const res = await models.updateQuantityModel(req)
    return res
}

const getRepairItem = async (req) => {
    const res = await models.getRepairItemModel(req)
    return res
}

const insertRepairRequest = async (req) => {
    const res = await models.insertRepairRequestModel(req)
    return res
}

const updateRepairRequestAgain = async (req) => {
    const res = await models.updateRepairRequestAgainModel(req)
    return res
}

const insertChecklistWarning = async (req) => {
    const res = await models.insertChecklistWarningModel(req)
    return res
}

const insertChecklistWarningWithMaRequest = async (req) => {
    const res = await models.insertChecklistWarningWithMaRequestModel(req)
    return res
}

const checkFirstShift = async (req) => {
    var res = await models.checkFirstShiftModel(req)
    if (res.success === true) {
        const res2 = await models.getChecklistModel(req.machine_id)
        res.doc = res2.doc
        res.data = res2.data
        res.group_id_array = res2.group_id_array
    }
    return res
}

const getChecklist = async (req) => {
    var res = await models.getChecklistModel(req.machine_id)
    res.checklist_machine_detail = await models.getChecklistMachineDetail(req.machine_id)
    res.checklist_outsource_detail = await models.getChecklistOutsourceDetail(req.plan_id)
    res.checklist_qc_detail = await models.getChecklistQCDetail(req.plan_id)
    return res
}

const getChecklistOutsource = async (req) => {
    const res = await models.getChecklistOutsourceDetail(req)
    return res
}

const getChecklistOutsourceId = async (req) => {
    const res = await models.getChecklistOutsourceIdModel()
    return res
}

const getTotalRunning = async (req) => {
    const res = await models.getTotalRunningModel(req)
    return res
}

const updateTimesheetItem = async (ip, req) => {
    const res = await models.updateTimesheetItemModel(ip, req)
    return res
}

const getDepartment = async (req) => {
    const res = await models.getDepartmentModel(req)
    return res
}

const getMachineByDepartment = async (req) => {
    const res = await models.getMachineByDepartmentModel(req)
    return res
}

const getOkLimitColorDetail = async (req) => {
    const res = await models.getOkLimitColorDetailModel(req)
    return res
}

const insertOkLimitColor = async (ip, req) => {
    const res = await models.insertOkLimitColorModel(ip, req)
    return res
}

const getProblem = async (req) => {
    const res = await models.getProblemModel(req)
    return res
}

const getChecklistLong = async (req) => {
    const res = await models.getChecklistLongModel(req)
    return res
}

const deleteTimesheet = async (req) => {
    const res = await models.deleteTimesheetModel(req)
    return res
}

const getDetailSupCheckColor = async (req) => {
    const res = await models.getDetailSupCheckColorModel(req)
    return res
}

const updateEndtimeItem = async (req) => {
    const res = await models.updateEndtimeItemModel(req)
    return res
}

const insertInkUsage = async (req) => {
    const res = await models.insertInkUsageModel(req)
    return res
}

const getTableOtType = async (req) => {
    const res = await models.getTableOtTypeModel(req)
    return res
}

const insertRequestOt = async (ip, req) => {
    const res = await models.insertRequestOtModel(ip, req)
    return res
}

const deleteRequestOt = async (req) => {
    const res = await models.deleteRequestOtModel(req)
    return res
}

const getChecklistSup = async (req) => {
    const res = await models.getChecklistSupModel(req)
    return res
}

const getOkSheetDetail = async (req) => {
    const res = await models.getOkSheetDetailModel(req)
    return res
}

const getOldHeaderTimesheet = async (req) => {
    const res = await models.getOldHeaderTimesheetModel(req)
    return res
}

const getPartnameSub = async (req) => {
    const res = await models.getPartnameSubModel(req)
    return res
}

const insertSupCheckColorDetail = async (req) => {
    const res = await models.insertSupCheckColorDetailModal(req)
    return res
}

const insertOkSheet = async (req) => {
    const res = await models.insertOkSheetModel(req)
    return res
}

const addWorker = async (req) => {
    const res = await models.addWorkerModel(req)
    return res
}

const getEmployee = async (req) => {
    const res = await models.getEmployeeModel(req)
    return res
}

const removeWorker = async (req) => {
    const res = await models.removeWorkerModel(req)
    return res
}

const getChecker = async (req) => {
    const res = await models.getCheckerModel(req)
    return res
}

const checkWorkerRequestOt = async (req) => {
    const res = await models.checkWorkerRequestOtModel(req)
    return res
}

const checkEmployeeData = async (req) => {
    const res = await models.checkEmployeeDataModel(req)
    return res
}

const checkHeaderId = async (req) => {
    const res = await models.checkHeaderIdModel(req)
    return res
}

const getDocumentMaintenanceMachine = async (req) => {
    const res = await models.getDocumentMaintenanceMachineModel(req)
    return res
}

const insertTimesheetMaintenanceMachine = async (req) => {
    const res = await models.insertTimesheetMaintenanceMachineModel(req)
    return res
}

const getMaintenanceMachineRequestWorker = async (req) => {
    const res = await models.getMaintenanceMachineRequestWorkerModel(req)
    return res
}

const getTimesheetMaintenanceMachine = async (req) => {
    const res = await models.getTimesheetMaintenanceMachineModel(req)
    return res
}

const insertTimesheetMaintenanceMachineItem = async (req) => {
    const res = await models.insertTimesheetMaintenanceMachineItemModel(req)
    return res
}

const updateEndtimeItemMaintenance = async (req) => {
    const res = await models.updateEndtimeItemMaintenanceModel(req)
    return res
}
const endMaintenanceMachine = async (req) => {
    const res = await models.endMaintenanceMachineModel(req)
    return res
}

const updateMaStatus = async (req) => {
    const res = await models.updateMaStatusModel(req)
    return res
}

const deleteMaWorker = async (req) => {
    const res = await models.deleteMaWorkerModel(req)
    return res
}

const addMaWorker = async (req) => {
    const res = await models.addMaWorkerModel(req)
    return res
}

const checkMaWorker = async (req) => {
    const res = await models.checkMaWorkerModel(req)
    return res
}

const checkMaEndType = async (req) => {
    const res = await models.checkMaEndTypeModel(req)
    return res
}

const getWorkingStatusWorker = async (req) => {
    var res = await models.getWorkingStatusWorkerModel(req)
    // console.log(res);
    if (res.success) {
        res.summary = await models.summaryWorkingStatus(res.data)
    }
    return res
}

const insertChecklistQC = async (req) => {
    const res = await models.insertChecklistQCModel(req)
    res.data = await models.getChecklistQCDetail(req.head.plan_id)
    return res
}

const manageChecklistOutsource = async (req) => {
    var res = await models.manageChecklistOutsourceModel(req)
    res.data = await models.getChecklistOutsourceDetail(req.head.plan_id)
    return res
}


module.exports = {
    getMachineType,
    getMachines,
    getWorkers,
    getPlans,
    getPaperStatus,
    clearWorker,
    insertHeader,
    checkHeaderId,
    getHeader,
    insertTimesheetItem,
    updateQuantity,
    insertRepairRequest,
    insertChecklistWarning,
    checkFirstShift,
    getRepairItem,
    updateRepairRequestAgain,
    getTotalRunning,
    updateTimesheetItem,
    getDepartment,
    getMachineByDepartment,
    getOkLimitColorDetail,
    insertOkLimitColor,
    getProblem,
    getChecklistLong,
    insertChecklistWarningWithMaRequest,
    insertChecklist,
    deleteTimesheet,
    getDetailSupCheckColor,
    updateEndtimeItem,
    insertInkUsage,
    getTableOtType,
    insertRequestOt,
    deleteRequestOt,
    getChecklistSup,
    getOkSheetDetail,
    getOldHeaderTimesheet,
    getPartnameSub,
    insertSupCheckColorDetail,
    insertOkSheet,
    addWorker,
    getEmployee,
    removeWorker,
    getChecker,
    checkWorkerRequestOt,
    checkEmployeeData,
    getDocumentMaintenanceMachine,
    insertTimesheetMaintenanceMachine,
    getMaintenanceMachineRequestWorker,
    getTimesheetMaintenanceMachine,
    insertTimesheetMaintenanceMachineItem,
    updateEndtimeItemMaintenance,
    endMaintenanceMachine,
    updateMaStatus,
    deleteMaWorker,
    addMaWorker,
    checkMaWorker,
    checkMaEndType,
    getWorkingStatusWorker,
    insertChecklistQC,
    getChecklist,
    getChecklistOutsourceId,
    manageChecklistOutsource,
    getChecklistOutsource,
}