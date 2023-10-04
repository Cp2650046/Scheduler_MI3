var data_multi_process = ""
$(async function () {
    // $(".pallet_qty").mask('000,000',{revers:true});
})
async function pre_pallet() {
    console.log(global_data)
    let list_multi_process = ""
    var global_header_planning = []
    let data = await prepare_pre_pallet(global_data.header.header_id)
    console.log(data)
    // console.log(global_data.header_planning)
    let worker_people = global_data.worker
    let pre_pallet_sig = 0
    if (global_data.header_planning[0]) {
        pre_pallet_sig = global_data.header_planning[0].sig
        let header_planning = global_data.header_planning
        //รายละเอียดยก
        $.each(header_planning, function (index, item) {
            global_header_planning.push(`${item.sum_sig}`)
        });
    }
    global_header_planning = global_header_planning.toString()
    let list_pallet_worker = await set_list_worker(worker_people);
    let list_pallet_type = await set_list_pallet_type();
    if (data.next_process_id == 40) {
        data_multi_process = await get_multi_process(data.plan_id);
        list_multi_process = await set_list_part_name(data_multi_process);
    } else {
        list_multi_process = `<option value="-1">${data.part_name}</option>`;
    }
    // console.log(list_multi_process)
    if (pre_pallet_sig == '' || typeof pre_pallet_sig === 'undefined') pre_pallet_sig = 0;
    if (pre_pallet_sig > 0) pre_pallet_sig = pre_pallet_sig;

    let error_text = ``;
    let is_error = 0;
    //ไม่มีเครื่องถัดไป ไม่มีnext_process
    if (data.next_machine_id == '' || data.next_zone_id == '') {
        error_text += `<span> <h1 style="color: red;">กรุณาติดต่อ PPC เพื่อเพิ่มข้อมูล เครื่องจักรถัดไป</h1></span>`;
        is_error = 1;
    }
    if (data.machine_process == '') {
        error_text += `<span> <h1 style="color: red;">กรุณาติดต่อ PPC เพื่อเพิ่มข้อมูล ชั้นตอนถัดไป</h1></span>`;
        is_error = 1;
    }
    if (global_data.header_planning.length == 0) {
        if (global_data.header.type_id !== 36) {
            error_text += `<span> <h1 style="color: red;">กรุณาติดต่อ IT เนื่องจากดึงข้อมูลแผนไม่ได้</h1></span>`;
            is_error = 1;
        }

    }
    // console.log(global_data.header.machine_name);
    if (global_data.header.machine_name === '') {
        error_text += `<span> <h1 style="color: red;">กรุณาติดต่อ IT เนื่องจากไม่มีเครื่องจักรในระบบ PL</h1></span>`;
        is_error = 1;
    }
    let str = ""
    // console.log(worker_people);    
    let body = $("#modal-pre-pallet .modal-dialog .modal-content .modal-body").empty()
    str += `<div class="row">
                    <div class="col-6">
                        ${error_text}
                        <table class="table table-borderless">
                            <tbody>
                                <tr>
                                    <td class="text-right">Machine ID : </td>
                                    <td class="text-left">
                                        <input type="text" id="machine_id" class="control-input input-readonly" value="${global_data.header.machine_id}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">Plan ID : </td>
                                    <td class="text-left">
                                        <input type="text" id="plan_id" class="control-input input-readonly" value="${global_data.header.plan_id}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">Job ID : </td>
                                    <td class="text-left">
                                        <input type="text" id="job_id" class="control-input input-readonly" value="${global_data.header.jobid}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ผู้ปฏิบัติงาน : </td>
                                    <td class="text-left">
                                        <select class="form-control select2 input-list" id="list-pallet-worker">
                                            ${list_pallet_worker}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ขั้นตอน : </td>
                                    <td class="text-left">
                                        <input type="text" id="machine_process" class="control-input input-readonly" value="${data.machine_process}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ขั้นตอนถัดไป : </td>
                                    <td class="text-left">
                                        <input type="text" id="next_process" class="control-input input-readonly" value="${data.next_process}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ยกพิมพ์<span class="red">*</span> : </td>
                                    <td class="text-left">
                                        <input type="text" id="pre_pallet_sig" class="control-input control-input-pallet" oninput="set_input_numeric(this)" value="${pre_pallet_sig}"/>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">`
    if (global_data.header.type_id === 36 || global_data.header.type_id === 52) {
        str += `จำนวน<span class="red">*</span> : </td>
                    <td class="text-left">
                        <input type="text" id="pre_pallet_qty" class="control-input input-readonly" oninput="set_input_numeric(this)" maxlength="7" 
                        onkeyup="set_commas(this)" />
                    </td>
                </tr>`

    } else {
        str += `<button type="button" class="btn btn-primary" id="btn_cal" data-toggle="modal" onclick="qty_pallet();">คำนวณแผ่น</button>
        จำนวน<span class="red">*</span> : </td>
                                    <td class="text-left">
                                        <input type="text" id="pre_pallet_qty" class="control-input control-input-pallet" oninput="set_input_numeric(this)" maxlength="7" 
                                        onkeyup="set_commas(this)" />
                                    </td>
                                </tr>`
    }
    str += `<tr>
                                    <td class="text-right">รายละเอียดยก : </td>
                                    <td class="text-left">
                                        <input type="text" id="technician_remark" class="control-input input-readonly" value="${global_header_planning}" readonly />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">หมายเหตุ : </td>
                                    <td class="text-left">
                                        <input type="text" id="timesheet_remark" class="control-input control-input-pallet" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">รอแห้ง : </td>
                                    <td class="text-left">
                                        <div class="d-flex">
                                        <input type="checkbox" id="is_wait_dry" onclick="checkWaitDry()" />
                                        <input id="wait_dry_hr" class="input-wait-dry input-wait-dry-disable" type="text" oninput="set_input_numeric(this)" disabled />
                                        <span>&nbsp;ชั่วโมง</span></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td class="text-left">
                                        <input type="checkbox" name="is_last_pallet" id="is_last_pallet" /><span>&nbsp;เป็นพาเลทสุดท้าย</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="col-6">
                        <table class="table table-borderless">
                            <tbody>
                                <tr>
                                    <td class="text-right">Machine Name : </td>
                                    <td class="text-left">
                                        <input type="text" class="control-input input-readonly" value="${global_data.header.machine_name}" readonly>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">Plan Date : </td>
                                    <td class="text-left">
                                        <input type="text" class="control-input input-readonly" value="${global_data.header.plan_date}" readonly>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">Job Name : </td>
                                    <td class="text-left">
                                        <input type="text" class="control-input input-readonly" value="${global_data.header.job_name}" readonly>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">เวลา : </td>
                                    <td class="text-left">
                                        <input type="text" id="pre_pallet_print_finished" class="control-input input-readonly" value="${data.current_time}" readonly>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ชิ้นส่วน : </td>
                                    <td class="text-left">
                                        <select class="form-control select2 input-part-name" id="part_name" disabled>
                                            ${list_multi_process}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">Zone ถัดไป : </td>
                                    <td class="text-left">
                                        <input type="text" id="next_zone" class="control-input input-readonly" value="${data.next_zone}" readonly>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-right">ส่งผลิตข้างนอก : </td>
                                    <td class="text-left">
                                        <input type="text" id="is_send_out" class="control-input input-readonly" value="${data.send_out_remark}" readonly>
                                    </td>
                                </tr>`
    if (global_data.header.type_id === 36 || global_data.header.type_id === 52) {
        console.log(data.paper_type);
        str += `<tr>
            <td class="text-right">รายละเอียด : </td>
            <td class="text-left">
                <input type="text" id="paper_type" class="control-input control-input-pallet" value='${data.paper_type}' readonly>
            </td>
        </tr>
        <tr>
            <td class="text-right">ขนาดตัด (นิ้ว)<span class="red">*</span> : </td>
            <td class="text-left">
                <input type="text" id="trim_size" class="control-input control-input-pallet" value="">
            </td>
        </tr>
        <tr>
            <td class="text-right">ส่วนสูง (CM)<span class="red">*</span> : </td>
            <td class="text-left">
                <input type="text" id="trim_height" name="trim_height" class="control-input control-input-pallet" oninput="set_input_numeric(this)" />
            </td>
        </tr>
        <tr>
            <td class="text-right text-nowrap">จำนวนก้อนกระดาษ : 
                <br><button class="btn-success" id="btn_add_trimming_detail" onclick="add_trimming_detail()">เพิ่ม</button>
                <br><span class="red text_warning_trimming">*เพิ่มได้สูงสุด 5 แถว</span>
            </td>
            <td class="text-left td_trimming_detail">
                <div class="row">
                    <div class="col-5 text-center">
                        จำนวน (ก้อน)
                    </div>
                    <div class="col-5 text-center">
                        ก้อนละ (แผ่น)
                    </div>
                    <div class="col-2">
                        ลบ
                    </div>
                </div>
                <div class="row row_trimming_detail">
                    <div class="col-5 text-center">
                        <input type="text" name="qty_paper_loaf" class="control-input control-input-pallet text-center" oninput="set_input_numeric(this);cal_trimming_qty();" />
                    </div>
                    <div class="col-5 text-center">
                        <input type="text" name="paper_per_qty" class="control-input control-input-pallet text-center" oninput="set_input_numeric(this);cal_trimming_qty();" />
                    </div>
                    <div class="col-2">
                        <button class="btn-danger btn_del_trimming_detail" onclick="del_trimming_detail($(this))">ลบ</button>
                    </div>
                </div>
            </td>
        </tr>`
    } else {
        str += `<tr>
                    <td class="text-right">ส่วนสูง (CM) : </td>
                    <td class="text-left">
                        <input type="text" id="trim_height" name="trim_height" class="control-input control-input-pallet" oninput="set_input_numeric(this)" />
                    </td>
                </tr>`
    }

    str += `<tr>
                <td class="text-right">ประเภทพาเลท<span class="red">*</span> : </td>
                <td class="text-left">
                    <select class="form-control select2 input-list" id="list-pallet-type">
                        ${list_pallet_type}
                    </select>
                </td>
            </tr>
            </tbody>
            </table>
            </div>
            </div>`
    body.html(str)
}

async function add_trimming_detail() {
    let row_trimming_detail = $(".row_trimming_detail").length
    if (row_trimming_detail >= 5) {
        return
    }
    let str = `<div class="row mt-1 row_trimming_detail">
                <div class="col-5 text-center">
                    <input type="text" name="qty_paper_loaf" class="control-input control-input-pallet text-center" oninput="set_input_numeric(this);cal_trimming_qty()" />
                </div>
                <div class="col-5 text-center">
                    <input type="text" name="paper_per_qty" class="control-input control-input-pallet text-center" oninput="set_input_numeric(this);cal_trimming_qty()" />
                </div>
                <div class="col-2">
                    <button class="btn-danger btn_del_trimming_detail" onclick="del_trimming_detail($(this))">ลบ</button>
                </div>
            </div>`
    $(".td_trimming_detail").append(str)
}

async function del_trimming_detail(el) {
    let row_trimming_detail = $(".row_trimming_detail").length
    if (row_trimming_detail === 1) {
        el.closest("div.row_trimming_detail").find("input[name='qty_paper_loaf']").val("")
        el.closest("div.row_trimming_detail").find("input[name='paper_per_qty']").val("")
        cal_trimming_qty();
        return
    }

    el.closest("div.row_trimming_detail").remove();
    cal_trimming_qty();
}

async function cal_trimming_qty() {
    let total_qty = 0
    for (const i of $(".row_trimming_detail")) {
        let qty_paper_loaf = Number($(i).find("input[name='qty_paper_loaf']").val())
        let paper_per_qty = Number($(i).find("input[name='paper_per_qty']").val())
        total_qty += qty_paper_loaf * paper_per_qty
    }
    $("input#pre_pallet_qty").val(total_qty)
}

async function set_commas(e) {
    await updateTextView($(e))
}

async function updateTextView(_obj) {
    var num = await getNumber(_obj.val());
    if (num == 0) {
        _obj.val('');
    } else {
        _obj.val(num.toLocaleString());
    }
}

async function getNumber(_str) {
    var arr = _str.split('');
    var out = new Array();
    for (var cnt = 0; cnt < arr.length; cnt++) {
        if (isNaN(arr[cnt]) == false) {
            out.push(arr[cnt]);
        }
    }
    return Number(out.join(''));
}

async function prepare_pre_pallet(header_id) {
    const url = `${api_url}/pl/prepare_pre_pallet?header_id=${header_id}`
    let res = []
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            res = data.data[0]
        },
        error: function (err) {
            console.log(err);
        },
        complete: function () {
            $("#modal-pre-pallet").modal()
        }
    })
    return res
}

async function set_list_worker(worker_people) {
    var list_worker = "";
    worker_people.forEach((item, index) => {
        list_worker += `<option value="${item.emp_id}">(${item.emp_id}) ${item.firstname} ${item.lastname}</option>`
    })
    return list_worker;
}

async function set_list_pallet_type() {
    let pallet_type = await get_timesheet_pallet_type();
    // console.log(pallet_type);
    var list_pallet_type = "";
    pallet_type.forEach((item, index) => {
        if (item.remark_id === 5) {
            list_pallet_type += `<option value="${item.remark_id}" selected>${item.remark_name}</option>`
        } else {
            list_pallet_type += `<option value="${item.remark_id}">${item.remark_name}</option>`
        }
    })
    return list_pallet_type;
}

async function set_list_part_name(parts_name) {
    var list_part_name = `<option value="-99">กรุณาเลือก</option>`;
    parts_name.forEach((item, index) => {
        list_part_name += `<option value="${index}">${item.part_name}</option>`
    })
    return list_part_name;
}

async function checkWaitDry() {
    if ($("#is_wait_dry").is(':checked')) {
        $("#wait_dry_hr").attr('disabled', false);
        $("#wait_dry_hr").removeClass('input-wait-dry-disable');
    }
    else {
        $("#wait_dry_hr").val('');
        $("#wait_dry_hr").attr('disabled', true);
        $("#wait_dry_hr").addClass('input-wait-dry-disable');
    }
}

async function qty_pallet() {
    // console.log("1234")
    // console.log($("#modal-pre-pallet"))
    await $("#modal-cal-paper").modal({ backdrop: "static" })
    await $("div#modal-pre-pallet").addClass("background-backdrop")
    // let url = "http://192.168.5.25/planning/views/paper.php"
    // $.get(url,function(data){
    // 	// $.blockUI({message:data,css:{width:'60%',height:'50%',top:'20%',left:'20%',cursor:'default'}});
    //     $('body').loading({
    //         message: ,
    //         theme: 'dark'
    //     })
    //     console.log(data)
    // });
}

async function save_pallet(data_multi_process) {
    let timesheet_header_id = global_data.header.header_id;
    let qty = $("#pre_pallet_qty").val();
    let technician_remark = $("#technician_remark").val();
    let timesheet_remark = $("#timesheet_remark").val();
    let is_last_pallet = ($("#is_last_pallet").is(':checked')) ? 1 : 0;
    let print_finished = $('#pre_pallet_print_finished').val();
    let emp_created = $('#list-pallet-worker').val();
    let emp = $('#list-pallet-worker').val();
    let sig = $('#pre_pallet_sig').val();
    let index = $("#part_name").val();
    // let checked = $("#is_wait_dry").attr('checked');
    let pallet_type = $("#list-pallet-type").val();
    let is_wait_dry = 0;
    let wait_dry_hr = 0;
    // if (checked) {
    //     is_wait_dry = 1;
    //     wait_dry_hr = $("#wait_dry_hr").val();
    // }
    // else {
    //     is_wait_dry = 0;
    //     wait_dry_hr = "";
    // }

    if ($('input#is_wait_dry').is(':checked')) {
        is_wait_dry = 1
        wait_dry_hr = Number($("input#wait_dry_hr").val());
    } else {
        is_wait_dry = 0;
        wait_dry_hr = "";
    }

    // console.log(is_wait_dry, wait_dry_hr);

    let planning_send_id = -1;
    let next_process_id = 0;
    let next_process_name = -1;
    let next_zone_id = -1;
    let next_machine_id = -1;
    let part_name = "";
    if (index >= 0) {
        planning_send_id = data_multi_process[index].planning_send_id;
        next_process_id = data_multi_process[index].next_process_id;
        next_process_name = data_multi_process[index].next_process_name;
        next_zone_id = data_multi_process[index].next_zone_id;
        next_machine_id = data_multi_process[index].next_machine_id;
        part_name = data_multi_process[index].part_name;
    }

    if (qty <= 0 || qty == '') {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณากรอกจำนวน',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }
    if (sig < 0 || sig == '') {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณากรอกยก',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }
    if (index == -99 || index == '') {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณาเลือกชิ้นส่วน',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }
    if (is_wait_dry == 1 && wait_dry_hr <= 0) {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณากรอกเวลารอแห้ง',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }
    if (next_zone_id == 16) {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณาเลือกชิ้นส่วนที่มีโซน',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }

    if (typeof pallet_type === "undefined" || pallet_type == '0') {
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณาเลือก ประเภทพาเลท',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
        return false;
    }

    let get_date = new Date()
    let current_date = get_date.toISOString().split('T')[0]
    let str_date = `${current_date} ${print_finished}`
    let print_date = await formatDate(new Date(str_date))

    var data = {
        "timesheet_header_id": timesheet_header_id,
        "qty": qty.replace(/,/g, ''),
        "is_last_pallet": is_last_pallet,
        "print_finished": print_date,
        "remark_id": pallet_type,
        "sig": sig,
        "emp_created": emp_created,
        "emp": emp,
        "planning_send_id": planning_send_id,
        "next_process_id": next_process_id,
        "next_process_name": next_process_name,
        "next_zone_id": next_zone_id,
        "next_machine_id": next_machine_id,
        "part_name": part_name,
        "technician_remark": technician_remark,
        "planning_type": 1,
        "timesheet_remark": timesheet_remark,
        "is_wait_dry": is_wait_dry,
        "wait_dry_hr": wait_dry_hr,
        "type_id": global_data.header.type_id,
    }
    // console.log($("input#trim_height"));
    data.trim_height = $("input#trim_height").val()

    if (global_data.header.type_id === 36 || global_data.header.type_id === 52) {
        data.trim_size = $("input#trim_size").val()

        if ($.trim(data.trim_size) === "") {
            main_set_alert({
                position: 'center', icon: 'warning', title: 'กรุณากรอกขนาดตัด',
                showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
            })
            return false;
        }

        if ($.trim(data.trim_height) === "") {
            main_set_alert({
                position: 'center', icon: 'warning', title: 'กรุณากรอกขนาดส่วนสูง',
                showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
            })
            return false;
        }

        let trimming_detail = []
        let sequence = 0
        for (const i of $("div.row_trimming_detail")) {
            sequence++
            trimming_detail.push({
                sequence,
                paper_per_qty: Number($(i).find('input[name="paper_per_qty"]').val()),
                qty_paper: Number($(i).find('input[name="qty_paper_loaf"]').val())
            })
        }

        data.pl_trimming_detail = trimming_detail
        data.trim_detail = $("input#paper_type").val()
    }

    console.log(data);
    // console.log(data.print_finished)

    $.ajax({
        type: "POST",
        // url: "../../../PL/controllers/pl_monitor.php",
        url: `${api_url}/pl/insert_pre_pallet`,
        data: data,
        dataType: "json",
        async: false,
        beforeSend: async function () {
            await main_set_loading({ loading: true, message: 'LOADING ...' });
        },
        success: async function (response) {
            // console.log(response);
            if (response.success === true) {
                await main_set_loading({ type: 'success', loading: false, message: `บันทึกข้อมูลเสร็จสิ้น : ${response.pallet.pre_pallet_code}` })
            } else {
                await main_set_loading({ type: 'error', loading: false, message: "บันทึกล้มเหลว" })
            }
            await $('#modal-pre-pallet').modal('hide');

            if (type_id === 52 || type_id === 36) {
                await get_checklist_outsource_detail(plan_id)
            }
        },
        error: async function (err) {
            await main_set_loading({ type: 'error', loading: false, message: "บันทึกล้มเหลว" })
        }
    });
}

async function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

async function formatDate(date) {
    return (
        [
            date.getFullYear(),
            await padTo2Digits(date.getMonth() + 1),
            await padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            await padTo2Digits(date.getHours()),
            await padTo2Digits(date.getMinutes()),
            await padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}

async function pre_pallet_view() {
    let data_remark = await get_timesheet_pallet_type();
    let data_list_pallet = await load_pallet_in_plan();
    // console.log(data_list_pallet);
    let is_folding = 0
    let body = $("#modal-pre-pallet-view .modal-dialog .modal-content .modal-body");
    // console.log(body)
    var str = ""
    if (global_data.header.machine_type == 12) {
        is_folding = 1;
    }
    if (is_folding == 0) {
        str = `<table width="100%" border="0" style="" id="list_pallet">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>รหัส pallet</th>
                                <th>รหัส pre pallet</th>
                                <th>Job</th>
                                <th>ชิ้นส่วน</th>
                                <th>ยก</th>
                                <th>จำนวน</th>
                                <th>สะสม</th>
                                <th>ลำดับพาเลท</th>
                                <th>อื่นๆ</th>
                                <th>เวลาสร้าง</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>`;
    } else {
        str = `<table width="100%" border="0" style="" id="list_pallet">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>รหัส pallet</th>
                                <th>รหัส pre pallet</th>
                                <th>Job</th>
                                <th>ชิ้นส่วน</th>
                                <th>ยก</th>
                                <th>ยกพับ</th>
                                <th>จำนวน</th>
                                <th>สะสม</th>
                                <th>ลำดับพาเลท</th>
                                <th>อื่น ๆ</th>
                                <th>เวลาสร้าง</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>`;
    }
    let tbody = "";
    if (data_list_pallet.length > 0) {
        let data_pallet = data_list_pallet;
        let data_length = data_list_pallet.length;
        let accumulated_amount = 0;
        var sum_accumulated_amount = data_pallet[0].accumulated_amount
        // let PaperSheeter_checked = $("#machineType_36").attr('checked');
        // let WarehouseTrimming_checked = $("#machineType_52").attr('checked');
        console.log(data_pallet)

        data_pallet.forEach((item, index) => {
            let text_status = `<span class="bi bi-trash pre_pallet_delete" onclick ="delete_pallet('${item.pallet_code}',pre_pallet,'${item.technician_id}')"></span>`
            // let text_status = `<span style="text-decoration: underline;cursor: pointer;color: red;font-size: 12px;" onclick ="delete_pallet('${item.pallet_code}',pre_pallet,'${item.technician_id}')">ลบพาเลทนี้</span>`;
            // if (PaperSheeter_checked == 'checked' || WarehouseTrimming_checked == 'checked' ) {
            // 	text_pallet_code = `<a target="_blank" href="http://192.168.5.41:8080/print_pallet/print_pallet_trim.aspx?id=${item.pallet_id}">${item.pallet_code}</a>`;
            // }
            // else{
            // 	text_pallet_code = `<a target="_blank" href="http://192.168.5.41:8080/print_pallet/print_pallet.aspx?id=${item.pallet_id}">${item.pallet_code}</a>`;
            // }
            let text_pallet_code = `<a class="pallet_code_view" target="_blank" href="http://192.168.5.41:8080/print_pallet/print_pallet.aspx?id=${item.pallet_id}">${item.pallet_code}</a>`;
            let remark_text = "";
            data_remark.forEach((item2, index2) => {
                if (item.remark_id == item2.remark_id) {
                    remark_text = `<span>${item2.remark_name}</span>`;
                }
            });

            var qty_prepallet = item.qty.toLocaleString()
            if (is_folding == 0) {
                tbody += `
                        <tr>
                            <td align="center" >${data_length - index}</td>
                            <td align="center" >${text_pallet_code}</td>
                            <td align="center" >${item.pre_pallet_code}</td>
                            <td align="center" >${item.job_id}</td>
                            <td align="center" >${item.part_name}</td>
                            <td align="center" >${item.sig}</td>
                            <td align="center" >${qty_prepallet}</td>
                            <td align="center" >${sum_accumulated_amount}</td>
                            <td align="center" >${item.pallet_number}</td>
                            <td align="center" >${remark_text}</td>
                            <td align="center" >${item.created}</td>
                            <td align="center" >${text_status}</td>
                        </tr>
                `;
            }
            else {
                tbody += `
                        <tr>
                            <td align="center" >${data_length - index}</td>
                            <td align="center" >${text_pallet_code}</td>
                            <td align="center" >${item.pre_pallet_code}</td>
                            <td align="center" >${item.job_id}</td>
                            <td align="center" >${item.part_name}</td>
                            <td align="center" >${item.sig}</td>
                            <td align="center" >${item.sig_folding}</td>
                            <td align="center" >${qty_prepallet}</td>
                            <td align="center" >${sum_accumulated_amount}</td>
                            <td align="center" >${item.pallet_number}</td>
                            <td align="center" >${remark_text}</td>
                            <td align="center" >${item.created}</td>
                            <td align="center" >${text_status}</td>
                        </tr>
                `;
            }
            sum_accumulated_amount = sum_accumulated_amount - parseInt(item.qty)
        })
    }
    str += tbody;
    str += `</tbody>
            <tfoot></tfoot>
            </table>`;
    body.html(str);

}

async function load_pallet_in_plan() {
    //url = "../../../PL/controllers/pl_monitor.php"
    var res = []
    $.ajax({
        url: `${api_url}/pl/list_pallet_timesheet?machine=${global_data.header.machine_id}&plan_id=${global_data.header.plan_id}`,
        method: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (response) {
            if (response.data.length > 0) {
                let rs_accumulated_amount = (response.accumulated_amount != undefined) ? response.accumulated_amount : 0
                console.log(rs_accumulated_amount)
                response.data[0].accumulated_amount = rs_accumulated_amount
            }
            res = response.data
        },
        error: function (err) {
            console.log(err);
        },
        complete: function () {
            $("#modal-pre-pallet-view").modal()
        }
    })
    return res;
}

async function delete_pallet(pallet_code, pre_pallet, emp_id) {
    console.log('delete pallet');

    // url: "http://192.168.5.25/PL/controllers/pl_monitor.php",
    // post_type: 'delete_pre_pallet',  เชื่อม  backend อันเก่า
    $.ajax({
        type: "POST",
        url: `${api_url}/pl/delete_pallet`,
        data: {
            "pallet_code": pallet_code,
            "emp": emp_id
        },
        dataType: "json",
        async: false,
        beforeSend: function () {
        },
        success: async function (response) {
            // console.log(response);
            if (response.success === true) {
                main_set_loading({ type: 'success', loading: false, message: `ลบพาเลท : ${response.data} สำเร็จ` })
            }
            else {
                main_set_loading({ type: 'error', loading: false, message: "ลบพาเลทล้มเหลว" })
            }
            await $('#modal-pre-pallet-view').modal('hide');
        },
        error: function (e) {
            main_set_loading({ type: 'error', loading: false, message: "ลบพาเลทล้มเหลว" })
        }
    });
}

async function update_pallet() {
    await $('.pallet_qty').each(function () {
        // console.log($(this).val());
        let pallet_id = $(this).attr("pallet_id");
        let qty_val = $(this).val();
        qty_val = qty_val.replace(',', '');
        let tem_qty_val = $(this).attr("tem_val");
        tem_qty_val = tem_qty_val.replace(',', '');

        // url: "../../../PL/controllers/pl_monitor.php",
        if (qty_val != tem_qty_val) {

            $.ajax({
                type: "POST",
                url: `${api_url}/pl/update_pallet_qty_timesheet`,
                data: {
                    "pallet_id": pallet_id,
                    "qty": qty_val,
                },
                dataType: "json",
                async: false,
                beforeSend: function () {
                },
                success: function (response) {
                    if (response.success === true) {
                        console.log("success qty finish")
                    }
                },
                error: function (e) {
                    // console.log(e);
                    alert("บันทึกล้มเหลว :" + e);
                }
            });
        }
    });
    await $('.pallet_remark').each(function () {
        // console.log($(this).val());
        let pallet_id = $(this).attr("pallet_id");
        let remark_id = $(this).val();
        let tem_remark_id = $(this).attr("tem_remark_id");

        console.log(pallet_id)
        console.log(remark_id)
        console.log(tem_remark_id)

        if (remark_id != tem_remark_id) {
            $.ajax({
                type: "POST",
                // url: "../../../PL/controllers/pl_monitor.php",
                url: `${api_url}/pl/update_pallet_remark_id_timesheet`,
                data: {
                    "pallet_id": pallet_id,
                    "remark_id": remark_id,
                },
                dataType: "json",
                async: false,
                beforeSend: function () {
                },
                success: function (response) {
                    if (response.success === true) {
                        console.log("success qty finish")
                    }
                },
                error: function (e) {
                    console.log(e);
                    alert("บันทึกล้มเหลว :" + e);
                }
            });
        }
    });
    await $('#modal-pre-pallet-view').modal('hide');
}

async function upload_img() {
    await build_model_upload_image()
    await $("#modal-upload-img").modal({ backdrop: "static" });
}

async function saveImage() {
    var formData = new FormData($('#detail')[0]);
    console.log(formData)
    console.log(api_url)
    $.ajax({
        // url: 'http://192.168.5.25/planning/timesheet/timesheetmanager.php',
        url: `${api_url}/pl/upload_img`,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        async: false,
        beforeSend: async function () {
            await main_set_loading({ loading: true, message: 'LOADING ...' });
        },
        success: async function (res) {
            if (res.success === true) {
                await main_set_loading({ type: 'success', loading: false, message: res.message })
            } else {
                await main_set_loading({ type: 'error', loading: false, message: res.message })
            }
            await $('#modal-upload-img').modal('hide');
        },
        error: function (res) {
            // main_set_loading({ type: 'error', loading: false, message: res.message})
        }
    });
}

async function build_model_upload_image() {
    // console.log(global_header_id)
    let str = `<form id="detail" enctype="multipart/form-data">
                <input type="hidden" name="action" value="upload_img">
                <input type="hidden" name="header_id" value="${global_data.header.header_id}">
                <table width="95%" id="upload_img">
                    <thead>
                        <tr>
                            <th align="left" colspan="3">
                                <button class="btn btn-success" type="button" name="addimg" id="addimg" onclick="add_row_image(this);">เพิ่มรูปภาพ</button>
                                <br/>
                                <br/>
                            </th>
                        </tr>
                    </thead>
                    <tbody> 
                        <tr>
                            <td width="10%" style="text-align:right;">1. </td>
                            <td width="40%" style="text-align:left;"><input type="file" type="text" name="sheet_upload" class="upload-img"></td>
                            <td width="100%" style="text-align:left;"><input type="text" name="img_remark" id="img_remark" class="form-control" /></td>
                            <td width="10%"><span style="color:red; font-weight: bold; cursor:pointer; margin-left: 1rem;" class="removeimg" onclick="remove_row_image(this);">X</span></td>
                        </tr>
                    </tbody>
                </table>
            </form>`
    await $("#modal-upload-img .modal-dialog .modal-content .modal-body").html(str)
}

async function add_row_image() {
    var elm = '<tr>' +
        '<td width="10%" style="text-align:right;"></td>' +
        '<td width="40%" style="text-align:left;"><input type="file" type="text" name="sheet_upload" class="upload-img"></td>' +
        '<td width="100%" style="text-align:left;"><input type="text" name="img_remark" id="img_remark" class="form-control" /></td>' +
        '<td width="10%"><span style="color:red; font-weight: bold; cursor:pointer; margin-left: 1rem;" class="removeimg" onclick="remove_row_image(this);">X</span></td>' +
        '</tr>'
    $('#upload_img tbody').append(elm);
    $('#upload_img tbody tr:last-child').children().eq(0).html('');
    for (let i = 0; i < $('#upload_img tbody tr').length; i++) {
        $('#upload_img tbody tr').eq(i).children().eq(0).html(`${i + 1}. `);
    }
}

async function remove_row_image(e) {
    // var button = $('#upload_img tbody tr').length;
    $(e).parents('tr').remove();
    for (let i = 0; i <= $('#upload_img tbody tr').length; i++) {
        $('#upload_img tbody tr').eq(i).children().eq(0).html(i + 1);
    }
}

async function clearImg() {
    await build_model_upload_image();
}

async function open_ok_limit_color_report() {
    var url_view = "http://192.168.5.3/planning/timesheet/report_ok_limit_color.php";
    window.open(url_view)
}

async function set_input_numeric(e) {
    // console.log(e)
    e.value = e.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    // e.value = e.value.replace(/,/g,'')
    // e.value = e.value.toLocaleString()
    // console.log(e.value)
}

async function get_timesheet_pallet_type() {
    let timesheet_pallet_type = []
    const url = `${api_url}/pl/get_timesheet_pallet_type`
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            timesheet_pallet_type = data.data
        },
        error: function (err) {
            console.log('error');
        },
    })
    return timesheet_pallet_type
}

async function get_multi_process(plan_id) {
    const url = `${api_url}/pl/get_multi_process?plan_id=${plan_id}`
    let data_multi_process = []
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            data_multi_process = data.data[0]
        },
        error: function (err) {
            console.log(err);
        },
    })
    return data_multi_process
}