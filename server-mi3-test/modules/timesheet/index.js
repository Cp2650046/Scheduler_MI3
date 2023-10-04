const Router = require('express').Router()
const controllers = require('./timesheet.controllers')


Router.get("/get_machine_type", async (req, res) => {
    const data = await controllers.getMachineType(req.query.type_id)
    res.send(data).status(200)
})

Router.get("/get_checker", async (req, res) => {
    const data = await controllers.getChecker(req.query.type_id)
    res.send(data).status(200)
})

Router.get("/get_machines", async (req, res) => {
    const data = await controllers.getMachines(req.query.type_id)
    res.send(data).status(200)
})

Router.get("/get_workers", async (req, res) => {
    const data = await controllers.getWorkers(req)
    res.send(data).status(200)
})

Router.get("/get_plans", async (req, res) => {
    const data = await controllers.getPlans(req.query.machine_id)
    res.send(data).status(200)
})

Router.get("/get_paper_status", async (req, res) => {
    const data = await controllers.getPaperStatus(req.query.plan_id)
    res.send(data).status(200)
})

Router.post("/clear_worker", async (req, res) => {
    const data = await controllers.clearWorker(req.body)
    res.send(data).status(200)
})

Router.post("/insert_header", async (req, res) => {
    const data = await controllers.insertHeader(req.body)
    res.send(data).status(200)
})

Router.post("/insert_checklist_timesheet", async (req, res) => {
    const data = await controllers.insertChecklist(req.body)
    res.send(data).status(200)
})

Router.post("/insert_checklist_qc_timesheet", async (req, res) => {
    const data = await controllers.insertChecklistQC(req.body)
    res.send(data).status(200)
})

Router.post("/insert_worker_mapping", async (req, res) => {
    const data = await controllers.addWorker(req.body)
    res.send(data).status(200)
})

Router.get("/get_emp_data", async (req, res) => {
    const data = await controllers.getEmployee(req.query.term)
    res.send(data).status(200)
})

Router.post("/remove_worker", async (req, res) => {
    const data = await controllers.removeWorker(req.body)
    res.send(data).status(200)
})

Router.post("/get_checklist", async (req, res) => {
    const data = await controllers.getChecklist(req.body)
    res.send(data).status(200)
})

Router.get("/get_checklist_outsource_id", async (req, res) => {
    const data = await controllers.getChecklistOutsourceId()
    res.send(data).status(200)
})

// ***************************End Timesheet Header******************************

Router.get("/get_header", async (req, res) => {
    const data = await controllers.getHeader(req.query.header_id)
    res.send(data).status(200)
})

Router.post("/insert_timesheet_item", async (req, res) => {
    const data = await controllers.insertTimesheetItem(req.body)
    res.send(data).status(200)
})

Router.post("/update_quantity", async (req, res) => {
    const data = await controllers.updateQuantity(req.body)
    res.send(data).status(200)
})

Router.get("/get_repair_item", async (req, res) => {
    const data = await controllers.getRepairItem(req.query.machine_id)
    res.send(data).status(200)
})

Router.post("/insert_ma_request", async (req, res) => {
    const data = await controllers.insertRepairRequest(req.body)
    res.send(data).status(200)
})

Router.get("/update_ma_request_again", async (req, res) => {
    const data = await controllers.updateRepairRequestAgain(req.query.ma_id)
    res.send(data).status(200)
})

Router.post("/insert_checklist_warning", async (req, res) => {
    const data = await controllers.insertChecklistWarning(req.body)
    res.send(data).status(200)
})

Router.post('/insert_checklist_warning_with_ma_request', async (req, res) => {
    const data = await controllers.insertChecklistWarningWithMaRequest(req.body)
    res.send(data).status(200)
})

Router.post("/chk_first_shift", async (req, res) => {
    const data = await controllers.checkFirstShift(req.body)
    res.send(data).status(200)
})

Router.get("/get_total_running", async (req, res) => {
    const data = await controllers.getTotalRunning(req.query.header_id)
    res.send(data).status(200)
})

Router.post("/update_timesheet_item", async (req, res) => {
    const data = await controllers.updateTimesheetItem(req.ip, req.body)
    res.send(data).status(200)
})

Router.get("/get_department", async (req, res) => {
    const data = await controllers.getDepartment(req.query.term)
    res.send(data).status(200)
})

Router.get("/get_machine_by_dep", async (req, res) => {
    const data = await controllers.getMachineByDepartment(req.query)
    res.send(data).status(200)
})

Router.get('/get_detail_oklimit_color', async (req, res) => {
    const data = await controllers.getOkLimitColorDetail(req.query.header_id)
    res.send(data).status(200)
})

Router.post('/insert_oklimit_color', async (req, res) => {
    const data = await controllers.insertOkLimitColor(req.ip, req.body)
    res.send(data).status(200)
})

Router.get('/get_problem', async (req, res) => {
    const data = await controllers.getProblem(req.query.machine_id)
    res.send(data).status(200)
})

Router.get('/get_checklist_long', async (req, res) => {
    const data = await controllers.getChecklistLong(req.query.machine_id)
    res.send(data).status(200)
})

Router.get('/delete_timesheet', async (req, res) => {
    const data = await controllers.deleteTimesheet(req.query.header_id)
    res.send(data).status(200)
})

Router.post('/get_sup_detail', async (req, res) => {
    const data = await controllers.getDetailSupCheckColor(req.body)
    res.send(data).status(200)
})

Router.post("/update_end_timesheet", async (req, res) => {
    const data = await controllers.updateEndtimeItem(req.body)
    res.send(data).status(200)
})

Router.post("/insert_ink_usage", async (req, res) => {
    const data = await controllers.insertInkUsage(req.body)
    res.send(data).status(200)
})

Router.post("/get_request_ot_type", async (req, res) => {
    const data = await controllers.getTableOtType(req.body)
    res.send(data).status(200)
})

Router.post('/get_sup_detail', async (req, res) => {
    const data = await controllers.getDetailSupCheckColor(req.body)
    res.send(data).status(200)
})

Router.post("/insert_request_ot", async (req, res) => {
    const data = await controllers.insertRequestOt(req.ip, req.body)
    res.send(data).status(200)
})

Router.post("/delete_request_ot", async (req, res) => {
    const data = await controllers.deleteRequestOt(req.body)
    res.send(data).status(200)
})

Router.get("/get_checklist_sup", async (req, res) => {
    const data = await controllers.getChecklistSup()
    res.send(data).status(200)
})

Router.post("/get_ok_sheet_detail", async (req, res) => {
    const data = await controllers.getOkSheetDetail(req.body)
    res.send(data).status(200)
})

Router.post("/get_old_header", async (req, res) => {
    const data = await controllers.getOldHeaderTimesheet(req.body)
    res.send(data).status(200)
})

Router.post("/get_partname_sub", async (req, res) => {
    const data = await controllers.getPartnameSub(req.body)
    res.send(data).status(200)
})

Router.post("/insert_sup_check_color", async (req, res) => {
    const data = await controllers.insertSupCheckColorDetail(req.body)
    res.send(data).status(200)
})

Router.post("/insert_ok_sheet", async (req, res) => {
    const data = await controllers.insertOkSheet(req.body)
    res.send(data).status(200)
})

Router.post("/check_worker_request_ot", async (req, res) => {
    const data = await controllers.checkWorkerRequestOt(req.body)
    res.send(data).status(200)
})

Router.get("/check_emp_data", async (req, res) => {
    const data = await controllers.checkEmployeeData(req.query.term)
    res.send(data).status(200)
})

Router.get("/check_header_id", async (req, res) => {
    const data = await controllers.checkHeaderId(req.query.header_id)
    res.send(data).status(200)
})

// ***************************End Timesheet Item******************************

Router.get("/get_document_maintenance_machine", async (req, res) => {
    const data = await controllers.getDocumentMaintenanceMachine(req.query.machine_id)
    res.send(data).status(200)
})

Router.post("/insert_timesheet_maintenance_machine", async (req, res) => {
    const data = await controllers.insertTimesheetMaintenanceMachine(req.body)
    res.send(data).status(200)
})

Router.get("/get_maintenance_machine_ma_worker", async (req, res) => {
    const data = await controllers.getMaintenanceMachineRequestWorker(req.query.ma_id)
    res.send(data).status(200)
})

Router.get("/get_timesheet_maintenance_machine", async (req, res) => {
    const data = await controllers.getTimesheetMaintenanceMachine(req.query.header_id)
    res.send(data).status(200)
})

Router.post("/insert_timesheet_maintenance_machine_item", async (req, res) => {
    const data = await controllers.insertTimesheetMaintenanceMachineItem(req.body)
    res.send(data).status(200)
})

Router.post("/update_endtime_item_maintenance", async (req, res) => {
    const data = await controllers.updateEndtimeItemMaintenance(req.body)
    res.send(data).status(200)
})

Router.post("/end_maintenance_machine", async (req, res) => {
    const data = await controllers.endMaintenanceMachine(req.body)
    res.send(data).status(200)
})

Router.get("/update_ma_success", async (req, res) => {
    const data = await controllers.updateMaStatus(req.query.ma_id)
    res.send(data).status(200)
})

Router.post("/delete_ma_worker", async (req, res) => {
    const data = await controllers.deleteMaWorker(req.body)
    res.send(data).status(200)
})

Router.post("/add_ma_worker", async (req, res) => {
    const data = await controllers.addMaWorker(req.body)
    res.send(data).status(200)
})

Router.post("/check_ma_emp_data", async (req, res) => {
    const data = await controllers.checkMaWorker(req.body)
    res.send(data).status(200)
})

Router.get("/check_ma_end_type", async (req, res) => {
    const data = await controllers.checkMaEndType(req.query.ma_id)
    res.send(data).status(200)
})

Router.post("/get_working_status", async (req, res) => {
    const data = await controllers.getWorkingStatusWorker(req.body)
    res.send(data).status(200)
})

Router.post("/manage_checklist_outsource", async (req, res) => {
    const data = await controllers.manageChecklistOutsource(req.body)
    res.send(data).status(200)
})

Router.get("/get_checklist_outsource_detail", async (req, res) => {
    const data = await controllers.getChecklistOutsource(req.query.plan_id)
    res.send(data).status(200)
})


module.exports = Router