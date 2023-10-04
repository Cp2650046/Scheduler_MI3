$(document).ready(async function () {
    await settingDataTable('#tb_plans');
    $("#edit_one_plan_tab,#edit_multi_plan_tab").on("click", (e) => {
        let navId = e.target.id;
        $("#scheduler_tab3").show();
        $("#scheduler_tab4").show();
        if (navId == "edit_multi_plan_tab") {
            $('#tb_plans tbody tr').removeClass('rowSelected');
            if ($('#tb_plans tbody tr td').hasClass("color-row-select")) {
                $('#tb_plans tbody tr td').removeClass('color-row-select');
            }
            btnReset();
        } else {
            resetInputPlans();
        }
        toggleNav(navId);
    })
})

async function searchPlan(skip = 0) {
    const s_type_search = $('#s_type_search').val();
    const s_machine_id = $('#s_machine_id').val();
    const s_machine_type = $('#s_machine_type').val();
    const s_shift_id = $('#s_shift_id').val();
    const s_jobid = $.trim($("[name=s_job_id]").val());
    const chk_plan_date = $("[name=s_chk_plan_date]").is(':checked') == true ? 1 : 0;
    const plan_date_start = $.trim($("#plan_date_start").val()) != "" ? formatDate($.trim($("#plan_date_start").val())) : "";
    const plan_date_end = $.trim($("#plan_date_end").val()) != "" ? formatDate($.trim($("#plan_date_end").val())) : "";
    let chkBool = true;
    let element = "";
    let textWarning = "";

    if (s_type_search == 1) {

        if (s_machine_id == "" && chkBool) {
            chkBool = false;
            element = "[name=s_machine_id]";
            textWarning = "กรุณาระบุเครื่องจักร";
        }
        if (plan_date_start == "" && chkBool) {
            chkBool = false;
            element = "#plan_date_start";
            textWarning = "กรุณาระบุวันที่เริ่มต้นวางแผน";
        }
        if (plan_date_end == "" && chkBool) {
            chkBool = false;
            element = "#plan_date_end";
            textWarning = "กรุณาระบุวันที่สิ้นสุดวางแผน";
        }
    }
    else if (s_type_search == 2) {
        if (s_jobid == "" && chkBool) {
            chkBool = false;
            element = "[name=s_job_id]";
            textWarning = "กรุณาระบุ Job";
        }
        if (chk_plan_date == 1) {
            if (plan_date_start == "" && chkBool) {
                chkBool = false;
                element = "#plan_date_start";
                textWarning = "กรุณาระบุวันที่เริ่มต้นวางแผน";
            }
            if (plan_date_end == "" && chkBool) {
                chkBool = false;
                element = "#plan_date_end";
                textWarning = "กรุณาระบุวันที่สิ้นสุดวางแผน";
            }
        }
    }
    else if (s_type_search == 3) {
        const s_jobid = $.trim($("[name=s_job_id]").val());
        if (s_jobid == "" && chkBool) {
            chkBool = false;
            element = "[name=s_job_id]";
            textWarning = "กรุณาระบุ Job";
        }

    }
    else if (s_type_search == 4) {
        if (plan_date_start == "" && chkBool) {
            chkBool = false;
            element = "#plan_date_start";
            textWarning = "กรุณาระบุวันที่เริ่มต้นวางแผน";
        }
        if (plan_date_end == "" && chkBool) {
            chkBool = false;
            element = "#plan_date_end";
            textWarning = "กรุณาระบุวันที่สิ้นสุดวางแผน";
        }

    }

    if (!chkBool) {
        if (skip !== 1) {
            $(element).focus();
            showAlertWithTimer(textWarning, "warning", 1500);
            return false;
        } else {
            return false;
        }
    }

    var obj_search_data = {
        typeSearch: s_type_search
        , machineID: s_machine_id
        , machineType: s_machine_type
        , shiftID: s_shift_id
        , jobID: s_jobid
        , checkedPlanDate: chk_plan_date
        , startDate: plan_date_start
        , endDate: plan_date_end
    }
    await resetInputPlans();
    await getPlanSearch(obj_search_data)
}

async function createPlanTable(planList = []) {
    let str = "";
    if (planList.length === 0) {
        await resetDataTable();
        return
    }
    $('#tb_plans').DataTable().clear().draw();
    $('#tb_plans').DataTable().destroy();

    let totalWaste = 0;
    let totalSig = 0;
    let totalDaytime = 0;
    let totalNight = 0;
    let totalRow = 0;
    for (const plan of planList) {
        totalWaste += parseFloat(plan.waste);
        totalSig += parseFloat(plan.sig);
        totalRow++;

        let classShiftName = "";
        if (plan.shift_id === 1) {
            classShiftName = "color_day";
            totalDaytime += parseFloat(plan.hr1)
            totalDaytime = await decimalToMinuteSecond(totalDaytime)
        } else if (plan.shift_id === 2) {
            classShiftName = "color_night";
            totalNight += parseFloat(plan.hr1)
            totalNight = await decimalToMinuteSecond(totalNight)
        }

        str += `<tr id="${plan.id}" onclick="setDataPlan('${plan.id}', $(this),'tb_plans')">`
        str += `
                    <td class="center checkbox_plan"><input type="checkbox" class="check_plan" value="${plan.id}" /></td>
                    <td>${plan.id}</td>
                    <td class="center">${plan.priority}</td>
                    <td class="center">${plan.jobid}</td>
                    <td class="left">${plan.job_name}</td>
                    <td>${plan.hr1}</td>
                    <td class="center">${plan.plan_date}</td>
                    <td class="left">${plan.machine_detail}</td>
                    <td class="center">${plan.machine_id}</td>
                    <td class="left">${plan.machine_name}</td>
                    <td class="center">${plan.job_status_name}</td>
                    <td class="center ${classShiftName}">${plan.shift_name}</td>
                    <td class="left">${plan.partName}</td>
                    <td class="left">${plan.detail}</td>
                    <td>${plan.sig}</td>
                    <td>${plan.paper_size}</td>
                    <td>${plan.paper_type}</td>
                    <td class="center">${plan.saleman_id}</td>
                    <td class="center">${plan.key_date}</td>
                    <td>${numeral(plan.quantity).format('0,0')}</td>
                    <td>${numeral(plan.waste).format('0,0')}</td>
                    <td>${plan.make_ready}</td>
                    <td>${plan.process_time1}</td>
                    <td>${numeral(plan.speed).format('0,0.00')}</td>
                    <td class="center">${plan.date_paper_in}</td>
                    <td class="center">${plan.due1}</td>
                    <td class="center">${plan.date_plate_in}</td>
                    <td class="center">${plan.date_ink_in}</td>
                    <td class="center">${plan.waterbase}</td>
                    <td class="center">${plan.varnish}</td>
                    <td class="center">${plan.recive_dep}</td>
                    <td class="left">${plan.send_dep_name}</td>
                    <td class="left">${plan.remark}</td>
                    <td class="center is_printing">${plan.ok_date} ok_date</td>
                    <td class="center">${plan.machine_id_send}</td>
                </tr>`;

    };

    // console.log(totalWaste, totalSig, totalDaytime, totalNight, totalRow);
    $('#tb_plans tbody').append(str);
    if (menuType !== 'Printing') {
        $('.is_printing').prop('hidden', true);
    }
    // $('#tb_plans').removeClass('el_visible');
    await settingDataTable('#tb_plans');
    $('#tb_plans').DataTable().draw();

    $('span[name="show_total_waste"]').text(totalWaste.toLocaleString());
    $('span[name="show_sum_hr_day"]').text(totalDaytime.toLocaleString());
    $('span[name="show_sum_hr_night"]').text(totalNight.toLocaleString());
    $('span[name="show_sum_sig"]').text(totalSig.toLocaleString());
    $('span[name="show_sum_job"]').text(totalRow.toLocaleString());
}

async function setDataInput(obj) {
    // console.log('1173 :>> ', obj);
    // await btnReset();
    $("[name=e_id]").val(obj.id);
    $("#e_send_dep").val(obj.send_dep);
    $("#e_machine_id_send").val(obj.machine_id_send);
    $("#e_machine_id").val(obj.machine_id).trigger('change');
    $("#e_plan_date").val(moment(obj.plan_date).format('DD/MM/YYYY'));
    $("#e_jobid").val(obj.jobid)
    $("#e_shift_id").val(obj.shift_id);
    $("[name=e_job_name]").val(obj.job_name);
    $("[name=e_sig]").val(obj.sig);
    $("[name=e_priority]").val(obj.priority);
    $("[name=e_waste]").val(numeral(obj.waste).format('0,0'));
    $("[name=e_quantity]").val(numeral(obj.quantity).format('0,0'));
    $("[name=e_paper_type]").val(obj.paper_type);
    $("[name=e_paper_size]").val(obj.paper_size);
    $("[name=e_recive_dep]").val(obj.recive_dep);
    $("[name=e_ae_name]").val(obj.fullname);
    $("[name=e_due1]").val(convertDateThai(obj.due1));
    $("[name=e_job_status_id]").val(obj.job_status_id);
    $("[name=e_partName]").val(obj.partName);
    $("[name=e_detail]").val(obj.detail);
    $("[name=e_make_ready]").val(obj.make_ready);
    $("[name=e_process_time1]").val(obj.process_time1);
    $("[name=e_speed]").val(numeral(obj.speed).format('0,0'));
    $("[name=e_hr1]").val(obj.hr1);
    $("[name=e_capacity_labor]").val(obj.capacity_labor);
    $("[name=e_remark]").val(obj.remark);
    $("[name=e_recive_dep]").val(obj.recive_dep);
    // $("[name=e_machine_send_remark]").val(obj.machine_send_remark);
    // $("[name=e_others]").val(obj.others);
}

async function resetDataTable() {
    $('#tb_plans').DataTable().clear().draw();
    $('span.input_total').text(0);
}

//function tab print plan

async function btnPrint() {
    let date_start = $.trim($("#plan_date_start").val()) != "" ? formatDate($.trim($("#plan_date_start").val())) : "";
    let date_end = $.trim($("#plan_date_end").val()) != "" ? formatDate($.trim($("#plan_date_end").val())) : "";
    date_start = await checkDatePlanPrint(date_start);
    var reportName = await checkReportName(menu_group_data.group_data);
    var url_report_plan = "http://192.168.5.41:8080/report_scheduler";
    url_report_plan += reportName + "sqlin=" + menu_group_data.responseText;
    url_report_plan += "&machine_id=" + $("#s_machine_id").val() + "&machine_type_id=" + $("#s_machine_type").val();
    url_report_plan += "&plan_date_start=" + date_start + "&plan_date_end=" + date_end;
    // console.log('url :>> ', url_report_plan);
    window.open(url_report_plan, "reportSchedule", "", "");
}

async function checkReportName(menu_group_data) {
    if (menu_group_data == "Printing") {
        return "/showSchedule.aspx?";
    } else if (menu_group_data == 'WarehouseTrimming') {
        return "/showScheduleWHTrim.aspx?";
    } else if (menu_group_data == 'Paper Sheet') {
        return "/showSchedulePapersheet.aspx?";
    } else {
        return "/showScheduleall.aspx?";
    }
}

async function btnExcel() {
    let date_start = $.trim($("#plan_date_start").val()) != "" ? formatDate($.trim($("#plan_date_start").val())) : "";
    let date_end = $.trim($("#plan_date_end").val()) != "" ? formatDate($.trim($("#plan_date_end").val())) : "";
    let machine_type_id = $("#s_machine_type").val();
    let machine_id = $("#s_machine_id").val();
    let obj_data_excel = { planStartDate: date_start, planEndDate: date_end, machineTypeId: machine_type_id, machineId: machine_id, menuId: menuType }
    let data_excel = await getDataToExcel(obj_data_excel);
    if (data_excel.length === 0) {
        showAlertWithTimer("ไม่พบข้อมูล", "warning", 1000);
    } else {
        var url = "http://192.168.5.3/planning/scheduler/print_job_excel.php";
        url += "?plan_date_start=" + date_start + "&plan_date_end=" + date_end;
        url += "&menu_id=" + menuType + "&machine_id=" + $("#s_machine_id").val() + "&machine_type_id=" + $("#s_machine_type").val();
        window.open(url);
    }
}

async function btnPrintTest() {
    let date_start = $.trim($("#plan_date_start").val()) != "" ? formatDate($.trim($("#plan_date_start").val())) : "";
    let date_end = $.trim($("#plan_date_end").val()) != "" ? formatDate($.trim($("#plan_date_end").val())) : "";
    date_start = await checkDatePlanPrint(date_start);
    var url_report_plan = "http://192.168.5.41:8080/report_scheduler/showScheduleV2.aspx?";
    url_report_plan += "sqlin=" + menu_group_data.responseText;
    url_report_plan += "&machine_id=" + $("#s_machine_id").val() + "&machine_type_id=" + $("#s_machine_type").val();
    url_report_plan += "&plan_date_start=" + date_start + "&plan_date_end=" + date_end;
    window.open(url_report_plan, "reportScheduleV2", "", "");
}