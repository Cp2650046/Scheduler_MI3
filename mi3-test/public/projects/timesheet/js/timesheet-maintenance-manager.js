async function getDocumentMaintenanceMachine(machine_id) {
    const url = `${api_url}/timesheet/get_document_maintenance_machine`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { machine_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function insertTimesheetMaintenanceMachine(obj) {
    const url = `${api_url}/timesheet/insert_timesheet_maintenance_machine`
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getMaintenanceMachineRequestWorker(ma_id) {
    const url = `${api_url}/timesheet/get_maintenance_machine_ma_worker`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { ma_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.workers
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function checkEndTypeTimesheet(ma_id) {
    const url = `${api_url}/timesheet/check_ma_end_type`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { ma_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.header_id
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getTimesheetMaintenanceMachine(header_id) {
    const url = `${api_url}/timesheet/get_timesheet_maintenance_machine`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function insertTimesheetMaintenanceMachineItem(obj) {
    const url = `${api_url}/timesheet/insert_timesheet_maintenance_machine_item`
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function updateEndtimeItemMaintenance(obj) {
    const url = `${api_url}/timesheet/update_endtime_item_maintenance`
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
        },
        error: function (err) {
            console.log(err);
        }
    })
}

async function endMaintenanceMachine(obj) {
    const url = `${api_url}/timesheet/end_maintenance_machine`
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: async function (data) {
            if (data.success === true) {
                await stateEnd(0)
            }
        },
        error: function (err) {
            console.log(err);
        }
    })
}

async function updateMaintenanceStatus(ma_id) {
    const url = `${api_url}/timesheet/update_ma_success`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { ma_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function deleteMaWorker(obj) {
    const url = `${api_url}/timesheet/delete_ma_worker`
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function addMaWorker(obj) {
    const url = `${api_url}/timesheet/add_ma_worker`
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: { obj },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getEmpData(req) {
    $.ajax({
        url: `${api_url}/timesheet/get_emp_data`,
        method: 'GET',
        data: { term: req },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            if (data.length !== 0) {
                // console.log(data);
                $(`div#finding-emp`).show()
                let html = `<ul id="new-worker">`
                $.each(data, function (index, value) {
                    html += `<li onclick="setWorkerNew(this)" id="${value.emp_id}" 
                    data-emp-name="${value.emp_name}" data-li-type="new-worker">(${value.emp_id}) ${value.emp_name}</li>`
                });
                html += `</ul>`
                $(`div#finding-emp`).html(html)
            } else {
                $(`div#finding-emp`).html("")
                $(`div#finding-emp`).hide()
            }
        },
    })
}

async function check_emp_input(req) {
    let res
    $.ajax({
        url: `${api_url}/timesheet/check_ma_emp_data`,
        method: 'POST',
        data: { emp_id : req },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            console.log(data);
            res = data
        },
    })
    return res
}

async function remove_worker(obj) {
    const url = `${api_url}/timesheet/remove_ma_worker`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (data) {
            console.log(data);
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}
