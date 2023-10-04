const params_maintenance = new URLSearchParams(window.location.search);
var ma_id = ""

$(async function () {
    if (params_maintenance.get('maintenance') === '1') {
        await set_layout_timesheet()
        let data = await getTimesheetMaintenanceMachine(params_maintenance.get('header_id'))
        ma_id = data.header.ma_id
        await createTimesheetHeaderText(data.header)
        await createTimesheetWorkerTable(data.worker)
        await createItemHistory(data.item)
        await stateEnd(data.header.end_type)
    }
    $('div#second_board').prop('hidden', false)

    $("div#finding-emp").hide()
    $("input#search-emp").focus(async () => {
        await getEmpData($("input#search-emp").val())
    })

    $("div#finding-emp").hide()
    $("input#search-emp").keyup(async () => {
        await getEmpData($("input#search-emp").val())
    })

})

async function createTimesheetHeaderText(header) {
    //บรรทัดแรก
    $("div.timesheet-title h2 span#plan-title").html(`REQUEST ID: ${header.ma_id} `)
    $("div.timesheet-title h2 span#machine-title").html(`(${header.machine_id} ${header.machine_name})`)
    //บรรทัดสอง
    $("div.timesheet-title h5 span#job-title").html(`${header.ma_remark}`)
    $("div.timesheet-title h5 span#remark-title").html(`(${header.ma_location})`)
}

async function createTimesheetWorkerTable(worker) {
    let str = ""
    $('div.timesheet-btn-left#div-insert-worker table tbody').html("")
    let btn_add = `<button class="btn-success add-worker" style="width: 50%; height: 2.3rem; margin: 3px;" onclick="showPageAddMaWorker($(this).closest('tr'))">เพิ่มพนักงาน</button>`

    $.each(worker, function (index, value) {
        let btn_del = `<button class="btn-danger del-worker" style="width: 6rem; height: 2.3rem; margin: 3px;" onclick="delMaWorker($(this).closest('tr'))">ลบ</button>`
        str += `<tr id="${value.id}" data-emp-id="${value.emp_id}" data-help-worker="${value.help_worker}">
                    <td class="rowNumber">${Number(index) + 1}</td>
                    <td>${value.emp_id}</td>
                    <td class="left">${value.emp_name}</td>
                    <td class="button">${btn_del}</td>
                </tr>`
    });

    str += `<tr id="" data-help-worker="">
                <td colspan="4">${btn_add}</td>
            </tr>`

    $('div.timesheet-btn-left#div-insert-worker table tbody').html(str)
}

async function carryOutMaintenance(el) {
    if (el.hasClass('active')) {
        return
    }

    el.toggleClass('active')
    $('#click-here').toggle()
    let obj = {
        header_id: params_maintenance.get('header_id'),
        end_time: await format_datetime(new Date()),
        ma_id: ma_id
    }

    if (el.hasClass('active')) {
        let data = await insertTimesheetMaintenanceMachineItem(obj)
        await createItemHistory(data.item)
    }
}

async function createItemHistory(data) {
    let body = $("table.table#process-history tbody").html("")
    let str = ""

    $.each(data, async function (index, value) {
        str += `<tr id="${value.id}">
                <td class="text-center index-col" style="width:5%">${Number(index) + 1}.</td>
                <td class="left index-col" style="width:100%">ดำเนินการซ่อม</td>
                <td class="right pr-2 time-col" style="width:100%">${value.startTime}</td>
               </tr>`
        if (index === data.length - 1 && value.endTimeText === null) {
            timeoutFlag = true
            await add_timer(value.startTimeText)
            $('div#show-process h1 span').text('ดำเนินการซ่อม')
            $('div.timesheet-btn-left#div-carry-out button').addClass('active')
            $('#click-here').hide()
        }
    });
    body.append(str);
}

async function stopMaintenance() {
    $('div#show-process h1 span').text('')
    timeoutFlag = false
    $("div#show-timer").html('')

}

async function endMaintenance(type) {
    let obj = {
        header_id: params_maintenance.get('header_id'),
        end_time: await format_datetime(new Date()),
        ma_id: ma_id
    }
    await updateEndtimeItemMaintenance(obj)
    await endMaintenanceMachine(obj)
    if (type === 1) { // ซ่อมเสร็จสิ้น
        await updateMaintenanceStatus(ma_id)
    }

    await stopMaintenance()
}

async function stateEnd(endType) {
    if (endType === 0) {
        $('div#div-carry-out button').prop('hidden', true)
        $('div#div-carry-out span').prop('hidden', true)
        $('div.end-timesheet-box').prop('hidden', true)
        $('div.div-btn-back').prop('hidden', false)
        $('table#worker button').prop('hidden', true)
        // $('table#worker').prop('hidden', true)
    }
}

async function modifyRow() {
    $.each($('td.rowNumber'), function (index, value) {
        $(value).html(Number(index) + 1)
    });
}

async function delMaWorker(tr) {
    let emp_id = tr.attr('data-emp-id')
    let emp_name = tr.find('td:eq(2)').text()
    await alert_delete_ma_worker(emp_id, emp_name, tr)
}

async function delMaWorkerFunc(emp_id, tr) {
    let obj = {
        header_id: params_maintenance.get('header_id'),
        emp_id: emp_id,
        ma_id,
        end_time: await format_datetime(new Date())
    }
    await deleteMaWorker(obj)
    // tr.remove()
    // await modifyRow()

    await updateEndtimeItemMaintenance(obj)
    location.reload()
}

async function showPageAddMaWorker(tr) {
    $("div.modal#add-workers").modal('show')
    $("div.modal#add-workers div.modal-body input#search-emp").val("")
}

async function setWorkerNew(e) {
    $(`div#finding-emp`).hide()
    $("input#search-emp").val(`(${e.id}) ${e.dataset.empName}`)
    $("input#new-emp-id").val(e.id)
    // console.log($("input#new-emp-id").val());
}

async function saveWorker() {
    if (!($("input#search-emp").val())) {
        await alert_valid("ข้อมูลว่าง ไม่สามารถเพิ่มพนักงานได้")
        return
    }
    
    let obj = {
        emp_id: $("input#new-emp-id").val(),
        ma_id,
        header_id: params_maintenance.get('header_id'),
        end_time: await format_datetime(new Date())
    }
    // console.log(obj);
    await updateEndtimeItemMaintenance(obj)
    await addMaWorker(obj)
    // await endMaintenanceMachine(obj)
    // await createTimesheetWorkerTable(worker)
    $("div.modal#add-workers").modal('hide')
    
    location.reload()
}

async function closeModal(el) {
    el.modal('hide')
}