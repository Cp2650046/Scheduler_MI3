const pathname_maintenance = location.pathname.split('/', -1).pop()
const params_maintenance = new URLSearchParams(window.location.search);
var temp_timesheet_maintenance = {
    workers: []
}

$(async function () {
    if (params_maintenance.get('maintenance') === '1') {

        await set_layout_timesheet()
        await set_datepicker()
        await set_shift()
        temp_timesheet_maintenance['shift_id'] = $("input[name='shift']:checked").attr('id')
        temp_timesheet_maintenance['type_id'] = pathname_maintenance !== "" || pathname_maintenance !== undefined ? pathname_maintenance : ""
        temp_timesheet_maintenance['machine_id'] = params_maintenance.get('machine_id') !== "" || params_maintenance.get('machine_id') !== undefined ? params_maintenance.get('machine_id') : ""

        if (temp_timesheet_maintenance['type_id'] === "" ||
            temp_timesheet_maintenance['machine_id'] === "") {
            window.close()
        }

        let data = await getDocumentMaintenanceMachine(temp_timesheet_maintenance.machine_id)
        await createMachineButton($(`div.timesheet-body-box.machines`), data.machine)
        await createMaintenanceMachinePlans($(`div.timesheet-body-box.plans`), data.plans)
        await createMaintenanceMachineWorkers($(`div.timesheet-body-box.workers`), data.workers)
        await propElement($("div.content-wrapper"), 'hidden', false)
        await propElement($("div.detail-container"), 'hidden', true)

        $("div#finding-emp").hide()
        $("input#search-emp").focus(async () => {
            await getEmpData($("input#search-emp").val())
        })

        $("div#finding-emp").hide()
        $("input#search-emp").keyup(async () => {
            await getEmpData($("input#search-emp").val())
        })

    }
})

async function propElement(el, type, bool) {
    el.prop(type, bool)
}

async function createMachineButton(el, machines) {
    let body_machines = el.html("")
    let str = ` <input name="machines" type="radio" 
                    id="${machines[0].machine_id}" 
                    value="${machines[0].machine_id}" 
                    data-typeid="${machines[0].type_id}"  
                    data-machine-name="${machines[0].machine_name}" />
                <label for="${machines[0].machine_id}" name="machines">${machines[0].machine_id} ${machines[0].machine_name}</label>`
    body_machines.append(str);

    await activeMachinebutton(machines[0].machine_id)
}

async function createMaintenanceMachineWorkers(el, workers) {
    let body_workers = el.html("")
    $.each(workers, function (index, value) {
        let str = ` <input name="workers" type="checkbox" id="${value.emp_id}" value="${value.emp_id}" onclick="manageOption($(this))"
                    data-firstname="${value.firstname}" data-lastname="${value.lastname}" />
                    <label for="${value.emp_id}" name="workers">
                        <div>
                            <span class="emp-id">${value.emp_id}</span>
                            <img class="img_worker" src="http://192.168.5.40/LEAVE_FLOW/pic_emp/${value.emp_id}.jpg" alt="${value.emp_id}">
                            <p>${value.firstname} ${value.lastname}</p>
                            <button id="edit-worker" onclick="edit_worker('${value.emp_id}')" hidden><i class="bi bi-gear-fill"></i></button>
                            <button id="delete-worker"><i class="bi bi-trash-fill"></i></button>
                        </div>
                    </label>`
        body_workers.append(str);
    })
}

async function activeMachinebutton(machine_id) {
    let el_machine = document.getElementById(machine_id)
    el_machine.checked = true
    await radio_actived(el_machine)
}

async function createMaintenanceMachinePlans(el, plans) {
    let body_plans = el.html("")
    let str = ""
    $.each(plans, async function (index, value) {
        str += `<input name="plans" type="radio" 
                id="${value.plan_id}" 
                value="${value.plan_id}" 
                onclick="manageOption($(this))" 
                data-count-worker"${value.count_worker}" 
                data-doctype="${value.doctype}" 
                data-detail="${value.detail}" 
                data-count-worker="${value.count_worker}" />
                <label for="${value.plan_id}" name="plans">
                    <div>
                        ${value.plan_id}<br/>
                        ${value.plan_date}<br/>
                        ${value.jobid} (${value.partname})<br/>
                        ${value.job_name}
                    </div>
                </label>`
    })

    body_plans.append(str);
}

async function manageOption(el) {
    if ($(`label[for='${el.attr('id')}']`).hasClass('active') && el.attr('name') !== 'workers') {
        return
    }

    let name = el.attr('name')
    let value = el.attr('id')
    let element = document.getElementById(el.attr('id'))
    switch (name) {
        case 'shift':
            temp_timesheet_maintenance['shift_id'] = value
            await propElement($(element), 'checked', true)
            await radio_actived(element)
            break
        case 'plans':
            let res = await checkEndTypeTimesheet(value)
            if (res === "") {
                let detail = el.attr('data-detail')
                await createPlansDetail(detail)
                await uncheckWorkers()
                temp_timesheet_maintenance['ma_id'] = value
                temp_timesheet_maintenance['count_worker'] = Number(el.attr('data-count-worker'))
                $('span#number-worker').text(`(${$('input[name="workers"]:checked').length}/${temp_timesheet_maintenance['count_worker']})`)
                await propElement($(element), 'checked', true)
                await radio_actived(element)
                let workers = await getMaintenanceMachineRequestWorker(value)
                $.each(workers, async (index, item) => {
                    let elWorker = $(`input#${item.emp_id}[name="workers"]`)
                    await propElement($(`input#${item.emp_id}[name="workers"]`), 'checked', true)
                    manageOption(elWorker)
                })
            } else {
                let url = `http://192.168.5.3:3080/timesheet?maintenance=1&header_id=${res}`
                await alert_old_timesheet(url)
            }

            break
        case 'workers':
            await checkbox_actived(element)
            if ($('input[name="workers"]:checked').length > temp_timesheet_maintenance['count_worker'] && temp_timesheet_maintenance['count_worker'] !== 0) {
                await alert_valid('จำนวนเกินที่วางแผน')
                await propElement($(element), 'checked', false)
                $(`label[for="${value}"]`).removeClass('active')
                $(`label[for="${value}"] div > .emp-id`).removeClass('active')
            } else {

                temp_timesheet_maintenance['workers'] = []
                $.each($('input[name="workers"]:checked'), (index, item) => {
                    temp_timesheet_maintenance['workers'].push($(item).val())
                })
            }
            $('span#number-worker').text(`(${$('input[name="workers"]:checked').length}/${temp_timesheet_maintenance['count_worker']})`)

            break
    }

    await checkMaintenanceMachineValue()
}

async function createPlansDetail(detail) {
    let str = ` <span>รายละเอียด</span>
                <div>${detail}</div>`
    $("div.detail-container").html(str)
    await propElement($("div.detail-container"), 'hidden', false)
}

async function uncheckWorkers() {
    await propElement($('input[name="workers"]'), 'checked', false)
    $('label[name="workers"]').removeClass('active')
    $(`label[name="workers"] div > .emp-id`).removeClass('active')
}

async function removeItem(arr, item) {
    var index = arr.indexOf(item);
    if (index !== -1) {
        arr.splice(index, 1);
    }
}

async function checkMaintenanceMachineValue() {
    let chk = true
    if (temp_timesheet_maintenance.machine_id === undefined || temp_timesheet_maintenance.machine_id === "") {
        chk = false
    }

    if (temp_timesheet_maintenance.ma_id === undefined || temp_timesheet_maintenance.ma_id === "") {
        chk = false
    }

    if (temp_timesheet_maintenance.shift_id === undefined || temp_timesheet_maintenance.shift_id === "") {
        chk = false
    }

    if (temp_timesheet_maintenance.workers.length === undefined || temp_timesheet_maintenance.workers.length === 0) {
        chk = false
    }

    if (chk) {
        await propElement($("div.div-start-maintenance"), 'hidden', false)
    } else {
        await propElement($("div.div-start-maintenance"), 'hidden', true)
    }


}

async function startTimesheetMaintenanceMachines() {
    // console.log(temp_timesheet_maintenance);
    let result = await insertTimesheetMaintenanceMachine(temp_timesheet_maintenance)
    if (result.header_id !== "") {
        self.location.href = `/timesheet?maintenance=1&header_id=${result.header_id}`
    }
}

async function open_modal_add_workers(type) {
    switch (type) {
        case 1: //ชั่วคราว
            $("div.modal#add-workers div.modal-body h3.modal-title").text('เพิ่มพนักงานชั่วคราว')
            // $(".save-workers").attr('data-worker-type', 1)
            break;
        case 2: //ถาวร
            $("div.modal#add-workers div.modal-body h3.modal-title").text('เพิ่มพนักงานถาวร')
            // $(".save-workers").attr('data-worker-type', 2)
            break

    }

    $("div.modal#add-workers div.modal-body input#search-emp").val("")
    $("div.modal#add-workers").modal('show')
    $(".save-workers").attr('onclick', `save_worker(${type})`)

}

async function setWorkerNew(e) {
    $(`div#finding-emp`).hide()
    $("input#search-emp").val(`(${e.id}) ${e.dataset.empName}`)
    $("input#new-emp-id").val(e.id)
    // console.log($("input#new-emp-id").val());
}

async function saveWorker(type) {
    if (!($("input#search-emp").val())) {
        await alert_valid("ข้อมูลว่าง ไม่สามารถเพิ่มพนักงานได้")
        return
    }
    let str_name = $("input#search-emp").val().split(" ")
    let emp_id = str_name[0].replace('(', '').replace(')', '')
    let result = await check_emp_input(emp_id)

    if (result.success === 1) {
        if ($(`input[name='workers']#${result.emp_data.emp_id}`).length > 0) {
            await alert_valid('ไม่สามารถเพิ่มพนักงานซ้ำกับที่มีอยู่ได้ <br><span class="text-danger">กรุณาตรวจสอบอีกรอบ</span>')
        } else {
            let body_workers = $(`div.timesheet-body-box.workers`)
            let str = ` <input name="workers" type="checkbox" id="${result.emp_data.emp_id}" value="${result.emp_data.emp_id}" onclick="click_type(this)"
                data-firstname="${result.emp_data.emp_firstname_th}" data-lastname="${result.emp_data.emp_lastname_th}" />
                <label for="${result.emp_data.emp_id}" name="workers">
                    <div>
                        <span class="emp-id">${result.emp_data.emp_id}</span>
                        <img class="img_worker" src="http://192.168.5.40/LEAVE_FLOW/pic_emp/${result.emp_data.emp_id}.jpg" alt="${result.emp_data.emp_id}">
                        <p>${result.emp_data.emp_firstname_th} ${result.emp_data.emp_lastname_th}</p>
                        <p class="type-worker"></p>
                        <button id="edit-worker" onclick="edit_worker('${result.emp_data.emp_id}')" hidden><i class="bi bi-gear-fill"></i></button>
                        <button id="delete-worker" onclick="alert_delete_worker('${result.emp_data.emp_id}', '${result.emp_data.emp_firstname_th} ${result.emp_data.emp_lastname_th}')"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </label>`
            body_workers.append(str);
            if (parseInt(type) === 2) {
                $(`label[for='${result.emp_data.emp_id}'] div p.type-worker`).remove()
                // type_id: Number(temp_timesheet.type_id) === 28 || Number(temp_timesheet.type_id) === 29 ? Number(temp_timesheet.type_id) : 0,
                let obj = {
                    emp_id: result.emp_data.emp_id,
                    type_id: Number(temp_timesheet.type_id) === 28 || Number(temp_timesheet.type_id) === 29 ? Number(temp_timesheet.type_id) : 0,
                    machine_id: temp_timesheet.machine_id
                }
                await insert_worker_mapping(obj)
            } else {
                // $(`label[for='${result.emp_data.emp_id}'] div button#edit-worker`).hide()
                $(`label[for='${result.emp_data.emp_id}'] div p.type-worker`).text(`(พนักงานชั่วคราว)`).css({ 'font-size': '14px', 'color': '#FCAE1E' })
            }
            $("div.modal#add-workers").modal('hide')
        }
    } else {
        await alert_valid('กรอกค่าไม่ถูกต้อง <br>ไม่สามารถเพิ่มพนักงานได้')
    }

}

async function delete_worker(emp_id) {
    let obj = {
        emp_id: emp_id,
        machine_id: temp_timesheet.machine_id
    }
    await remove_worker(obj).then(async () => {
        $(`input[type='checkbox']#${emp_id}`).remove()
        $(`label[name='workers'][for='${emp_id}']`).remove()
        await alert_success('ลบสำเร็จ')
    })
}