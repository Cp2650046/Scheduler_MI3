var insert_success_status = false

async function get_machine_type(type_id) {
    const url = `${api_url}/timesheet/get_machine_type`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id: type_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            switch (data.success) {
                case true:
                    res = {
                        data: data.data,
                        event: data.event
                    }
                    break
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_machines(type_id) {
    const url = `${api_url}/timesheet/get_machines`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id: type_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            switch (data.success) {
                case true:
                    res = data.data
                    break
                case false:
                    // alert(data.message)
                    break
            }
        },
        error: function (err) {
            console.log(err);
            // alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_workers(value, value_type) {
    const url = `${api_url}/timesheet/get_workers`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { value, value_type },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            switch (data.success) {
                case true:
                    res = data.data
                    break
                case false:
                    // alert(data.message)
                    break
            }
        },
        error: function (err) {
            console.log(err);
            // alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_plans(machine_id) {
    const url = `${api_url}/timesheet/get_plans`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { machine_id: machine_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            switch (data.success) {
                case true:
                    res = data.data
                    break
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_paper_status(plan_id) {
    const url = `${api_url}/timesheet/get_paper_status`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { plan_id: plan_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.message.is_paper_trim_reader === 1) {
                let obj = {
                    icon: 'success',
                    message: 'กระดาษพร้อมพิมพ์'
                }
                alert_paper_status(obj)
            } else {
                let obj = {
                    icon: 'warning',
                    message: 'กระดาษไม่พร้อมพิมพ์'
                }
                alert_paper_status(obj)
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function clear_worker(plan_id, machine_id) {
    const obj = {
        plan_id: plan_id,
        machine_id: machine_id,
    }
    const url = `${api_url}/timesheet/clear_worker`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {

        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function insert_header(obj) {
    const url = `${api_url}/timesheet/insert_header`
    let header_id = ''
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (data) {
            header_id = data.data
        },
        error: function (err) {
            // console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return header_id
}

async function chk_first_shift(obj) {
    const url = `${api_url}/timesheet/chk_first_shift`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            if (data.success === true) {
                res = data
                // if (data.total === 0) {
                //     const modal = $('div.modal#checklist')
                //     modal.modal({ keyboard: false })
                // } else {
                //     return
                // }
            } else if (data.success === false) {
                return
            }
        },
        error: function (err) {
            // console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function insert_checklist_timesheet(obj) {
    const url = `${api_url}/timesheet/insert_checklist_timesheet`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (data) {
            // console.log(data);
            if (data.success === true) {
                const modal = $('div.modal#checklist')
                // alert_success(data.message)
                modal.modal('hide')
            } else if (data.success === false) {
                alert_error(data.message)
                return
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function insert_checklist_qc_timesheet(obj) {
    if (obj.detail.length === 0) {
        return res = {
            success: true,
            req: obj
        }
    }
    // console.log(obj);
    const url = `${api_url}/timesheet/insert_checklist_qc_timesheet`
    res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (result) {
            console.log(result);
            res = result
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}


// ***************************End Timesheet Header******************************

async function check_header_id(header_id) {
    // console.log(header_id);
    const url = `${api_url}/timesheet/check_header_id`
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id: header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            if (data.success === false) {
                window.location.href = document.referrer
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    // return
}

async function get_header(header_id) {
    const url = `${api_url}/timesheet/get_header`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id: header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_total_running(header_id) {
    // console.log(header_id);
    const url = `${api_url}/timesheet/get_total_running`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id: header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    // console.log(res);
    return res
}

async function get_repair_item(machine_id) {
    const url = `${api_url}/timesheet/get_repair_item`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { machine_id: machine_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function insert_timesheet_item(header_id, process_id, str_datetime) {
    let obj = {
        header_id: header_id,
        process_id: process_id,
        datetime: str_datetime
    }
    let url = `${api_url}/timesheet/insert_timesheet_item`
    let item = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: function (data) {
            item = {
                item_id: data[0].currentRecordID,
                show_time: data[0].showTime,
                start_time: data[0].startTime,
                current_date: data[0].currentDate,
                full_current_time: data[0].full_current_time,
                force_remark: data[0].force_remark
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return item
}

async function update_timesheet_item(name, obj) {
    const url = `${api_url}/timesheet/update_timesheet_item`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            // console.log(data);
            if (data.success === true) {
                await alert_success(data.message)
                $(`div.modal#${name}`).modal("hide")
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function update_qty(id, qty, waste) {
    let url = `${api_url}/timesheet/update_quantity`
    let temp_qty = 0
    let temp_waste = 0
    if (!isNaN(qty)) {
        temp_qty = qty
    }
    if (!isNaN(waste)) {
        temp_waste = waste
    }
    let obj = {
        id: id,
        qty: temp_qty,
        waste, temp_waste
    }
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            await calc_qty()
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function insert_ma_request(obj, type) {
    const url = `${api_url}/timesheet/insert_ma_request`
    $.ajax({
        url: url,
        headers: { 'user_account': USER_DATA.user_account },
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            if (data.success === true) {
                if (type === 'checklist') {
                    return
                }

                await alert_success('แจ้งซ่อมสำเร็จ')
                $("div.modal#maintenance").modal('hide')
            } else {
                await alert_error('แจ้งซ่อมไม่สำเร็จ')
            }
        },
        error: async function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function update_ma_request_again(ma_id) {
    const url = `${api_url}/timesheet/update_ma_request_again`
    $.ajax({
        url: url,
        method: 'GET',
        data: { ma_id: ma_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.success === true) {
                alert_success('แจ้งซ่อมซ้ำสำเร็จ')
                $("div.modal#maintenance").modal('hide')
            } else {
                alert_error('แจ้งซ่อมไม่สำเร็จ')
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function insert_checklist_warning(obj) {
    const url = `${api_url}/timesheet/insert_checklist_warning`
    $.ajax({
        url: url,
        headers: { 'user_account': USER_DATA.user_account },
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            if (data.success === true) {
                await alert_success('บันทึกสำเร็จ')
                insert_success_status = true
                $("div.modal#maintenance").modal('hide')
            } else {
                await alert_error('แจ้งซ่อมไม่สำเร็จ')
            }
        },
        error: async function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function insert_checklist_warning_with_ma(obj) {
    const url = `${api_url}/timesheet/insert_checklist_warning_with_ma_request`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            // console.log(data);
            if (data.success === true) {
                await alert_success('บันทึกสำเร็จ')
                $("div.modal#maintenance").modal('hide')
            } else {
                await alert_error('แจ้งซ่อมไม่สำเร็จ')
            }
        },
        error: async function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function get_department(req, elshow) {
    $.ajax({
        url: `${api_url}/timesheet/get_department`,
        method: 'GET',
        data: { term: req },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            if (data.length !== 0) {
                $(`${elshow}`).show()
                let html = `<ul id="department">`
                $.each(data, function (index, value) {
                    html += `<li onclick="set_value(this)" id="${value.type_id}" 
                    data-li-department-name="${value.type_name}" data-li-type="department">${value.type_name}</li>`
                });
                html += `</ul>`
                $(`${elshow}`).html(html)
            } else {
                $(`${elshow}`).html("")
                $(`${elshow}`).hide()
            }
        },
    })
}

async function get_machine_by_dep(req, elshow) {
    $.ajax({
        url: `${api_url}/timesheet/get_machine_by_dep`,
        method: 'GET',
        data: {
            text_mac: req,
            text_dep: $("#item-department-helped").val()
        },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            if (data.length !== 0) {
                $(`${elshow}`).show()
                let html = `<ul id="machine">`
                $.each(data, function (index, value) {
                    html += `<li onclick="set_value(this)" id="${value.machine_id}"
                    data-li-machine-name="${value.machine_name}" data-li-department-id="${value.type_id}"
                    data-li-department-name="${value.type_name}" data-li-type="machine">
                    ${value.machine_id} ${value.machine_name}</li>`
                });
                html += `</ul>`
                $(`${elshow}`).html(html)
            } else {
                $(`${elshow}`).html("")
                $(`${elshow}`).hide()
            }
        },
    })
}

async function get_detail_oklimit_color(header_id) {
    const url = `${api_url}/timesheet/get_detail_oklimit_color`
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id: header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function insert_oklimit_color(obj) {
    const url = `${api_url}/timesheet/insert_oklimit_color`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: async function (data) {
            if (data.success === true) {
                await alert_success('บันทึกสำเร็จ')
                $("div.modal#ok-limit-color").modal('hide')
            } else {
                await alert_error(data.message)
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function get_problem(machine_id) {
    const url = `${api_url}/timesheet/get_problem`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { machine_id: machine_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.success === true) {
                res = data.data
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_checklist_long(machine_id) {
    const url = `${api_url}/timesheet/get_checklist_long`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { machine_id: machine_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.success === true) {
                res = data.data
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function delete_timesheet(header_id) {
    const url = `${api_url}/timesheet/delete_timesheet`
    $.ajax({
        url: url,
        method: 'GET',
        data: { header_id: header_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.success === true) {

            } else {
                alert_error(data.message)
                return
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
}

async function get_sup_detail(obj) {
    const url = `${api_url}/timesheet/get_sup_detail`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            res = data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function update_end_timesheet(obj) {
    const url = `${api_url}/timesheet/update_end_timesheet`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: function (data) {
            if (data.success === true) {
                return true
            } else {
                return false
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function insert_ink_usage(header_material) {
    const url = `${api_url}/timesheet/insert_ink_usage`
    $.ajax({
        url: url,
        method: 'POST',
        data: header_material,
        dataType: 'JSON',
        async: false,
        success: function (data) {
            console.log(data);
            if (data.success === true) {
                alert_success(data.message)
                $("div#modal_ink_usage").modal('hide')
                return
            }
        },
        error: function (err) {
            $("div#modal_ink_usage").modal('hide')
            console.log(err);
            // alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function get_request_ot_type(header_id, request_type) {
    // console.log(header_id, machine_id, shift_id, request_date);
    let obj = {
        header_id: header_id,
        request_type: request_type
    }
    const url = `${api_url}/timesheet/get_request_ot_type`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: function (data) {
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function delete_request_ot(header_id, request_type) {
    const url = `${api_url}/timesheet/delete_request_ot`
    $.ajax({
        url: url,
        method: 'POST',
        data: { header_id: header_id, request_type: request_type },
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            if (data.success === true) {
                await alert_success(data.message)
                await $('#modal-request-ot').modal('hide')
                location.reload()
            } else {
                await alert_valid(data.message)
            }

        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function insert_request_ot(obj) {
    const url = `${api_url}/timesheet/insert_request_ot`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            await alert_success(data.message)
            await $('#modal-request-ot').modal('hide')
            location.reload()
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function get_checklist_sup() {
    const url = `${api_url}/timesheet/get_checklist_sup`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            // console.log(data.data);
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function get_ok_sheet_detail(obj) {
    const url = `${api_url}/timesheet/get_ok_sheet_detail`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function get_old_header(machine_id, plan_id) {
    const url = `${api_url}/timesheet/get_old_header`
    let res = ''
    $.ajax({
        url: url,
        method: 'POST',
        data: { machine_id: machine_id, plan_id: plan_id },
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            res = data.data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

/* async function get_partname_sub(obj) {
    const url = `${api_url}/timesheet/get_partname_sub`
    let res = ''
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            res = data
        },
        error: async function (err) {
            await alert_error(err)
        },
    })
    return res
} */

async function insert_sup_check_color(obj) {
    const url = `${api_url}/timesheet/insert_sup_check_color`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            if (data.success === true) {
                $("div.modal#sup-check-color").modal('hide')
                await alert_success('บันทึกสำเร็จ')
            } else {
                console.log(data);
                await alert_valid('บันทึกไม่สำเร็จ')
            }
        },
        error: async function (err) {
            console.log(err);
            await alert_error(`QUERY ERROR: ${err}`)
        },
    })
}

async function insert_ok_sheet(obj) {
    const url = `${api_url}/timesheet/insert_ok_sheet`
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        dataType: 'JSON',
        async: false,
        success: async function (data) {
            // console.log(data);
            if (data.success === true) {
                $("div.modal#ok-sheet").modal('hide')
                await alert_success('บันทึกสำเร็จ')

                if (machine_id == 3422 || machine_id == 3423 || machine_id == 3521) {   //position บน ล่าง
                    var url_ok_sheet = "http://192.168.5.41:8080/report_ok_sheet/report_ok_sheet_position.aspx?ok_sheet_id=" + data.data;
                } else if (machine_id == 3507) {  //10 unit
                    var url_ok_sheet = "http://192.168.5.41:8080/report_ok_sheet/report_ok_sheet_other.aspx?ok_sheet_id=" + data.data;
                } else {  //8 unit & white std 
                    var url_ok_sheet = "http://192.168.5.41:8080/report_ok_sheet/report_ok_sheet.aspx?ok_sheet_id=" + data.data;
                }
                window.open(url_ok_sheet)

            } else {
                await alert_valid('บันทึกไม่สำเร็จ')
            }
        },
        error: async function (err) {
            console.log(err);
            await alert_error(err)
        },
    })
}

async function get_emp_data(req) {
    $.ajax({
        url: `${api_url}/timesheet/get_emp_data`,
        method: 'GET',
        data: { term: req },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            if (data.length !== 0) {
                console.log(data);
                $(`div#finding-emp`).show()
                let html = `<ul id="new-worker">`
                $.each(data, function (index, value) {
                    html += `<li onclick="set_worker_new(this)" id="${value.emp_id}" 
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
        url: `${api_url}/timesheet/check_emp_data`,
        method: 'GET',
        data: { term: req },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            console.log(data);
            res = data
        },
    })
    return res
}

async function insert_worker_mapping(obj) {
    const url = `${api_url}/timesheet/insert_worker_mapping`
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

async function remove_worker(obj) {
    const url = `${api_url}/timesheet/remove_worker`
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

async function get_checker(type_id) {
    const url = `${api_url}/timesheet/get_checker`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id: type_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.success === true) {
                res = data.data
                // console.log(data.data);
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function check_worker_request_ot(obj) {
    const url = `${api_url}/timesheet/check_worker_request_ot`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            if (data.success === true) {
                res = data.data[0]
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_working_status(obj) {
    const url = `${api_url}/timesheet/get_working_status`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            if (data.success === true) {
                res = data
            }
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        }
    })
    return res
}

async function get_checklist(obj) {
    const url = `${api_url}/timesheet/get_checklist`
    let res = []
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (result) {
            res = result
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function get_checklist_outsource_detail(plan_id) {
    const url = `${api_url}/timesheet/get_checklist_outsource_detail`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        data: { plan_id },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (result) {
            await set_local_storage(result, "checklist_outsource")
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function get_checklist_outsource_id() {
    const url = `${api_url}/timesheet/get_checklist_outsource_id`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (result) {
            res = result.cqp_code
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function manage_checklist_outsource(obj) {
    const url = `${api_url}/timesheet/manage_checklist_outsource`
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {

        },
        success: async function (data) {
            res = data
        },
        error: function (err) {
            console.log(err);
            alert_error(`QUERY ERROR: ${err}`)
        },
    })
    return res
}

async function set_local_storage(obj, name) {
    var json_str = JSON.stringify(obj)
    localStorage.setItem(name, json_str)
}

async function get_local_storage(name) {
    var store_json_str = localStorage.getItem(name)
    return JSON.parse(store_json_str)
}

async function del_local_storage(name) {
    localStorage.removeItem(name);
}