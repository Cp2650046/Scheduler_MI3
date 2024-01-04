var apiScheduler = `${api_url}/masterplans`

async function getDataPlaning(type_id, search_date1, search_date2) {
    const url = `${apiScheduler}/get_data_machine`;
    // let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id, search_date1, search_date2 },
        dataType: 'JSON',
        // beforeSend: async function () {
        //     await main_set_loading({ loading: true, message: 'LOADING...' })
        // },
        success: function (res) {
            // console.log(res);
            renderTablePLan(res.machineList, res.holidayList).then((value) => {
                if (value) {
                    // await setDataPlan(res.dataplanList.plansList, 'all');
                    getDataPlan(type_id, search_date1, search_date2);
                }
                // await main_set_loading({ loading: false })
            }).catch(err => {
                console.log(err);
            });
        },
        error: function (err) {
            console.log(err);
        }
    })
    // return res
}
function getDataPlan(type_id, search_date1, search_date2){
    const url = `${apiScheduler}/get_data_plan`;
    // let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id, search_date1, search_date2 },
        dataType: 'JSON',
        beforeSend: async function () {
            await main_set_loading({ loading: true, message: 'LOADING...' })
        },
        success: async function (res) {
            // console.log(res);
            await setDataPlan(res.plansList, 'all');
            await main_set_loading({ loading: false })
        },
        error: function (err) {
            console.log(err);
        }
    })
}

function getData(targetDate, targetMachine) {
    const url = `${apiScheduler}/get_data`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { targetDate, targetMachine },
        dataType: 'JSON',
        success: async function (res) {
            // console.log('37 :>> ', data);
            if (res.length > 0) {
                await setDataPlan(res, 'single');
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
    // return res
}

function getDataHr(targetDate, targetMachine) {
    const url = `${apiScheduler}/get_data_hr`;
    // let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { targetDate, targetMachine },
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: async function (data) {
            // console.log('62 :>> ', data);
            // res 
            if (data) {
                await showHR(data);
            }

        },
        error: function (err) {
            console.log(err);
        }
    })
    // return res
}

async function saveMasterPlanDragAndDrop(data) {
    const url = `${apiScheduler}/send_data`;
    // let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: data,
        dataType: 'JSON',
        async: true,
        beforeSend: async function () {
            await main_set_loading({ loading: true, message: 'LOADING...' })
        },
        success: async function (res) {
            // console.log("85 > ", res);
            if (res.success == 1) {
                await main_set_loading({ type: 'success', loading: false, message: 'Success' })
                // await resetState();
                // await reloadSection(data.original_plan_date, data.original_machine_id)
                await reloadSection(data.plan_date, data.machine_id)
                await reloadSection(data.original_plan_date, data.original_machine_id)
                            }
            else if (res.success == 2) {
                await resetState();
                await main_set_loading({ type: 'warning', loading: false, message: res.message })
                await reloadSection(data.plan_date, data.machine_id)
                await reloadSection(data.original_plan_date, data.original_machine_id)
            }
            else {
                await main_set_loading({ type: 'error', loading: false, message: 'ERROR - ' + res.message })
            }
        },
        error: async function (a, b) {
            console.error(a, b);
            await main_set_loading({ type: 'error', loading: false, message: b.toUpperCase() + ' - ' + a.statusText })
        }
    })
    // return res
}

async function hasTimeSheet(plan_id) {
    const url = `${apiScheduler}/check_time_sheet`;
    let res = 0;
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            method: 'POST',
            data: { plan_id },
            dataType: 'JSON',
            success: function (data) {
                // console.log('200 :>> ', data[0]);
                res = data[0].has_timesheet
                resolve(res);
            },
            error: function (err) {
                console.log(err);
            }
        })
    });
    // return res
}

async function getPaperInfo(id, jobID, itid) {
    const url = `${apiScheduler}/get_paper_info`;
    $.ajax({
        url: url,
        method: 'POST',
        data: {
            id,
            jobID,
            itid
        },
        dataType: 'JSON',
        success: function (res) {
            // console.log('res :>> ', res);
            setPaperInfo(res);
        },
        error: function (err) {
            console.log(err);
        }
    })
}

async function setPaperAndInkReady(data_paper) {
    const url = `${apiScheduler}/set_paper_and_ink_ready`;
    $.ajax({
        url: url,
        method: 'POST',
        data: data_paper,
        dataType: 'JSON',
        // async: false,
        success: async function (res) {
            console.log('res :>> ', res);
            if (res.success === 1) {
                await $("#modal-paperReadyContainer").modal('hide')
                console.log('246:>> ', $('div[plan_id="+data_paper.id+"]'));
                await setIconPrint(data_paper)
                await reloadSection(data_paper.plan_date, data_paper.machine_id);
                await main_set_loading({ type: 'success', loading: false, message: 'save ink_ready or paper_trim_ready SUCCESS' })
                console.log('save ink_ready or paper_trim_ready SUCCESS');
                // location.reload();
            }
        },
        error: function (err) {
            console.log('save ink_ready or paper_trim_ready UNSUCCESS');
        }
    })
}