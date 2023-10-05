var apiScheduler = `${api_url}/masterplans`

async function getDataPlaning(type_id, search_date1, search_date2) {
    const url = `${apiScheduler}/get_data_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id, search_date1, search_date2 },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

function getData(targetDate, targetMachine, targetDateLast) {
    const url = `${apiScheduler}/get_data`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { targetDate, targetMachine, targetDateLast },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            if (typeof targetDateLast == 'undefined') $('td.' + targetMachine + '.' + targetDate).html('');
            setDataPlan(data, 'single')
        },
        error: function (err) {
            console.log(err);
        }
    })
    // return res
}

function getDataHr(targetDate, targetMachine, targetDateLast) {
    const url = `${apiScheduler}/get_data_hr`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { targetDate, targetMachine, targetDateLast },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            showHR(data)
        },
        error: function (err) {
            console.log(err);
        }
    })
    // return res
}

async function saveMasterPlanDragAndDrop(data) {
    const url = `${apiScheduler}/send_data`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: data,
        async: false,
        dataType: 'JSON',
        beforeSend: async function () {
            await loadingLayer(false)
            await displayStatus("Loading...");
        },
        success: async function (res) {
            console.log(res);
            if (res == 'success') {
                await displayStatus("Success");
            }
            else {
                await displayStatus("ERROR - " + res);
            }
        },
        error: async function (a, b) {
            console.error(a, b);
            await displayStatus(b.toUpperCase() + ' - ' + a.statusText);
        },
        complete: async function () {
            await reloadSection(data.plan_date, data.machine_id);
            if (data.plan_date != data.original_plan_date || data.machine_id != data.original_machinei_id) { // if machine or date is differrent, reload the original box
                await reloadSection(data.original_plan_date, data.original_machine_id);
            }
            await loadingLayer(false);
        },
    })
    // return res
}

async function saveMasterPlanDragAndDropMoveAllThoseBehind(data) {
    const url = `${apiScheduler}/send_data_moveAllThoseBehind`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: data,
        async: false,
        dataType: 'JSON',
        beforeSend: async function () {
            await loadingLayer(false)
            await displayStatus("Loading...");
        },
        success: async function (res) {
            if (typeof res.status != "undefined" && res.status == 'success') {
                if (typeof res.moveList[0] != "undefined" && res.moveList[0].id == 0) { // invalid return from stored proc
                    await displayStatus("ERROR - " + res.moveList[0].detail);
                    await reloadSection(data.plan_date, data.machine_id);
                    if (data.plan_date != data.original_plan_date || data.machine_id != data.original_machine_id) { // if machine or date is differrent, reload the original box
                        await reloadSection(data.original_plan_date, data.original_machine_id);
                    }
                    await resetState();
                }
                else if (!moveNow) {
                    await displayStatus("Please comfirm.");
                    var moveList = await createMoveListTable(res.moveList);
                    $.responder({
                        message: moveList,
                        type: 'prompt',
                        height: '300px',
                        width: '600px',
                        ok: function () {
                            save(true, true);
                        },
                        cancel: function () {
                            reloadSection(data.plan_date, data.machine_id);
                            if (data.plan_date != data.original_plan_date || data.machine_id != data.original_machine_id) { // if machine or date is differrent, reload the original box
                                reloadSection(data.original_plan_date, data.original_machine_id);
                            }
                            resetState();
                        },
                    });
                }
                else {
                    await displayStatus("Success.");
                    await loadingLayer(true);
                    // reload the whole page
                    window.location.href = window.location.href;
                }
            }
            else {
                await displayStatus("ERROR - " + res.status);
                await reloadSection(data.planDate, data.machine_id);
                if (data.plan_date != data.original_plan_date || data.machine_id != data.original_machine_id) { // if machine or date is differrent, reload the original box
                   await reloadSection(data.original_plan_date, data.original_machine_id);
                }
                await resetState();
            }
        },
        error: async function (a, b) {
            console.error(a, b);
            await displayStatus(b.toUpperCase() + ' - ' + a.statusText);
            await reloadSection(data.planDate, data.machine_id);
            if (data.plan_date != data.original_plan_date || data.machine_id != data.original_machine_id) { // if machine or date is differrent, reload the original box
                await reloadSection(data.original_plan_date, data.original_machine_id);
            }
            await resetState();
        }
    })
    // return res
}