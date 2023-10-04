const params = new URLSearchParams(window.location.search)
const header_id = parseInt(params.get("header_id"))
var type_id = 0
var machine_id = ''
var machine_name = ''
var jobid = ''
var job_name = ''
var shift_id = ''
var plan_id = ''
var worker = []
var global_data = ''
var sub_detail_check = ''
var timer_start = 0
var no_duprunning = true
var global_detail_sup = '' /* set detail Sup ตรวจสอบสี */
var ok_sheet = {}
var isSup = 0
var leader = []
var total_output_timesheet_all = 0
var total_output_plan = 0
var doc_date = ''
var is_end = 1

let timeoutFlag = true

density = {
    uncoat: [1.55, 1.15, 1.25, 1.25, 0.00],
    coat: [1.90, 1.50, 1.50, 1.40, 0.00],
    uvink: [1.70, 1.40, 1.40, 1.35, 0.15]
}

$(async function () {
    if (params.get('maintenance') !== '1') {
        await main_set_loading({ loading: true, message: 'LOADING ...' });
        $('#keypad').keypad();
        await set_layout_timesheet()
        await check_header_id(header_id)
        const data = await get_header(header_id)

        // console.log(data);
        const ma_request = await get_repair_item(data.header.machine_id)
        const limit_color = await get_detail_oklimit_color(header_id)
        //set
        global_data = data
        leader = await get_checker(data.header.type_id)
        machine_id = data.header.machine_id
        machine_name = data.header.machine_name
        type_id = data.header.type_id
        plan_id = data.header.plan_id
        shift_id = data.header.shift_id
        jobid = data.header.jobid
        job_name = data.header.job_name === null || data.header.job_name === "" ? "" : data.header.job_name
        worker = data.worker
        doc_date = data.header.doc_date
        total_output_timesheet_all = data.sumtotal_qty.sumtotal_qty_timesheet
        total_output_plan = data.sumtotal_qty.sumtotal_qty_plans

        //end set
        await set_help_button(type_id)
        await set_table_ma_request(ma_request)
        await build_modal_maintenance(data.worker, data.problem, data.checklist)
        await build_modal_limit_color(limit_color, data.worker)
        await set_text_title(data.header)
        await set_table_request_ot(data.table_request_ot)
        await build_proc_right_side(data.process_right_side)
        await build_proc_left_side(data.process_left_side)
        await build_timesheet_item_history(data.item)
        await build_modal_ink_usage(data.header_planning)
        await build_modal_request_ot(data.header)
        await set_sumtotal(data.sumtotal_qty)
        await $("#second_board").removeAttr('hidden')
        await gen_checklist()

        if (data.header.end_timesheet === 0) {
            // console.log("?");
            is_end = data.header.end_timesheet
            await state_end_timesheet(0)
        }

        $("input.input-total").focus(function (e) {
            $("input.input-total").removeClass('keypad')
            $(e.currentTarget).addClass('keypad')
        });

        let sig_str = data.header_planning.map(function (item) {
            return item['sum_sig'];
        });
        if (sig_str.length !== 0) {
            let text_sig_str = `ยก : ${(sig_str.reverse()).toString()}`
            $("#remark-sig").text(text_sig_str)
        }


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

        $("input[name='coat_option']").change(function (e) {
            let coat_id = e.target.id
            if (coat_id === 'coat_other') {
                $("input#coat_other_text").removeClass('disabled')
            } else {
                $("input#coat_other_text").val("")
                $("input#coat_other_text").addClass('disabled')
            }
        })

        // await select_first_option()
        await set_datepicker()

        if (parseInt(data.header.type_id) === 35 || parseInt(data.header.type_id) === 34) {
            ot_input_alert();
            setInterval(function () {
                // console.log('check ot');
                ot_input_alert();
            }, 300000); //  เช็คทุก 5 นาที หมายเหตุ: 1000 = 1 วินาที
        }

        $("button#checklist-sup-repair").click(() => {
            isSup = 1
        })

        await main_set_loading({ loading: false, message: 'LOADING ...' });
        $('div.history-body').scrollTop($('div.history-body')[0].scrollHeight);
    }

})

async function gen_checklist() {
    // const cqp_code = await get_checklist_outsource_id()
    const checklist_doc = await get_checklist({ machine_id, plan_id })
    const con_array1 = [1, 2, 3]
    const con_array2 = [6]
    const con_array3 = [4, 5]
    var result_checklist_machine = await all_value_is_in_array(con_array1, checklist_doc.group_id_array)
    if (result_checklist_machine) {
        await set_local_storage(checklist_doc.checklist_machine_detail, "checklist_machine")
    }
    var result_checklist_outsource = await all_value_is_in_array(con_array2, checklist_doc.group_id_array)
    if (result_checklist_outsource) {
        await set_local_storage(checklist_doc.checklist_outsource_detail, "checklist_outsource")
        if ($("table#tb-checklist-outsource").length === 0) {
            await build_checklist(checklist_doc, 'checklist-outsource', con_array2, worker)
        }

    }
    var result_checklist_qc = await all_value_is_in_array(con_array3, checklist_doc.group_id_array)
    if (result_checklist_qc) {
        await set_local_storage(checklist_doc.checklist_qc_detail, "checklist_qc")
        if ($("table#tb-checklist-qc").length === 0) {
            await build_checklist(checklist_doc, 'checklist-qc', con_array3, worker)
        }
    }
}

async function all_value_is_in_array(values_to_check, target_array) {
    return values_to_check.some(function (value) {
        // console.log(target_array.includes(value));
        return target_array.includes(value);
    });
}

async function set_help_button(type_id) {
    if (Number(type_id) === 35) {
        $("div#need-help").removeAttr('hidden', true)
        $("div#no-need-help").attr('hidden', true)
    } else {
        $("div#need-help").removeAttr('hidden', true)
        $("div#no-need-help").attr('hidden', true)
        $("div#help").prop('hidden', true)
    }
}

async function format_datetime(datetime) {
    const format1 = "yyyy-MM-DD HH:mm:ss.SSS"
    let my_date = moment(datetime).format(format1)
    return my_date
}

async function build_modal_sup_color(sup_color) {
    let { topic, detail, sub_detail } = sup_color
    // console.log(sup_color);
    // console.log(sub_detail)
    let body_sup_detail = $("#sup-check-color div#sup-detail");
    global_detail_sup = detail
    var table_sup_detail = `<table class="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">เครื่องจักร:</td>
                                            <td><input type="text" class="form-control disabled-text text-center" name="machine_id" value="(${detail.machine_id}) ${detail.machine_name}" /></td>
                                            <td class="col-2 text-right pr-2 align-middle">วัน/เดือน/ปี:</td>
                                            <td class="pr-5">
                                            <input type="text" class="form-control disabled-text text-center" name="stamp_date" value="${detail.present_date}" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">JOB:</td>
                                            <td><input type="text" class="form-control disabled-text text-center" name="disp_job" value="(${detail.jobid}) ${detail.job_name === "" || detail.job_name === null ? "" : detail.job_name}"></td>
                                            <td class="col-2 text-right pr-2 align-middle">กะ</td>
                                            <td class="pr-5"><input type="text" class="form-control disabled-text text-center" id="shift_id" name="shift_id" value="${detail.shift_id == 1 ? 'กลางวัน' : 'กลางคืน'}" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>ชิ้นส่วน:</td>
                                            <td>
                                                <input type="hidden" id="partname_value" name="partname_value" value="">
                                                <select id="partname" name="partname" class="form-control text-left" onchange="set_partname_sub();">
                                                    <option value="" disabled>--เลือกชิ้นส่วน--</option>`;
    detail.partName.forEach((item) => {
        table_sup_detail += `					<option value="${item.itid}">${item.partName}</option>`;
    })
    table_sup_detail += `
                                                </select>
                                            </td>
                                            <td class="col-2 text-right pr-2 align-middle">ยอดงานที่สั่งผลิต:</td>
                                            <td class="pr-5">
                                                <input type="text" class="form-control disabled-text text-center" id="qty" name="qty" value="${detail.qty1 === "" || detail.qty1 === null ? 0 : detail.qty1.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>Text:</td>
                                            <td><input type="text" class="form-control text-center" id="textname" name="textname"></td>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>Ink:</td>
                                            <td class="pr-5">
                                                <select name="ink" id="ink" class="form-control text-left">
                                                    <option value="" disabled>--เลือกหมึก--</option>
                                                    <option value="comax">Comax</option>
                                                    <option value="epple">Epple</option>
                                                    <option value="flint">Flint</option>
                                                    <option value="toka">TOKA</option>
                                                    <option value="toyoink">TOYOINK</option>
                                                    <option value="interink">INTERINK</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">WB ชนิด:</td>
                                            <td><input type="text" class="form-control text-center" id="typeWB" name="typeWB"></td>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>Analog No.:</td>
                                            <td class="pr-5">
                                                <select name="analog" id="analog" class="form-control text-left">
                                                    <option value="" disabled>--เลือก Analog No.--</option>
                                                    <option value="60 LCM">60 LCM</option>
                                                    <option value="80 LCM">80 LCM</option>
                                                    <option value="160 LPI">160 LPI</option>
                                                    <option value="200 LPI">200 LPI</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">WB ยี่ห้อ:</td>
                                            <td><input type="text" class="form-control text-center" id="brandWB" name="brandWB"></td>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>เบอร์แป้ง:</td>
                                            <td class="pr-5">
                                                <select name="numPowder" id="numPowder" class="form-control text-left">
                                                    <option value="" disabled>--เลือกเบอร์แป้ง--</option>
                                                    <option value="20-30 Micron">20-30 Micron</option>
                                                    <option value="30-40 Micron">30-40 Micron</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">ค่าความเงา:</td>
                                            <td><input id="shadow" type="text" class="form-control text-center number" name="shadow"></td>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>% การพ่นแป้ง:</td>
                                            <td class="pr-5">
                                                <input id="percent_powder" type="text" class="form-control text-center number" name="percentPowder" value="${sub_detail.length != 0 ? sub_detail[0].percentPowder : ''}" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">Lot น้ำยาเคลือบ:</td>
                                            <td><input type="text" class="form-control text-center number" id="lotWB" name="lotWB" value="" maxlength="10"></td>
                                            <td class="col-2 text-right pr-2 align-middle">ค่าความหนืดเฉลี่ย:</td>
                                            <td class="pr-5">
                                                <input type="text" class="form-control text-center number" id="stickiness" name="stickiness" value="" maxlength="4" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">Lot สี K:</td>
                                            <td><input type="text" class="form-control text-center number" id="lotK" name="lotK" maxlength="10" value=""></td>
                                            <td class="col-2 text-right pr-2 align-middle">Lot สี C:</td>
                                            <td class="pr-5"><input type="text" class="form-control text-center number" id="lotC" name="lotC" maxlength="10" value="" ></td>
                                        </tr>
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle">Lot สี M:</td>
                                            <td><input type="text" class="form-control text-center number" id="lotM" name="lotM" maxlength="10" value=""></td>
                                            <td class="col-2 text-right pr-2 align-middle">Lot สี Y:</td>
                                            <td class="pr-5"><input type="text" class="form-control text-center number" id="lotY" name="lotY" maxlength="10" value=""></td>
                                        </tr>`
    if (machine_id === 3605 || machine_id === '3605') {
        table_sup_detail += `<tr><td class="col-2 text-right pr-2 align-middle">ตำแหน่ง หลอด UV1:</td>
                                            <td>
                                                <select class="form-control text-center" id="uv1" name="uv1">
                                                    <option value="none">-- เลือกตำแหน่ง --</option>
                                                    <option value="1">Unit 1</option>
                                                    <option value="2">Unit 2</option>
                                                    <option value="0">None</option>
                                                </select>
                                            </td>
                                            
                                            <td class="col-2 text-right pr-2 align-middle">หลอด UV3: </td>
                                            <td class="pr-5">
                                                <select class="form-control text-center" id="uv3" name="uv3">
                                                    <option value="none">-- เลือกสถานะ --</option>
                                                    <option value="0">ปิด</option>
                                                    <option value="1">เปิด</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr><td class="col-2 text-right pr-2 align-middle">ตำแหน่ง หลอด UV2:</td>
                                            <td>
                                                <select class="form-control text-center" id="uv2" name="uv2">
                                                    <option value="none">-- เลือกตำแหน่ง --</option>
                                                    <option value="3">Unit 3</option>
                                                    <option value="4">Unit 4</option>
                                                    <option value="5">Unit 5</option>
                                                    <option value="6">Unit 6</option>
                                                    <option value="0">None</option>
                                                </select>
                                            </td>
                                            
                                            <td class="col-2 text-right pr-2 align-middle">หลอด UV4: </td>
                                            <td class="pr-5">
                                                <select class="form-control text-center" id="uv4" name="uv4">
                                                    <option value="none">-- เลือกสถานะ --</option>
                                                    <option value="0">ปิด</option>
                                                    <option value="1">เปิด</option>
                                                </select>
                                            </td>
                                        </tr>`
    }

    table_sup_detail += `
                                        <tr>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>ผู้ตรวจสอบ</td>
                                            <td>
                                                <select name="operator" id="operator" class="form-control text-left">
                                                    <option value="" disabled>--เลือกรายชื่อ--</option>`
    worker.forEach((item) => {
        table_sup_detail += `					<option value="${item.emp_id}">${item.firstname} ${item.lastname}</option>`;
    })
    table_sup_detail += `
                                                </select>
                                            </td>`
    if (machine_id === 3605 || machine_id === '3605') {
        table_sup_detail += `<td class="col-2 text-right pr-2 align-middle">หลอด UV5: </td>
                                            <td class="pr-5">
                                                <select class="form-control text-center" id="uv5" name="uv5">
                                                    <option value="none">-- เลือกสถานะ --</option>
                                                    <option value="0">ปิด</option>
                                                    <option value="1">เปิด</option>
                                                </select>
                                            </td>
                                        </tr>`
    }

    table_sup_detail += `<tr>
                                            <td class="col-2 text-right pr-2 align-middle"><span class="text-danger">*</span>หัวหน้างาน</td>
                                            <td>
                                                <select name="manager" id="manager" class="form-control text-left">
                                                    <option value="" disabled>--เลือกรายชื่อ--</option>`
    leader.forEach((item) => {
        table_sup_detail += `					<option value="${item.leader_id}">${item.leader_name}</option>`;
    })
    table_sup_detail += `
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                            </table> `
    body_sup_detail.html(table_sup_detail)

    let body_planning_working = $("#sup-check-color div.sup-planning-working");
    var table_planning_working = `<h5 class="text-center text-heading">การวางแผนการทำงาน</h5>
                                    <div class="type-id-1">
                                        <table class="table table-borderless" id="tb_input_detail">
                                            <thead>
                                                <tr>
                                                    <th colspan="6" class="text-left">${topic[0][0].type_id}. ${topic[0][0].type_name}</th>
                                                </tr>
                                                <tr>
                                                    <th colspan="4"></th>
                                                    <th class="text-center">Unit Color/Pantone</th>
                                                    <th class="text-center"><span class="text-danger">*</span> ค่า Packing ผ้ายาง</th>
                                                    <th class="text-center"><span class="text-danger">*</span> ค่าแรงกดโมล</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            `;
    let row_unit = topic[0][0].unit.length
    if (machine_id != 3507) {
        row_unit = topic[0][0].unit.length - 2
    }
    if (machine_id == 3422 || machine_id == 3423 || machine_id == 3521) {
        let j = 1;
        for (let i = 0; i < row_unit; i++) {
            let top_unit = ""
            if (topic[0][0].unit[i].checklist_type_id === 15) {
                top_unit = "บน"
            }
            else if (topic[0][0].unit[i].checklist_type_id === 19) {
                top_unit = "ล่าง"
            }
            else {
                top_unit = ""
            }
            // let j = 1;
            table_planning_working += `<tr id=${topic[0][0].unit[i].checklist_type_id} class="unit-packing-mole">`
            if (i === 0) {
                table_planning_working += `<td style="min-width: 5%;">${top_unit}</td>
                                                <td colspan="3" class="text-left pt-1">${topic[0][0].unit[i].topic}&emsp;Unit ${j}</td>
                                                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                    <input type="text" class="form-control unit-packing-mole" id="pantone_${topic[0][0].unit[i].checklist_type_id}" name="pantone[]">
                                                </td>
                                                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                    <input type="text" class="form-control unit-packing-mole" id="packing_${topic[0][0].unit[i].checklist_type_id}" name="packing[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                                </td>
                                                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                    <input type="text" class="form-control unit-packing-mole" id="mole_${topic[0][0].unit[i].checklist_type_id}" name="mole[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                                </td>
                                            </tr>`;
            } else if (i > 0) {
                table_planning_working += `<td style="min-width: 5%;">${top_unit}</td>
                <td colspan="3" class="text-left pt-1">${topic[0][0].unit[i].topic}&emsp;Unit ${j}</td>
                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                    <input type="text" class="form-control unit-packing-mole" id="pantone_${topic[0][0].unit[i].checklist_type_id}" name="pantone[]" >
                </td>
                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                    <input type="text" class="form-control disabled-text unit-packing-mole" id="packing_${topic[0][0].unit[i].checklist_type_id}" name="packing[]" oninput="set_input_numeric(this)">
                </td>
                <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                    <input type="text" class="form-control disabled-text unit-packing-mole" id="mole_${topic[0][0].unit[i].checklist_type_id}" name="mole[]" oninput="set_input_numeric(this)"> 
                </td>
            </tr>`;
            }

            if (j == 4) {
                j = 0
            }
            j++;

        }

    } else {
        for (let i = 0; i < row_unit; i++) {
            if (i === 0) {
                table_planning_working += `<tr id=${topic[0][0].unit[i].checklist_type_id} class="unit-packing-mole">
                                            <td style="min-width: 5%;"></td>
                                            <td colspan="3" class="text-left pt-1">${topic[0][0].unit[i].topic}&emsp;${topic[0][0].unit[i].topic_name}</td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control unit-packing-mole" id="pantone_${topic[0][0].unit[i].checklist_type_id}" name="pantone[]" >
                                            </td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control text-center unit-packing-mole" id="packing_${topic[0][0].unit[i].checklist_type_id}" name="packing[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                            </td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control text-center unit-packing-mole" id="mole_${topic[0][0].unit[i].checklist_type_id}" name="mole[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                            </td>
                                        </tr>`;
            } else {
                table_planning_working += `<tr id=${topic[0][0].unit[i].checklist_type_id} class="unit-packing-mole">
                                            <td style="min-width: 5%;"></td>
                                            <td colspan="3" class="text-left pt-1">${topic[0][0].unit[i].topic}&emsp;${topic[0][0].unit[i].topic_name}</td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control unit-packing-mole" id="pantone_${topic[0][0].unit[i].checklist_type_id}" name="pantone[]" >
                                            </td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control disabled-text text-center unit-packing-mole" id="packing_${topic[0][0].unit[i].checklist_type_id}" name="packing[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                            </td>
                                            <td class="text-left pt-1" style="padding: 0 5%; min-width: 25%;">
                                                <input type="text" class="form-control disabled-text text-center unit-packing-mole" id="mole_${topic[0][0].unit[i].checklist_type_id}" name="mole[]" onkeyup="set_value_unit(this.value, this)" oninput="set_input_numeric(this)">
                                            </td>
                                        </tr>`;
            }
        }
    }
    table_planning_working += `
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="type-id-2 type-id-3">
                                        <table class="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th colspan="5" class="text-left">${topic[0][1].type_id}. ${topic[0][1].type_name}</th>
                                                    <th colspan="5" class="text-left">${topic[0][2].type_id}. ${topic[0][2].type_name}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][1].unit[0].topic} ${topic[0][1].unit[0].topic_name}</td>
                                                    <td class="pl-2"><input type="text" class="form-control" id="papertype" name="papertype" readonly></td>
                                                    <td></td>
                                                    <!-- 3 -->
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][2].unit[0].checklist_type_id}" class="form-control number check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][2].unit[0].topic} ${topic[0][2].unit[0].topic_name}</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][1].unit[1].topic} <span class="text-danger">*</span>${topic[0][1].unit[1].topic_name}</td>
                                                    <td class="pl-2"><input type="text" id="thickpaper" name="thickpaper" class="form-control text-center number" value="${sub_detail.length != 0 ? sub_detail[0].thickpaper : ''}"></td>
                                                    <td class="align-middle">มิลลิเมตร</td>
                                                   
                                                    <!-- 3 -->
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][2].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][2].unit[1].topic} ${topic[0][2].unit[1].topic_name}</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3" class="pl-2 text-left align-middle"></td>
                                                    <td class="pl-2"></td>
                                                    <td ></td>
                                                    <!-- 3 -->
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][2].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][2].unit[2].topic} ${topic[0][2].unit[2].topic_name}</td>
                                                </tr>
                                                
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="type-id-4 type-id-5 type-id-6">
                                        <table class="table table-borderless">
                                            <thead>
                                                <tr>
                                                    <th colspan="4" class="text-left">${topic[0][3].type_id}. ${topic[0][3].type_name}</th>
                                                    <th colspan="4" class="text-left">${topic[0][4].type_id}. ${topic[0][4].type_name}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][3].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][3].unit[0].topic} ${topic[0][3].unit[0].topic_name}</td>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][4].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][4].unit[0].topic} ${topic[0][4].unit[0].topic_name}</td>
                                                </tr>
                                                <tr>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][3].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][3].unit[1].topic} ${topic[0][3].unit[1].topic_name}</td>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][4].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][4].unit[1].topic} ${topic[0][4].unit[1].topic_name}</td>
                                                </tr>
                                                <tr>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][3].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][3].unit[2].topic} ${topic[0][3].unit[2].topic_name}</td>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][4].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][4].unit[2].topic} ${topic[0][4].unit[2].topic_name}</td>
                                                </tr>
                                                <tr>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][3].unit[3].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][3].unit[3].topic} ${topic[0][3].unit[3].topic_name}</td>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][5].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle"><strong>${topic[0][5].type_id}. ${topic[0][5].type_name}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][3].unit[4].checklist_type_id}" class="form-control check-box-sup"></td>
                                                    <td colspan="3" class="pl-2 text-left align-middle">${topic[0][3].unit[4].topic} ${topic[0][3].unit[4].topic_name}</td>
                                                    <td colspan="4" class="pl-2 text-left align-middle"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    `;
    // console.log($("#sup-check-color div.sup-planning-working"));
    body_planning_working.html(table_planning_working)
    // set uv1
    $("select#uv1 option[value='none']").prop('disabled', true)
    $("select#uv1 option[value='none']").prop('selected', true)

    // set uv2
    $("select#uv2 option[value='none']").prop('disabled', true)
    $("select#uv2 option[value='none']").prop('selected', true)

    // set uv3
    $("select#uv3 option[value='none']").prop('disabled', true)
    $("select#uv3 option[value='none']").prop('selected', true)

    // set uv4
    $("select#uv4 option[value='none']").prop('disabled', true)
    $("select#uv4 option[value='none']").prop('selected', true)

    // set uv5
    $("select#uv5 option[value='none']").prop('disabled', true)
    $("select#uv5 option[value='none']").prop('selected', true)

    const body_sup_make_ready = $("#sup-check-color div.sup-make-ready");
    var table_sup_make_ready = `<h5 class="text-center text-heading">การปรับตั้ง (Make-Ready)</h5>
                                <div class="type-id-4 type-id-5 type-id-6">
                                <table class="table table-borderless">
                                    <thead>
                                        <tr>
                                            <th colspan="4" class="text-left">7. ตั้ง Feeder</th>
                                            <th colspan="4" class="text-left">11. ปรับตั้ง Register</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][6].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][6].unit[0].topic} ${topic[0][6].unit[0].topic_name}</td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][10].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][10].unit[0].topic} ${topic[0][10].unit[0].topic_name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][6].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][6].unit[1].topic} ${topic[0][6].unit[1].topic_name}</td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][10].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][10].unit[1].topic} ${topic[0][10].unit[1].topic_name}</td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][6].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][6].unit[2].topic} ${topic[0][6].unit[2].topic_name}</td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][10].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][10].unit[2].topic} ${topic[0][10].unit[2].topic_name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][6].unit[3].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][6].unit[3].topic} ${topic[0][6].unit[3].topic_name}
                                            </td>
                                            <th colspan="4" class="text-left">12. การปรับตั้งสี</th>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][6].unit[4].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle">${topic[0][6].unit[4].topic} ${topic[0][6].unit[4].topic_name}</td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][11].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="4" class="pl-2 text-left align-middle">${topic[0][11].unit[0].topic} ${topic[0][11].unit[0].topic_name}</td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][7].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle"><strong>${topic[0][7].type_id}. ${topic[0][7].type_name}</strong></td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][11].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="4" class="pl-2 text-left align-middle">${topic[0][11].unit[1].topic} ${topic[0][11].unit[1].topic_name}</td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][8].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle"><strong>${topic[0][8].type_id}. ${topic[0][8].type_name}</strong></td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][11].unit[2].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="4" class="pl-2 text-left align-middle">${topic[0][11].unit[2].topic} ${topic[0][11].unit[2].topic_name}</td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][9].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle"><strong>${topic[0][9].type_id}. ${topic[0][9].type_name}</strong></td>
                                            <th colspan="4" class="text-left">13. ขีดฉากพิมพ์ (ฉากหน้าและฉากข้าง)</th>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle"></td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][12].unit[0].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="4" class="pl-2 text-left align-middle">${topic[0][12].unit[0].topic} ${topic[0][12].unit[0].topic_name}</td>
                                        </tr>
                                        <tr>
                                            <td class="pl-4"></td>
                                            <td colspan="3" class="pl-2 text-left align-middle"></td>
                                            <td class="pl-4"><input type="checkbox" name="topic[]" id="${topic[0][12].unit[1].checklist_type_id}" class="form-control check-box-sup"></td>
                                            <td colspan="4" class="pl-2 text-left align-middle">${topic[0][12].unit[1].topic} ${topic[0][12].unit[1].topic_name}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                                `;
    body_sup_make_ready.html(table_sup_make_ready)
    // set value
    sub_detail_check = sub_detail
    // console.log(sub_detail);
    var lotK = ''
    var lotC = ''
    var lotM = ''
    var lotY = ''
    if (sub_detail.length != 0) { //sub_detail form last checklist_timesheet_sub
        $('#typeWB').val(sub_detail[0].typeWB)
        $('#brandWB').val(sub_detail[0].brandWB)
        $('#textname').val(sub_detail[0].textname)
        $('#shadow').val(sub_detail[0].shadow)
        $('#percentPowder').val(sub_detail[0].percentPowder)
        $('#papertype').val(sub_detail[0].papertype)
        $('#thickpaper').val(sub_detail[0].thickpaper)
        $('#partname').children().each(function () {
            if ($(this).val() == sub_detail[0].partname_id) {
                $(this).attr('selected', true)
                $('#partname_value').val($(this).html())
            }
        })
        $('select#ink').children().each(function () {
            if ($(this).val() == sub_detail[0].ink)
                $(this).attr('selected', true)
        })
        $('select#analog').children().each(function () {
            if ($(this).val() == sub_detail[0].analog) {
                $(this).attr('selected', true)
            }
        })
        $('select#numPowder').children().each(function () {
            if ($(this).val() == sub_detail[0].numPowder) $(this).attr('selected', true)
        })

        for (let i = 1; i <= 5; i++) {
            $('#uv' + i).children().each(function () {
                switch (i) {
                    case 1:
                        if ($(this).val() == sub_detail[0].uv1) $(this).attr('selected', true)
                        break;
                    case 2:
                        if ($(this).val() == sub_detail[0].uv2) $(this).attr('selected', true)
                        break;
                    case 3:
                        if ($(this).val() == sub_detail[0].uv3) $(this).attr('selected', true)
                        break;
                    case 4:
                        if ($(this).val() == sub_detail[0].uv4) $(this).attr('selected', true)
                        break;
                    case 5:
                        if ($(this).val() == sub_detail[0].uv5) $(this).attr('selected', true)
                        break;
                    default:
                        break;
                }
            })
        }
        let x = 0
        for (let i = 0; i < sub_detail[0].pantone.length; i++) {
            i > 7 ? x = i + 40 : x = i + 15
            $('#pantone_' + x).val(sub_detail[0].pantone[i])
            $('#packing_' + x).val(sub_detail[0].packing[i])
            $('#mole_' + x).val(sub_detail[0].mole[i])
            if (i > 0) { /* set disable input packing and mole */
                $('#packing_' + x).removeClass('disabled-text')
                $('#mole_' + x).removeClass('disabled-text')
            }
        }
        lotK = (machine_id != 3605 ? detail.lotColor[0] : sub_detail[0].lotK)
        lotC = machine_id != 3605 ? detail.lotColor[1] : sub_detail[0].lotC
        lotM = machine_id != 3605 ? detail.lotColor[2] : sub_detail[0].lotM
        lotY = machine_id != 3605 ? detail.lotColor[3] : sub_detail[0].lotY

        // for (let item_check of sub_detail[0].topic_check) {
        //     $(`input#${item_check}`).attr('checked', true)
        // }

    } else {
        lotK = machine_id != 3605 ? detail.lotColor[0] : ''
        lotC = machine_id != 3605 ? detail.lotColor[1] : ''
        lotM = machine_id != 3605 ? detail.lotColor[2] : ''
        lotY = machine_id != 3605 ? detail.lotColor[3] : ''
        $('select#ink option[value=""]').prop('selected', true)
        $('select#analog option[value=""]').prop('selected', true)
        $('select#numPowder option[value=""]').prop('selected', true)
        $('select#operator option[value=""]').prop('selected', true)
        $('select#partname option[value=""]').prop('selected', true)
        $('select#manager option[value=""]').prop('selected', true)
    }
    // $("div.modal#sup-check-color div.modal-body select#ink").find(`option[value="${sub_detail[0].ink}"]`)
    $('#lotK').val(lotK.lot_value != undefined ? lotK.lot_value : lotK)
    $('#lotC').val(lotC.lot_value != undefined ? lotC.lot_value : lotC)
    $('#lotM').val(lotM.lot_value != undefined ? lotM.lot_value : lotM)
    $('#lotY').val(lotY.lot_value != undefined ? lotY.lot_value : lotY)

    $('#sup-detail table tbody tr select#operator')[0].selectedIndex = 0
    // console.log($('#sup-detail table tbody tr select#operator')[0].selectedIndex);
    $('#sup-detail table tbody tr select#manager')[0].selectedIndex = 0
    // console.log($('#sup-detail table tbody tr select#manager')[0].selectedIndex);
}

async function select_first_option() {
    $('select').val($('select option:first').val())
}

async function set_datepicker() {
    $('#timesheet-date').datetimepicker({
        format: 'YYYY-MM-DD',
        date: new Date(),
    });

    // if ($('input.form-control.datetimepicker-input').val() != '') {
    //     $('input.form-control.datetimepicker-input').addClass('is-valid')
    // }
}

async function set_layout_timesheet() {
    // หน้า main
    $("nav").hide()
    $("aside").hide()
    $("#action_bar").hide()
    $(".content-wrapper").css({ margin: '0' })
    // หน้า timesheet 
    $("div.about-box").hide()
}

async function set_sumtotal(data) {
    $("span#sumtotal-qty-plans").text(parseInt(data.sumtotal_qty_plans).toLocaleString())
    $("span#sumtotal-qty-timesheet").text(parseInt(data.sumtotal_qty_timesheet).toLocaleString())
    await calc_qty()
}

async function set_input_numeric(e) {
    e.value = e.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
}

async function set_table_request_ot(data) {
    if (data.length === 0) {
        return
    }
    $("div.ot-request-box div.about-box").html("")
    let str = ` <table class="table table-borderless" id="table_request_ot">
                    <thead>
                        <tr>
                            <th class="text-center col-6">ชื่อ - นามสกุล</th>
                            <th class="text-center" hidden>OT พักเที่ยง</th>
                            <th class="text-center">OT ก่อนเลิกงาน</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>`
    $("div.ot-request-box div.about-box").append(str)
    $.each(data, function (index, item) {
        let tr = ` <tr>
                        <td class="text-left col-6">${item.emp_name}</td>
                        <td class="text-center" hidden>${item.request_type1 === 1 ? '<span class="text-success">✓</span>' : ''}</td>
                        <td class="text-center">${item.request_type2 === 2 ? '<span class="text-success">✓</span>' : ''}</td>
                    </tr>`
        $("table#table_request_ot").append(tr)
    });
    $("div.ot-request-box div.about-box").show()
}

async function set_table_ma_request(data) {
    if (data.length === 0) {
        return
    }

    let body = $("div.tab-pane#repair-again div table tbody")
    $("div.tab-pane#repair-again div h5#title-machine").text(`รายการแจ้งซ่อม: ${machine_id} ${machine_name}`)
    for (const item of data) {
        let str = `<tr class="" id="${item.ma_id}" onclick="set_active_tr(this, '${item.ma_id}')">
                    <td>${item.ma_id}</td>
                    <td class="ma_remark"><p class="text-break">${item.ma_remark}</p></td>
                    <td>${item.fullname}</br>${item.show_datetime}</td>
                </tr>`
        body.append(str)
    }
}

async function set_text_title(data) {
    //บรรทัดแรก
    $("div.timesheet-title h2 span#plan-title").html(`PLAN ID: ${data.plan_id} `)
    $("div.timesheet-title h2 span#machine-title").html(`(${data.machine_id} ${data.machine_name})`)
    //บรรทัดสอง
    $("div.timesheet-title h5 span#job-title").html(`${data.jobid} ${data.job_name === null ? "" : data.job_name}`)
    if ($.trim(data.remark) !== '') {
        $("div.timesheet-title h5 span#remark-title").html(`(${data.remark})`)
    }
}

async function build_proc_right_side(data) {
    $.each(data, function (index, value) {
        let box
        let func = value.function === null ? "" : `${value.function}(this,'${header_id}')`
        switch (value.piority) {
            case 0:
                box = $(`div.view-checklist-box div.button-box`)

                box.append(`<button id="view_checklist_${value.process_code_id}" class="view-checklist" onclick="${value.function}(${value.process_code_id})">
                ${value.process_code_name}</button>`);
                break
            case 1:
                if (value.process_code_id !== '1') {
                    box = $(`div.ot-request-box div.button-box`)
                    box.append(`<button id="ot_type_${value.process_code_id}" onclick="${func}">${value.process_code_name}</button>`);
                }
                break
            case 2:
                box = $(`div.pallet-box div.button-box`)
                box.append(`<button onclick="${func}">${value.process_code_name}</button>`);
                break
            case 3:
                box = $(`div.other-box div.button-box`)
                if (value.function !== 'view_checklist') {
                    box.append(`<button id="${value.function}" onclick="${func}">${value.process_code_name}</button>`);
                } else {
                    box.append(`<button id="view_checklist_${value.process_code_id}" class="view-checklist" onclick="${value.function}(${value.process_code_id})">
                ${value.process_code_name}</button>`);
                }
                break
            case 4:
                box = $(`div.end-timesheet-box div.button-box`)
                box.append(`<button id="${value.function}" onclick="${func}">${value.process_code_name}</button>`);
                break
        }
    });

    $(`div.view-checklist-box`).prop('hidden', true)
}

async function build_proc_left_side(data) {
    $.each(data, function (index, value) {
        let box = $(`div#group-id-${value.group_id}`)
        box.append(`<button value="${value.process_code_name}" id="${value.process_code_id}" 
        name="${value.group_abbreviation}" data-force-remark="${value.force_remark}"
        data-insert-qty="${value.insert_qty}" data-breakdown="${value.is_breakdown}"
        data-step="${value.step}" onclick="set_process_type(this, ${header_id}, '${value.process_code_id}')">
        ${value.process_code_id} ${value.process_code_name}</button>`)

        if (value.step > 1) {
            box.find(`button#${value.process_code_id}`).hide()
        }
    });
}

async function set_process_type(el, id, process) {
    let newproc = process
    let lasttr = $("table.table#process-history tbody tr").last()

    if (lasttr[0] !== undefined) {
        if (lasttr[0].dataset.process === 'R' && newproc === 'R') {
            await alert_valid('กรุณากด <strong class="text-primary">ใส่ยอด</strong> หรือ<br/>กดที่แถวเพื่อ <strong class="text-primary">แก้ไขจำนวน</strong> แทน')
            return
        }
    }

    // ถ้ามี popup ให้แสดงหลัง change process
    if (lasttr.length !== 0 && (parseInt(lasttr[0].dataset.forceRemark) !== 0 || parseInt(lasttr[0].dataset.insertQty) !== 0)) {
        let lastproc = lasttr[0].dataset.process
        let procname = lasttr[0].dataset.processName
        //เช็คว่าเป็น force_remark ที่อยากให้แสดงก่อนกดเปลี่ยน process หรือไม่
        let promise_force_remark = new Promise(async (resolve, reject) => {
            await set_timesheet_item(el, id)
            if (parseInt(lasttr[0].dataset.insertQty) !== 1 && lastproc !== 'N3' && lastproc !== 'N') {
                // ส่ง type ของ forceRemark, ชื่อ modal ที่จะเด้ง force-remark, process อันสุดท้ายที่กด, ชื่อ process อันสุดท้ายที่กด, Timesheet_item id
                await build_modal_force_remark(parseInt(lasttr[0].dataset.forceRemark), 'force-remark', lastproc, procname, lasttr[0].id)
                $("div.modal#force-remark").modal("show")
                $('div.modal#force-remark select[name="worker-update"]').prop("selectedIndex", 0)
                $("div.modal#force-remark").on('hidden.bs.modal', async function () {
                    resolve()
                })
            } else if (parseInt(lasttr[0].dataset.insertQty) === 1) {
                let lastid = lasttr[0].id
                no_duprunning = false
                await open_insert_qty(lastid)
                $("div.modal-footer button.save-insert-qty").click(() => {
                    $("div.modal#insert-qty").modal("hide")
                    resolve()
                })
            } else {
                resolve()
            }
        })
        //ปิด popup ก่อนหน้า เช็คว่าปุ่มล่าสุดที่กดเป็นส่งซ่อมหรือไม่
        promise_force_remark.then(async () => {
            await calc_qty()
            // ถ้ามีให้ส่งซ่อม
            if (parseInt(el.dataset.breakdown) !== 0) {
                //build
                // await select_first_option()
                await reset_modal_maintenance()
                if (parseInt(el.dataset.breakdown) === 1) {
                    await set_tab_hide('edit')
                    await set_active_tab('repair')
                } else if (parseInt(el.dataset.breakdown) === 2) {
                    await set_active_tab('edit')
                }
                $("table.table-repair.table-left tbody tr").last().prop('hidden', true)
                $("div.modal#maintenance").modal("show")
                return
            }
            if (newproc === 'N' || newproc === 'N3') {
                // await set_timesheet_item(el, id)
                const item_id = ($("table.table#process-history tbody tr").last())[0].id
                const type_force_remark = parseInt(el.dataset.forceRemark)
                const modal_name = 'force-remark-before'
                const newproc_name = `${newproc} ${el.value}`
                let promise = new Promise(async (resolve, reject) => {
                    await build_modal_force_remark(type_force_remark, modal_name, newproc, newproc_name, item_id)
                    resolve()
                })
                promise.then(async () => {
                    $("div.modal#force-remark-before").modal("show")
                })
                return
            }

            if (newproc === 'S7') { // sup ตรวจสอบสี
                const modal = $("div.modal#sup-check-color")
                const sup_color = await get_sup_detail({ plan_id, machine_id, header_id })
                await build_modal_sup_color(sup_color);
                modal.modal("show")
                return
            }

            if (newproc === 'S8') {
                await open_modal_ok_sheet()
                return
            }

            if (newproc === 'S9') {
                const modal = $("div.modal#ok-limit-color")
                await reset_modal_ok_limit_color(modal)
                await set_datetime_limit_color()
                modal.modal("show")
                return
            }

            no_duprunning = true
        })
        return

    }
    // ถ้าไม่มี force_remark แสดงเช็คก่อนว่าปุ่มล่าสุดเป็นปุ่มแจ้งซ่อมหรือไม่
    if (parseInt(el.dataset.breakdown) !== 0) {
        //build
        // await select_first_option()
        await reset_modal_maintenance()
        await set_timesheet_item(el, id)
        if (parseInt(el.dataset.breakdown) === 1) {
            await set_tab_hide('edit')
            await set_active_tab('repair')
        } else if (parseInt(el.dataset.breakdown) === 2) {
            await set_active_tab('edit')
        }
        $("table.table-repair.table-left tbody tr").last().prop('hidden', true)
        $("div.modal#maintenance").modal("show")
        return
    }

    if (newproc === 'N' || newproc === 'N3') {
        await set_timesheet_item(el, id)
        const item_id = ($("table.table#process-history tbody tr").last())[0].id
        const type_force_remark = parseInt(el.dataset.forceRemark)
        const modal_name = 'force-remark-before'
        const newproc_name = `${newproc} ${el.value}`
        let promise = new Promise(async (resolve, reject) => {
            await build_modal_force_remark(type_force_remark, modal_name, newproc, newproc_name, item_id)
            resolve()
        })
        promise.then(async () => {
            $("div.modal#force-remark-before").modal("show")
        })
        return
    }

    if (newproc === 'S7') {
        const modal = $("div.modal#sup-check-color")
        const sup_color = await get_sup_detail({ plan_id, machine_id, header_id })
        await build_modal_sup_color(sup_color);
        modal.modal("show")
        await set_timesheet_item(el, id)
        return
    }

    if (newproc === 'S8') {
        await open_modal_ok_sheet()
        await set_timesheet_item(el, id)
        return
    }

    if (newproc === 'S9') {
        const modal = $("div.modal#ok-limit-color")
        await reset_modal_ok_limit_color(modal)
        await set_datetime_limit_color()
        modal.modal("show")
        let promise = new Promise(async (resolve, reject) => {
            modal.on('shown.bs.modal', async function () {
                resolve()
            })
        })

        promise.then(async () => {
            await set_timesheet_item(el, id)
        })
        return
    }
    // ถ้าไม่มี popup
    await set_timesheet_item(el, id)
}

async function set_timesheet_item(el, id) {
    $('div.timesheet-btn-left button').removeClass('active');
    if (el === undefined) {
        return
    }
    let date_start = await format_datetime(new Date)
    let row = await insert_timesheet_item(id, el.id, date_start)
    // console.log(date_start);
    let obj = {
        id: row.item_id,
        process_code_id: `${el.id}`,
        process_code_name: `${el.id} ${el.value}`,
        group_name: $(el).parent().attr('id'),
        show_time: row.show_time,
        waste: 0,
        qty: 0,
        full_start_time: row.full_current_time,
        insert_qty: parseInt(el.dataset.insertQty),
        force_remark: row.force_remark
    }

    // console.log(obj.full_start_time);

    await build_timesheet_item_history([obj])
    if (parseInt(el.dataset.step) > 0) {
        let button = $(`button[data-step="${parseInt(el.dataset.step) + 1}"]`)
        button.show('normal')
    }
}

async function reset_modal_ok_limit_color(modal) {
    // S9 reset
    modal.find('input[name="input-density-suggest"]').val("")
    modal.find('input#remark').val("")
    // let body = $("div.ok-limit-color-body table tbody")
    modal.find('select[name="worker"]').prop("selectedIndex", 0)
    modal.find('select[name="worker"]').removeClass(['is-valid', 'is-invalid'])
    modal.find('select[name="leader"]').prop("selectedIndex", 0)
    modal.find('select[name="leader"]').removeClass(['is-valid', 'is-invalid'])
    modal.find('select[name="part"]').prop("selectedIndex", 0)
    modal.find('select[name="part"]').removeClass(['is-valid', 'is-invalid'])
}

async function add_timer(full_current_time) {
    timer_start = new Date(full_current_time);
    timer()
}

async function timer() {
    if (timeoutFlag) {
        var now = new Date();
        var msDiff = now.getTime() - timer_start.getTime();
        $("div#show-timer").html(Math.floor((msDiff / 1000 / 60)) + ":" + (Math.floor((msDiff / 1000) % 60) > 9 ? "" : "0") + Math.floor((msDiff / 1000) % 60));
    }
    setTimeout("timer(); ", 1000);
}

async function build_timesheet_item_history(data) {
    let islast = false
    $.each(data, async function (index, value) {
        let number = $('table.table#process-history tbody tr').length + 1
        if (index + 1 === data.length) {
            if (value.endTime === null || value.endTime === undefined) {
                islast = true
                $(`button#${value.process_code_id}`).addClass('active')
                $('div#show-process h1 span').text(value.process_code_name)
                if (value.group_name === 'group-id-2') {
                    $('div#show-process h1 span').append(`<button class="ml-3 insert_qty">ใส่ยอด</button>`)
                }
                await add_timer(value.full_start_time)
            } else if (value.endTime !== null && value.endTime !== undefined) {
                await calc_qty()
                if (Number(global_data.header.end_timesheet) === 0) {
                    await state_end_timesheet()
                }
                // await state_end_timesheet()
            }

        }
        set_show_history(number, value, islast)
        let step = parseInt($(`button#${value.process_code_id}`).attr('data-step'))
        $(`button[data-step="${step}"]`).show()
        $(`button[data-step="${step + 1}"]`).show()
    });
    await calc_qty()
    return
}

async function set_show_history(index, obj, islast) {
    let body = $("table.table#process-history tbody")
    let lasttr = $("table.table#process-history tbody tr").last()
    let str = `<tr id="${obj.id}" data-process="${obj.process_code_id}" 
                data-force-remark="${obj.force_remark}" 
                data-insert-qty="${obj.insert_qty}"
                data-process-name="${obj.process_code_name}">
                    <td class="text-right index-col">${index}.</td>`
    if (obj.group_id === 2 || obj.group_name === 'group-id-2') {
        let proc_name = obj.process_code_id === 'R' ? `${obj.process_code_name} <strong class="text-primary">(กดเพื่อแก้ไข)</strong>` : obj.process_code_name
        str += `<td class="pl-2 process-name-col">${proc_name}</td>
                <td class="total-running text-right pr-2 qty-col">Run: <span>${obj.qty.toLocaleString()}</span></td>
                <td class="total-waste text-right pr-2 waste-col">Waste: <span>${obj.waste.toLocaleString()}</span></td>`
    } else {
        str += `<td class="pl-2 process-name-col" colspan="3">${obj.process_code_name}</td>`
    }
    str += `<td class="text-right pr-2 time-col">${obj.show_time}</td>
            </tr>`
    body.append(str)
    if (islast === true) {
        $(lasttr).removeClass('text-warning')
        $(`tr#${obj.id}`).addClass('text-warning')
    }

    if (obj.insert_qty === 1) {
        $(`tr#${obj.id}`).attr('onclick', `open_insert_qty(${obj.id})`)
        if (islast === true) {
            $('div#show-process h1 span button').attr('onclick', `open_insert_qty(${obj.id},)`)
        }
    }
    return
}

async function open_insert_qty(id) {
    let total_running = $(`tr#${id} td.total-running span`).text().replace(/,/g, '')
    let total_waste = $(`tr#${id} td.total-waste span`).text().replace(/,/g, '')

    parseInt(total_running) !== 0 ? $("input#total-running").val(total_running) : $("input#total-running").val("")
    parseInt(total_waste) !== 0 ? $("input#total-waste").val(total_waste) : $("input#total-waste").val("")

    $("input#total-running").focus()
    $("input#total-running").addClass('keypad')
    $("input#total-waste").removeClass('keypad')

    $(`div.modal-footer button.save-insert-qty`).attr('onclick', `set_insert_qty(${id})`)
    $("div.modal#insert-qty").modal('toggle')
}

async function set_insert_qty(id) {
    // update in element and database
    let qty_running = parseInt($("input#total-running").val())
    let qty_waste = parseInt($("input#total-waste").val())

    $(`tr#${id} td.total-running span`).text(isNaN(qty_running) === true ? "0" : qty_running.toLocaleString())
    $(`tr#${id} td.total-waste span`).text(isNaN(qty_waste) === true ? "0" : qty_waste.toLocaleString())

    qty_running = isNaN(qty_running) === true ? 0 : qty_running
    qty_waste = isNaN(qty_waste) === true ? 0 : qty_waste

    // if (qty_running !== 0 || qty_waste !== 0) {
    await update_qty(id, qty_running, qty_waste)
    // }

    $("div.modal#insert-qty").modal('toggle')

    // new running
    if (type_id === 35) {
        let lasttr = $("table.table#process-history tbody tr").last()
        let tr = $(`tr#${id}`)
        let process = $(tr[0].attributes[1]).val();
        let button = $(`button#${process}`)[0]
        if (tr.is(lasttr) && no_duprunning === true) {
            await set_timesheet_item(button, header_id)
        }
    }
}

async function calc_qty() {
    const total_running = (await get_total_running(header_id))[0].total_running
    if (total_running === null) {
        return
    }
    let new_total = total_running + total_output_timesheet_all
    // console.log(total_running , total_output_timesheet_all);
    $('h6 span#sumtotal-qty-running').text(total_running.toLocaleString())
    $('h6 span#sumtotal-qty-timesheet').text(new_total.toLocaleString())

    if (new_total > total_output_plan) {
        await alert_valid(`จำนวน Qty ที่ได้จาก Timesheet <br/>มากกว่าจำนวน Qty ในแผน`)
    }

}

async function ot_input_alert() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    if (minutes < 10)
        minutes = "0" + minutes;

    // var msg_alert = "กรุณาตรวจสอบข้อมูลการขอโอที";
    // if (hours == 17 && (minutes >= 00 && minutes <= 05)) { //ตอน 5 โมงเย็น
    //     await alert_valid(msg_alert);
    // }
    // else if (hours == 05 && (minutes >= 00 && minutes <= 05)) { //ตอนตี 5 
    //     await alert_valid(msg_alert);
    // }
}

async function build_modal_force_remark(type, name, process, process_name, id) {
    let body = $(`div.modal#${name} div.modal-body`)
    let placeholder_remark = 'ข้อมูลเพิ่มเติมของขั้นตอนที่ผ่านมา'
    body.html("")
    switch (type) {
        case 1:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <h4>${process_name}</h4>
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">สาเหตุ</span></td>
                                    <td><input type="text" class="form-control" id="item-remark" placeholder="${placeholder_remark}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">วิธีแก้ไข</span></td>
                                    <td><input type="text" class="form-control" id="item-solution"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)
            break;
        case 2:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ปัญหา</span></td>
                                    <td><input type="text" class="form-control" id="item-problem" placeholder="${process_name}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">สาเหตุ</span></td>
                                    <td><input type="text" class="form-control" id="item-remark" placeholder="${placeholder_remark}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">วิธีแก้ไข</span></td>
                                    <td><input type="text" class="form-control" id="item-solution"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)
            break;
        case 3:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <h4>${process_name}</h4>
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">สาเหตุ</span></td>
                                    <td><input type="text" class="form-control" id="item-remark" placeholder="${placeholder_remark}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)
            break;
        case 4:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <h4>${process_name}</h4>
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">พิมพ์ไปแล้ว</span></td>
                                    <td><input type="text" class="form-control" id="item-printed" oninput="set_input_numeric(this)" placeholder="ใส่จำนวนตัวเลข"></td>
                                    <td><span class="align-middle">ใบพิมพ์</span></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                    <td><span class="align-middle"></span></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)
            break;
        case 5:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">การรอ</span></td>
                                    <td><input type="text" class="form-control" id="item-waiting" placeholder="${process_name}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">สาเหตุ</span></td>
                                    <td><input type="text" class="form-control" id="item-remark" placeholder="${placeholder_remark}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)
            break;
        case 6:
            body.html(`<table class="table table-borderless" id="type-${type}">
                            <h4>${process_name}</h4>
                            <tbody>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">หน่วยงานที่ไป</span></td>
                                    <td>
                                        <input type="text" class="form-control" id="item-department-helped">
                                        <input type="text" class="form-control" id="department_id" hidden>
                                        <div id="dep-suggesstion-box"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">เครื่องจักรที่ไป</span></td>
                                    <td>
                                        <input type="text" class="form-control" id="item-machine-helped">
                                        <input type="text" class="form-control" id="machine_id" hidden>
                                        <div id="mac-suggesstion-box"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">สาเหตุ</span></td>
                                    <td><input type="text" class="form-control" id="item-remark" placeholder="${placeholder_remark}"></td>
                                </tr>
                                <tr>
                                    <td><span class="text-danger">*</span><span class="align-middle">ผู้บันทึก</span></td>
                                    <td><select name="worker-update" id="" class="form-control">
                                        <option value="none" disabled><--เลือก--></option>
                                    </select></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-success btn-save" onclick="save_timesheet_item('${name}', ${type}, '${id}')">บันทึก</button>`)

            $("div#dep-suggesstion-box").hide()
            $("input#item-department-helped").focus(async () => {
                $("div#mac-suggesstion-box").hide()
                await get_department($("input#item-department-helped").val(), '#dep-suggesstion-box')
            })

            $("input#item-department-helped").keyup(async () => {
                await get_department($("input#item-department-helped").val(), '#dep-suggesstion-box')
            })

            $("input#item-department-helped").change(async () => {
                $(`table#type-6 input#machine_id`).val("")
                $(`table#type-6 input#item-machine-helped`).val("")
            })

            $("div#mac-suggesstion-box").hide()
            $("input#item-machine-helped").focus(async () => {
                $("div#dep-suggesstion-box").hide()
                await get_machine_by_dep($("input#item-machine-helped").val(), '#mac-suggesstion-box')
            })

            $("input#item-machine-helped").keyup(async () => {
                await get_machine_by_dep($("input#item-machine-helped").val(), '#mac-suggesstion-box')
            })
            break;

    }
    $.each(worker, function (index, value) {
        $('select[name="worker-update"]').append(`<option id="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
    });
}

async function set_datetime_limit_color() {
    let body = $("div.ok-limit-color-body table tbody")
    var now = new Date();
    var y_str = now.getFullYear();
    var m_str = now.getMonth() + 1;
    var d_str = String(now.getDate()).padStart(2, '0');
    var hh_str = String(now.getHours()).padStart(2, '0');
    var mm_str = String(now.getMinutes()).padStart(2, '0');

    var time_str = hh_str + ":" + mm_str;
    var today = d_str + "/" + m_str + "/" + y_str;
    body.find("input#date").val(today)
    body.find("input#time").val(time_str)
}

async function build_modal_limit_color(limit_color, worker) {
    let body = $("div.ok-limit-color-body table tbody")
    body.find("input#machine").val(`(${limit_color.detail.machine_id}) ${limit_color.detail.machine_name}`)
    body.find("input#jobid").val(`(${limit_color.detail.jobid}) ${limit_color.detail.job_name === null || limit_color.detail.job_name === "" ? "" : limit_color.detail.job_name}`)

    $.each(limit_color.part, function (index, value) {
        body.find("select[name='part']").append(`<option id="${value.itid}">${value.partName}</option>`)
    });

    $.each(leader, function (index, value) {
        body.find("select[name='leader']").append(`<option id="${value.leader_id}">${value.leader_name}</option>`)
    });

    $.each(worker, function (index, value) {
        body.find("select[name='worker']").append(`<option id="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
    });
}

async function valid_value(el, val) {
    if (val !== "" && !$(el).hasClass('is-valid')) {
        if ($(el).hasClass('is-invalid')) {
            $(el).removeClass('is-invalid')
        }
        $(el).addClass('is-valid')
    }
}

async function set_value(element) {
    switch (element.dataset.liType) {
        case 'machine':
            $(`table#type-6 input#item-machine-helped`).focus()
            $(`table#type-6 input#machine_id`).val(element.id)
            $(`table#type-6 input#item-machine-helped`).val(`${element.id} ${element.dataset.liMachineName}`)
            $(`table#type-6 input#department_id`).val(element.dataset.liDepartmentId)
            $(`table#type-6 input#item-department-helped`).val(element.dataset.liDepartmentName)
            $(`table#type-6 div#mac-suggesstion-box`).hide()
            break
        case 'department':
            $(`table#type-6 input#department_id`).val(element.id)
            $(`table#type-6 input#item-department-helped`).val(element.dataset.liDepartmentName)
            $(`table#type-6 div#dep-suggesstion-box`).hide()
    }
}

async function save_timesheet_item(name, type, id) {
    let emp_id = $(`table#type-${type} select[name="worker-update"]`).find(":selected").attr('id')
    if (emp_id === undefined) {
        await alert_valid('กรุณาเลือกผู้บันทึก')
        return
    }
    let obj = {}
    switch (type) {
        case 1:
            obj = {
                type: type,
                id: id,
                remark: ($(`table#type-${type} input#item-remark`).val()).replace(/'/g, "''"),
                solution: ($(`table#type-${type} input#item-solution`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }

            if (obj.remark === '') {
                await alert_valid('กรุณาระบุสาเหตุ')
                return
            } else if (obj.solution === '') {
                await alert_valid('กรุณาระบุแนวทางแก้ไข')
                return
            }
            break
        case 2:
            obj = {
                type: type,
                id: id,
                problem: ($(`table#type-${type} input#item-problem`).val()).replace(/'/g, "''"),
                remark: ($(`table#type-${type} input#item-remark`).val()).replace(/'/g, "''"),
                solution: ($(`table#type-${type} input#item-solution`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }

            if (obj.problem === '') {
                await alert_valid('กรุณาระบุปัญหา')
                return
            } else if (obj.remark === '') {
                await alert_valid('กรุณาระบุสาเหตุ')
                return
            } else if (obj.solution === '') {
                await alert_valid('กรุณาระบุแนวทางแก้ไข')
                return
            }
            break
        case 3:
            obj = {
                type: type,
                id: id,
                remark: ($(`table#type-${type} input#item-remark`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }

            if (obj.remark === '') {
                await alert_valid('กรุณาระบุสาเหตุ')
                return
            }
            break
        case 4:
            obj = {
                type: type,
                id: id,
                printed: ($(`table#type-${type} input#item-printed`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }
            if (obj.printed === '') {
                await alert_valid('กรุณาระบุจำนวนที่พิมพ์ไปแล้ว')
                return
            }
            break
        case 5:
            obj = {
                type: type,
                id: id,
                waiting: ($(`table#type-${type} input#item-waiting`).val()).replace(/'/g, "''"),
                remark: ($(`table#type-${type} input#item-remark`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }

            if (obj.waiting === '') {
                await alert_valid('กรุณาระบุการรอ')
                return
            } else if (obj.remark === '') {
                await alert_valid('กรุณาระบุสาเหตุ')
                return
            }

            break
        case 6:
            obj = {
                type: type,
                id: id,
                machine: ($(`table#type-${type} input#machine_id`).val()).replace(/'/g, "''"),
                // costcenter: $(`table#type-${type} input#department_id`).val(),
                department: ($(`table#type-${type} input#department_id`).val()).replace(/'/g, "''"),
                remark: ($(`table#type-${type} input#item-remark`).val()).replace(/'/g, "''"),
                emp_id: emp_id
            }

            if (obj.machine === '') {
                await alert_valid('กรุณาระบุเครื่องจักรที่ไปช่วย')
                return
            } else if (obj.department === '') {
                await alert_valid('กรุณาระบุหน่วยงานที่ไปช่วย')
                return
            } else if (obj.remark === '') {
                await alert_valid('กรุณาระบุสาเหตุ')
                return
            }
            break
    }

    await update_timesheet_item(name, obj)
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

async function reset_modal_maintenance() {
    $(`.nav-tabs a[href="#edit"]`).tab('show')
    $(`.nav-tabs a[href="#edit"]`).closest('li').show()
    $("input.machine-name").val(`${machine_id} ${machine_name}`)

    $(`label[name='status-id']`).removeClass('active')
    $('input[name="status-id"]').prop('checked', false)
    $('table.table-edit tbody tr td.text-left input[type="text"]').val("")
    $('table.table-edit tbody tr td select[name="worker"]').prop("selectedIndex", 0)
    $('table.table-edit tbody tr td select[name="checklist"]').prop("selectedIndex", 0)
    $('table.table-edit #solution').val("")

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
    await build_modal_maintenance(global_data.worker, global_data.problem, global_data.checklist)
}

async function build_modal_maintenance(worker, problem, checklist) {
    $("input.machine-name").val(`${machine_id} ${machine_name}`)
    $("table.table-repair input.date-text").val((new Date()).toISOString().split('T')[0])

    $('table.table-edit select[name="worker"]').html("")
    $('table.table-repair select[name="worker"]').html("")
    $('table.table-repair select[name="worker"]').append(`<option value="none" id="" disabled><--เลือก--></option>`)
    $('table.table-edit select[name="worker"]').append(`<option value="none" id="" disabled><--เลือก--></option>`)
    $.each(worker, function (index, value) {
        $('table.table-repair select[name="worker"]').append(`<option id="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
        $('table.table-edit select[name="worker"]').append(`<option id="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
    });
    $('table.table-repair tbody tr td select[name="worker"]').prop("selectedIndex", 0)
    $('table.table-edit tbody tr td select[name="worker"]').prop("selectedIndex", 0)

    $('table.table-repair select[name="problem"]').html("")
    $('table.table-repair select[name="problem"]').append(`<option value="none" id="" disabled><--เลือก--></option>`)
    $.each(problem, function (index, value) {
        $('table.table-repair select[name="problem"]').append(`<option id="${value.problem_id}">${value.problem_name}</option>`)
    });
    $('table.table-repair tbody tr td select[name="problem"]').prop("selectedIndex", 0)

    $('table.table-repair select[name="checklist"]').html("") // reset checklist
    $('table.table-repair select[name="checklist"]').append(`<option value="none" id="" disabled><--เลือก--></option>`)
    $.each(checklist, function (index, value) {
        $('table.table-repair select[name="checklist"]').append(`<option id="${value.checklist_type_id}">${value.topic_name}</option>`)
    })
}

async function set_active(el) {
    $(`label[name='${el.attributes.name.value}']`).removeClass('active')
    $(el).addClass('active')
}

async function set_active_tr(tr, ma_id) {
    $("div.tab-pane#repair-again div table tbody tr").removeClass('active')
    $(tr).addClass('active')
}

async function set_active_tab(tab) {
    $(`.nav-tabs a[href="#${tab}"]`).tab('show')
    $(`.nav-tabs a[href="#${tab}"]`).closest('li').show()
}

async function set_tab_hide(tab) {
    $(`.nav-tabs a[href="#${tab}"]`).closest('li').hide()
}

async function check_maintenance_input(type) {
    let obj = {}
    let obj_warning = {}
    switch (type) {
        case 1:
            if (type_id === 35 || type_id === 52 || type_id === 36) {
                let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
                let emp_id = $('table.table-repair select[name="worker"]').find(':selected')[0].id === '' ? 0 : $('table.table-repair select[name="worker"]').find(':selected')[0].id
                let call_number = $('table.table-repair input.call-number').val() === '' ? 0 : $('table.table-repair input.call-number').val()
                let location = $('table.table-repair input.location-machine').val() === '' ? 0 : $('table.table-repair input.location-machine').val()
                let machine_status_id = $(`table.table-repair input[name="status-id"]:checked`).val()
                let process_status_id = $('table.table-repair select[name="process_status_machine"]').find(':selected')[0].value
                let problem_id = $('table.table-repair select[name="problem"]').find(':selected')[0].value === 'none' ? undefined : $('table.table-repair select[name="problem"]').find(':selected')[0].id
                let remark = $('table.table-repair #repair_textarea').val() === '' ? 0 : $('table.table-repair #repair_textarea').val()
                let topic_checklist = ""
                if (!$('table.table-repair select[name="checklist"]').is(":hidden")) {
                    topic_checklist = $('table.table-repair select[name="checklist"]').find(':selected')[0].value === 'none' ? "" : $('table.table-repair select[name="checklist"]').find(':selected')[0].id
                }

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

                if (!$('table.table-repair select[name="checklist"]').is(":hidden") && topic_checklist === "") {
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
                    call_number: call_number.replace(/'/g, "''"),
                    need_date: date,
                    machine_id: machine_id,
                    machine_status_id: machine_status_id,
                    process_status_id: process_status_id,
                    problem_id: problem_id,
                    ma_type_id: 1,
                    ma_remark: remark.replace(/'/g, "''"),
                    ma_location: location.replace(/'/g, "''")
                }

                if (!$('table.table-repair select[name="checklist"]').is(":hidden")) {
                    obj_warning = {
                        checklist_type_id: topic_checklist,
                        machine_id: machine_id,
                        cause_problem: remark,
                        solution: "",
                        emp_id: emp_id,
                        jobid: jobid,
                        shift_id: shift_id,
                        plan_id: plan_id,
                        header_id: header_id
                    }
                }
            }
            console.log(obj);
            if (obj_warning.checklist_type_id !== "" && obj_warning.checklist_type_id !== undefined) {
                await insert_ma_request(obj, 'checklist')
                await insert_checklist_warning_with_ma(obj_warning)

                // console.log(obj_warning.checklist_type_id);
                $(`div.modal#sup-check-color div.modal-body input#${obj_warning.checklist_type_id}`).prop("checked", false);
                $(`div.modal#sup-check-color div.modal-body input#${obj_warning.checklist_type_id}`).prop("disabled", true);
            } else {
                await insert_ma_request(obj)
            }

            break
        case 2:
            let remark = $(`table#table-edit input.remark`).val()
            let solution = $(`table#table-edit textarea#solution`).val()
            let topic_checklist = $('table#table-edit select[name="checklist"]').find(':selected')[0].value === 'none' ? "" : $('table#table-edit select[name="checklist"]').find(':selected')[0].id
            let emp_id = $('table#table-edit select[name="worker"]').find(':selected')[0].value === 'none' ? "" : $('table#table-edit select[name="worker"]').find(':selected')[0].id

            if (topic_checklist === "") {
                await alert_valid('กรุณาเลือกหัวข้อที่พบสิ่งผิดปกติ')
                return
            } else if (remark === "") {
                await alert_valid('กรุณากรอกสาเหตุ')
                return
            } else if (solution === "") {
                await alert_valid('กรุณากรอกวิธีแก้ไข')
                return
            } else if (emp_id === "") {
                await alert_valid('กรุณาเลือกชื่อผู้แก้ไข')
                return
            }

            obj = {
                checklist_type_id: topic_checklist,
                machine_id: machine_id,
                cause_problem: remark.replace(/'/g, "''"),
                solution: solution.replace(/'/g, "''"),
                emp_id: emp_id,
                jobid: jobid,
                shift_id: shift_id,
                plan_id: plan_id,
                header_id: header_id
            }

            await insert_checklist_warning(obj)
            if (isSup === 1) {
                $(`div.modal#sup-check-color div.modal-body input#${obj.checklist_type_id}`).prop("checked", false);
                $(`div.modal#sup-check-color div.modal-body input#${obj.checklist_type_id}`).prop("disabled", true);
                isSup = 0
            }

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

async function density_suggest(e, name, type) {
    e.value = e.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    if (!isNaN(parseFloat(e.value)) && type === 1) {
        var low_val = parseFloat(e.value) - 0.10;
        var up_val = parseFloat(e.value) + 0.10;

        var spanlow = document.getElementById(`${name}-lowstd`);
        spanlow.innerHTML = (low_val).toFixed(2);

        var spanup = document.getElementById(`${name}-upstd`);
        spanup.innerHTML = (up_val).toFixed(2);
    } else if (type === 1) {
        var spanlow = document.getElementById(`${name}-lowstd`);
        spanlow.innerHTML = '';

        var spanup = document.getElementById(`${name}-upstd`);
        spanup.innerHTML = '';
    }
}

async function set_dot(e, name, type) {
    if (e.value.length === 1 && event.key !== "Backspace") {
        $(e).val($(e).val() + '.')
    } else if (e.value.length === 1 && event.key === "Backspace") {
        $(e).val("")
    }

    if (e.value.length === 0 && type === 1) {
        var spanlow = document.getElementById(`${name}-lowstd`);
        spanlow.innerHTML = '';

        var spanup = document.getElementById(`${name}-upstd`);
        spanup.innerHTML = '';
    }
}

async function density_light_getdata(rowpos) {
    if ($(`#${rowpos}-light`).val() === '') {
        var span_low = document.getElementById(`${rowpos}-lowstd`);
        $(`#${rowpos}-light`).val(span_low.innerHTML);
        $(`#${rowpos}-light`).select();
    }
}

async function density_dark_getdata(rowpos) {
    if ($(`#${rowpos}-dark`).val() === '') {
        var span_up = document.getElementById(`${rowpos}-upstd`);
        $(`#${rowpos}-dark`).val(span_up.innerHTML);
        $(`#${rowpos}-dark`).select();
    }
}

async function save_ok_limit_color() {
    const body = $("div.ok-limit-color-body table tbody")
    let status_check = true
    if (body.find("select[name='part'] option:selected").val() === "") {
        status_check = false
        body.find("select[name='part']").addClass('is-invalid')
    } else {
        body.find("select[name='part']").addClass('is-valid')
    }

    if (body.find("select[name='worker'] option:selected").val() === "") {
        status_check = false
        body.find("select[name='worker']").addClass('is-invalid')
    } else {
        body.find("select[name='worker']").addClass('is-valid')
    }

    if (body.find("select[name='leader'] option:selected").val() === "") {
        status_check = false
        body.find("select[name='leader']").addClass('is-invalid')
    } else {
        body.find("select[name='leader']").addClass('is-valid')
    }

    if (status_check === false) {
        return
    }

    let part_id = body.find("select[name='part'] option:selected")[0].id
    let part_name = body.find("select[name='part'] option:selected")[0].innerHTML
    body.find("select[name='part']").removeClass('is-invalid')
    body.find("select[name='part']").addClass('is-valid')
    // console.log(body.find("select[name='part'] option:selected")[0].id);

    let emp_id = body.find("select[name='worker'] option:selected")[0].id
    let emp_name = body.find("select[name='worker'] option:selected")[0].innerHTML
    body.find("select[name='worker']").removeClass('is-invalid')
    body.find("select[name='worker']").addClass('is-valid')

    let leader_id = body.find("select[name='leader'] option:selected")[0].id
    let leader_name = body.find("select[name='leader'] option:selected")[0].innerHTML
    body.find("select[name='leader']").removeClass('is-invalid')
    body.find("select[name='leader']").addClass('is-valid')

    let str_job_name = job_name === null || job_name === "" ? "" : job_name
    // console.log(job_name.indexOf('\''));
    if (job_name.indexOf('\'') >= 0) {
        str_job_name = job_name.replace(/'/g, "''")
    }

    const obj = {
        type_id: type_id,
        header_id: header_id,
        machine_id: machine_id,
        machine_name, machine_name,
        plan_id: plan_id,
        jobid: jobid,
        job_name: str_job_name,
        part_id: part_id,
        part_name: part_name,
        leader_id: leader_id,
        leader_name: leader_name,
        emp_id: emp_id,
        emp_name: emp_name,
        remark: body.find("input#remark").val(),
        k_light: body.find("input#k-light").val() === "" ? 0 : body.find("input#k-light").val(),
        c_light: body.find("input#c-light").val() === "" ? 0 : body.find("input#c-light").val(),
        m_light: body.find("input#m-light").val() === "" ? 0 : body.find("input#m-light").val(),
        y_light: body.find("input#y-light").val() === "" ? 0 : body.find("input#y-light").val(),
        k_standard: body.find("input#y-standard").val() === "" ? 0 : body.find("input#y-standard").val(),
        c_standard: body.find("input#y-standard").val() === "" ? 0 : body.find("input#y-standard").val(),
        m_standard: body.find("input#y-standard").val() === "" ? 0 : body.find("input#y-standard").val(),
        y_standard: body.find("input#y-standard").val() === "" ? 0 : body.find("input#y-standard").val(),
        k_dark: body.find("input#y-dark").val() === "" ? 0 : body.find("input#y-dark").val(),
        c_dark: body.find("input#y-dark").val() === "" ? 0 : body.find("input#y-dark").val(),
        m_dark: body.find("input#y-dark").val() === "" ? 0 : body.find("input#y-dark").val(),
        y_dark: body.find("input#y-dark").val() === "" ? 0 : body.find("input#y-dark").val(),
        sp1_light: body.find("input#sp1-light").val() === "" ? 0 : body.find("input#sp1-light").val(),
        sp2_light: body.find("input#sp2-light").val() === "" ? 0 : body.find("input#sp2-light").val(),
        sp3_light: body.find("input#sp3-light").val() === "" ? 0 : body.find("input#sp3-light").val(),
        sp4_light: body.find("input#sp4-light").val() === "" ? 0 : body.find("input#sp4-light").val(),
        sp1_standard: body.find("input#sp1-standard").val() === "" ? 0 : body.find("input#sp1-standard").val(),
        sp2_standard: body.find("input#sp2-standard").val() === "" ? 0 : body.find("input#sp2-standard").val(),
        sp3_standard: body.find("input#sp3-standard").val() === "" ? 0 : body.find("input#sp3-standard").val(),
        sp4_standard: body.find("input#sp4-standard").val() === "" ? 0 : body.find("input#sp4-standard").val(),
        sp1_dark: body.find("input#sp1-dark").val() === "" ? 0 : body.find("input#sp1-dark").val(),
        sp2_dark: body.find("input#sp2-dark").val() === "" ? 0 : body.find("input#sp2-dark").val(),
        sp3_dark: body.find("input#sp3-dark").val() === "" ? 0 : body.find("input#sp3-dark").val(),
        sp4_dark: body.find("input#sp4-dark").val() === "" ? 0 : body.find("input#sp4-dark").val(),
    }
    // console.log(obj);
    await insert_oklimit_color(obj)
}

async function cancel_timesheet(el, header_id) {
    const url = `${window.location.origin}${window.location.pathname}/${type_id}`
    await alert_delete_timesheet(header_id, url)
}

async function confirm_end_timesheet(header_id) {
    let lasttr = $("table.table#process-history tbody tr").last()
    if (lasttr.length !== 0 && (parseInt(lasttr[0].dataset.forceRemark) !== 0 || parseInt(lasttr[0].dataset.insertQty) !== 0)) {
        let lastproc = lasttr[0].dataset.process
        let procname = lasttr[0].dataset.processName
        //เช็คว่าเป็น force_remark ที่อยากให้แสดงก่อนกดเปลี่ยน process หรือไม่
        let promise_force_remark = new Promise(async (resolve, reject) => {
            if (parseInt(lasttr[0].dataset.insertQty) !== 1 && lastproc !== 'N3' && lastproc !== 'N') {
                await build_modal_force_remark(parseInt(lasttr[0].dataset.forceRemark), 'force-remark', lastproc, procname, lasttr[0].id)
                $("div.modal#force-remark").modal("show")
                $('div.modal#force-remark select[name="worker-update"]').prop("selectedIndex", 0)
                $("div.modal#force-remark").on('hidden.bs.modal', async function () {
                    resolve()
                })
            } else if (parseInt(lasttr[0].dataset.insertQty) === 1) {
                let lastid = lasttr[0].id
                no_duprunning = false
                await open_insert_qty(lastid)
                $("div.modal-footer button.save-insert-qty").click(() => {
                    $("div.modal#insert-qty").modal("hide")
                    resolve()
                })
            } else {
                resolve()
            }
        })

        promise_force_remark.then(async () => {
            if (type_id === 52 || type_id === 36) {
                let promise_post_work = new Promise(async (resolve2, reject2) => {
                    await view_checklist(15)
                    $("div.modal#checklist-qc").on('hidden.bs.modal', async function () {
                        resolve2()
                    })
                })
                promise_post_work.then(async () => {
                    await setting_end_timesheet(lasttr[0].id, header_id, 0, null, lasttr.length)
                })
            } else {
                await setting_end_timesheet(lasttr[0].id, header_id, 0, null, lasttr.length)
            }
        })

    } else {
        if (type_id === 52 || type_id === 36) {
            await view_checklist(15)
            let promise_post_work = new Promise(async (resolve2, reject2) => {
                await view_checklist(15)
                $("div.modal#checklist-qc").on('hidden.bs.modal', async function () {
                    resolve2()
                })
            })
            promise_post_work.then(async () => {
                await setting_end_timesheet(lasttr[0] === undefined ? 0 : lasttr[0].id, header_id, 0, null, lasttr.length)
            })
        } else {
            await setting_end_timesheet(lasttr[0] === undefined ? 0 : lasttr[0].id, header_id, 0, null, lasttr.length)
        }

    }
}

async function setting_end_timesheet(item_id, header_id, end_type, remark, item_length) {
    // console.log(item_length);
    let endtime = await format_datetime(new Date())
    let obj = {
        item_id,
        header_id,
        end_type,
        remark,
        endtime
    }
    await update_end_timesheet(obj).then(async () => {
        console.log(1);
        await calc_qty()
        await state_end_timesheet()
        if (item_length !== 0) {
            console.log(2);
            $("div#modal_ink_usage").modal({
                keyboard: false
            })
        }
    })

}

async function end_timesheet(e, header_id) {
    await alert_end_timesheet('จบงาน - เลือกงานใหม่', confirm_end_timesheet)
}

async function confirm_end_timesheet_with_problem(header_id) {
    let lasttr = $("table.table#process-history tbody tr").last()
    if (lasttr.length !== 0 && (parseInt(lasttr[0].dataset.forceRemark) !== 0 || parseInt(lasttr[0].dataset.insertQty) !== 0)) {

        let lastproc = lasttr[0].dataset.process
        let procname = lasttr[0].dataset.processName
        //เช็คว่าเป็น force_remark ที่อยากให้แสดงก่อนกดเปลี่ยน process หรือไม่
        let promise_force_remark = new Promise(async (resolve, reject) => {
            if (parseInt(lasttr[0].dataset.insertQty) !== 1 && lastproc !== 'N3' && lastproc !== 'N') {
                await build_modal_force_remark(parseInt(lasttr[0].dataset.forceRemark), 'force-remark', lastproc, procname, lasttr[0].id)
                $("div.modal#force-remark").modal("show")
                $('div.modal#force-remark select[name="worker-update"]').prop("selectedIndex", 0)
                $("div.modal#force-remark").on('hidden.bs.modal', async function () {
                    resolve()
                })
            } else if (parseInt(lasttr[0].dataset.insertQty) === 1) {
                let lastid = lasttr[0].id
                no_duprunning = false
                await open_insert_qty(lastid)
                $("div.modal-footer button.save-insert-qty").click(() => {
                    $("div.modal#insert-qty").modal("hide")
                    resolve()
                })
            } else {
                resolve()
            }
        })
        //ปิด popup ก่อนหน้า เช็คว่าปุ่มล่าสุดที่กดเป็นส่งซ่อมหรือไม่
        promise_force_remark.then(async () => {
            if (type_id === 52 || type_id === 36) {
                await view_checklist(15)
                let promise_post_work = new Promise(async (resolve2, reject2) => {
                    await view_checklist(15)
                    $("div.modal#checklist-qc").on('hidden.bs.modal', async function () {
                        resolve2()
                    })
                })
                promise_post_work.then(async () => {
                    await show_maintenance_modal()
                    let promise_mainten = new Promise((resolve2, reject2) => {
                        $("div.modal#maintenance").on('hidden.bs.modal', async function () {
                            resolve2()
                        })
                    })
                    promise_mainten.then(async () => {
                        await setting_end_timesheet(lasttr[0].id, header_id, 1, null, lasttr.length)
                    })
                })
            } else {
                await show_maintenance_modal()
                let promise_mainten = new Promise((resolve2, reject2) => {
                    $("div.modal#maintenance").on('hidden.bs.modal', async function () {
                        resolve2()
                    })
                })
                promise_mainten.then(async () => {
                    await setting_end_timesheet(lasttr[0].id, header_id, 1, null, lasttr.length)
                })
            }

        })

    } else {

        if (type_id === 52 || type_id === 36) {
            await view_checklist(15)
            let promise_post_work = new Promise(async (resolve2, reject2) => {
                await view_checklist(15)
                $("div.modal#checklist-qc").on('hidden.bs.modal', async function () {
                    resolve2()
                })
            })
            promise_post_work.then(async () => {
                await show_maintenance_modal()
                let promise_mainten = new Promise((resolve2, reject2) => {
                    $("div.modal#maintenance").on('hidden.bs.modal', async function () {
                        resolve2()
                    })
                })
                promise_mainten.then(async () => {
                    await setting_end_timesheet(lasttr[0] === undefined ? 0 : lasttr[0].id, header_id, 1, null, lasttr.length)
                })
            })
        } else {
            await show_maintenance_modal()
            let promise_mainten = new Promise((resolve2, reject2) => {
                $("div.modal#maintenance").on('hidden.bs.modal', async function () {
                    resolve2()
                })
            })
            promise_mainten.then(async () => {
                await setting_end_timesheet(lasttr[0] === undefined ? 0 : lasttr[0].id, header_id, 1, null, lasttr.length)
            })
        }
    }
}

async function show_maintenance_modal() {
    await reset_modal_maintenance()
    await set_tab_hide('edit')
    await set_active_tab('repair')
    $("table.table-repair.table-left tbody tr").last().prop('hidden', true)
    $("div.modal#maintenance").modal({
        keyboard: false
    })
}

async function end_timesheet_with_problem(e, header_id) {
    await alert_end_timesheet('จบงานเนื่องจากมีปัญหา', confirm_end_timesheet_with_problem)
}

async function state_end_timesheet(type = 1) {
    url = `${window.location.origin}${window.location.pathname}/${type_id}`
    $(`div.timesheet-left-box`).html("")
    $(`div.timesheet-left-box`).html(`<h1 class="text-center">กรุณาตรวจสอบข้อมูลยอดผลิต<br>หากไม่ถูกต้อง กรุณาแตะที่ตัวเลขยอดผลิตเพื่อแก้ไข</h1>`)
    const body_r = $(`div.timesheet-right-box div.timesheet-btn-right`)
    $(`div.timesheet-right-box div.timesheet-current-process`).hide()
    $('button#cancel_timesheet').hide()
    $(`div.timesheet-right-box div.div-btn-back`).removeAttr('hidden')
    $(`button#back-to-timesheet`).attr('onclick', `back_to_timesheet('${url}')`)

    if (type === 0 || type === '0') {
        // console.log($(`div.history-body table#process-history tbody tr[data-process="R"] td:eq(1)`));
        let tr = $(`div.history-body table#process-history tbody tr[data-process="R"]`)
        $.each(tr, function (index, value) {
            $(value).find("td:eq(1)").text("R วิ่งงาน")
        });
        $(`div.history-body table#process-history tbody tr`).css('cursor', 'not-allowed')
        $(`table.table#process-history tbody tr[data-process="R"]`).attr("onclick", "").unbind("click")
        $(`div.timesheet-left-box`).html(`<h1 class="text-center"></h1>`)
    }

    body_r.find('div.ot-request-box').hide()
    body_r.find('div.pallet-box').hide()
    body_r.find('div.end-timesheet-box').hide()

    if ($("div.view-checklist-box button").length > 0) {
        if (machine_id !== '7001' && machine_id !== '7002') {
            $("div.view-checklist-box").prop('hidden', false)
        }
    }
    is_end = 0
}

async function back_to_timesheet(url) {
    console.log(url, machine_id, type_id);
    window.location.href = url
    // window.location.href = url + '?machine_id=' + machine_id
    // window.location.href = document.referrer
}

async function build_modal_ink_usage(header_planning) {
    // console.log(header_planning);
    $.each(header_planning, function (index, item) {
        if (index === 0) {
            $("#ink-sig1").attr("data-header-planning", item.id)
        } else if (index === 1) {
            $("#ink-sig2").attr("data-header-planning", item.id)
            $("#ink-sig2").removeAttr('hidden')
        }
        let text = `กรอบ ${item.sum_sig} เลือกสีที่พิมพ์`
        $(`div#ink-sig${++index} div.ink-container-top span`).text(text)
    });
}

async function toggle_ink_special(e) {
    let text = $(e).attr('for')
    let id = $(`#${text}`)
    if (id[0].checked) {
        $(e).removeClass('active')
    } else {
        $(e).addClass('active')
    }
}

async function toggle_coating(e) {
    let text = $(e).attr('for')
    let id = $(`input#${text}`)

    if (id[0].checked) {
        $(e).removeClass('active')
    } else {
        $('label.coating-usage').removeClass('active')
        $('input.coating-usage').prop("checked", false)
        $(e).addClass('active')
    }
}

async function add_sp_ink(e) {
    let div = $(e).parent().parent()
    // console.log(div[0].id);
    let div_add_ink = $(`.div-add-ink`).length
    let id = `div-add-ink${++div_add_ink}`
    let input = `<div id="${id}" class="div-add-ink text-center">  
                        <input type="text" class="ink-usage-test" placeholder="เพิ่มสี..."/>
                        <button class="btn-ok-ink btn-lg btn-success" onclick="set_special_ink('${id}','ok','${div[0].id}')">✓</button>
                        <button class="btn-reject-ink btn-lg btn-danger" onclick="set_special_ink('${id}','reject')">𝘟</button>
                    </div>`
    div.append(input)
}

async function set_special_ink(item, type, where) {
    // console.log($(`#${item}`), type);
    switch (type) {
        case 'reject':
            $(`#${item}`).remove()
            break;
        case 'ok':
            let str = $(`#${item}`).find('input').val()
            if (str != "") {
                let input = `   <input type="checkbox" id="ink-usage-${str}" value="${str}" class="ink-usage" hidden/>
                            <label class="ink-usage" for="ink-usage-${str}" onclick="toggle_ink_special(this)">${str}</label>`
                let div = $(`#${where}`).find('div.ink-container-button')
                div.append(input)
            }
            $(`#${item}`).remove()
            break;
    }
}

async function save_ink_usage() {
    let header_material = await get_header_material()
    console.log(header_material);
    let result = true

    if (header_material.sig1.ink_usage.length < 1) {
        result = false
    }

    if (header_material.coating.ink_usage_coating === undefined) {
        header_material.coating.ink_usage_coating = ""
    }

    if (header_material.sig2 !== null) {
        if (header_material.sig2.ink_usage.length < 1) {
            result = false
        }
    }

    if (result) {
        await insert_ink_usage(header_material)
    } else {
        await alert_valid('กรุณาเลือกสีที่พิมพ์ ก่อนกดบันทึก')
    }


}

async function get_header_material() {
    let header_material_1 = {}
    let header_material_2 = null
    let header_material_coating = {}

    let header_planning_1 = $('#ink-sig1').attr('data-header-planning')
    let array_sig1 = $('#ink-sig1 .ink-container-button .ink-usage:checkbox:checked').map((index, item) => {
        return $(item).val()
    }).toArray()

    header_material_1 = {
        header: header_id,
        header_planning_id: header_planning_1,
        ink_usage: array_sig1,
    }

    if (!$("div#ink-sig2").is(":hidden")) { // ถ้ามี header planning > 1
        let array_sig2 = $('#ink-sig2 .ink-container-button .ink-usage:checkbox:checked').map((index, item) => {
            return $(item).val()
        }).toArray()
        let header_planning_2 = $('#ink-sig2').attr('data-header-planning')
        header_material_2 = {
            header: header_id,
            header_planning_id: header_planning_2,
            ink_usage: array_sig2,
        }
    }

    let coating = $('div#coating .coating-button input.coating-usage:checkbox:checked').val()
    if (coating === 'Waterbase' || coating === 'Varnish') {
        coating = coating.toLowerCase()
    }
    if (coating != '') {
        header_material_coating = {
            header: header_id,
            ink_usage_coating: coating,
        }
    }

    let header_material = {
        header_id: header_id,
        sig1: header_material_1,
        sig2: header_material_2,
        coating: header_material_coating
    }
    return header_material
}

async function open_modal_maintenance_sup() {
    await reset_modal_maintenance()
    $("table.table-repair.table-left tbody tr").last().removeAttr('hidden') // ให้ checklist show ในเคสแจ้งซ่อมผ่าน sup ตรวจสอบสี
    let checklist_sup = await get_checklist_sup()
    let select = $('table.table-repair.table-left tbody tr select[name="checklist"]')
    let select2 = $('table.table-edit tbody tr select[name="checklist"]')
    select.html("") // reset checklist
    select.append(`<option value="none" id="" disabled><--เลือก--></option>`)
    select2.html("")
    select2.append(`<option value="none" id="" disabled><--เลือก--></option>`)
    $.each(checklist_sup, function (index, value) {
        select.append(`<option id="${value.checklist_type_id}">(${value.topic}) ${value.topic_name}</option>`)
        select2.append(`<option id="${value.checklist_type_id}">(${value.topic}) ${value.topic_name}</option>`)
    })

    select.val(select.find('option:first-child').val())
    select2.val(select.find('option:first-child').val())
    await set_active_tab('edit')
    $("div.modal#maintenance").modal("show")
}

async function build_modal_request_ot(data) {
    let shift = ''

    if (data.shift_id === 1) {
        shift = 'กลางวัน'
    } else if (data.shift_id === 2) {
        shift = 'กลางคืน'
    }

    let str = `             <h3 id="title-ot" class="text-warning"></h3>
                            <table class="table table-borderless" id="table-request-ot">
                                <tbody>
                                    <tr>
                                        <td class="col-4 text-right">เครื่อง:</td>
                                        <td class="text-left"><input id="machine_id" type="text" class="control-input disabled" value="${data.machine_id} ${data.machine_name}" readonly/></td>
                                    </tr>
                                    <tr>
                                        <td class="col-4  text-right">วันที่:</td>
                                        <td class="text-left"><input id="request_date" type="text" class="control-input disabled" value="${data.doc_date}" readonly/></td>
                                    </tr>
                                    <tr>
                                        <td class="col-4  text-right">กะ:</td>
                                        <td class="text-left">
                                        <input id="shift_id" type="text" class="control-input" value="${data.shift_id}" hidden/>
                                        <input type="text" class="control-input disabled" value="${shift}" readonly/>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <hr>
                            <div class="div-request-ot">
                                <h5 class="block">พนักงานทำ OT (0)</h5>
                                <div class="row">
                                    <div class="col-9">
                                        <select name="worker" id="worker-ot" class="form-control">
                                            <option value="none" disabled><--เลือก--></option>
                                        </select>
                                    </div>
                                    <div class="col-3"><button id="add-worker-request-ot" class="btn btn-lg btn-success add-worker-request-ot" onclick="">+</button></div>
                                </div>
                            </div>
                            <div class="div-show-worker-request-ot d-block">
                                
                            </div>`
    $("#modal-request-ot .modal-dialog .modal-content .modal-body").append(str)
    $.each(worker, function (index, value) {
        $('select[name="worker"]#worker-ot').append(`<option id="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
    });
    // await select_first_option()
}

async function request_ot(e, header_id) {
    let type_ot_request = ""
    if ($(e).attr('id') === 'ot_type_1') {
        type_ot_request = "1"
    } else {
        type_ot_request = "2"
    }

    const valuesArray = worker.map(emp => `${emp.emp_id}`);
    let data_working_status = await get_working_status({ workers: valuesArray, working_date: doc_date })
    console.log(data_working_status.summary.workers_on);
    if (data_working_status.summary.workers_on === 0) {
        await alert_valid('ไม่สามารถขอโอทีวันหยุดได้ กรุณาติดต่อ SDC')
        return
    }

    for (const emp of data_working_status.data) {
        if (emp.working_status === 0) {
            $(`select[name="worker"]#worker-ot`).find(`option#${emp.emp_id}`).prop('disabled', true)
        } else {
            $(`select[name="worker"]#worker-ot`).find(`option#${emp.emp_id}`).prop('disabled', false)
        }
    }
    // console.log(type_ot_request, e);
    let items = await get_request_ot_type(header_id, type_ot_request)
    // console.log(items);
    let shift_id = $("table#table-request-ot tbody tr td:last-child input#shift_id").val()
    let request_date = $("table#table-request-ot tbody tr td:last-child input#request_date").val()
    $("button#add-worker-request-ot").attr('onclick', `add_worker_request_ot('${type_ot_request}', '${header_id}')`)
    $("#modal-request-ot .modal-dialog .modal-content .modal-body .div-show-worker-request-ot").html("")
    $.each(items, function (index, item) {
        let str = ` <div id="${item.emp_id}" class="worker-request-ot d-flex justify-content-between" style="margin: .5rem 5rem;"><span>${item.emp_name}</span>
                    <button id="delete-worker-request-ot" class="btn btn-lg btn-danger delete-worker-request-ot" onclick="delete_worker_request_ot('${item.emp_id}')">-</button></div>`
        $("#modal-request-ot .modal-dialog .modal-content .modal-body .div-show-worker-request-ot").append(str)
    });
    $("#modal-request-ot .modal-dialog .modal-content .modal-footer .btn-success").attr('onclick', `send_form_request_ot('${header_id}', '${type_ot_request}', '${machine_id}', '${shift_id}', '${request_date}')`)

    // console.log(items);
    switch (type_ot_request) {

        case '1':
            $("div#modal-request-ot .modal-dialog .modal-content .modal-body h3#title-ot").text("บันทึก OT พักเที่ยง")
            break
        case '2':
            $("div#modal-request-ot .modal-dialog .modal-content .modal-body h3#title-ot").text("บันทึก OT ก่อนเลิกงาน/วันหยุด")
            break
    }

    let length = $("div.div-show-worker-request-ot div.worker-request-ot").length
    $("div.div-request-ot h5").text(`พนักงานทำ OT (${length})`)
    $("#modal-request-ot").modal('toggle')
    $(`select[name="worker"]#worker-ot`).prop('selectedIndex', 0);
}

async function add_worker_request_ot(typeot, header_id) {
    let value = $(`select[name="worker"]#worker-ot option:selected`)[0].value
    if (value === 'none') {
        await alert_valid('กรุณาเลือกรายชื่อ')
        return
    }
    let id = $(`select[name="worker"]#worker-ot option:selected`)[0].id
    let count = $(`div#${id}.worker-request-ot`).length
    if (count > 0) {
        $("input.control-input.input-worker-request-ot").val("")
        alert_valid('ไม่สามารถเลือกซ้ำใน OT ประเภทเดียวกันได้')
        return
    }

    let obj_chk_ot = {
        worker_id: id,
        request_date: $("table#table-request-ot input#request_date").val(),
        request_type: typeot,
        shift_id: shift_id
    }
    let res_chk = await check_worker_request_ot(obj_chk_ot)
    if (res_chk.c === 0) {
        let str = ` <div id="${id}" class="worker-request-ot d-flex justify-content-between" style="margin: .5rem 5rem;">
                <span>${value}</span>
                <button id="delete-worker-request-ot" class="btn btn-lg btn-danger delete-worker-request-ot" onclick="delete_worker_request_ot('${id}')">-</button></div>`
        $("#modal-request-ot .modal-dialog .modal-content .modal-body .div-show-worker-request-ot").append(str)
        $("input.control-input.input-worker-request-ot").val("")

        let length = $("div.worker-request-ot").length
        $("div.div-request-ot h5").text(`พนักงานทำ OT (${length})`)
    } else {
        await alert_valid(`ไม่สามารถบันทึกพนักงานรหัส <span class="text-warning">${id}</span> ได้</br>เนื่องจากมีการบันทึกในกะอื่นของวันเดียวกันไปแล้ว`)
    }



}

async function delete_worker_request_ot(id) {
    $(`div#${id}.worker-request-ot`).remove()
    let length = $("div.worker-request-ot").length
    $("div.div-request-ot h5").text(`พนักงานทำ OT (${length})`)
}

async function send_form_request_ot(header_id, request_type, machine_id, shift_id, request_date) {
    if ($(".worker-request-ot").length < 1) {
        await delete_request_ot(header_id, request_type)
        return
    }
    let workers = $(".worker-request-ot").map((index, item) => {
        return item.id
    }).toArray()

    let obj = {
        machine_id: machine_id,
        shift_id: shift_id,
        request_date: request_date,
        request_type: request_type,
        last_edit_ip: null,
        header_id: header_id,
        employee: workers
    }

    await insert_request_ot(obj)

}

async function open_modal_ok_sheet() {
    const modal = $("div.modal#ok-sheet")
    let obj = {
        jobid: jobid,
        header_id: header_id,
        type_id: type_id,
    }

    let detail = await get_ok_sheet_detail(obj)
    if (detail.success === false) {
        alert_valid(detail.data)
        return
    }

    res_detail = {
        part: detail.data.part,
        item: detail.data.item
    }

    ok_sheet = res_detail
    const x = res_detail.item[0]
    const part = res_detail.part

    let body = $("div.modal#ok-sheet modal-body")
    $("table.table-ok-detail#table-ok-detail-1 input").prop("readonly", true)
    // el = input 
    let el_job = $("table.table-ok-detail#table-ok-detail-1 input#input-job")
    let el_machine = $("table.table-ok-detail#table-ok-detail-1 input#input-machine")
    let el_ae = $("table.table-ok-detail#table-ok-detail-1 input#input-ae")
    let el_part = $("table.table-ok-detail#table-ok-detail-1 select[name='part']#select-part")
    let el_wb_type = $("table.table-ok-detail#table-ok-detail-1 input#input-wb-type")
    let el_wb = $("table.table-ok-detail#table-ok-detail-1 input#input-wb")
    let el_text = $("table.table-ok-detail#table-ok-detail-1 input#input-textname")
    let el_ink = $("table.table-ok-detail#table-ok-detail-1 input#input-ink")
    let el_shadow = $("table.table-ok-detail#table-ok-detail-1 input#input-shadow")
    let el_powder = $("table.table-ok-detail#table-ok-detail-1 select[name='powder']#select-powder")
    let el_percent_powder = $("table.table-ok-detail#table-ok-detail-1 input#input-percent-powder")
    let el_analog = $("table.table-ok-detail#table-ok-detail-1 input#input-analog")
    let el_width_paper = $("table.table-ok-detail#table-ok-detail-1 input#input-width-paper")

    let std_density = $("table.table-ok-detail#table-ok-detail-1 select[name='density'] #select-density")
    document.getElementById("select-density").selectedIndex = 0;
    document.getElementById("supervisor").selectedIndex = 0;
    document.getElementById("qa").selectedIndex = 0;
    document.getElementById("other").selectedIndex = 0;

    el_job.val(`(${x.jobid}) ${x.job_name === null || x.job_name === "" ? "" : x.job_name}`)

    $.each(part, function (index, value) {
        el_part.append(`<option id="${value.itid}" value="${value.partName}">${value.partName}</option>`)
    });

    el_part.find(`option#${x.partname_id}`).prop('selected', true)
    el_machine.val(`(${machine_id}) ${machine_name}`)
    el_ae.val(`(${x.ae_id}) ${x.ae_name}`)
    el_wb_type.val(x.type_wb)
    el_wb.val(x.brand_wb)
    el_text.val(x.textname)
    el_ink.val(x.ink)
    el_shadow.val(x.shadow)
    el_percent_powder.val(x.percent_powder)
    el_analog.val(x.analog)
    el_width_paper.val(x.thick_paper)
    el_powder.find(`option[value='${x.num_powder}']`).prop('selected', true)

    let body5 = $("div#div-ok-detail-2 table.table-ok-detail#table-ok-detail-5 tbody").html("")
    let str = `<tr>
                    <td class="text-center align-middle">1) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[0]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[0]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[0]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">2) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[1]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[1]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[1]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">3) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[2]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[2]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[2]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">4) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[3]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[3]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[3]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">5) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[4]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[4]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[4]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">6) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[5]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[5]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[5]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">7) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[6]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[6]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[6]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>
                <tr>
                    <td class="text-center align-middle">8) </td>
                    <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[7]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[7]}"></td>
                    <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[7]}"></td>
                    <td><input type="text" class="form-control text-center density"></td>
                </tr>`

    if (machine_id == 3507) {
        str +=
            ` <tr>
            <td class="text-center align-middle">9) </td>
            <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[8]}"></td>
            <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[8]}"></td>
            <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[8]}"></td>
            <td><input type="text" class="form-control text-center density"></td>
        </tr>
        <tr>
            <td class="text-center align-middle">10) </td>
            <td><input type="text" class="disabled-text form-control text-center pantone" value="${x.pantone[9]}"></td>
            <td><input type="text" class="disabled-text form-control text-center packing" value="${x.packing[9]}"></td>
            <td><input type="text" class="disabled-text form-control text-center mole" value="${x.mole[9]}"></td>
            <td><input type="text" class="form-control text-center density"></td>
        </tr>`
    }

    body5.append(str)
    if (machine_id == 3422 || machine_id == 3423 || machine_id == 3521) {
        let x_num = 1
        while (x_num <= 4) {
            for (let i = 4; i <= 7; i++) {
                $(`table#table-ok-detail-5 tbody tr:eq(${i}) td:eq(0)`).html(`${x_num})`)
                x_num++;
            }
        }
        // $('#table-ok-detail-5 tbody tr:eq(0) td:eq(0)').before(`<span class="text-left align-middle">บน</span>`)
        // $('#table-ok-detail-5 tbody tr:eq(4) td:eq(0)').before(`<span class="text-left align-middle">ล่าง</span>`)
        for (let i = 0; i <= 7; i++) {
            if (i != 0 && i != 0) {
                $(`#table-ok-detail-5 tbody tr:eq(${i}) td:eq(0)`).before(`<span class="text-left align-middle"></span>`)
            }
        }
        $('#table-ok-detail-5 thead tr:eq(0) td:eq(0)').attr('colspan', 3)
        $('#table-ok-detail-5 tbody tr:eq(0) td:eq(0)').before(`<span class="text-left align-middle">บน</span>`)
        $('#table-ok-detail-5 tbody tr:eq(4) td:eq(0)').before(`<span class="text-left align-middle">ล่าง</span>`)
    }
    $("table#table-ok-detail-4 select[name='manager']").empty()
    $("table#table-ok-detail-4 select[name='manager']").append(`<option value="none" disabled>-เลือกรายชื่อ-</option>`)

    $("table#table-ok-detail-4 select[name='supervisor']").empty()
    $("table#table-ok-detail-4 select[name='supervisor']").append(`<option value="none" disabled>-เลือกรายชื่อ-</option>`)

    $.each(leader, function (index, value) {
        $("table#table-ok-detail-4 select[name='manager']").append(`<option value="${value.leader_id}" data-manager-name="${value.leader_name}">(${value.leader_id}) ${value.leader_name}</option>`)
        $("table#table-ok-detail-4 select[name='supervisor']").append(`<option value="${value.leader_id}" data-sup-name="${value.leader_name}">(${value.leader_id}) ${value.leader_name}</option>`)
    });

    $("table#table-ok-detail-4 select[name='operator']").empty()
    $("table#table-ok-detail-4 select[name='operator']").append(`<option value="none" disabled>-เลือกรายชื่อ-</option>`)
    $.each(worker, function (index, value) {
        $("table#table-ok-detail-4 select[name='operator']").append(`<option value="${value.emp_id}"
        data-operator-name="${value.firstname} ${value.lastname}">(${value.emp_id}) ${value.firstname} ${value.lastname}</option>`)
    });
    $("table#table-ok-detail-4 select[name='supervisor'] option[value='none']").prop('selected', true)
    $("table#table-ok-detail-4 select[name='manager'] option[value='none']").prop('selected', true)
    $("table#table-ok-detail-4 select[name='operator'] option[value='none']").prop('selected', true)
    $(`#table-ok-detail-3 tbody tr input`).val('')
    for (let i = 0; i < $(`#table-ok-detail-3 tbody tr`).length; i++) {
        if (i > 0) {
            $(`#table-ok-detail-3 tbody tr`)[i].remove()
        }
    }

    for (let i = 0; i < $("table#table-ok-detail-2 tbody tr td").length; i++) {
        $("table#table-ok-detail-2 tbody tr td input[type='text']").val("")
    }

    modal.modal("show")
}

async function add_colors(name) {
    let body = $(`div.modal#ok-sheet div.modal-body div#div-ok-detail-1 table.table-ok-detail#table-ok-detail-3 tbody`)
    let tr = $(`div.modal#ok-sheet div.modal-body div#div-ok-detail-1 table.table-ok-detail#table-ok-detail-3 tbody tr`).length

    if (tr < 4) {
        let number = tr + 1
        body.append(`<tr>
                    <td style="width: 5%;">${number}.</td>
                    <td class="pr-2">สี</td>
                    <td><input type="text" class="form-control temp-colors"></td>
                    <td class="pr-2">△E</td>
                    <td><input type="text" class="form-control temp-e"></td>
                    <td class="pr-2">L</td>
                    <td><input type="text" class="form-control temp-L"></td>
                    <td class="pr-2">a</td>
                    <td><input type="text" class="form-control temp-a"></td>
                    <td class="pr-2">b</td>
                    <td><input type="text" class="form-control temp-b"></td>
                    <td><button class="btn btn-danger" onclick="delete_colors(this)">ลบ</button></td>
                    </tr>`)
    }
}

async function delete_colors(e) {
    $(e).parent().parent().remove()
    let tr = $(`div.modal#ok-sheet div.modal-body div#div-ok-detail-1 table.table-ok-detail#table-ok-detail-3 tbody tr`)
    for (let i = 0; i < tr.length; i++) {
        $(tr[i]).find('td:first-child').text(`${i + 1}.`)
    }
}

async function save_ok_sheet() {
    let item = ok_sheet.item[0]
    var ae_array = []
    var row_temp = $("#table-ok-detail-3 tbody tr").length
    for (var i = 0; i < row_temp; i++) {
        let ae_topic = i + 1
        let ae_color = $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-colors').val() === "" ? "-" : $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-colors').val();
        let ae_e = $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-e').val() === "" ? "-" : $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-e').val();
        let ae_l = $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-L').val() === "" ? "-" : $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-L').val();
        let ae_a = $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-a').val() === "" ? "-" : $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-a').val();
        let ae_b = $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-b').val() === "" ? "-" : $($("#table-ok-detail-3 tbody tr")[i]).find('input.temp-b').val();
        ae_array.push({ ae_topic, ae_color, ae_e, ae_l, ae_a, ae_b })
    }

    let density = $("#table-ok-detail-5 tbody input.density").map((index, value) => {
        return $(value).val() === "" ? 0 : $(value).val()
    }).toArray()

    let chk = false
    $.each($("#table-ok-detail-2 tbody input.dst"), function (index, value) {
        if ($(value).val() === "") {
            chk = true
        }
    });

    if ($("#table-ok-detail-4 tbody select[name='manager']").find('option:selected').val() === "none"
        || $("#table-ok-detail-4 tbody select[name='qa']").find('option:selected').val() === "none"
        || $("#table-ok-detail-4 tbody select[name='operator']").find('option:selected').val() === "none"
        || $("#table-ok-detail-4 tbody select[name='supervisor']").find('option:selected').val() === "none"
        || $("#table-ok-detail-4 tbody select[name='other']").find('option:selected').val() === "none") {
        chk = true
    }

    if (chk === true) {
        await alert_valid('กรุณากรอกข้อมูลให้ครบ')
        return
    }

    let std = $("#table-ok-detail-2 tbody input.dst").map((index, value) => {
        return $(value).val() === "" ? 0 : $(value).val()
    }).toArray()

    let str_job_name = job_name === "" || job_name === null ? "" : job_name
    if (job_name.indexOf('\'') >= 0) {
        str_job_name = job_name.replace(/'/g, "''")
    }

    let op_name = $("#table-ok-detail-4 tbody select[name='operator']").find('option:selected').attr('data-operator-name')
    let manager_name = $("#table-ok-detail-4 tbody select[name='manager']").find('option:selected').attr('data-manager-name')
    let qa_name = $("#table-ok-detail-4 tbody select[name='qa']").find('option:selected').attr('data-qa-name')
    let sup_name = $("#table-ok-detail-4 tbody select[name='supervisor']").find('option:selected').attr('data-sup-name')
    let ok_sheet_obj = {
        type_id: type_id,
        header_id: header_id,
        ae_emp_id: item.ae_id,
        ae_emp_name: item.ae_name,
        machine_id: machine_id,
        machine_name: machine_name,
        job_id: jobid,
        job_name: str_job_name,
        text_name: (item.textname).replace(/'/g, "''"),
        ink: item.ink,
        wb_type: item.type_wb,
        wb_brand: item.brand_wb,
        shadow: item.shadow,
        analog_no: item.analog,
        std: std.toString(),
        density: density.toString(),
        unit_color: item.pantone.toString(),
        operator_id: $("#table-ok-detail-4 tbody select[name='operator']").find('option:selected').val(),
        operator_name: op_name,
        supervisor_emp_id: $("#table-ok-detail-4 tbody select[name='supervisor']").find('option:selected').val(),
        supervisor_name: sup_name,
        manager_emp_id: $("#table-ok-detail-4 tbody select[name='manager']").find('option:selected').val(),
        manager_emp_name: manager_name,
        customer: ($("#table-ok-detail-4 tbody input#customer").val()).replace(/'/g, "''"),
        other: $("#table-ok-detail-4 tbody select[name='other']").find('option:selected').val(),
        num_powder: $("#table-ok-detail-1 tbody tr td select[name='powder']").find('option:selected').val(),
        percent_powder: $("#table-ok-detail-1 tbody tr td input#input-percent-powder").val(),
        status: 1,
        qa_emp_id: $("#table-ok-detail-4 tbody select[name='qa']").find('option:selected').val(),
        qa_name: qa_name,
        partname: $("#table-ok-detail-1 tbody select[name='part']").find('option:selected').val(),
        mole: item.mole.toString(),
        packing: item.packing.toString(),
        thick_paper: item.thick_paper,
        type_density: $("#table-ok-detail-2 tbody select#select-density.form-control").find('option:selected').val(),
        ae_array

    }

    // console.log(ok_sheet_obj);
    await insert_ok_sheet(ok_sheet_obj);

}

async function set_partname_sub() {
    let word = $('#partname').find('option:selected').text();
    for (const value of global_detail_sup.partName) {
        if (value.partName == word) {
            $('#partname_value').val(word)
            $('#papertype').val(value.paperTypeName)
        }
    }
}

async function save_sup_check_color() {
    let inputTextArray = $("div.modal#sup-check-color input[type='text']")
    let inputCheckBoxArray = $("div.modal#sup-check-color input[type='checkbox']").not(":disabled")
    let selectArray = $("div.modal#sup-check-color select")
    let chk = false
    $.each(inputTextArray, async function (index, element) {
        // if (element.name !== "pantone[]" && element.name !== "packing[]" && element.name !== "mole[]") {
        //     if (element.value === "") {
        //         chk = true
        //     }
        // }
        switch (element.name) {
            case "textname":
            case "percentPowder":
            case "thickpaper":
            case "packing[]":
            case "mole[]":
                if (element.value === "") {
                    chk = true
                }
                // console.log(element, element.value, chk);
                break
        }

        if (chk === true) {
            return false
        }
    });

    $.each(selectArray, async function (index, element) {
        if ($(element).find('option:selected').val() === "") {
            chk = true
        }
    });

    $.each(inputCheckBoxArray, async function (index, element) {
        if (!$(element).is(':checked')) {
            chk = true
        }
    });

    if (chk === true) {
        await alert_valid('กรุณากรอกข้อมูลให้ครบถ้วน')
        return false
    }

    let checklist_timesheet_sub = {}
    checklist_timesheet_sub = {
        header_id,
        machine_id,
        shift_id,
        jobid,
        type_id,
        partname_id: $('div.modal#sup-check-color select#partname').find('option:selected').val(),
        partname: $('div.modal#sup-check-color select#partname').find('option:selected').text(),
        qty: $('div.modal#sup-check-color input#qty').val(),
        type_wb: ($('div.modal#sup-check-color input#typeWB').val()).replace(/'/g, "''"),
        brand_wb: ($('div.modal#sup-check-color input#brandWB').val()).replace(/'/g, "''"),
        textname: ($('div.modal#sup-check-color input#textname').val()).replace(/'/g, "''"),
        ink: $('div.modal#sup-check-color select#ink').find('option:selected').val(),
        analog: $('div.modal#sup-check-color select#analog').find('option:selected').val(),
        shadow: $('div.modal#sup-check-color input#shadow').val(),
        num_powder: $('div.modal#sup-check-color select#numPowder').find('option:selected').val(),
        percent_powder: $('div.modal#sup-check-color input#percent_powder').val(),
        lot_wb: $('div.modal#sup-check-color input#lotWB').val(),
        stickiness: $('div.modal#sup-check-color input#stickiness').val(),
        lot_k: $('div.modal#sup-check-color input#lotK').val(),
        lot_c: $('div.modal#sup-check-color input#lotC').val(),
        lot_m: $('div.modal#sup-check-color input#lotM').val(),
        lot_y: $('div.modal#sup-check-color input#lotY').val(),
        leader: $('div.modal#sup-check-color select#manager').find('option:selected').val(),
        worker: $('div.modal#sup-check-color select#operator').find('option:selected').val(),
    }
    if (machine_id === '3605' || machine_id === 3605) {
        checklist_timesheet_sub.uv1 = $('div.modal#sup-check-color select#uv1').find('option:selected').val()
        checklist_timesheet_sub.uv2 = $('div.modal#sup-check-color select#uv2').find('option:selected').val()
        checklist_timesheet_sub.uv3 = $('div.modal#sup-check-color select#uv3').find('option:selected').val()
        checklist_timesheet_sub.uv4 = $('div.modal#sup-check-color select#uv4').find('option:selected').val()
        checklist_timesheet_sub.uv5 = $('div.modal#sup-check-color select#uv5').find('option:selected').val()
    }

    let topic1 = $("div.modal#sup-check-color tbody tr.unit-packing-mole").map((index, item) => {
        return {
            topic_id: item.id,
            pantone: $(`div.modal#sup-check-color input#pantone_${item.id}`).val() === "" ? "-" : $(`div.modal#sup-check-color input#pantone_${item.id}`).val(),
            packing: $(`div.modal#sup-check-color input#packing_${item.id}`).val() === "" ? 0 : $(`div.modal#sup-check-color input#packing_${item.id}`).val(),
            mole: $(`div.modal#sup-check-color input#mole_${item.id}`).val() === "" ? 0 : $(`div.modal#sup-check-color input#mole_${item.id}`).val()
        }
    }).toArray()

    let topic2 = {
        topic_id: 23,
        papertype: $('div.modal#sup-check-color input#papertype').val(),
    }

    let topic3 = {
        topic_id: 24,
        thickpaper: parseInt($('div.modal#sup-check-color input#thickpaper').val()),
    }

    let topic4 = inputCheckBoxArray.map((index, item) => {
        return item.id
    }).toArray()

    checklist_timesheet_sub.topic1 = topic1
    checklist_timesheet_sub.topic2 = topic2
    checklist_timesheet_sub.topic3 = topic3
    checklist_timesheet_sub.topic4 = topic4

    // console.log(checklist_timesheet_sub);
    await insert_sup_check_color(checklist_timesheet_sub)

}

async function set_value_unit(val, e) {
    if (val !== '') {
        if ($(`input[name="${e.name}"]`).hasClass('disabled-text')) {
            $(`input[name="${e.name}"]`).removeClass('disabled-text')
        }
        $(`input[name="${e.name}"]`).val(val)
    } else {
        $(`input[name="${e.name}"]`).val(val)
        if (!$(`input[name="${e.name}"]`).hasClass('disabled-text')) {
            $(`input[name="${e.name}"]`).addClass('disabled-text')
            $(`input[name="${e.name}"]`).eq(0).removeClass('disabled-text')
        }
    }
    // if ($(`input[name="${e.name}"]`).hasClass('disabled-text')) {
    //     $(`input[name="${e.name}"]`).removeClass('disabled-text')
    //     // console.log($(`input[name="${e.name}"]`))
    //     $(`input[name="${e.name}"]`).val(val)
    // }
}

async function get_density(e) {
    let v = $(e).find('option:selected').val()
    switch (v) {
        case 'Coat':
            $.each(density.coat, function (index, value) {
                $(`table#table-ok-detail-2 input#dst-${index}`).val(value.toFixed(2))
            });
            $(`table#table-ok-detail-2 input#dst-4`).hide()
            $(`table#table-ok-detail-2 td#dst-white`).hide()
            break
        case 'Uncoat':
            $.each(density.uncoat, function (index, value) {
                $(`table#table-ok-detail-2 input#dst-${index}`).val(value.toFixed(2))
            });
            $(`table#table-ok-detail-2 input#dst-4`).hide()
            $(`table#table-ok-detail-2 td#dst-white`).hide()
            break
        case 'UV Ink':
            $.each(density.uvink, function (index, value) {
                $(`table#table-ok-detail-2 input#dst-${index}`).val(value.toFixed(2))
            });
            $(`table#table-ok-detail-2 td#dst-white`).show()
            $(`table#table-ok-detail-2 input#dst-4`).show()
            break
        default:
            for (let index = 0; index < 5; index++) {
                $(`table#table-ok-detail-2 input#dst-${index}`).val("")
            }
            $(`table#table-ok-detail-2 td#dst-white`).show()
            $(`table#table-ok-detail-2 input#dst-4`).show()
            break
    }
}

async function help_page() {
    window.open(`/timesheet/${type_id}/help`)
}

async function view_wi() {
    let url = `http://192.168.5.3/planning/mi/mi_wi.php?jobid=${jobid}`

    if (jobid.charAt(0) !== 'J' && jobid.charAt(0) !== 'j') {
        await alert_valid('ไม่มีข้อมูล WI')
    } else {
        window.open(url)
    }
}

async function view_checklist(process_code_id) {
    console.log(process_code_id);
    // console.log("view checklist", plan_id, header_id, process_code_id);
    switch (process_code_id) {
        case 13:
            var data = await get_local_storage("checklist_outsource")
            if (data === undefined) {
                await gen_checklist()
            }
            data.head.cqp_code = data.head.cqp_code !== "" ? data.head.cqp_code : await get_checklist_outsource_id()
            data.head.cqp_date = await convert_date(new Date())

            if (is_end === 1) {
                await set_value_checklist(process_code_id, data)
                const modal = $('div.modal#checklist-outsource')
                modal.modal({
                    keyboard: false
                })
            } else {
                await generate_checklist_pdf(process_code_id, data)
            }
            break
        case 14:
            var data = await get_local_storage("checklist_machine")
            if (data === undefined) {
                await gen_checklist()
            }

            // if (is_end === 1) {
            //     await set_value_checklist(process_code_id, data)
            //     const modal = $('div.modal#checklist-outsource')
            //     modal.modal({
            //         keyboard: false
            //     })
            // } else {
            //     console.log(is_end);
            // }
            if (is_end === 0) {
                await generate_checklist_pdf(process_code_id, data)
            }
            break
        case 15:
            var data = await get_local_storage("checklist_qc")
            if (data === undefined) {
                await gen_checklist()
            }

            if (is_end === 1) {
                await set_value_checklist(process_code_id, data)
                const modal = $('div.modal#checklist-qc')
                modal.modal({
                    keyboard: false
                })
            } else {
                // console.log(is_end);
                await generate_checklist_pdf(process_code_id, data)
            }
            break
    }
}

async function set_value_checklist(process_code_id, data) {
    // console.log("set_value_checklist => ", process_code_id, data);
    if (process_code_id === 13) {
        $("input#outsource_cqp_code").val(data.head.cqp_code)
        $("input#outsource_jobid").val(data.head.jobid)
        $("input#outsource_job_name").val(data.head.job_name)
        $("input#outsource_date").val(data.head.cqp_date)
        $("input#outsource_material_id").val(data.head.item_code)
        $("input#outsource_material_name").val(data.head.item_name)
        $("input#outsource_unit_id").val(data.head.unit_id)
        $("input#outsource_unit_name").val(data.head.unit_name)
        $("input#outsource_total_qty_pallet").val(data.head.total_qty_pallet)
        $("input#outsource_trim_height").val(data.head.trim_height)
        $("input#outsource_count_pallet").val(data.head.count_pallet)

        if (data.detail.length === 0) {
            $("input#outsource_cqp_proc").val("add")
            $("input[name='coat_option']").prop("checked", false)
            $("input#coat_other_text").val("")
            $("input#coat_other_text").addClass('disabled')
            $("input#outsource_name").val("")
            $("textarea#outsource_remark").val("")
            $('select#outsource_inspector[name="worker"]').prop('selectedIndex', 0)

            $("div#checklist-outsource div.checklist-div-box-2 table input.checklist-remark").val("")
            $("div#checklist-outsource div.checklist-div-box-2 table input.checklist-remark").removeClass("is-valid is-invalid")
            $("div#checklist-outsource div.checklist-div-box-2 table input.checklist-checkbox").prop("checked", false)
        } else {
            $("input#outsource_cqp_proc").val("edit")
            $(`input[name='coat_option'][value='${data.head.coat_choice}']`).prop("checked", true)
            if (data.head.coat_choice === 4) {
                $("input#coat_other_text").val(data.head.coat_detail)
                $("input#coat_other_text").removeClass('disabled')
            }
            $("input#outsource_name").val(data.head.cqp_outsource_name)
            $("textarea#outsource_remark").val(data.head.cqp_remark)
            if ($(`select#outsource_inspector[name="worker"][value=${data.head.cqp_emp_id}]`).length !== 0) {
                $('select#outsource_inspector[name="worker"]').val(data.head.cqp_emp_id)
            } else {
                $('select#outsource_inspector[name="worker"]').prop('selectedIndex', 0)
            }
            for (const item of data.detail) {
                $(`div#checklist-outsource div.checklist-div-box-2 table input#remark-unit-${item.detail_id}`).val(item.detail_remark)
                if (item.detail_value === 0) {
                    $(`div#checklist-outsource div.checklist-div-box-2 table input#remark-unit-${item.detail_id}`).addClass("is-valid")
                }
                $(`div#checklist-outsource div.checklist-div-box-2 table input.checklist-checkbox[data-detail-id='${item.detail_id}'][value=${item.detail_value}]`).prop("checked", true)
            }
        }
    } else if (process_code_id === 15) {
        if (machine_id === '7001' || machine_id === '7002') {
            return
        }
        // console.log("set value in checklist หลังการทำงาน");
        const modal = $("div#checklist-qc div.checklist-div-box-2")
        const checklist_id = $("div#checklist-qc div.checklist-div-box-1 input#checklist-id").val()
        $(`div.modal#checklist-qc div.modal-body input#qc-code`).val(data.head.qc_code)
        // modal.find("table input.checklist-checkbox").prop("checked", false)
        // modal.find("table input.checklist-remark").val("")

        if (checklist_id === '2') {
            $("div#checklist-qc div.checklist-div-box-1 input#qty-paper").val(data.head.qty_paper_receive.toLocaleString()).prop('hidden', false)
        } else {
            $("div#checklist-qc div.checklist-div-box-1 input#qty-paper").val("").prop('hidden', true)
        }
        for (const item of data.detail) {
            modal.find(`table input.checklist-checkbox[data-detail-id='${item.detail_id}'][value=${item.detail_value}]`).prop("checked", true)
            modal.find(`table input#remark-unit-${item.detail_id}`).val(item.detail_remark)
            if (item.detail_value === 0) {
                modal.find(`table input#remark-unit-${item.detail_id}`).addClass("is-valid")
            }

            modal.find(`table input.checklist-checkbox[data-detail-id='${item.detail_id}']`).prop('disabled', true)
            modal.find(`table input#remark-unit-${item.detail_id}`).addClass("disabled")
        }
        $('select#qc_inspector[name="worker"]').prop('selectedIndex', 0)
    }
}

async function save_checklist_outsource() {
    var proc = $("input#outsource_cqp_proc").val()
    var head = {}
    head.cqp_code = proc === "add" ? "" : $("input#outsource_cqp_code").val()
    head.plan_id = plan_id
    head.jobid = $.trim($("input#outsource_jobid").val())
    head.job_name = $("input#outsource_job_name").val()
    head.cqp_date = $.trim($("input#outsource_date").val())
    head.item_code = $.trim($("input#outsource_material_id").val())
    head.item_name = $("input#outsource_material_name").val()
    head.unit_id = $.trim($("input#outsource_unit_id").val())
    head.unit_name = $("input#outsource_unit_name").val()
    head.total_qty_pallet = Number($("input#outsource_total_qty_pallet").val())
    head.trim_height = parseFloat($("input#outsource_trim_height").val())
    head.count_pallet = Number($("input#outsource_count_pallet").val())
    head.outsource_name = $("input#outsource_name").val().replace(/'/g, "''")
    if (head.outsource_name === "") {
        await alert_valid("กรุณากรอก Outsource Name")
        return
    }

    if ($("input[name='coat_option']:checked").length === 0) {
        await alert_valid("กรุณาเลือกรายการจัดจ้าง")
        return
    }

    let coat_val = $("input[name='coat_option']:checked").val()
    let coat_id = $("input[name='coat_option']:checked").attr('id')
    let coat_text = ""
    switch (coat_val) {
        case '1':
        case '2':
        case '3':
            coat_text = $(`label[for='${coat_id}']`).text()
            break
        case '4':
            coat_text = $("input#coat_other_text").val()
            break
    }
    head.coat_choice = coat_val
    head.coat_detail = coat_text.replace(/'/g, "''")

    let number_of_checked = $('div#checklist-outsource div.checklist-div-box-2 table input[type="checkbox"]:checked').length
    let total_of_checkbox = $('div#checklist-outsource div.checklist-div-box-2 table input[type="checkbox"]').length / 2

    if (number_of_checked !== total_of_checkbox) {
        await alert_valid("กรุณาตรวจสอบขั้นตอนให้ครบถ้วน")
        return
    }

    let remark_invalid = $('div#checklist-outsource div.checklist-div-box-2 table input.checklist-remark.is-invalid').not(':disabled').length
    if (remark_invalid > 0) {
        alert_valid('กรุณากรอกหมายเหตุของขั้นตอนให้ครบถ้วน')
        return
    }

    let checklist_detail = $('div#checklist-outsource div.checklist-div-box-2 table input[type="checkbox"]:checked')
    detail = checklist_detail.map(function (index, value) {
        return {
            detail_id: $(value).data('detailId'),
            detail_value: $(value).val(),
            detail_remark: $(`div#checklist-outsource div.checklist-div-box-2 table input.checklist-remark#remark-unit-${$(value).data('detailId')}`).val().replace(/'/g, "''")
        }
    }).toArray();

    head.cqp_remark = $("textarea#outsource_remark").val().replace(/'/g, "''")
    head.cqp_emp_id = $('select#outsource_inspector[name="worker"]').val()
    if (head.cqp_emp_id === null) {
        await alert_valid("กรุณาเลือกผู้ประเมิน")
        return
    }

    var obj = {
        head,
        detail,
        proc,
    }

    await manage_checklist_outsource(obj).then(async (res) => {
        if (res.success === 1) {
            await set_local_storage(res.data, "checklist_outsource")
            const modal = $('div.modal#checklist-outsource')
            modal.modal('hide')
        } else if (data.success === 0) {
            alert_error(data)
            return
        }

        return
    })
}

async function save_checklist_qc() {
    var head = {}
    var detail = []
    const modal = $('div#checklist-qc div.checklist-div-box-2')
    head.qc_code = $("div#checklist-qc div.modal-body input#qc-code").val()
    let checklist_detail = modal.find('table input[type="checkbox"]:checked').not(':disabled')
    // console.log(checklist_detail);

    let number_of_checked = modal.find('table input[type="checkbox"]:checked').not(':disabled').length
    let total_of_checkbox = modal.find('table input[type="checkbox"]').not(':disabled').length / 2
    if (number_of_checked !== total_of_checkbox) {
        await alert_valid("กรุณาตรวจสอบขั้นตอนให้ครบถ้วน")
        return
    }

    let remark_invalid = modal.find('table input.checklist-remark.is-invalid').length
    if (remark_invalid > 0) {
        alert_valid('กรุณากรอกหมายเหตุของขั้นตอนให้ครบถ้วน')
        return
    }

    head.qc_emp_id = $('select#qc_inspector[name="worker"]').val()
    head.plan_id = plan_id
    if (head.qc_emp_id === null) {
        await alert_valid("กรุณาเลือกผู้บันทึก")
        return
    }

    detail = checklist_detail.map(function (index, value) {
        return {
            checklist_type_id: $(value).data('detailId'),
            checklist_val: $(value).val(),
            checklist_remark: modal.find(`table input.checklist-remark#remark-unit-${$(value).data('detailId')}`).val().replace(/'/g, "''")
        }
    }).toArray();
    var obj = {
        head,
        detail,
        type: 'post'
    }

    await insert_checklist_qc_timesheet(obj)
        .then(async (res) => {
            if (res.success === true) {
                await set_local_storage(res.data, 'checklist_qc')
                const modal = $('div.modal#checklist-qc')
                modal.modal('hide')
            } else if (res.success === false) {
                alert_error(res)
                return
            }
        })
}

async function build_checklist(checklist, modal_id, group_id_array, workers) {
    let data_array = checklist.data;
    let data_doc = checklist.doc
    let select_worker_id = ""
    switch (modal_id) {
        case 'checklist-qc':
            select_worker_id = "#qc_inspector"
            $(`div.modal#${modal_id} div.modal-body input#checklist-id`).val(data_doc.checklist_id)
            $(`div.modal#${modal_id} div.modal-body h3`).text(`รายการตรวจสอบคุณภาพหน่วยงาน${data_doc.doc_name.replace('เครื่อง', '')}`)
            break
        case 'checklist-outsource':
            select_worker_id = "#outsource_inspector"
            break
    }

    if (workers) {
        $.each(workers, function (index, value) {
            $(`select${select_worker_id}[name="worker"]`).append(`<option value="${value.emp_id}">${value.firstname} ${value.lastname}</option>`)
        });
    }

    $.each(data_array, async function (index, value) {
        if (!group_id_array.includes(value.group_id)) {
            return
        }
        let table = `<table class="table table-sm table-dark table-checklist" id="tb-${modal_id}" data-table-name="${value.group_name}"
                    data-checklist-group-id="${value.group_id}">
                        <thead>
                            <tr>
                                <th class="text-left">${value.group_name}</th>
                                <th>ผ่าน</th>
                                <th>ไม่ผ่าน</th>
                                <th>หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${await build_checklist_unit(value.type_unit)}
                        </tbody>
                    </table>`

        $(`div.modal#${modal_id} div.modal-body div.checklist-div-box-2`).append(table)
    });

}

async function build_checklist_unit(unit) {
    let str = ``
    $.each(unit, function (index, value) {
        // console.log(is_qc, index);
        let count_number = index + 1 + '. '
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

async function convert_date(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    var day = String(date.getDate()).padStart(2, '0');

    var formattedDate = year + '-' + month + '-' + day;
    return formattedDate
}