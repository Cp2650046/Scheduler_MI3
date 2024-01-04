const currentPath = window.location.pathname;
const segments = currentPath.split('/');
const lastSegment = segments[segments.length - 1];
const menuType = lastSegment === "" ? '22' : lastSegment;

let machine_global = ""
let plan_id_copy = 0;

var globalData = [];
let machineTypeList_global = "";
let Machine_process_global = "";
var menu_group_data = {}
var ar_plans = [];
var userData = JSON.parse(localStorage.getItem("userData"));
var menuID = ""

$(document).ready(async function () {
    menu_group_data = await getMenuGroupData();
    await setDisplayPlan();
    var schedulerData = {};
    var machineTypeData, nextMachineData, machineData, actCode, statusPlan,saddle;

    var storedData = localStorage.getItem("schedulerData");
    menuID = await getCurrentMenuID()
    if (storedData) {
        console.log("มีข้อมูล LocalStorage", menuID);
        var parsedData = JSON.parse(storedData);
        machineData = parsedData.schedulerDefaultMachine.find((item) => item.menuID == menuType);
        machineTypeData = parsedData.schedulerMachineTypeList.find((item) => item.menuID == menuType);
        nextMachineData = parsedData.schedulerNextMachine
        actCode = parsedData.schedulerActCode
        statusPlan = parsedData.schedulerStatuPlanList
        saddle = parsedData.schedulerSaddleList
    } else {
        console.log("ไม่มีข้อมูล LocalStorage");
        var storedUserData = localStorage.getItem("userData");
        var parsedUserData = JSON.parse(storedUserData);
        let data = await getMenu(parsedUserData.emp_id);
        let dataNextMachine = await getNextMachine();

        schedulerData = {
            schedulerNextMachine: dataNextMachine,
            schedulerDefaultMachine: data.machineList,
            schedulerMachineTypeList: data.machineTypeList
        }

        machineData = schedulerData.schedulerDefaultMachine.find((item) => item.menuID == menuType);
        machineTypeData = schedulerData.schedulerMachineTypeList.find((item) => item.menuID == menuType);
        nextMachineData = schedulerData.schedulerNextMachine
        actCode = parsedData.schedulerActCode
        statusPlan = parsedData.schedulerStatuPlanList
        saddle = parsedData.schedulerSaddleList

        localStorage.setItem("schedulerData", JSON.stringify(schedulerData));
    }

    // console.log(machineTypeData);
    machine_global = machineData.defaultMachineList;
    Machine_process_global = nextMachineData;

    menuID === '47' ? await setOptionMachine(actCode) : await setOptionMachine(machineData.defaultMachineList);
    menuID === '49' ? await setOptionSaddle(saddle) : true;
    await setOptionMachineTabPrint(machineData.defaultMachineList);
    if (menuID === '47') {
        // console.log(menuID);
        $("[data-menu-id='47']").show();
        $("[data-menu-id='0']").hide();
        $("[data-menu-id='49']").hide();
        $("[data-menu-id='1']").show();
    } else if(menuID === '49'){
        $("[data-menu-id='49']").show();
        $("[data-menu-id='47']").hide();
        $("[data-menu-id='0']").hide();
        $("[data-menu-id='1']").hide();
    } else {
        // console.log(menuID);
        $("[data-menu-id='49']").hide();
        $("[data-menu-id='47']").hide();
        $("[data-menu-id='0']").show();
        $("[data-menu-id='1']").show();
    }
    // ประเภทเครื่องจักร
    await setOptionMachineType(machineTypeData.machineType);
    // ขั้นตอนถัดไป กับ เครื่องจักรถัดไป
    await setOptionMachineProcess(Machine_process_global);
    await setOptionMachineNext(Machine_process_global);
    await setDatepicker();

    await setStatusList(statusPlan);

    /* event AutoComplete */
    await jobidAutocomplete();
    await partnameAutocomplete();

    /* end event AutoComplete */

    //Initialize Select2 Elements
    $('#s_machine_id,#e_machine_id,#es_machine_id,#p_machine_id').select2({ placeholder: "ค้นหาด้วย ID หรือชื่อ...", allowClear: true });

    $('#e_machine_id').on('select2:select', async (e) => {
        // console.log("change");
        if (menuID !== '47') {
            var mac_id = e.params.data.id
            await getSpeed(mac_id);
        }
    })

    $('#s_machine_id,#e_machine_id,#es_machine_id,#p_machine_id').on("select2:open", function () {
        $(document).on("keydown", async function (e) {
            if (e.key === "Enter") {
                $('#s_machine_id,#e_machine_id,#es_machine_id,#p_machine_id').select2("close"); // Close the dropdown
                let select2_id = $(e.target).closest("td").find("select").attr("id");
                var selectfocus = $("#" + select2_id).attr('nextEleId');
                // console.log('canfocus_86 :>> ', selectfocus);
                if (selectfocus == "btn_search") {
                    searchPlan();
                } else {
                    $("#" + selectfocus).focus();
                }
            }
        });
        setTimeout(function () {
            if (document.querySelector(`.select2-search__field`) !== null) {
                document.querySelector(`.select2-search__field`).focus();
            }

        }, 10);

    });

    $(document).on('keypress', 'input,select', function (e) {
        if (e.which == 13) { /* event Enter*/
            e.preventDefault();
            var canfocus = $(this).attr('nextEleId');
            console.log('canfocus :>> ', canfocus);
            if (canfocus == "btn_search") {
                searchPlan();
            } else {
                $("#" + canfocus).focus();
            }
        }
    });

    $('#s_machine_id').on('change', (e) => {
        let typeID = $(e.target).find(':selected').data('typeId');
        if (typeID !== undefined) {
            $('#s_machine_type').val(typeID)
        }
    })

    $('#e_machine_id').on('change', (e) => {
        if (typeof event !== 'undefined' && event.type === 'click') {
            return
        }
        let typeID = $(e.target).find(':selected').data('typeId');
        if (typeID !== undefined) {
            calMakeReady(typeID)
        }
        fncChkCapacityLabor();
    })

    $('#e_plan_date').on('change', (e) => {
        let date_text = $('#e_plan_date').text();
        fncChkCapacityLabor(date_text);
    })

    $("[name=e_waste],[name=e_sig],[name=e_speed]").blur(function () {
        callTimeTotal();
    }).keyup(function (e) {
        if (e.keyCode == 13) {
            callTimeTotal();
        }
    });

    $('#e_hr1').blur(async function () {
        await calculateTotal();
    })

    $('#s_machine_type').on('change', async (e) => {
        if (menuID === '47') {
            return
        }
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#s_machine_id').find(':selected').data('typeId') === undefined ? "" : $('#s_machine_id').find(':selected').data('typeId').toString()

        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#s_machine_id').val(null).trigger("change");
        }

        let machineList = await getMachine(valueTypeID);
        await setOptionMachine(machineList);
        // $('#s_machine_id').select2({ placeholder: "ค้นหาด้วย ID หรือชื่อ...", allowClear: true });
    })
    $('#e_send_dep').on('change', async (e) => {
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#e_machine_id_send').find(':selected').data('typeId') === undefined ? "" : $('#e_machine_id_send').find(':selected').data('typeId').toString()
        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#e_machine_id_send').val(null).trigger("change");
        }
        await setOptionMachineNext(Machine_process_global, valueTypeID);
    })

    $("#e_machine_id_send").on('change', async (e) => {
        // let typeID = $(e.target).find('option:selected').parent('optgroup').data('typeId');
        // $('#e_send_dep').val(typeID);
    })

    $('#s_type_search').on('change', (e) => {
        const s_type_search = $('#s_type_search').val();
        if (s_type_search == 1) {
            $(".show_input_s_job").hide();
            $('[name="s_chk_plan_date"]').hide();
            $(".show_input_machine").show();
            $("#text_plan_date").text("วันที่วางแผน:");
            $(".show_input_plan_date").show();
            $("#plan_date_start,#plan_date_end").val(moment().format("DD/MM/yyyy"));
            $(".btn_print").prop("hidden", false);
            $("[name=s_job_id]").val("");
            $("[name=s_chk_plan_date]").prop("checked", false);
            $("#plan_date_start,#plan_date_end").prop("disabled", false);
        }
        else if (s_type_search == 2) {
            $(".show_input_machine").hide();
            $(".show_input_s_job").show();
            $('[name="s_chk_plan_date"]').show();
            $("#text_plan_date").text("วันที่วางแผน:");
            $(".show_input_plan_date").show();
            $('[name="s_chk_plan_date"]').show();
            $("#s_machine_id").val(null).trigger("change");
            // $('#s_machine_type').change();
            $("#plan_date_start,#plan_date_end").val(moment().format("DD/MM/yyyy"));
            $("#plan_date_start,#plan_date_end").prop("disabled", true);
            $(".btn_print").prop("hidden", true);
        }
        else if (s_type_search == 3) {
            $(".show_input_s_job").hide();
            $(".show_input_machine").hide();
            $(".show_input_plan_date").hide();
            $('[name="s_chk_plan_date"]').hide();
            $(".show_input_s_job").show();
            $("#s_machine_id").val(null).trigger("change");
            // $("#s_machine_type").val(0);
            // $('#s_machine_type').change();
            $(".btn_print").prop("hidden", true);
            $("[name=s_job_id]").val("");
            $("[name=s_chk_plan_date]").prop("checked", false);
        }
        else if (s_type_search == 4) {
            $(".show_input_s_job").hide();
            $(".show_input_machine").hide();
            $('[name="s_chk_plan_date"]').hide();
            $(".show_input_machine").hide();
            $("#text_plan_date").text("วันที่ที่ยังไม่วางแผน:");
            $(".show_input_plan_date").show();
            $("#plan_date_start,#plan_date_end").val(moment().format("DD/MM/yyyy"));
            $(".btn_print").prop("hidden", true);
            $("[name=s_job_id]").val("");
            $("#s_machine_id").val(null).trigger("change");
            $("[name=s_chk_plan_date]").prop("checked", false);
            $("#plan_date_start,#plan_date_end").prop("disabled", false);
        }
    })

    $("[name=s_chk_plan_date]").on("click", () => {
        if ($("[name=s_chk_plan_date]").is(":checked")) {
            $("#plan_date_start,#plan_date_end").prop("disabled", false);
        } else {
            $("#plan_date_start,#plan_date_end").prop("disabled", true);
        }
    })

    $("#e_jobid").on('blur', () => {
        getDataJob();
    });

    $("[name=e_priority]").on('keyup', async (e) => {
        if ($("[name=e_priority]").val() == "") {
            // await showAlertWithTimer("กรุณาระบุ Priority", "warning", 1500);
            await $("[name=e_priority]").focus();
        }
        else if ($("[name=e_priority]").val() > 10) {
            await showAlertWithTimer("กรุณาระบุ Priority ไม่เกิน 10", "warning", 1500);
            await $("[name=e_priority]").val(0);
            await $("[name=e_priority]").focus();
        }
    })

    $("[name=e_priority]").on('change', async (e) => {
        if ($("[name=e_priority]").val() == "") {
            await $("[name=e_priority]").val(0);
        }
    })

    // event manage window hieght size
    $('div.card-tools').on('click', () => {
        event.preventDefault();
        setTimeout(handleWindowResize, 450);
    })

    $('li.nav-item').on('click', async (el) => {
        event.preventDefault();
        await showTabEditPlan();
        setTimeout(handleWindowResize, 450);
    })

    $('input.number').on('focus', async (el) => {
        let inputValue = $(el.target).val();
        let sanitizedValue = inputValue.replace(/,/g, '');
        $(el.target).val(sanitizedValue).select();
    }).on('input', async (el) => {
        let inputValue = $(el.target).val();
        let sanitizedValue = inputValue.replace(/[^0-9,\.]/g, '');
        sanitizedValue = sanitizedValue.replace(/([,\.])+/g, '$1');
        $(el.target).val(sanitizedValue);
    }).on('blur', async (el) => {
        let inputValue = $(el.target).val();
        if ($.trim(inputValue) !== "" && $(el.target).hasClass('decimal')) {
            let formattedValue = parseFloat(inputValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            $(el.target).val(formattedValue);
        } else if ($.trim(inputValue) !== "" && $(el.target).hasClass('int')) {
            const inputValue = Math.round(parseFloat($(el.target).val()));
            let formattedValue = inputValue.toLocaleString();
            $(el.target).val(formattedValue);
        }
    })

    await settingDataTable('#tb_plans');

    window.addEventListener('resize', handleWindowResize);
    setTimeout(handleWindowResize, 450);
    // end manage window hieght size

    //event begin tab edit multiple plan
    $("#check_plans").on("click", () => {
        if ($("#check_plans").is(":checked")) {
            $(".check_plan").prop("checked", true)
            ar_plans = []
            for (let i = 0; i < $(".check_plan:checked").length; i++) {
                ar_plans.push($(".check_plan:checked")[i].value)
            }
        } else {
            $(".check_plan").prop("checked", false)
            ar_plans = []
        }
        // console.log('247 :>> ', ar_plans);
    })

    $(document).on('click', '.check_plan', function () {
        if ($(this).is(":checked")) {
            ar_plans.push($(this).val())
        } else {
            console.log('plan_check not :>> ', $(this).val());
            ar_plans = ar_plans.filter(item => item !== $(this).val())
        }
        // console.log('array :>> ', ar_plans);
    });

    //end tab edit multiple plan
    //event begin tab print plan
    $("[name=s_print]").on("click", () => {
        if ($("#s_print_2").is(":checked")) {
            $("#tr_show_machine").show()
        } else {
            $("#tr_show_machine").hide();
        }
    })

    // $("#print_job_tab").on("click", () => {
    //     $("#scheduler_tab3").hide();
    //     $("#scheduler_tab4").hide();
    // })
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

    $('#p_machine_type').on('change', async (e) => {
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#p_machine_id').find(':selected').data('typeId') === undefined ? "" : $('#p_machine_id').find(':selected').data('typeId').toString()

        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#p_machine_id').val(null).trigger("change");
        }

        let machineList = await getMachine(valueTypeID);
        await setOptionMachineTabPrint(machineList);
    })
    //end tab print plan
});

async function toggleNav(navId = "") {
    if (navId == "") {
        navId = $("#edit_one_plan_tab").hasClass("nav-link active") == true ? "edit_one_plan_tab" : "edit_multi_plan_tab"
    }
    if (navId == 'edit_multi_plan_tab') {
        $('.checkbox_plan').css("display", "revert");
    } else {
        $('.checkbox_plan').css("display", "none");
    }
}

async function setDisplayPlan() {
    // $("#s_type_search").val($("#s_type_search option:first").val());
    $('span.input_total').text(0);
    await resetSeachPlan();
    await btnReset();
    await resetInputPrintPlan();
    $('.checkbox_plan').hide();
    return
}

async function settingDataTable(tableName) {
    $(tableName).DataTable({
        order: [],
        searching: false,
        paging: false,
        info: false,
        "columnDefs": [
            { "orderable": false, "targets": 0 } // Disable sorting for column 0
        ]
    });
}

async function handleWindowResize() {
    const tab1 = $('#scheduler_tab1').height();
    const tab2 = $('#scheduler_tab2').height();
    const tab4 = $('#scheduler_tab4').height();

    let screenHeight = $(window).height();
    let allTabHeight = (tab1 + tab2 + tab4 + 50);
    screenHeight = screenHeight - allTabHeight;
    let height = Number(screenHeight.toFixed(2));
    $('#scheduler_tab3>div.card-body').height(height);

    // console.log($(window).height(), allTabHeight, height);
}

async function getCurrentMenuID() {
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/');
    return urlParts[urlParts.length - 1];
}

async function showTabEditPlan() {
    if ($('div#scheduler_tab2.card').hasClass('collapsed-card') === true) {
        $('div#scheduler_tab2 button.btn-tool').click()
    }
}

async function setOptionMachine(machineList) {
    var machineListOption = '<option></option>';
    if (menuID === '47') {
        machineListOption = `<option data-machine-id="0" value="0">ทั้งหมด</option>`
    }
    machineList.forEach((item, index) => {
        if (menuID === '47') {
            let machine_id = item.act_name.substring(0, 4)
            // console.log(machine_id);
            machineListOption += `<option data-machine-id="${machine_id}" value="${item.act_code}">${item.act_name}</option>`
        } else {
            machineListOption += `<option value="${item.machine_id}" data-type-id="${item.type_id}">${item.machine_id} :: ${item.machine_name}</option>`
        }

    });
    $("#s_machine_id,#e_machine_id,#es_machine_id").html(machineListOption);
}

async function setOptionMachineType(machineTypeList) {
    if (menuType === '22') {
        var machineTypeListOption = '<option value="0">ทั้งหมด</option>';
    }
    machineTypeList.forEach((item, index) => {
        machineTypeListOption += `<option value="${item.type_id}">${item.type_name}</option>`
    });
    $("#s_machine_type,#p_machine_type").html(machineTypeListOption);
}

async function setDatepicker() {
    $('#plan_date_start,#plan_date_end,#es_plan_date,#p_date_start,#p_date_end').datepicker({
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        showOtherMonths: true,
        selectOtherMonths: true
    });

    $('#e_plan_date').datepicker({
        dateFormat: "dd/mm/yy",
        changeMonth: true,
        changeYear: true,
        showOtherMonths: true,
        selectOtherMonths: true,
    });
}

async function jobidAutocomplete(method) {
    method = (typeof method == 'undefined' ? '1' : method);
    if (method == '1') {
        var datasource = ["PM", "PM รายสัปดาห์", "Breakdown", "5 ส", "Waiting", "ไม่มีช่าง", "เปลี่ยนกะ", "Mockup ขาว", "ทำความสะอาดเครื่อง", "ติดตั้งอะไหล่", "อื่นๆ"];
    } else {
        var datasource = ["ส่ง Sub", "ช่วยงานหน่วยงานอื่น", "5 ส"];
    }
    $('#e_jobid').autocomplete({
        minLength: 0,
        source: datasource,
        search: function (e, u) {
            $('#e_jobid').autocomplete({
                source: datasource
            });
        },
        focus: function (event, ui) {
            $('#e_jobid').val(ui.item.label)
        },
        select: function (event, ui) {
            if (!ui.item) {
                $('input[name=e_jobid]').val(ui.item.label)
            }
            getDataJob();
            return false
        },
        change: function (event, ui) {
            if (!ui.item) {
                $('input[name=e_job_name]').val('')
                $('input[name=e_ae_name]').val('')
            }
        }

    }).autocomplete('instance')._renderItem = (ul, item) => {
        return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<a class="form-control-sm item-autocomplete">' + item.label + '</a>')
            .appendTo(ul);

    }
    $("#e_jobid").click(function () {
        $("#e_jobid").autocomplete('search');
    });
}

async function getDataJob() {
    // method = (typeof method == 'undefined' ? '1' : method);
    const jobid = $('#e_jobid').val();
    if (jobid) {
        var data_r = await getJob(jobid);
        if (data_r.length > 0) {
            $('[name="e_job_name"]').val(data_r[0].job_name);
            $('[name="e_ae_name"]').val(data_r[0].fullname);
            if (data_r[0].due1 != null) {
                $('[name="e_due1"]').val(convertDateThai(data_r[0].due1));
            }
            var qty1 = data_r[0].qty1;
            if (qty1) {
                $('[name="e_quantity"]').val(numeral(qty1).format('0,0'));
            }
        } else {
            $('[name="e_job_name"]').val("");
            $('[name="e_ae_name"]').val("");
            $('[name="e_due1"]').val("");
            $('[name="e_quantity"]').val("");
        }
    } else {
        $('[name="e_job_name"]').val("");
        $('[name="e_ae_name"]').val("");
        $('[name="e_due1"]').val("");
        $('[name="e_quantity"]').val("");
    }
    // if (method == 1) {
    await chk_job_default_mid();
    // }
}

async function chk_job_default_mid() {
    var job_default = ["PM", "PM รายสัปดาห์", "Breakdown", "5 ส", "Waiting", "ไม่มีช่าง", "เปลี่ยนกะ", "Mockup ขาว", "อื่นๆ"]
    var jobid = $('#e_jobid').val();
    let is_job_default = (job_default.includes(jobid) ? true : false);
    if (is_job_default) {
        $('#e_hr1').attr('readonly', false);
        return false;
    } else {
        $('#e_hr1').attr('readonly', true);
    }
    // if (type != "buttom") {
    //     callAllTime();
    // }
}

async function setStatusList(statusList) {
    var StatusListOption = '<option value=""></option>';
    statusList.forEach((item, index) => {
        StatusListOption += `<option value="${item.job_status_id}">${item.job_status_name}</option>`;
    });
    $("#e_job_status_id").html(StatusListOption);
}

async function setOptionMachineProcess(machineProcessList) {
    var machineProcessListOptionSend = '<option value=""></option>';
    var machineProcessListOptionRecive = '<option value=""></option>';
    machineProcessList.forEach((item, index) => {
        machineProcessListOptionRecive += `<option value="${item.typeName}">${item.typeName}</option>`;
        machineProcessListOptionSend += `<option value="${item.typeId}">${item.typeName}</option>`;
    });
    $("#e_recive_dep").html(machineProcessListOptionRecive);
    $("#e_send_dep").html(machineProcessListOptionSend);
}

async function setOptionMachineNext(Machine_process_list, valueTypeID = 0) {
    if (valueTypeID == 0) {
        var MachineNextOption = '<option value=""></option>';
        Machine_process_list.forEach((item, i) => {
            // console.log(item);
            MachineNextOption += '<optgroup data-type-id="' + item.typeId + '" label="' + item.typeName + '">';
            item.machineList.forEach((item2, k) => {
                if (item.typeId == item2.machine_process_id) {
                    MachineNextOption += '<option value="' + item2.machine_id + '">' + item2.machine_id + '::' + item2.machine_name + '</option>';
                }
            })
            MachineNextOption += '</optgroup>';
        })
    } else {
        var MachineNextOption = '';
        let rs_machineList = Machine_process_list.find((element) => element.typeId == valueTypeID);
        rs_machineList.machineList.forEach((items, k) => {
            MachineNextOption += '<option value="' + items.machine_id + '">' + items.machine_id + '::' + items.machine_name + '</option>';
        })
    }
    $("#e_machine_id_send").html(MachineNextOption);
}

async function getSpeed(machine_id) {
    if (machine_id) {
        const rs_get_speed = machine_global.find(items => items.machine_id == machine_id)
        if (rs_get_speed.speed >= 0) {
            $("[name=e_speed]").val(numeral(rs_get_speed.speed).format('0,0'));
        }
    }
    calMakeReady();
    callTimeTotal();
}

async function calculateTotal() {
    var hr1 = $('#e_hr1').val();
    var data = hr1.split(".");
    if (data[1] >= 60) {
        showAlertWithTimer("ค่า Total หลังจุดต้องไม่เกิน .59 ", "warning", 1500);
        callAllTime();
        $('#e_hr1').focus();
        return false;
    }
    var data_2 = ((parseFloat(data[1]) * 100) / 60).toFixed(0);
    if (data_2 < 10) { data_2 = "0" + data_2; }
    $('#e_hr').val(data[0] + "." + data_2);
}

function callAllTime(mc_id) {
    getSpeed(mc_id);
    calMakeReady();
    callTimeTotal();
}

function calMakeReady() {
    var machine_type_id = $("#e_machine_id").find(':selected').data('typeId');
    var machine_id = $('#e_machine_id').find(':selected').val();
    // console.log('machine_type_id :>> ', machine_type_id);
    // console.log('machine_id :>> ', machine_id);

    if (machine_type_id == '34' || machine_type_id == '35') {//Web && Sheet
        /*if(machine_id=='3603' || machine_id=='3604'){
            // ปรับให้ make ready 2  hr./frame
            var make_ready = parseFloat($('#e_sig').val().split(",").join(""))/(parseInt($('input[name=e_sig_num]:checked').val()) *0.5); 
        }else{
            
            var make_ready = parseFloat($('#e_sig').val().split(",").join(""))/parseInt($('input[name=e_sig_num]:checked').val());
        }*/
    } else if (machine_type_id == '41' || machine_type_id == '42' || machine_type_id == '43' || machine_type_id == '44' ||
        machine_type_id == '45' || machine_type_id == '46' || machine_type_id == '47' || machine_type_id == '51') {
        // console.log('347 :>> ');
        let rs_machine = machine_global.find(items => items.machine_id == machine_id);
        let array_machine_condition = ['5503', '5504', '5505', '5506', '5507', '5510', '5512']; /* ใช้ make_ready ตาม setting */
        var make_ready = (array_machine_condition.includes(machine_id) ? rs_machine.make_ready : 0)
        /*switch (machine_id) { code เก่า
            case '5501': make_ready = 1; break;
            case '5502': make_ready = 2; break;
            case '5503': make_ready = rs_machine.make_ready; break;
            case '5504': make_ready = 0.75; break;
            case '5505': make_ready = 1.50; break;
            case '5506': make_ready = 0.33; break;
            case '5507': make_ready = 0.33; break;
            case '5510': make_ready = 0.75; break;
            case '5511': make_ready = 1; break;
            case '5512': make_ready = 1; break;
            default: make_ready = 0;
        }*/
    } else {
        var make_ready = parseFloat($('[name=e_sig]').val().split(",").join("")) / 1; //5501,5502,5511
    }
    if (make_ready) {

        $("[name=e_make_ready]").val(numeral(make_ready).format('0,0.00')); //5503,5505,5506,5507,5510
    } else {
        $("[name=e_make_ready]").val("0"); //5508
    }
    /*if($.trim($('input[name=e_sig_num]:checked').val())==""){ // ยังไม่ใช้
        $('#e_make_ready').val("0.00");
    }*/
}

function callTimeTotal() {
    var paper_loss = parseFloat($('[name=e_waste]').val().split(",").join(""));
    var speed = parseFloat($('[name=e_speed]').val().split(",").join(""));
    var make_ready = parseFloat($('[name=e_make_ready]').val().split(",").join(""));
    var perfecting = 1
    var wait_dry = 0
    /* var perfecting = parseFloat($("input[name=e_sig_num]:checked").val()); 
    var wait_dry = parseFloat($('#e_wait_dry').val().split(",").join(""));*/
    var e_sig = parseFloat($('[name=e_sig]').val().split(",").join(""));
    if (speed == 0) speed = 1;
    /*if (menu_group_data == "Printing") {
        perfecting = e_sig / perfecting;
    } else {
        perfecting = 1 * e_sig;
        wait_dry = 0;
    }*/
    perfecting = 1 * e_sig;
    var process_100 = (paper_loss / speed) * perfecting;
    // console.log('process_100 :>> ', convertTime(process_100));
    var process_60 = String(convertTime(process_100)).replace(/:/, '.');
    $('#e_process_time').val(numeral(process_100).format('0,0.00'));
    $('#e_process_time1').val(numeral(process_60).format('0,0.00'));
    ///######## Total Time
    var total_100 = 0;
    var total_60 = 0;
    total_100 = wait_dry + make_ready + process_100;
    total_60 = String(convertTime(total_100)).replace(/:/, '.');
    // output
    $('#e_hr1').val(numeral(total_60).format('0,0.00'));
    $('#e_hr').val(numeral(total_100).format('0,0.00'));
    /// 
    if (speed <= 0 || paper_loss <= 0) {
        $('#e_process_time').val("0.00");
        $('#e_process_time1').val("0.00");
        $('#e_hr1').val("0.00");
        $('#e_hr').val("0.00");
    }
}

async function resetSeachPlan() {
    $("[name=s_job_id]").val('');
    $("#s_machine_type").val(0);
    $('#s_machine_type').change();
    $("#select2-s_machine_id-container").val('');
    $("#s_shift_id").val(0);
    $("[name=s_chk_plan_date]").prop("checked", false);
    $('#s_type_search').val('1');
    $('#s_type_search').change();
    if (event != undefined && event.type == "click") {
        await resetDataTable();
        $('span.input_total').text(0);
    }
    $("#plan_date_start,#plan_date_end,#es_plan_date,#p_date_start,#p_date_end").val(moment().format("DD/MM/yyyy"));
    await btnReset();
    await resetInputPlans();
}

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
        , menuID: menuID
    }
    // console.log(obj_search_data);
    // await main_set_table_loading({ loading: true, message: 'LOADING ...' }, ".div_table_plan");
    await resetInputPlans();
    await getPlanSearch(obj_search_data)
}

async function btnInsert() {
    const message_confirm = "ยืนยันการ" + $("#btn_insert").attr("title");
    let obj = {
        title: message_confirm,
        text: ""
    }
    await showAlertConfirm('add', obj);
}

async function btnReset() {
    // if (event !== undefined && event.target.tagName === 'BUTTON') {
    $('#tb_plans tbody tr').removeClass('rowSelected');
    if ($('#tb_plans tbody tr td').hasClass("color-row-select")) {
        $('#tb_plans tbody tr td').removeClass('color-row-select');
    }
    // }
    $("[name=e_id]").val("");

    $("#e_save_type").val("1");
    $("#e_send_dep").val('');
    $("#e_machine_id_send").val('');
    $("#e_plan_date").val('');
    $("#e_jobid").val("")
    $("#e_shift_id").val(0);
    $("[name=e_job_name]").val("");
    $("[name=e_sig]").val(0);
    $("[name=e_priority]").val(0);
    $("[name=e_waste]").val(0);
    $("[name=e_quantity]").val(0);
    $("[name=e_paper_type]").val("");
    $("[name=e_paper_size]").val("");
    $("[name=e_recive_dep]").val("");
    $("[name=e_ae_name]").val("");
    $("[name=e_due1]").val("");
    $("[name=e_job_status_id]").val("");
    $("[name=e_partName]").val("");
    $("[name=e_detail]").val("");
    $("[name=e_make_ready]").val("1.00");
    $("[name=e_process_time1]").val("0.00");
    $("[name=e_speed]").val(0);
    $("[name=e_hr1]").val("0.00");
    $("[name=e_capacity_labor]").val(0);
    $("[name=e_remark]").val("");
    $("[name=e_recive_dep]").val("");
    $("[name=e_machine_send_remark]").val("");
    $("[name=e_others]").val("");
    $("#e_machine_id").val(null).trigger('change');
    $("#e_itid").val(0);
    /* $("#e_sig_num1").attr("checked",true); ยังไม่มี */
    plan_id_copy = 0;
    // $("#e_btn_copy").removeClass("disabled");
    $(".btn_plan").removeClass("disabled");

}

async function btnSave() {
    const status_save = $("#e_save_type").val();
    // console.log(status_save);
    var confirmMsg = "";
    if (status_save == 4) {
        if ($.trim($("#e_plan_date").val()) == "") {
            showAlertWithTimer("กรุณากรอกวันที่วางแผน", "warning", 1500);
            $("#e_plan_date").focus();
            return false;
        }
        if ($.trim($("#e_jobid").val()) == "") {
            showAlertWithTimer("กรุณากรอก Job", "warning", 1500);
            $("#e_jobid").focus();
            return false;
        }
        if ($("#e_shift_id").val() == 0) {
            showAlertWithTimer("กรุณาเลือกประเภทกะ", "warning", 1500);
            $("#e_shift_id").focus();
            return false;
        }
        if ($.trim($("#e_sig").val()) == "0") {
            showAlertWithTimer("กรุณากรอกยกต่อวัน", "warning", 1500);
            $("#e_sig").focus();
            return false;
        }

        if ($.trim($("#e_send_dep").val()) == "") {
            showAlertWithTimer("กรุณาเลือกขั้นตอนถัดไป", "warning", 1500);
            $("#e_send_dep").focus();
            return false;
        }
        if ($.trim($("#e_machine_id_send").val()) == "") {
            showAlertWithTimer("กรุณาเลือกเครื่องจักรถัดไป", "warning", 1500);
            $("#e_machine_id_send").focus();
            return false;
        }
        if(menuID == '49'){
            if($("#e_saddle_detail_id").attr('selected',true).val() == ""){
                showAlertWithTimer("กรุณาเลือกขั้นตอนงาน", "warning", 1500);
                $("#e_saddle_detail_id").focus();
                return false;
            }
        }

        if (($("#e_machine_type_id").val() == "34" || $("#e_machine_type_id").val() == "35"
            || $("#e_machine_type_id").val() == "12" || $("#e_machine_type_id").val() == "10"
            || $("#e_machine_type_id").val() == "14" || $("#e_machine_type_id").val() == "16"
            || $("#e_machine_type_id").val() == "24" || $("#e_machine_type_id").val() == "25"
            || $("#e_machine_type_id").val() == "26")
            && $.trim($("#e_ae_name").val()) != ""
        ) {
            var job_default = ["PM", "Breakdown", "5 ส", "Waiting", "ไม่มีช่าง", "เปลี่ยนกะ", "Mockup ขาว", "ทำความสะอาดเครื่อง", "อื่นๆ"];
            var jobx = $("#e_jobid").val()
            const has_alert = job_default.some((item) => {
                return item == jobx
            })
            if ($.trim($("#e_itid").val()) == "0" && has_alert == false) {
                showAlertNotiWarning("กรุณาเลือกชิ้นส่วน");
                $("#e_partName").focus();
                return false;
            }
        }
        var job_default = ["PM", "Breakdown", "5 ส", "Waiting", "ไม่มีช่าง", "เปลี่ยนกะ", "Mockup ขาว", "ทำความสะอาดเครื่อง", "อื่นๆ"];
        var jobid = $('#e_jobid').val();
        // var chk_job = "0";
        const chk_job = job_default.some((item) => {
            return item == jobid
        })
        if (chk_job == false) {
            if ($.trim($("[name=e_waste]").val()) == 0) {
                showAlertNotiWarning("กรุณากรอกจำนวน");
                $("[name=e_waste]").focus();
                return false;
            }
            if ($.trim($("[name=e_quantity]").val()) == 0) {
                showAlertNotiWarning("กรุณากรอกยอดงาน");
                $("[name=e_quantity]").focus();
                return false;
            }
        }
        if ($.trim($("#e_machine_id").val()) == "") {
            showAlertNotiWarning("กรุณาเลือกเครื่องจักร");
            $("#e_machine_id").focus();
            return false;
        }
    }
    var obj_save = await keepValue();
    // console.log(obj_save);
    // return
    if (status_save == "1") {
        if ($("[name=e_id]").val() == "") {
            await showAlertNotiWarning("กรุณาเลือกข้อมูลที่ต้องการแก้ไข");
            return false;
        }
        confirmMsg = await getConfirmMessage(status_save);
        let obj = {
            title: confirmMsg,
            text: "",
            obj_save
        }
        await showAlertConfirm('update', obj);
    }
    if (status_save == "2" || status_save == "4") {
        confirmMsg = await getConfirmMessage(status_save);
        let obj = {
            title: confirmMsg,
            text: "",
            obj_save
        }
        await showAlertConfirm('save', obj);
    }
}

async function keepValue() {
    // console.log($("#e_machine_id").find('option:selected').data('machineId'));
    const e_plan_date = $("#e_plan_date").val() != "" ? formatDate($("#e_plan_date").val()) : "";
    const e_id = $("#e_id").val();
    const e_id_cut = $("#e_id_cut").val();
    const e_jobid = $("#e_jobid").val().replace("'", "''");
    const e_priority = $("[name=e_priority]").val().replace(/,/g, '');
    const e_job_name = $("[name=e_job_name]").val();
    const e_ae_name = $("[name=e_ae_name]").val();
    const e_due1 = $("[name=e_due1]").val();
    const e_job_status_id = $("[name=e_job_status_id]").val();
    const e_partName = $("[name=e_partName]").val().replace("'", "''");
    const e_detail = $("[name=e_detail]").val().replace("'", "''");
    const e_shift_id = $("#e_shift_id").val();
    const e_sig = $("[name=e_sig]").val().replace(/,/g, '');
    const e_waste = $("[name=e_waste]").val().replace(/,/g, '');
    const e_quantity = $("[name=e_quantity]").val().replace(/,/g, '');
    const e_make_ready = $("[name=e_make_ready]").val().replace(/,/g, '');
    const e_speed = $("[name=e_speed]").val().replace(/,/g, '');
    const e_itid = $("#e_itid").val();
    const e_process_time1 = $("#e_process_time1").val().replace(/,/g, '');
    const e_hr1 = $("#e_hr1").val().replace(/,/g, '');
    const e_process_time = $("#e_process_time").val().replace(/,/g, '');
    const e_hr = $("#e_hr").val().replace(/,/g, '');
    const e_paper_type = $("[name=e_paper_type]").val().replace("'", "''");
    const e_paper_size = $("[name=e_paper_size]").val().replace("'", "''");
    const e_recive_dep = $("#e_recive_dep").val();
    const e_send_dep = $("#e_send_dep").val();
    const e_remark = $("[name=e_remark]").val().replace("'", "''");
    const e_capacity_labor = $("[name=e_capacity_labor]").val().replace(/,/g, '');;
    const e_master_capacity_labor = $("#e_master_capacity_labor").val();
    const e_machine_id_send = $("#e_machine_id_send").val();
    const keyDate = moment().format("YYYY-MM-DD HH:mm:ss");
    const datePlateIn = "";
    const datePaperIn = "";
    const dateInkIn = "";
    const waterbase = "";
    const varnish = "";
    const e_sig_num = 0;
    const e_wait_dry = "";
    const saleman_id = userData.emp_id;
    const e_okdate = "";
    /* ยังไม่มี 
    const e_sig_num = $("input[name*=e_sig_num]:checked").val(); ยังไม่มี 
    const e_wait_dry = $("#e_wait_dry").val();
    const e_date_plate_in = $("#e_date_plate_in").val(); 
    const e_date_paper_in = $("#e_date_paper_in").val();
    const e_date_ink_in = $("#e_date_ink_in").val();
    const e_waterbase = $("#e_waterbase").val();
    const e_varnish = $("#e_varnish").val();
    const e_okdate = $('#e_okdate').val();
    const scheduler_autoMove = '<?=$_GET['scheduler_autoMove']?>';
    const autoMove = '<?=$_GET['autoMove']?>';
    const menu_id = '<?=$_GET['menu_id']?>';
    const coyp_id = coyp_id;
    */
    var obj_data_plan = {
        menu_id: menuID
        , e_plan_date
        , plan_id: e_id
        , e_id_cut
        , e_jobid
        , e_priority
        , e_job_name
        , e_ae_name
        , e_due1
        , e_job_status_id
        , e_partName
        , e_detail
        , e_shift_id
        , e_sig
        , e_waste
        , e_quantity
        , e_machine_id
        , e_make_ready
        , e_speed
        , e_process_time1
        , e_hr1
        , e_process_time
        , e_hr
        , e_paper_type
        , e_paper_size
        , e_recive_dep
        , e_send_dep
        , e_remark
        , e_capacity_labor
        , e_master_capacity_labor
        , e_machine_id_send
        , e_itid
        , keyDate
        , datePlateIn
        , datePaperIn
        , dateInkIn
        , waterbase
        , varnish
        , e_sig_num
        , e_wait_dry
        , saleman_id
        , e_okdate
        , plan_id_copy
    }

    if (menuID === '47') {
        obj_data_plan.act_code = $("#e_machine_id").val()
        obj_data_plan.e_machine_id = $("#e_machine_id").find('option:selected').data('machineId');
    }else if (menuID === '49') {
        obj_data_plan.saddle_detail_id = $("e_saddle_detail_id").val()
    }else {
        obj_data_plan.e_machine_id = $("#e_machine_id").val()
    }
    // return
    console.log(obj_data_plan);
    return obj_data_plan;
}

async function getConfirmMessage(status_save) {

    if (status_save == "1") {
        return "ยืนยันการบันทึก แก้ไขข้อมูล";
    } if (status_save == "2") {
        return "ยืนยันการบันทึก คัดลอกข้อมูล";
    } if (status_save == "3") {
        return "ยืนยันการบันทึก ลบข้อมูล";
    } if (status_save == "4") {
        return "ยืนยันการบันทึก เพิ่มข้อมูล";
    } if (status_save == "5") {
        return "ยืนยันการบันทึก ยกเลิกวางแผน";
    }
}

async function partnameAutocomplete(method = "") {
    var machine_id = ""
    var e_job = ""
    $('#e_partName').autocomplete({
        minLength: 0,
        search: function (e, u) {
            $('#e_partName').autocomplete({
                source: async function (request, response) {
                    let itemlist = await getItem(machine_id, request.term, e_job);
                    return response(itemlist)
                }
            });
        },
        focus: function (event, ui) {
            $('#e_partName').val(ui.item.partName)
        },
        select: function (event, ui) {
            $('#e_partName').val(ui.item.partName);
            if (method == 'Printing') {
                $("[name=e_detail]").val(html_entity_decode(ui.item.detail));
            }
            $("#e_itid").val(ui.item.itid);
            return false
        },
        change: function (event, ui) {
            if (!ui.item && $.trim($("[name=e_ae_name]").val()) != "") {
                $("#e_itid").val("0");
            }
        },
        classes: {
            "ui-autocomplete": "ui-autocomplete-partname"
        }

    }).autocomplete('instance')._renderItem = (ul, item) => {
        return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm item-autocomplete">' + item.partName + "::" + item.detail + '</div>')
            .appendTo(ul);

    }
    $('#e_partName').click(async function () {
        machine_id = $("#e_machine_id").val();
        e_job = $("#e_jobid").val();
        await $('#e_partName').autocomplete('search');
    });
}

async function fncChkCapacityLabor(dateText = "") {
    var e_machine_id = $('#e_machine_id').val();
    var e_plan_date = "";

    if ($.trim(dateText) == "") {
        e_plan_date = $("#e_plan_date").val() != "" ? formatDate($("#e_plan_date").val()) : "";
    } else {
        e_plan_date = formatDate(dateText);
    }

    if (!e_machine_id) {
        return
    }

    if (!e_plan_date) {
        return
    }

    let master_capacity_labor = await getCapacityLabor(e_machine_id, e_plan_date, menuID);
    $("[name=e_capacity_labor],#e_master_capacity_labor").val(master_capacity_labor);


}

async function btnCancel() {
    const planId = $("#e_id").val();
    const e_machine_id = $.trim($("#e_machine_id").val())
    if (planId === "") {
        await showAlertNotiWarning('กรุณาเลือกข้อมูลที่ต้องการยกเลิกแผน');
        return false;
    }
    if (e_machine_id == "") {
        await showAlertNotiWarning("รหัสงาน : " + planId + " ไม่มีการวางแผนงานอยู่แล้ว");
        return false;
    }

    let obj = {
        planId,
        machineId: e_machine_id,
        title: `ต้องการยกเลิกแผน ${planId} หรือไม่ ?`,
        text: "",
        func: eventCancelPlan
    }
    await showAlertConfirm('cancel', obj);
}

async function eventCancelPlan(plan_id, machineId, empId = '') {
    $("#e_save_type").val("5");
    await cancelPlan({ plan_id, machineId, empId })
        .then((success) => {
            if (success === 1) {
                showAlertNotiSuccess('ยกเลิกแผนสำเร็จ')
                $('#btn_search').trigger('click');
            } else if (success === 2) {
                showAlertNotiError('เนื่องจากแผนนี้มีการทำ timesheet ไปแล้ว จึงไม่สามารถยกเลิกได้')
            }
        }).catch((error) => {
            console.error(error.message)
        })
}

async function btnDelete() {
    const planId = $("#e_id").val();
    if (planId === "") {
        await showAlertNotiWarning('กรุณาเลือกข้อมูลที่ต้องการลบ');
        return false;
    }

    let obj = {
        planId,
        title: `ต้องการลบแผน ${planId} หรือไม่ ?`,
        text: "เมื่อลบแผนแล้วจะไม่สามารถเรียกคืนได้",
        func: eventDeletePlan
    }
    await showAlertConfirm('delete', obj);
}

async function eventDeletePlan(plan_id) {
    $("#e_save_type").val("3");
    await deletePlan(plan_id, userData.emp_id)
        .then((success) => {
            if (success === 1) {
                showAlertNotiSuccess('ลบแผนสำเร็จ')
                $('#btn_search').trigger('click');
            } else if (success === 2) {
                showAlertNotiError('เนื่องจากแผนนี้มีการทำ timesheet ไปแล้ว จึงไม่สามารถลบได้')
            }
        }).catch((error) => {
            console.error(error.message)
        })
}

async function decimalToMinuteSecond(decimalNumber) {
    let res = 0
    let minutes = Math.floor(decimalNumber); // Extract the whole minutes
    let seconds = decimalNumber - minutes; // Calculate the seconds

    if (seconds >= 0.60) {
        seconds = seconds - 0.60
        res = minutes + 1 + seconds
    } else {
        res = minutes + seconds
    }
    // console.log(res);
    return res
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
        // console.log(plan.send_dep);
        let classShiftName = "";
        // console.log(plan.sig, plan.machine_id);
        totalRow++;
        if (plan.machine_id !== "") {
            totalWaste += parseFloat(plan.waste);
            totalSig += parseFloat(plan.sig);

            if (plan.shift_id === 1) {
                classShiftName = "color_day";
                totalDaytime += parseFloat(plan.hr1)
                totalDaytime = await decimalToMinuteSecond(totalDaytime)
            } else if (plan.shift_id === 2) {
                classShiftName = "color_night";
                totalNight += parseFloat(plan.hr1)
                totalNight = await decimalToMinuteSecond(totalNight)
            }
        }
        // console.log(plan.machine_id, plan.machine_name);
        // console.log(plan);
        str += `<tr id="${plan.id}" onclick="setDataPlan('${plan.id}', $(this))">`
        str += `
        <td class="center checkbox_plan"><input type="checkbox" class="check_plan" value="${plan.id}" /></td>
        <td>${plan.id}</td>
        <td class="center">${plan.priority}</td>
        <td class="center">${plan.jobid}</td>
        <td class="left">${plan.job_name}</td>
        <td>${plan.hr1}</td>
        <td class="center">${plan.plan_date}</td>
        <td class="left">${plan.machine_detail}</td>
        <td class="center" data-menu-id="0">${plan.machine_id}</td>
        <td class="left" data-menu-id="0">${plan.machine_name}</td>
        <td class="left" data-menu-id="47">${(plan.act_name) ? plan.act_name : ''}</td>
        <td class="center">${plan.job_status_name}</td>
        <td class="center ${classShiftName}">${plan.shift_name}</td>
        <td class="left">${plan.partName}</td>
        <td class="left">${plan.detail}</td>
        <td>${plan.sig}</td>
        <td class="left" data-menu-id="49">${(plan.saddle_detail_name) ? plan.saddle_detail_name : ''}</td>
        <td>${plan.paper_size}</td>
        <td>${plan.paper_type}</td>
        <td class="center">${plan.saleman_id}</td>
        <td class="center">${plan.key_date}</td>
        <td>${numeral(plan.quantity).format('0,0')}</td>
        <td>${numeral(plan.waste).format('0,0')}</td>
        <td>${plan.make_ready}</td>
        <td>${plan.process_time1}</td>
        <td>${numeral(plan.speed).format('0,0.00')}</td>
        <td class="center" data-menu-id="1">${plan.date_paper_in}</td>
        <td class="center">${plan.due1}</td>
        <td class="center" data-menu-id="1">${plan.date_plate_in}</td>
        <td class="center" data-menu-id="1">${plan.date_ink_in}</td>
        <td class="center" data-menu-id="1">${plan.waterbase}</td>
        <td class="center" data-menu-id="1">${plan.varnish}</td>
        <td class="center">${plan.recive_dep}</td>
        <td class="left">${plan.send_dep_name}</td>
        <td class="left">${plan.remark}</td>
        <td class="center is_printing" data-menu-id="1">${plan.ok_date} ok_date</td>
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

    // console.log(menuID);
    if (menuID === '47') {
        $("td[data-menu-id='47']").show()
        $("td[data-menu-id='0']").hide()
        $("td[data-menu-id='49']").hide()
        $("td[data-menu-id='1']").show()
    }else if (menuID === '49') {
        $("td[data-menu-id='49']").show()
        $("td[data-menu-id='1']").hide()
    }  else {
        $("td[data-menu-id='49']").hide()
        $("td[data-menu-id='47']").hide()
        $("td[data-menu-id='0']").show()
        $("td[data-menu-id='1']").show()
    }
}

async function setDataPlan(planId, el) {
    if ($(event.target).hasClass('check_plan')) {
        return
    }
    $('#tb_plans tbody tr').removeClass('rowSelected');
    if ($('#tb_plans tbody tr td').hasClass("color-row-select")) {
        $('#tb_plans tbody tr td').removeClass('color-row-select');
    }
    var is_navId = $("#edit_one_plan_tab").hasClass("nav-link active") == true ? "edit_one_plan_tab" : "edit_multi_plan_tab"
    if (is_navId != 'edit_multi_plan_tab') {
        el.addClass('rowSelected');
        if (el.children().hasClass("color_day")) {
            el.find('.color_day').addClass('color-row-select');
        } else if (el.children().hasClass("color_night")) {
            el.find('.color_night').addClass('color-row-select');
        }
    }
    $(".btn_plan").removeClass("disabled")



    const filteredData = globalData.filter(function (item) {
        return item.id === planId;
    });

    setDataInput(filteredData[0]);
}

async function setDataInput(obj) {
    // console.log('1173 :>> ', obj);
    // return
    // await btnReset();
    $("#e_send_dep").val("").change();
    $("[name=e_id]").val(obj.id);
    $("#e_send_dep").val(obj.send_dep).change();
    $("#e_machine_id_send").val(obj.machine_id_send);

    if (menuID !== '47') {
        $("#e_machine_id").val(obj.machine_id).trigger('change');
    } else if (menuID == '49') {
        $("#e_saddle_detail_id").val(obj.saddle_detail_id).trigger('change');
    }else {
        $("#e_machine_id").val(obj.act_code).trigger('change');
    }

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
    $("#e_itid").val(obj.itid)
    $("[name=e_partName]").val(obj.partName);
    $("[name=e_detail]").val(obj.detail);
    $("[name=e_make_ready]").val(obj.make_ready);
    $("[name=e_process_time1]").val(obj.process_time1);
    $("[name=e_speed]").val(numeral(obj.speed).format('0,0'));
    $("[name=e_hr1]").val(obj.hr1);
    $("input#e_hr").val(obj.hr);
    $("[name=e_capacity_labor]").val(obj.capacity_labor);
    $("[name=e_remark]").val(obj.remark);
    $("[name=e_recive_dep]").val(obj.recive_dep);
    $("[name=e_machine_send_remark]").val(obj.machine_send_remark);
    $("[name=e_others]").val(obj.others);
}

async function resetDataTable() {
    $('#tb_plans').DataTable().clear().draw();
    $('span.input_total').text(0);
    // $('#tb_plans').addClass('el_visible');
}

async function btnCopy() {
    if (plan_id_copy == 0 && $("[name=e_id]").val() == "") {
        showAlertNotiWarning("กรุณาเลือกข้อมูลที่ต้องการคัดลอก");
        return false
    } else {
        plan_id_copy = $("[name=e_id]").val();
        $("[name=e_id]").val("");
        $("#e_save_type").val(2);
        $(".btn_plan").removeClass("disabled");
        $("#e_btn_copy").addClass("disabled");
    }
}

//function tab edit multiple plan
async function resetCheckboxPlans() {
    $("#check_plans").prop("checked", false)
    $(".check_plan").prop("checked", false)
}

async function resetInputPlans() {
    $("#es_plan_date").val(moment().format("DD/MM/yyyy"));
    $(".larger").prop("checked", false);
    $("#es_job_status_id").val('');
    $("#es_machine_id").val(null).trigger('change');
    $("#es_shift_id").val(0);
    $("#es_remark").val('');
    $("#es_detail").val('');
    $("#es_okdate").val('');
    ar_plans = [];
}

async function btnMultipleSave(proc, status_save) {
    const is_check_list = await checkEditCheckList();
    // console.log('is_check_list :>> ', is_check_list);
    if ($(".check_plan:checked").length == 0) {
        showAlertNotiWarning("กรุณาเลือก plan อย่างน้อย 1 plan");
        return false;
    }
    if (is_check_list !== false) {
        const obj_value_plan_edit = await keepValueMutipleEditPlan();
        const obj_check_plan_edit = await keepCheckListEditPlan();
        // console.log('obj_value_plan_edit :>> ', obj_value_plan_edit);
        // console.log('obj_check_plan_edit :>> ', obj_check_plan_edit);
        const obj_update_mutiple_plan = {
            plan_date: {
                value: obj_value_plan_edit.plan_date,
                is_check: obj_check_plan_edit.chk_plan_date
            },
            job_status_id: {
                value: obj_value_plan_edit.job_status_id,
                is_check: obj_check_plan_edit.chk_job_status_id
            },
            machine_id: {
                value: obj_value_plan_edit.machine_id,
                is_check: obj_check_plan_edit.chk_machine_id
            },
            shift_id: {
                value: obj_value_plan_edit.shift_id,
                is_check: obj_check_plan_edit.chk_shift_id
            },
            remark: {
                value: obj_value_plan_edit.remark,
                is_check: obj_check_plan_edit.chk_remark
            },
            detail: {
                value: obj_value_plan_edit.detail,
                is_check: obj_check_plan_edit.chk_detail
            },
            ok_date: {
                value: obj_value_plan_edit.ok_date,
                is_check: obj_check_plan_edit.chk_okdate
            },
            proc,
            status_save,
            plan_id_array: ar_plans,
            saleman_id: userData.emp_id,
            menu_id: menuID,
        }

        if (menuID === '47') {
            obj_update_mutiple_plan.act_code = obj_value_plan_edit.act_code
        }
        if (menuID === '49') {
            obj_update_mutiple_plan.saddle.value = obj_value_plan_edit.saddle_detail_id
            obj_update_mutiple_plan.saddle.is_check = obj_check_plan_edit.es_chk_saddle_detail_id
        }
        // console.log('obj_update_mutiple_plan :>> ', obj_update_mutiple_plan);
        if (proc == "copy") {
            let obj = {
                title: "ยืนยันการคัดลอกข้อมูล",
                text: "",
                obj_data: obj_update_mutiple_plan,
            }
            await showAlertConfirm('copyMulti', obj);
        } else {
            let obj = {
                title: "ยืนยันการบันทึกข้อมูล",
                text: "",
                obj_data: obj_update_mutiple_plan,
            }
            await showAlertConfirm('updateMulti', obj);
        }

    }

}

async function btnMultipleCancel() {
    if ($(".check_plan:checked").length == 0) {
        showAlertNotiWarning("กรุณาเลือก plan อย่างน้อย 1 plan");
        return false;
    }
    console.log('userData :>> ', userData);
    const obj_cancel_mutiple_plan = {
        proc: "cancel",
        status_save: 5,
        plan_id_array: ar_plans,
        saleman_id: userData.emp_id

    }
    console.log('obj_cancel :>> ', obj_cancel_mutiple_plan);
    let obj = {
        title: "ยืนยันการยกเลิกข้อมูล",
        text: "",
        obj_data: obj_cancel_mutiple_plan,
    }
    await showAlertConfirm('cancelMulti', obj);
}

async function btnMultipleDelete() {
    if ($(".check_plan:checked").length == 0) {
        showAlertNotiWarning("กรุณาเลือก plan อย่างน้อย 1 plan");
        return false;
    }
    const obj_delete_mutiple_plan = {
        plan_id_array: ar_plans
    }
    console.log('obj_delete :>> ', obj_delete_mutiple_plan);
    let obj = {
        title: "ยืนยันการลบข้อมูล",
        text: "",
        obj_data: obj_delete_mutiple_plan,
    }
    await showAlertConfirm('deleteMulti', obj);
}

async function checkEditCheckList() {
    if ($("#es_chk_plan_date").is(':checked') === false
        && $("#es_chk_job_status_id").is(':checked') === false
        && $("#es_chk_machine_id").is(':checked') === false
        && $('#es_chk_shift_id').is(':checked') === false
        && $('#es_chk_detail').is(':checked') === false
        && $('#es_chk_remark').is(':checked') === false
        && $('#es_chk_okdate').is(':checked') === false
    ) {
        showAlertNotiWarning("กรุณาเลือกข้อมูลที่ต้องการเปลี่ยนแปลง");
        return false;
    }

    if ($("#es_chk_job_status_id").is(':checked') && $("#es_job_status_id").val() == "") {
        showAlertWithTimer("กรุณาเลือกสถานะ", "warning", 1000);
        $("#es_job_status_id").focus();
        return false;
    }
    if ($("#es_chk_machine_id").is(':checked') && $("#es_machine_id").val() == "") {
        $("#es_machine_id").focus();
        showAlertWithTimer("กรุณาเลือกเครื่องจักร", "warning", 1000);
        return false;
    }
    if ($("#es_chk_shift_id").is(':checked') && $("#es_shift_id").val() == "") {
        $("#es_shift_id").focus();
        showAlertWithTimer("กรุณาเลือกประเภทกะ", "warning", 1000);
        return false;
    }
    if ($("#es_chk_remark").is(':checked') && $("#es_remark").val() == "") {
        $("#es_remark").focus();
        showAlertWithTimer("กรุณากรอกหมายเหตุ", "warning", 1000);
        return false;
    }
    if ($("#es_chk_detail").is(':checked') && $("#es_detail").val() == "") {
        $("#es_detail").focus();
        showAlertWithTimer("กรุณากรอกรายละเอียด", "warning", 1000);
        return false;
    }
    if ($("#es_chk_okdate").is(':checked') && $("#es_okdate").val() == "") {
        $("#es_okdate").focus();
        showAlertWithTimer("กรุณากรอก okDate", "warning", 1000);
        return false;
    }
}

async function keepValueMutipleEditPlan() {
    const plan_date = $.trim($("#es_plan_date").val()) != "" ? formatDate($.trim($("#es_plan_date").val())) : "";
    const job_status_id = $("#es_job_status_id").val();
    // const machine_id = $("#es_machine_id").val();
    const shift_id = $("#es_shift_id").val();
    const remark = $("#es_remark").val();
    const detail = $("#es_detail").val();
    const ok_date = $("#es_okdate").val();

    const obj_edit_mutiple_data = {
        plan_date, job_status_id, shift_id, remark, detail, ok_date
    }

    if (menuID === '47') {
        obj_edit_mutiple_data.act_code = $("#es_machine_id").val()
        obj_edit_mutiple_data.machine_id = $("#es_machine_id").find('option:selected').data('machineId');
    } else if (menuID === '49') {
        obj_edit_mutiple_data.saddle_detail_id = $("#es_saddle_detail_id").val()
    }else {
        obj_edit_mutiple_data.machine_id = $("#es_machine_id").val()
    }

    return obj_edit_mutiple_data;
}
async function keepCheckListEditPlan() {
    let chk_plan_date = $("#es_chk_plan_date").is(':checked') == true ? $("#es_chk_plan_date").val() : 0
    let chk_job_status_id = $("#es_chk_job_status_id").is(':checked') == true ? $("#es_chk_job_status_id").val() : 0
    let chk_machine_id = $("#es_chk_machine_id").is(':checked') == true ? $("#es_chk_machine_id").val() : 0
    let chk_shift_id = $("#es_chk_shift_id").is(':checked') == true ? $("#es_chk_shift_id").val() : 0
    let chk_remark = $("#es_chk_remark").is(':checked') == true ? $("#es_chk_remark").val() : 0
    let chk_detail = $("#es_chk_detail").is(':checked') == true ? $("#es_chk_detail").val() : 0
    let chk_okdate = $("#es_chk_okdate").is(':checked') == true ? $("#es_chk_okdate").val() : 0
    
    const obj_chk_edit_plan = { chk_plan_date, chk_job_status_id, chk_machine_id, chk_shift_id, chk_remark, chk_detail, chk_okdate }
    if (menuID === '49') {
        obj_chk_edit_plan.es_chk_saddle_detail_id = $("#es_chk_saddle_detail_id").is(':checked') == true ? $("#es_chk_saddle_detail_id").val() : 0
    }
    return obj_chk_edit_plan
}



//function tab print plan
async function resetInputPrintPlan() {
    $("#s_print_1").prop("checked", true);
    if ($("#s_print_2").is(":checked")) {
        $("#tr_show_machine").show()
    } else {
        $("#tr_show_machine").hide();
    }
}

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

async function setOptionMachineTabPrint(machineList) {
    var machineListOption = '<option></option>';
    machineList.forEach((item, index) => {
        machineListOption += `<option value="${item.machine_id}" data-type-id="${item.type_id}">${item.machine_id} :: ${item.machine_name}</option>`
    });
    $("#p_machine_id").html(machineListOption);
}

async function btnExcel() {
    let date_start = $.trim($("#plan_date_start").val()) != "" ? formatDate($.trim($("#plan_date_start").val())) : "";
    let date_end = $.trim($("#plan_date_end").val()) != "" ? formatDate($.trim($("#plan_date_end").val())) : "";
    let machine_type_id = $("#s_machine_type").val();
    let machine_id = $("#s_machine_id").val();
    let obj_data_excel = { planStartDate: date_start, planEndDate: date_end, machineTypeId: machine_type_id, machineId: machine_id, menuId: menuType }
    // console.log('1351 :>> ', obj_data_excel);
    let data_excel = await getDataToExcel(obj_data_excel);
    // console.log('1353 :>> ', data_excel);
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
    // console.log('url :>> ', url_report_plan);
    window.open(url_report_plan, "reportScheduleV2", "", "");
}

async function checkDatePlanPrint(date_start) {
    var a = moment(date_start);
    var b = moment();
    let count_day = a.diff(b, 'days')
    if (count_day < -3) {
        date_start = moment().subtract(5, 'days').format('YYYY-MM-DD')
    }
    return date_start
}

function open_send(){
	var plan_id = $("#e_id").val();
	if(parseInt(plan_id)>0){
		$("#e_send_dep").val('40');
		$("#e_machine_id_send").val('0005');
        $("#modal-plan_machine_send").modal({ backdrop: "static" });
		// window.popup('http://192.168.5.40/planning/process_send/planning_send.php?plan_id='+plan_id,'',1000,300)
	}else{
		alert('ต้องบันทึกแผนก่อน ถึงจะเลือกได้')
	}
}

async function setOptionSaddle(saddleList) {
    var saddleListOption = '<option value=""></option>';
    saddleList.forEach((item, index) => {
        saddleListOption += `<option value="${item.saddle_detail_id}">${item.saddle_detail_name}</option>`

    });
    $("#e_saddle_detail_id,#p_saddle_detail_id,#es_saddle_detail_id").html(saddleListOption);
}