const pathname = location.pathname.split('/', -1).pop()
const params = new URLSearchParams(window.location.search);
var temp_timesheet = {
    header_id: null,
    type_id: 0,
    jobid: '',
    job_name: '',
    partname: '',
    plan_id: '',
    machine_id: '',
    doc_date: '',
    shift_id: '',
    use_lpg: '',
    worker: [],
    sig: '',
    subsig: [],
}

if (Array.from(params).length > 0) {
    temp_timesheet.machine_id = params.get('machine_id')

    //fix only 3407 ช่วงทดลองใช้ 
    // if (params.get('machine_id') !== '3407') {
    //     window.location.href = `${base_url}/timesheet/35?machine_id=3407`
    // }

}

var perfecting = 0
var capacity_labor = 0
var pre_work_status = 0

$(async function () {
    if (params.get('maintenance') !== '1') {
        await del_local_storage('checklist_machine')
        await del_local_storage('checklist_qc')
        await del_local_storage('checklist_outsource')

        $('#keypad').keypad();
        $("div#second_board").hide()
        await hide_button_options()
        await set_layout_timesheet()
        await check_pathname()
        await set_datepicker()
        await set_shift()
        await set_printing()
        await set_page()

        let machine_type = await get_machine_type(pathname)

        let accorded = await set_accord_condition(machine_type)
        if (accorded === false) {
            return
        }

        // if url has search machine_id like ?machine_id=3423
        if (temp_timesheet.machine_id && Array.from(params).length > 0) {
            let div_machine = $(`div.timesheet-body-box.machines`)
            let machine = div_machine.find(`input[name='machines'][type='radio']#${temp_timesheet.machine_id}`)
            if (machine.length === 1) {
                div_machine.find(`input[name='machines'][type='radio']`).not(`#${temp_timesheet.machine_id}`).hide()
                div_machine.find(`label[name='machines']`).not(`[for='${temp_timesheet.machine_id}']`).hide()
                div_machine.find(`input[name='machines'][type='radio']#${temp_timesheet.machine_id}`).prop('checked', true)

                let input = div_machine.find(`input[name='machines'][type='radio']#${temp_timesheet.machine_id}`)[0]
                await click_type(input)

                if (div_machine.find(`input[name='machines'][type='radio']#${temp_timesheet.machine_id}`).is(":checked")) {
                    let label = div_machine.find(`label[name='machines'][for='${temp_timesheet.machine_id}']`)[0]
                    await set_active(label)
                }

            }

        }

        await set_sig_value()
        await select_first_option()
        $("div#second_board").show()

        $("div#finding-emp").hide()
        $("input#search-emp").focus(async () => {
            await get_emp_data($("input#search-emp").val())
        })

        $("div#finding-emp").hide()
        $("input#search-emp").keyup(async () => {
            await get_emp_data($("input#search-emp").val())
        })

        $("input.input-total").focus(function (e) {
            $("input.input-total").removeClass('keypad')
            $(e.currentTarget).addClass('keypad')
        });

        $("div.keypad button.number").click(function (e) {
            let number = e.delegateTarget.textContent
            $('input.keypad').val(function (index, value) {
                if (value === '' && parseInt(number) === 0) {
                    return
                }
                return value + number
            });
        });

        $("div.keypad button.delete").click(function (e) {
            if ($('input.keypad').val() === '' || $('input.keypad').val() === undefined) {
                return
            }
            $('input.keypad').val(($('input.keypad').val()).slice(0, -1));
        });

        $("div.modal#insert-sig").on('hidden.bs.modal', async function () {
            $("input.sig").removeClass('keypad')
            $("input.subsig").removeClass('keypad')
        })

        // ot_input_alert();
        // setInterval(function () {
        //     ot_input_alert();
        // }, 300000); //  เช็คทุก 5 นาที หมายเหตุ: 1000 = 1 วินาที
    }

})

async function ot_input_alert() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    if (minutes < 10)
        minutes = "0" + minutes;

    // var msg_alert = "กรุณาตรวจสอบข้อมูลการขอโอที";
    // if (hours == 17 && (minutes >= 00 && minutes <= 05)) { //ตอน 5 โมงเย็น
    //     // await alert_valid(msg_alert);
    //     window.location.reload()
    // }
    // else if (hours == 05 && (minutes >= 00 && minutes <= 05)) { //ตอนตี 5 
    //     // await alert_valid(msg_alert);
    //     window.location.reload()
    // }
}

async function check_pathname() {
    if (pathname === "") {
        window.location.href = `${base_url}/timesheet`
    }
}

async function save_sig_subsig() {
    let sig = $("div.modal#insert-sig input#sig").val()
    let subsig = $("div.modal#insert-sig input#subsig").val()
    $("div.sig1 input.sig").val(sig)
    $("div.sig1 input.subsig").val(subsig)

    if ($('input[type="radio"]#print2').is(":checked")) {
        $("div.sig2 input.sig").val(sig)
        $("div.sig2 input.subsig").val(Number(subsig) === 1 ? Number(subsig) + 1 : "")
    }
    // await check_sig_value()
    $("div.modal#insert-sig").modal("hide")
    await check_start_readiness()
}

async function show_numeric_keypad(el, val) {
    $("input.input-total").removeClass('keypad')
    $("div.modal#insert-sig").modal("show")

    if ($(el).hasClass('sig')) {
        $('input#sig').addClass('keypad')
        $('input#sig').focus()
    } else {
        $('input#subsig').addClass('keypad')
        $('input#subsig').focus()
    }
}

async function hide_numeric_keypad(el) {
    // console.log("hide");
    $("div.sig-numeric-keypad").hide()
}

async function set_layout_timesheet() {
    $("nav").hide()
    $("aside").hide()
    $("#action_bar").hide()
    $(".content-wrapper").css({ margin: '0' })

    $("div.sig-numeric-keypad").hide()
}

async function set_accord_condition(machine_type) {
    // ไม่เจอ machine type
    if (machine_type === false) {
        return machine_type
    }
    // เจอ
    switch (machine_type.event) {
        case 1:
            await build_machine_type(machine_type.data)
            break
        case 2:
            await build_machines_and_workers(machine_type.data[0].type_id)
            $('div.timesheet-body-box.add-workers').show()
            break
    }
}

async function set_input_numeric(e) {
    e.value = e.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    await check_start_readiness()
}

async function set_datepicker() {
    $('#timesheet-date').datetimepicker({
        format: 'YYYY-MM-DD',
        date: new Date()
    });

    if ($('input.form-control.datetimepicker-input').val() != '') {
        $('input.form-control.datetimepicker-input').addClass('is-valid')
    }
}

async function set_shift() {
    let bool = await check_time()
    if (bool) {
        $("div.shift-container div.shift input[name='shift']#2").prop('checked', true)
        if ($("div.shift-container div.shift input[name='shift']#2").is(':checked')) {
            $("div.shift-container div.shift label[name='shift']#label-2").addClass('active')
        }
    } else if (!bool) {
        $("div.shift-container div.shift input[name='shift']#1").prop('checked', true)
        if ($("div.shift-container div.shift input[name='shift']#1").is(':checked')) {
            $("div.shift-container div.shift label[name='shift']#label-1").addClass('active')
        }
    }
}

async function set_printing() {
    // console.log(perfecting);
    if (perfecting === 0) {
        $('div.print-container').hide()
        await set_default_sig2()
    }

    if (perfecting === 1) {
        $('div.print-container').show()
    }

    $('div.print-container div.print label').removeClass('active')
    $('div.print-container div.print input#print1').prop('checked', true)
    $('div.print-container div.print label#label-print1').addClass('active')
    await set_sig2_show('print1')
}

async function set_page() {
    await unset_plans_detail()
    await set_sig1_show()
    await set_use_lpg_show()
    $('div.div-start').hide()
    $('div.container-fluid#second_board').removeAttr('hidden')
    $('div.timesheet-body-box.add-workers').hide()
}

async function set_sig_value() {
    $('div.sig1 input.form-control.sig').keyup(function (e) {
        //ถ้าเลือก พิมพ์หน้าเดียว ไม่ให้ set ค่า sig ที่กรอบ 1
        if ($('div.print-container div.print input#print1').is(':checked')) {
            return
        }
        //ถ้าเลือก พิมพ์สองหน้า ต้อง set ค่า sig ที่กรอบ 1
        if (e.currentTarget.value === '') {
            $('div.sig2 input.form-control.sig').val('')
        } else {
            $('div.sig2 input.form-control.sig').val(parseInt(e.currentTarget.value))
        }
    });

    $('div.sig1 input.form-control.subsig').keyup(function (e) {
        //ถ้าเลือก พิมพ์หน้าเดียว ไม่ให้ set ค่า subsig ที่กรอบ 2
        if ($('div.print-container div.print input#print1').is(':checked')) {
            return
        }
        //ถ้าเลือก พิมพ์สองหน้า ต้อง set ค่า subsig ที่กรอบ 2
        if (e.currentTarget.value === '') {
            $('div.sig2 input.form-control.subsig').val('')
        } else {
            $('div.sig2 input.form-control.subsig').val(parseInt(e.currentTarget.value) + 1)
        }
    });
}

async function set_sig1_show() {
    if (pathname !== 'timesheet') {
        temp_timesheet.type_id = parseInt(pathname)
    }

    if (temp_timesheet.type_id === 34 ||
        temp_timesheet.type_id === 35 ||
        temp_timesheet.type_id === 12 ||
        temp_timesheet.type_id === 9 ||
        temp_timesheet.type_id === 52 ||
        temp_timesheet.type_id === 74) {
        // console.log(pathname);
        $('div.sig1-container').show()
        return
    } else {
        // console.log(pathname);
        $('div.sig1-container').hide()
        $('input.sig, input.subsig').val('')
    }


}

async function set_input_only_alphanumeric(e) {
    $(e).val($(e).val().replace(/[^a-z0-9]/gi, ''));
}

async function set_sig2_show(id) {
    if (id === 'print1') {
        await set_default_sig2()
        return
    }
    let sig = $('div.sig1-container div.sig1 input.form-control.sig').val()
    let subsig = $('div.sig1-container div.sig1 input.form-control.subsig').val() === '' ? '' : parseInt($('div.sig1-container div.sig1 input.form-control.subsig').val()) + 1

    $('div.sig2-container').show()
    $('div.sig2-container div.sig2 input.form-control.sig').val(sig)
    $('div.sig2-container div.sig2 input.form-control.subsig').val(subsig)
}

async function set_default_sig2() {
    $('div.sig2-container').hide()
    $('div.sig2-container div.sig2 input.form-control.sig').val("")
    $('div.sig2-container div.sig2 input.form-control.subsig').val("")
}

async function set_use_lpg_show() {
    let setting = false
    if (pathname === '34') {
        setting = true
    }

    if (temp_timesheet.type_id === 34) {
        setting = true
    }

    if (setting === true) {
        $("div.lpg-container div.use-lpg label[name='lpg']").show()
        $("div.lpg-container div.use-lpg input[name='lpg']").prop('checked', true)
        $("div.lpg-container div.use-lpg label[name='lpg']").addClass('active')
    } else {
        $("div.lpg-container div.use-lpg label[name='lpg']").hide()
        $("div.lpg-container div.use-lpg input[name='lpg']").prop('checked', false)
        $("div.lpg-container div.use-lpg label[name='lpg']").removeClass('active')
    }

    return
}

async function set_capacity_labor(number = 0) {
    $("span#number-worker").html(`(${number}/${capacity_labor})`)
}

async function check_time() {
    let res = false
    let format = 'hh:mm:ss'
    let time = moment(),
        beforeTime1 = moment('17:00:00', format),
        afterTime1 = moment('23:59:59', format),
        beforeTime2 = moment('00:00:00', format),
        afterTime2 = moment('05:59:59', format)
    if (time.isBetween(beforeTime1, afterTime1) || time.isBetween(beforeTime2, afterTime2)) {
        res = true
    }
    return res
}

async function build_plans_detail(dataset) {
    capacity_labor = parseInt(dataset.capacityLabor)
    let str = ` <span>รายละเอียด</span>
                <div>${dataset.detail}</div>`
    $("div.detail-container").html(str)
    $("div.detail-container").show()
}

async function build_machines_and_workers(type_id) {
    // console.log(type_id);
    await build_machines(type_id)

    // let workers = await get_workers(type_id, 'type_id')
    // if (Number(type_id) === 28 || Number(type_id) === 29) {
    //     await build_worker(workers)
    // }

}

async function build_machine_type(data) {
    let machine_type = data
    let body_machine_type = $(`div.div-process-type`).html("")
    $.each(machine_type, function (index, value) {
        let str = ` <div class="process-type">
                        <input name="process-type" type="radio" id="${value.type_name}" value="${value.type_id}" onclick="click_type(this)" />
                        <label for="${value.type_name}" name="process-type">${value.type_name}</label>
                    </div>`
        body_machine_type.append(str)
    });
}

async function build_machines(type_id) {
    let machines = await get_machines(type_id)
    let body_machines = $(`div.timesheet-body-box.machines`).html("")
    $.each(machines, async function (index, value) {
        let str = ` <input name="machines" type="radio" id="${value.machine_id}" value="${value.machine_id}" 
                    data-perfecting="${value.perfecting}" data-typeid="${value.type_id}" onclick="click_type(this)"
                    data-machine-name="${value.machine_name}" />
                    <label for="${value.machine_id}" name="machines">${value.machine_id} ${value.machine_name}</label>`
        body_machines.append(str);
    })
}

async function build_alternate_machines(type_id) {
    let machines = await get_machines(type_id)
    let body_machines = $(`div.timesheet-body-box.machines2`).html("")
    $.each(machines, async function (index, value) {
        let str = ` <input name="machines2" type="radio" id="${value.machine_id}_alternate" value="${value.machine_id}" 
                    data-perfecting="${value.perfecting}" data-typeid="${value.type_id}" onclick="click_type(this)"
                    data-machine-name="${value.machine_name}" />
                    <label for="${value.machine_id}_alternate" name="machines2">${value.machine_id} ${value.machine_name}</label>`
        body_machines.append(str);
    })
}

async function plans_on_other_machines(el) {
    // console.log($(el).text());
    $(`div.timesheet-body-box.machines`).toggle()
    $(`div.timesheet-body-box.span-alternate-machines`).toggle()
    $(`div.timesheet-body-box.machines2`).toggle()
    $(`label[name='machines2']`).removeClass('active')
    $(`input[name='machines2']`).prop('checked', false)
    $(`div.timesheet-body-box.plans`).html("")
    temp_timesheet.plan_id = ""
    // console.log(temp_timesheet.plan_id, temp_timesheet.machine_id);

    await unset_plans_detail()
    if ($(`div.timesheet-body-box.machines2`).is(':hidden')) {
        await build_plans(temp_timesheet.machine_id)
        $(el).html("<strong>Plans on other machines</strong>")
    } else {
        $(el).html("<strong>Exit from Plans on other machines</strong>")
    }
    // await build_plans(temp_timesheet.machine_id)
}

async function build_worker(workers) {
    // let workers = await get_workers(type_id, 'type_id')
    let body_workers = $(`div.timesheet-body-box.workers`).html("")
    $.each(workers, function (index, value) {
        // console.log(`192.168.5.40/LEAVE_FLOW/pic_emp/${value.emp_id}.jpg`);
        let str = ` <input name="workers" type="checkbox" id="${value.emp_id}" value="${value.emp_id}" onclick="click_type(this)"
                    data-firstname="${value.firstname}" data-lastname="${value.lastname}" />
                    <label for="${value.emp_id}" name="workers">
                        <div>
                            <span class="emp-id">${value.emp_id}</span>
                            <img class="img_worker" src="http://192.168.5.40/LEAVE_FLOW/pic_emp/${value.emp_id}.jpg" alt="${value.emp_id}">
                            <p>${value.firstname} ${value.lastname}</p>
                            <button id="edit-worker" onclick="edit_worker('${value.emp_id}')" hidden><i class="bi bi-gear-fill"></i></button>
                            <button id="delete-worker" onclick="alert_delete_worker('${value.emp_id}','${value.firstname} ${value.lastname}')"><i class="bi bi-trash-fill"></i></button>
                        </div>
                    </label>`
        // <button id="delete-worker"><i class="bi bi-trash-fill"></i></button>
        body_workers.append(str);
    })
}

async function build_plans(machine_id) {
    let plans = await get_plans(machine_id)
    let body_plans = $(`div.timesheet-body-box.plans`).html("")
    $.each(plans, async function (index, value) {
        let partname = value.partname === null || value.partname === "" ? "" : `(${value.partname})`
        let jobname = value.job_name === null || value.job_name === "" ? "" : value.job_name
        // console.log(value.partname, value.job_name);
        let str = ` <input name="plans" type="radio" id="${value.plan_id}" value="${value.plan_id}" onclick="click_type(this)" 
                    data-capacity-labor="${value.capacity_labor}" data-doctype="${value.doctype}" data-partname="${value.partname}"
                    data-detail="${value.detail}" data-jobid="${value.jobid}" data-jobname="${value.job_name}"/>
                    <label for="${value.plan_id}" name="plans">
                        <div>
                            <span class="shift-text ${value.shift_id === 1 ? 'day' : 'night'}">${value.shift_id === 1 ? 'DAY' : 'NIGHT'}</span>
                            ${value.plan_id}<br/>${value.plan_date}<br/>${value.jobid} ${partname}<br/>${jobname}
                        </div>
                    </label>`
        body_plans.append(str);
    })
}

async function click_type(el) {
    if ($(`label[for='${el.id}']`).hasClass('active')
        && el.name !== 'workers' && el.name !== 'lpg') {
        return
    }
    switch (el.name) {
        case 'process-type':
            let type_id = $(el).val()
            temp_timesheet.type_id = parseInt(type_id)
            await set_timesheet_box_empty()
            await radio_actived(el)
            await set_use_lpg_show()
            await set_sig1_show()
            await build_machines_and_workers(type_id)
            $('div.timesheet-body-box.add-workers').show()
            break
        case 'machines':
            perfecting = parseInt($(el).attr('data-perfecting'))
            capacity_labor = 0
            temp_timesheet.machine_id = $(el).val()
            temp_timesheet.machine_name = el.dataset.machineName
            let workers = await get_workers(temp_timesheet.machine_id, 'machine_id')
            await build_alternate_machines(temp_timesheet.type_id)
            await build_worker(workers)
            await radio_actived(el)
            await set_capacity_labor()
            await build_plans(temp_timesheet.machine_id)
            await unset_workers()
            await unset_plans_detail()
            await set_printing()

            const ma_request = await get_repair_item(temp_timesheet.machine_id)
            await set_table_ma_request(ma_request)

            await show_button_options();
            break
        case 'workers':
            await checkbox_actived(el)
            break
        case 'plans':
            // console.log(el.dataset);
            temp_timesheet.plan_id = $(el).val()
            let old_head = await get_old_header(temp_timesheet.machine_id, temp_timesheet.plan_id)
            if (old_head !== null) {
                const url = `${window.location.origin}/timesheet?header_id=${old_head}`
                await alert_old_timesheet(url)
                return
            }
            await radio_actived(el)
            await build_plans_detail(el.dataset)
            await set_capacity_labor()
            await get_paper_status(temp_timesheet.plan_id)
            await unset_workers()

            // console.log(temp_timesheet.plan_id, temp_timesheet.machine_id);
            break
        case 'shift':
            await radio_actived(el)
            break
        case 'print':
            await radio_actived(el)
            await set_sig2_show(el.id)
            break
        case 'lpg':
            if (parseInt(pathname) === 34) {
                await checkbox_actived(el)
            }
            break
        case 'machines2':
            await radio_actived(el)
            await build_plans($(el).val())
            // console.log(temp_timesheet.plan_id, temp_timesheet.machine_id);
            // await unset_workers()
            // await unset_plans_detail()
            break
    }
    await check_start_readiness()
}

async function set_timesheet_box_empty() {
    $('div.timesheet-body-box.machines').empty()
    $('div.timesheet-body-box.plans').empty()
    $('div.timesheet-body-box.workers').empty()
}

async function unset_workers() {
    $(`input[name="workers"]:checkbox`).prop('checked', false);
    $(`label[name="workers"] div span.emp-id`).removeClass('active')
    $(`label[name="workers"]`).removeClass('active')
}

async function unset_plans_detail() {
    $("div.detail-container").hide()
}

async function radio_actived(target) {
    let element = $(`label[for='${target.id}']`)
    if ($(target).is(':radio') && $(target).is(':checked')) {
        $(`label[name='${target.name}']`).removeClass('active')
        element.addClass('active')
    }
}

async function checkbox_actived(target) {
    switch (target.name) {
        case 'workers':
            let num_workers = $(`input[name='workers']:checked`).length
            let num_plans = $(`input[name='plans']:checked`).length
            if (num_plans < 1) {
                $(target).prop('checked', false);
                await alert_paper_status({ icon: 'warning', message: 'กรุณาเลือกแผนก่อน' })
                return
            }
            if (num_workers <= capacity_labor || capacity_labor === 0) {
                $(`label[for='${target.id}']`).toggleClass('active')
                $(`label[for='${target.id}'] div span.emp-id`).toggleClass('active')
                await set_capacity_labor(num_workers)
            } else {
                $(target).prop('checked', false);
                await alert_max_capacity_labor()
                return
            }
            break;
        case 'lpg':
            $(`label[for='${target.id}']`).toggleClass('active')
            break
    }
}

async function check_start_readiness() {
    $('div.div-start').hide()
    let checked_machines = $(`input[name='machines']:checked`).length === 1 ? true : false
    if (!checked_machines) {
        return
    }
    let checked_plans = $(`input[name='plans']:checked`).length === 1 ? true : false
    if (!checked_plans) {
        return
    }
    let date_input = $(`input.form-control.datetimepicker-input`).val() !== '' ? true : false
    if (!date_input) {
        return
    }
    let checked_shift = $(`input[name='shift']:checked`).length === 1 ? true : false
    if (!checked_shift) {
        return
    }

    if ($('div.sig1-container').css('display') !== 'none') {
        if (await check_sig_value() === false) {
            return
        }
    }

    let checked_workers = $(`input[name='workers']:checked`).length > 0 ? true : false
    if (!checked_workers) {
        return
    }

    $('div.div-start').show()
}

async function check_sig_value() {
    let checked_sig_value = true
    let sig = $("div.sig1-container div.sig1 input.form-control.sig").val() !== '' ? true : false
    let subsig = $("div.sig1-container div.sig1 input.form-control.subsig").val() !== '' ? true : false

    if (!sig) {
        checked_sig_value = false
    } else if (!subsig) {
        checked_sig_value = false
    }

    if ($("div.sig1-container div.sig1 input.form-control.sig").val() !== '') {
        $("div.sig1-container div.sig1 input.form-control.sig").addClass('is-valid')
    } else {
        $("div.sig1-container div.sig1 input.form-control.sig").removeClass('is-valid')
    }

    if ($("div.sig1-container div.sig1 input.form-control.subsig").val() !== '') {
        $("div.sig1-container div.sig1 input.form-control.subsig").addClass('is-valid')
    } else {
        $("div.sig1-container div.sig1 input.form-control.subsig").removeClass('is-valid')
    }

    return checked_sig_value
}

async function start_timesheet() {
    temp_timesheet.doc_date = $('input.form-control.datetimepicker-input').val()
    temp_timesheet.shift_id = $("div.shift-container div.shift input[name='shift']:checked").attr('id')
    temp_timesheet.use_lpg = $(`div.lpg-container div.use-lpg input[name='lpg']`).is(':checked') ? 1 : 0

    temp_timesheet.sig = $(`div.sig1 input.form-control.sig`).val()
    temp_timesheet.subsig = $(`input.form-control.subsig`).map(function () {
        if ($(this).val() === '') {
            return
        }
        return $(this).val();
    }).toArray();

    temp_timesheet.worker = $(`input[name='workers']:checked`).map(function () {
        // console.log($(`input[name='workers']:checked`));
        return {
            emp_id: $(this).val(),
            emp_name: `${$(this)[0].dataset.firstname} ${$(this)[0].dataset.lastname}`
        }
    }).toArray();

    let plan = $(`input[name='plans']:checked`)[0]
    if (temp_timesheet.plan_id === plan.id) {
        temp_timesheet.partname = plan.dataset.partname
        temp_timesheet.job_name = plan.dataset.jobname
        temp_timesheet.jobid = plan.dataset.jobid
    }

    var checklist_prepare_machine = []
    var checklist_pre_work = []
    var checklist_post_work = []
    var checklist_title = ""
    var checklist_id = ""
    var temp_machine = { machine_id: temp_timesheet.machine_id, machine_name: temp_timesheet.machine_name }

    await clear_worker(temp_timesheet.plan_id, temp_timesheet.machine_id)
    const promise = new Promise(async (res, rej) => {
        const obj = {
            doc_date: temp_timesheet.doc_date,
            shift_id: temp_timesheet.shift_id,
            machine_id: temp_timesheet.machine_id
        }
        console.log(temp_machine.machine_id);
        if (temp_machine.machine_id === '7001' || temp_machine.machine_id === '7002') {
            res()
        } else {
            await chk_first_shift(obj).then(async (result) => {
                // console.log(result);
                checklist_id = result.doc.checklist_id
                $("input#checklist_doc_id").val(result.doc.checklist_id)
                checklist_title = "รายการตรวจสอบคุณภาพหน่วยงาน" + result.doc.doc_name.replace('เครื่อง', '')
                checklist_prepare_machine = result.data.filter(r => r.group_id <= 3)
                checklist_pre_work = result.data.filter(r => r.group_id === 4)
                checklist_post_work = result.data.filter(r => r.group_id === 5)
                if (result.total === 0) {
                    if (checklist_prepare_machine.length !== 0) {
                        // ถ้ายังไม่ทำ checklist เครื่องจักร
                        let leader = await get_checker(temp_timesheet.type_id)
                        await build_checklist(checklist_prepare_machine, temp_timesheet.worker, temp_machine)
                        await build_checker(temp_timesheet.worker, leader)
                        const modal = $('div.modal#checklist')
                        modal.modal({ keyboard: false })
                        return
                    }
                }
                if (checklist_pre_work.length !== 0 && pre_work_status === 0) {
                    await build_checklist(checklist_pre_work, null, temp_machine, 1, checklist_title, checklist_id)
                    $('div.modal#checklist').modal({ keyboard: false })
                    pre_work_status = 1
                    return
                }

                res()
            })
            // เมื่อทำ checklist เครื่องจักรเสร็จแล้ว
            $('div.modal#checklist').on('hidden.bs.modal', async function () {
                if (checklist_pre_work.length !== 0 && pre_work_status === 0) {
                    await build_checklist(checklist_pre_work, null, temp_machine, 1, checklist_title, checklist_id)
                    $('div.modal#checklist').modal({ keyboard: false })
                    pre_work_status = 1
                    return
                }
                res()
            })
        }


    })
    // console.log(temp_timesheet);
    promise.then(async () => {
        temp_timesheet.header_id = await insert_header(temp_timesheet)
        console.log(temp_timesheet.header_id);
        if (temp_timesheet.header_id !== null) {
            localStorage.setItem('timesheet_header', JSON.stringify(temp_timesheet))
            self.location.href = `/timesheet?header_id=${temp_timesheet.header_id}`
            // window.location.reload()
        }
    })

}

async function build_checklist(checklist, worker, machine, is_qc = 0, title = 'ขั้นตอนการเตรียมเครื่องจักร', id = 0) {
    $("div.modal#checklist div.modal-body h3").text(title)
    $("div.modal#checklist div.modal-body table").remove()
    // console.log('checklist_id = ', id);
    if (is_qc === 0) {
        let problem = await get_problem(machine.machine_id)
        let checklist_long = await get_checklist_long(machine.machine_id)
        await build_modal_maintenance_checklist(worker, problem, checklist_long, machine)
        $("div.modal#checklist div.modal-body button#checklist-repair").attr('onclick', `open_modal_maintenance()`)
        $("div.modal#checklist div.modal-body button#checklist-repair").prop('hidden', false)
        $("div.modal#checklist div.modal-footer button.save-checklist").attr('onclick', `save_checklist()`)
    } else {
        $("div.modal#checklist div.modal-body button#checklist-repair").prop('hidden', true)
        $("div.modal#checklist div.modal-footer button.save-checklist").attr('onclick', `save_checklist(1)`)
    }

    if (id === 2) {
        $('.pre-work').prop('hidden', false)
        $(`input#qty-paper`).val("")
    } else {
        $('.pre-work').prop('hidden', true)
    }

    $.each(checklist, async function (index, value) {
        let count_number = checklist.length === 1 ? '' : index + 1
        let table = `<table class="table table-sm table-dark table-checklist" id="checklist-${machine.machine_id}-${value.group_id}" data-table-name="${value.group_name}"
                    data-checklist-group-id="${value.group_id}">
                        <thead>
                            <tr>
                                <th class="text-left">${count_number} ${value.group_name}</th>
                                <th>${is_qc === 1 ? 'ผ่าน' : 'ปกติ'}</th>
                                <th>${is_qc === 1 ? 'ไม่ผ่าน' : 'ผิดปกติ'}</th>
                                <th>หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${await build_checklist_unit(value.type_unit, is_qc)}
                        </tbody>
                    </table>`

        $("div.modal#checklist div.modal-body").append(table)
    });
}

async function build_checklist_unit(unit, is_qc) {
    let str = ``
    $.each(unit, function (index, value) {
        // console.log(is_qc, index);
        let count_number = is_qc === 1 ? index + 1 + '. ' : ''
        str += `<tr id="unit-${value.checklist_detail_id}">
                    <td class="col-7 text-left align-middle">${count_number} ${value.detail_name}</td>
                    <td class="align-middle"><input data-detail-id="${value.checklist_detail_id}" data-detail-name="${value.detail_name}" type="checkbox" class="form-control checklist-checkbox" value="1" onclick="manage_checklist($(this))"></td>
                    <td class="align-middle"><input data-detail-id="${value.checklist_detail_id}" data-detail-name="${value.detail_name}" type="checkbox" class="form-control checklist-checkbox" value="0" onclick="manage_checklist($(this))"></td>
                    <td class="align-middle"><input type="text" class="form-control checklist-remark text-left" id="remark-unit-${value.checklist_detail_id}" oninput="manage_remark_checklist($(this), ${value.checklist_detail_id})"></td>
                </tr>`
    });

    // console.log($(this).closest('tr').find('input[data-detail-id="${value.checklist_detail_id}"]'), $(this));
    return str
}

async function manage_checklist(el) {
    let checklist_detail_id = el.data('detailId')
    let checklist_detail_val = el.val()
    let checklist_detail_remark_val = $(`input#remark-unit-${checklist_detail_id}`).val()
    $(`input[data-detail-id="${checklist_detail_id}"]`).not(el).prop("checked", false)
    // console.log(el, el.val(), el.data('detailId'));
    // console.log(checklist_detail_val);
    if (checklist_detail_val === "0" && el.is(':checked')) {
        if (checklist_detail_remark_val === "") {
            $(`input#remark-unit-${checklist_detail_id}`).removeClass('is-valid')
            $(`input#remark-unit-${checklist_detail_id}`).addClass('is-invalid')
        } else {
            $(`input#remark-unit-${checklist_detail_id}`).removeClass('is-invalid')
            $(`input#remark-unit-${checklist_detail_id}`).addClass('is-valid')
        }
    } else {
        $(`input#remark-unit-${checklist_detail_id}`).removeClass('is-valid')
        $(`input#remark-unit-${checklist_detail_id}`).removeClass('is-invalid')
    }
}

async function manage_remark_checklist(el, val) {
    let checklist_detail_val = $(`input[data-detail-id="${val}"]:checked`).val()
    if (checklist_detail_val !== '0') {
        return
    }
    // ถ้าติ๊ก ผิดปกติ
    if ($.trim(el.val()) !== "") {
        $(`input#remark-unit-${val}`).removeClass("is-invalid")
        $(`input#remark-unit-${val}`).addClass("is-valid")
    } else {
        $(`input#remark-unit-${val}`).removeClass("is-valid")
        $(`input#remark-unit-${val}`).addClass("is-invalid")
    }
}

async function manage_qty_paper(el) {
    if (event.type === "focus") {
        el.val().replace(',', '')
        el.select()
    } else if (event.type === "input") {
        if ($.trim(el.val()) !== "" && Number($.trim(el.val())) !== 0) {
            el.val(Number(el.val().replace(/[^0-9]/g, '')))
            $(`input#qty-paper`).removeClass("is-invalid")
            $(`input#qty-paper`).addClass("is-valid")
        } else {
            $(`input#qty-paper`).removeClass("is-valid")
            $(`input#qty-paper`).addClass("is-invalid")
        }
    } else if (event.type === "blur") {
        if (Number($.trim(el.val())) === 0 || $.trim(el.val()) === "") {
            $(`input#qty-paper`).removeClass("is-valid")
            $(`input#qty-paper`).addClass("is-invalid")
            return
        }
        let result_number = Number(el.val().replace(',', '')).toLocaleString()
        el.val(result_number)
    }

}

async function build_checker(worker, leader) {
    let str = `<table class="table table-borderless" id="table-checker">
                    <tr>
                        <td class="text-right align-middle col-9"><span>ผู้ตรวจสอบ</span></td>
                        <td class="col-3">
                            <select class="form-control" name="checker">
                                <option value="none" disabled>- เลือกรายชื่อ -</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td class="text-right align-middle col-9"><sapn>หัวหน้างาน</sapn></td>
                        <td class="col-3">
                            <select class="form-control" name="leader" onchange="set_position_leader(this)">
                                <option value="none" disabled>- เลือกรายชื่อ -</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td class="text-right align-middle col-9"></td>
                        <td class="col-3"><input class="form-control" id="leader-position" type="text"></td>
                    </tr>
                </table>`
    $("div.modal#checklist div.modal-body").append(str)

    $('select[name="checker"]').html("")
    $('select[name="checker"]').append(`<option value="" disabled>--เลือกรายชื่อ--</option>`)
    // console.log(worker);
    $.each(worker, function (index, value) {
        $('select[name="checker"]').append(`<option id="${value.emp_id}" data-worker-name="${value.emp_name}">${value.emp_name}</option>`)
    });

    $('select[name="leader"]').html("")
    $('select[name="leader"]').append(`<option value="" disabled>--เลือกรายชื่อ--</option>`)
    $.each(leader, function (index, value) {
        $('select[name="leader"]').append(`<option id="${value.leader_id}" data-position="${value.leader_position}" data-leader-name="${value.leader_name}">${value.leader_name}</option>`)
    });

    await select_first_option()
}

async function select_first_option() {
    $('select').val($('select option:first').val())
}

async function set_position_leader(e) {
    let data = $('div.modal#checklist div.modal-body table select[name="leader"]').find(":selected")[0].dataset
    $('div.modal#checklist div.modal-body table input#leader-position').val(data.position)
}

async function open_modal_maintenance(checklist, worker) {
    await reset_modal_maintenance_checklist()
    $("div.modal#maintenance").modal("show")
}

async function build_modal_maintenance_checklist(worker, problem, checklist, machine) {
    $("input.machine-name").val(`${machine.machine_id} ${machine.machine_name}`)
    $("input.date-text").val((new Date()).toISOString().split('T')[0])

    $.each(worker, function (index, value) {
        $('select[name="worker"]').append(`<option id="${value.emp_id}">${value.emp_name}</option>`)
    });

    $.each(problem, function (index, value) {
        $('select[name="problem"]').append(`<option id="${value.problem_id}">${value.problem_name}</option>`)
    });

    $.each(checklist, function (index, value) {
        $('select[name="checklist"]').append(`<option id="${value.checklist_detail_id}">${value.detail_name}</option>`)
    })
}

async function check_maintenance_input(type) {
    let obj = {}
    // let res = false
    switch (type) {
        case 1:
            if (temp_timesheet.type_id === 35 || temp_timesheet.type_id === 36 || temp_timesheet.type_id === 52) {
                let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
                let emp_id = $('table.table-repair select[name="worker"]').find(':selected')[0].id === '' ? 0 : $('select[name="worker"]').find(':selected')[0].id
                let call_number = $('table.table-repair input.call-number').val() === '' ? 0 : $('table.table-repair input.call-number').val()
                let location = $('table.table-repair input.location-machine').val() === '' ? 0 : $('table.table-repair input.location-machine').val()
                let machine_status_id = $(`table.table-repair input[name="status-id"]:checked`).val()
                let process_status_id = $('table.table-repair select[name="process_status_machine"]').find(':selected')[0].value
                let problem_id = $('table.table-repair select[name="problem"]').find(':selected')[0].value === 'none' ? undefined : $('table.table-repair select[name="problem"]').find(':selected')[0].id
                let remark = $('table.table-repair #repair_textarea').val() === '' ? 0 : $('table.table-repair #repair_textarea').val()
                let topic_checklist = $('table.table-repair select[name="checklist"]').find(':selected')[0].value === 'none' ? "" : $('table.table-repair select[name="checklist"]').find(':selected')[0].id

                let setting = true
                if (emp_id === 0) {
                    $('table.table-repair select[name="worker"]').addClass('is-invalid')
                    setting = false
                }
                if (call_number === 0) {
                    $('table.table-repair input.call-number').addClass('is-invalid')
                    setting = false
                }
                if (machine_status_id === undefined) {
                    setting = false
                }
                if (process_status_id === 'none') {
                    $('table.table-repair select[name="process_status_machine"]').addClass('is-invalid')
                    setting = false
                }
                if (problem_id === undefined) {
                    $('table.table-repair select[name="problem"]').addClass('is-invalid')
                    setting = false
                }
                if (remark === 0) {
                    $('table.table-repair #repair_textarea').addClass('is-invalid')
                    setting = false
                }
                if (location === 0) {
                    $('table.table-repair input.location-machine').addClass('is-invalid')
                    setting = false
                }
                if (topic_checklist === "") {
                    $('table.table-repair select[name="checklist"]').addClass('is-invalid')
                    setting = false
                }

                if (!setting) {
                    await alert_valid('กรุณาระบุข้อมูลให้ครบถ้วน')
                    return
                }

                obj = {
                    branch_id: 2,
                    emp_id: emp_id,
                    call_number: call_number,
                    need_date: date,
                    machine_id: temp_timesheet.machine_id,
                    machine_status_id: machine_status_id,
                    process_status_id: process_status_id,
                    problem_id: problem_id,
                    ma_type_id: 1,
                    ma_remark: remark,
                    ma_location: location
                }

                obj_warning = {
                    checklist_type_id: topic_checklist,
                    machine_id: temp_timesheet.machine_id,
                    cause_problem: remark,
                    solution: "",
                    emp_id: emp_id,
                    jobid: temp_timesheet.jobid,
                    shift_id: temp_timesheet.shift_id,
                    plan_id: temp_timesheet.plan_id,
                    header_id: 0
                }

            }
            await insert_ma_request(obj, 'checklist')
            await insert_checklist_warning_with_ma(obj_warning).then(() => {
                $(`div.modal#checklist div.modal-body table tr#unit-${obj_warning.checklist_type_id} td:first-child`).addClass('disbled-text')
                $(`div.modal#checklist div.modal-body input[data-detail-id="${obj_warning.checklist_type_id}"]`).prop("checked", false)
                $(`div.modal#checklist div.modal-body input[data-detail-id="${obj_warning.checklist_type_id}"]`).prop("disabled", true)

                // setting checklist remark (checklist เครื่องจักร)
                $(`div.modal#checklist div.modal-body input#remark-unit-${obj_warning.checklist_type_id}`).val("").prop("disabled", true)
                $(`div.modal#checklist div.modal-body input#remark-unit-${obj_warning.checklist_type_id}`).removeClass('is-valid')
                $(`div.modal#checklist div.modal-body input#remark-unit-${obj_warning.checklist_type_id}`).removeClass('is-invalid')

                $(`select[name='checklist']`).find(`option#${obj_warning.checklist_type_id}`).prop('disabled', true)
            })

            break
        case 2:
            let remark = $(`table#table-edit input.remark`).val()
            let solution = $(`table#table-edit textarea#solution`).val()
            let topic_checklist = $('table#table-edit select[name="checklist"]').find(':selected')[0].value === 'none' ? "" : $('table#table-edit select[name="checklist"]').find(':selected')[0].id
            let emp_id = $('table#table-edit select[name="worker"]').find(':selected')[0].value === 'none' ? "" : $('table#table-edit select[name="worker"]').find(':selected')[0].id

            let setting = true

            if (topic_checklist === "") {
                $('table#table-edit select[name="checklist"]').addClass('is-invalid')
                setting = false
            }

            if (remark === "") {
                $(`table#table-edit input.remark`).addClass('is-invalid')
                setting = false
            }

            if (solution === "") {
                $(`table#table-edit textarea#solution`).addClass('is-invalid')
                setting = false
            }

            if (emp_id === "") {
                $('table#table-edit select[name="worker"]').addClass('is-invalid')
                setting = false
            }

            if (!setting) {
                await alert_valid('กรุณากรอกข้อมูลให้ครบถ้วน')
                return
            }

            obj = {
                checklist_type_id: topic_checklist,
                machine_id: temp_timesheet.machine_id,
                cause_problem: remark,
                solution: solution,
                emp_id: emp_id,
                jobid: temp_timesheet.jobid,
                shift_id: temp_timesheet.shift_id,
                plan_id: temp_timesheet.plan_id,
                header_id: 0
            }

            await insert_checklist_warning(obj).then(() => {
                $(`div.modal#checklist div.modal-body table tr#unit-${topic_checklist} td:first-child`).addClass('disbled-text')
                $(`div.modal#checklist div.modal-body input[data-detail-id="${topic_checklist}"]`).prop("checked", false)
                $(`div.modal#checklist div.modal-body input[data-detail-id="${topic_checklist}"]`).prop("disabled", true)

                // setting checklist remark (checklist เครื่องจักร)
                $(`div.modal#checklist div.modal-body input#remark-unit-${topic_checklist}`).val("").prop("disabled", true)
                $(`div.modal#checklist div.modal-body input#remark-unit-${topic_checklist}`).removeClass('is-valid')
                $(`div.modal#checklist div.modal-body input#remark-unit-${topic_checklist}`).removeClass('is-invalid')

                $(`select[name='checklist']`).find(`option#${topic_checklist}`).prop('disabled', true)
            })
            break
        case 3:
            let ma = $("div.tab-pane#repair-again div table tbody tr.active")
            if (ma.length === 0) {
                await alert_valid('กรุณาเลือกใบแจ้งซ่อม')
                return
            } else {
                const ma_id = ma[0].id
                await update_ma_request_again(ma_id)
                $("div.tab-pane#repair-again div table tbody tr").removeClass('active')
            }
            break
    }
}

async function check_edit_value(el, val) {
    // console.log(el, val);
    if (val !== "") {
        $(el).removeClass('is-invalid')
        $(el).addClass('is-valid')
    } else if (val === "") {
        $(el).removeClass('is-valid')
        $(el).addClass('is-invalid')
    }
}

async function set_active(el) {
    $(`label[name='${el.attributes.name.value}']`).removeClass('active')
    $(el).addClass('active')
}

async function reset_modal_maintenance_checklist() {
    $(`.nav-tabs a[href="#edit"]`).tab('show')
    $(`.nav-tabs a[href="#edit"]`).closest('li').show()

    $(`table.table-repair label[name='status-id']`).removeClass('active')
    $('table.table-repair input[name="status-id"]').prop('checked', false)

    $('table.table-edit tbody tr td.text-left input[type="text"]').val("")
    $('table.table-edit tbody tr td.text-left input[type="text"]').removeClass(['is-invalid', 'is-valid'])
    $("input.machine-name").val(`${temp_timesheet.machine_id} ${temp_timesheet.machine_name}`)
    $('table.table-edit tbody tr td select[name="worker"]').prop("selectedIndex", 0)
    $('table.table-edit tbody tr td select[name="worker"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-edit tbody tr td select[name="checklist"]').prop("selectedIndex", 0)
    $('table.table-edit tbody tr td select[name="checklist"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-edit #solution').val("")
    $('table.table-edit #solution').removeClass(['is-invalid', 'is-valid'])

    $('table.table-repair tbody tr td.text-left input.location-machine').val("")
    $('table.table-repair tbody tr td.text-left input.location-machine').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair tbody tr td.text-left input.call-number').val("")
    $('table.table-repair tbody tr td.text-left input.call-number').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair tbody tr td select[name="process_status_machine"]').prop("selectedIndex", 0)
    $('table.table-repair tbody tr td select[name="process_status_machine"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair tbody tr td select[name="worker"]').prop("selectedIndex", 0)
    $('table.table-repair tbody tr td select[name="worker"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair tbody tr td select[name="checklist"]').prop("selectedIndex", 0)
    $('table.table-repair tbody tr td select[name="checklist"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair tbody tr td select[name="problem"]').prop("selectedIndex", 0)
    $('table.table-repair tbody tr td select[name="problem"]').removeClass(['is-invalid', 'is-valid'])
    $('table.table-repair #repair_textarea').val("")
    $('table.table-repair #repair_textarea').removeClass(['is-invalid', 'is-valid'])
    $("table.table-repair input.date-text").val((new Date()).toISOString().split('T')[0])

    $("div.tab-pane#repair-again div table tbody tr").removeClass('active')

    // console.log($(`select[name='checklist'] option`));
    // $(`select[name='checklist'] option`).prop('disabled', false)

}

async function save_checklist(is_qc = 0) {
    let remark_invalid = $('div.modal#checklist div.modal-body table input.checklist-remark.is-invalid').not(':disabled').length
    if (remark_invalid > 0) {
        alert_valid('กรุณากรอกหมายเหตุให้ครบถ้วน')
        return
    }

    let leader = $('div.modal#checklist div.modal-body table select[name="leader"] option:selected')[0]
    let worker = $('div.modal#checklist div.modal-body table select[name="checker"] option:selected')[0]
    let number_of_checked = $('div.modal#checklist div.modal-body table input[type="checkbox"]:checked').not(':disabled').length
    let total_of_checkbox = $('div.modal#checklist div.modal-body table input[type="checkbox"]').not(':disabled').length / 2

    // console.log(number_of_checked, total_of_checkbox);
    var obj_checklist_req = {}
    console.log(number_of_checked, total_of_checkbox);
    if (number_of_checked === total_of_checkbox && is_qc === 0) {
        if (worker.value === '' || worker.value === undefined) {
            alert_valid('กรุณาเลือกชื่อ ผู้ตรวจสอบ')
            return
        } else if (leader.value === '' || leader.value === undefined) {
            alert_valid('กรุณาเลือกชื่อ หัวหน้างาน')
            return
        }

        const checklist_timesheet_head = {
            type_id: temp_timesheet.type_id,
            machine_id: temp_timesheet.machine_id,
            shift_id: temp_timesheet.shift_id,
            worker_id: worker.id,
            worker_name: worker.dataset.workerName,
            leader_id: leader.id,
            leader_name: leader.dataset.leaderName,
            leader_position: leader.dataset.position,
            plan_id: temp_timesheet.plan_id,
        }
        let detail = $('div.modal#checklist div.modal-body table input[type="checkbox"]:checked').not(':disabled')
        checklist_timesheet_detail = detail.map(function (index, value) {
            return {
                checklist_type_id: $(value).data('detailId'),
                checklist_val: $(value).val(),
                checklist_remark: $(`input.checklist-remark#remark-unit-${$(value).data('detailId')}`).val().replace(/'/g, "''")
            }
        }).toArray();

        obj_checklist_req.head = checklist_timesheet_head
        obj_checklist_req.detail = checklist_timesheet_detail

        // console.log(obj_checklist_req);
        await insert_checklist_timesheet(obj_checklist_req)
    } else if (number_of_checked === total_of_checkbox && is_qc === 1) {
        let checklist_id = $("input#checklist_doc_id").val()
        let qty = 0
        if (checklist_id === '2') {
            qty = $('input#qty-paper').val().replace(',', '')
            if ($.trim(qty) === "" || Number($.trim(qty)) === 0) {
                alert_valid('กรุณากรอกจำนวนกระดาษที่รับ')
                return
            }
        }
        // console.log($("table.table-checklist"));
        const qc_head = {
            type_id: temp_timesheet.type_id,
            machine_id: temp_timesheet.machine_id,
            checklist_id: checklist_id,
            plan_id: temp_timesheet.plan_id,
            jobid: temp_timesheet.jobid,
            qty_paper: Number(qty),
            qc_emp_id: ""

            // checklist_group_id:  $("table.table-checklist")
        }

        let detail = $('div.modal#checklist div.modal-body table input[type="checkbox"]:checked').not(':disabled')
        qc_detail = detail.map(function (index, value) {
            return {
                checklist_type_id: $(value).data('detailId'),
                checklist_val: $(value).val(),
                checklist_remark: $(`input.checklist-remark#remark-unit-${$(value).data('detailId')}`).val().replace(/'/g, "''")
            }
        }).toArray();

        obj_checklist_req.head = qc_head
        obj_checklist_req.detail = qc_detail
        obj_checklist_req.type = 'pre'

        // console.log(obj_checklist_req);
        await insert_checklist_qc_timesheet(obj_checklist_req)
            .then(async (res) => {
                if (res.success === true) {
                    const modal = $('div.modal#checklist')
                    modal.modal('hide')
                } else if (res.success === false) {
                    await alert_error(result.data.sql)
                    return
                }
            })
    } else {
        alert_valid('กรุณาตรวจสอบขั้นตอนให้ครบถ้วน')
        return
    }

    // if (is_qc === 1) {
    //     const modal = $('div.modal#checklist')
    //     modal.modal('hide')
    //     return
    // }


}

async function set_table_ma_request(data) {
    if (data.length === 0) {
        return
    }

    let body = $("div.tab-pane#repair-again div table tbody")
    $("div.tab-pane#repair-again div h5#title-machine").text(`รายการแจ้งซ่อม: ${temp_timesheet.machine_id} ${temp_timesheet.machine_name}`)
    for (const item of data) {
        let str = `<tr class="" id="${item.ma_id}" onclick="set_active_tr(this, '${item.ma_id}')">
                    <td>${item.ma_id}</td>
                    <td class="ma_remark"><p class="text-break">${item.ma_remark}</p></td>
                    <td>${item.fullname}</br>${item.show_datetime}</td>
                </tr>`
        body.append(str)
    }
}

async function edit_worker(emp_id) {
    console.log(emp_id, temp_timesheet.type_id);
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

async function open_modal_add_workers(type) {
    let checked_machines = $(`input[name='machines']:checked`).length === 1 ? true : false
    if (!checked_machines) {
        await alert_valid(`กรุณาเลือกเครื่องจักรก่อน`)
        return
    }

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

async function set_worker_new(e) {
    $(`div#finding-emp`).hide()
    $("input#search-emp").val(`(${e.id}) ${e.dataset.empName}`)
}

async function save_worker(type) {
    if (!($("input#search-emp").val())) {
        await alert_valid("ข้อมูลว่าง ไม่สามารถเพิ่มพนักงานได้")
        return
    }
    let str_name = $("input#search-emp").val().split(" ")
    let emp_id = str_name[0].replace('(', '').replace(')', '')
    let result = await check_emp_input({ emp_id })

    if (result.success === true) {
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

async function set_active_tr(tr, ma_id) {
    $("div.tab-pane#repair-again div table tbody tr").removeClass('active')
    $(tr).addClass('active')
}

async function show_button_options() {
    $('div.timesheet-body-box.button-option').show()
}

async function hide_button_options() {
    $('div.timesheet-body-box.button-option').hide()
    $('div.timesheet-body-box#child-machines2').hide()
    $(`div.timesheet-body-box.span-alternate-machines`).hide()
}

async function timesheet_maintenance_machine() {
    // await alert_valid('งานซ่อมเครื่องจักร - ยังไม่เปิดให้ใช้งาน')

    // console.log(temp_timesheet.type_id, temp_timesheet.machine_id);
    window.open(`/timesheet/${temp_timesheet.type_id}?machine_id=${temp_timesheet.machine_id}&maintenance=1`)

    return
}