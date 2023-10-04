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

$(document).ready(async function () {
    menu_group_data = await getMenuGroupData(menuType);
    await setDisplayPlan();
    // let data = await getData(menuType);
    // localStorage.clear();

    // console.log("ไปต่อ");
    var schedulerData = {};
    var machineTypeData, nextMachineData, machineData, workTypeData;

    var storedData = localStorage.getItem("schedulerData");
    if (storedData) {
        console.log("มีข้อมูล LocalStorage");
        var parsedData = JSON.parse(storedData);
        // console.log('31 ',parsedData);
        machineData = parsedData.schedulerDefaultMachine.find((item) => item.menuID == menuType);
        machineTypeData = parsedData.schedulerMachineTypeList.find((item) => item.menuID == menuType);
        nextMachineData = parsedData.schedulerNextMachine
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

        localStorage.setItem("schedulerData", JSON.stringify(schedulerData));
    }
    machine_global = machineData.defaultMachineList;
    Machine_process_global = nextMachineData;

    if (menuType != 47) {
        await setOptionMachine(machineData.defaultMachineList);
    }
    // await setOptionMachineTabPrint(machineData.defaultMachineList);
    // ประเภทเครื่องจักร
    await setOptionMachineType(machineTypeData.machineType);
    // ขั้นตอนถัดไป กับ เครื่องจักรถัดไป
    await setOptionMachineProcess(Machine_process_global);
    await setOptionMachineNext(Machine_process_global);
    await setDatepicker();

    /* EVENT CASE IN */
    if (menuType == 47) {
        getWorkType(menuType).then(async (value) => {
            await setOptionTypeWork(value);
        }).catch(err => {
            console.log(err.toString());
        });
    }

    /* EVENT CASE IN */

    /* event AutoComplete */
    await jobidAutocomplete();
    await partnameAutocomplete();

    /* end event AutoComplete */

    //Initialize Select2 Elements
    $('#s_machine_id,#e_machine_id,#es_machine_id').select2({ placeholder: "ค้นหาด้วย ID หรือชื่อ...", allowClear: true });

    $('#e_machine_id').on('select2:select', async (e) => {
        var mac_id = e.params.data.id
        await getSpeed(mac_id);
    })

    $('#s_machine_id,#e_machine_id,#es_machine_id,#p_machine_id').on("select2:open", function () {
        $(document).on("keydown", async function (e) {
            if (e.key === "Enter") {
                $('#s_machine_id,#e_machine_id,#es_machine_id,#p_machine_id').select2("close"); // Close the dropdown
                let select2_id = $(e.target).closest("td").find("select").attr("id");
                var selectfocus = $("#" + select2_id).attr('nextEleId');
                // console.log('canfocus_86 :>> ', selectfocus);
                $("#" + selectfocus).focus();
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
            $("#" + canfocus).focus();
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
            fncChkCapacityLabor();
        }
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
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#s_machine_id').find(':selected').data('typeId') === undefined ? "" : $('#s_machine_id').find(':selected').data('typeId').toString()

        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#s_machine_id').val(null).trigger("change");
        }

        let machineList = await getMachine(valueTypeID);
        await setOptionMachine(machineList);
    })
    $('#e_send_dep').on('change', async (e) => {
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#e_machine_id_send').find(':selected').data('typeId') === undefined ? "" : $('#e_machine_id_send').find(':selected').data('typeId').toString()
        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#e_machine_id_send').val(null).trigger("change");
        }
        await setOptionMachineNext(Machine_process_global, valueTypeID);
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

    // await settingDataTable('#tb_plans');

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
    /* $("[name=s_print]").on("click", () => {
        if ($("#s_print_2").is(":checked")) {
            $("#tr_show_machine").show()
        } else {
            $("#tr_show_machine").hide();
        }
    }) */
   /*  $("#edit_one_plan_tab,#edit_multi_plan_tab").on("click", (e) => {
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
    }) */

   /*  $('#p_machine_type').on('change', async (e) => {
        let valueTypeID = $(e.target).val().toString();
        let typeID = $('#p_machine_id').find(':selected').data('typeId') === undefined ? "" : $('#p_machine_id').find(':selected').data('typeId').toString()

        if (valueTypeID !== typeID && valueTypeID !== "") {
            $('#p_machine_id').val(null).trigger("change");
        }

        let machineList = await getMachine(valueTypeID);
        await setOptionMachineTabPrint(machineList);
    }) */
    //end tab print plan
});

async function setNextInputWhenEnter(target, count_td) {
    let a = target.next().find(`td:eq(${count_td}) .form-control`).length
    let b = target.next()
    if (a === 0) {
        count_td++
        b = $("table#plan_data tbody tr:first-child")
    }

    console.log(count_td, a, b, b.find(`td:eq(${count_td})`));
}

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

async function showTabEditPlan() {
    if ($('div#scheduler_tab2.card').hasClass('collapsed-card') === true) {
        $('div#scheduler_tab2 button.btn-tool').click()
    }
}

async function setOptionMachine(machineList) {
    var machineListOption = '<option></option>';
    machineList.forEach((item, index) => {
        machineListOption += `<option value="${item.machine_id}" data-type-id="${item.type_id}">${item.machine_id} :: ${item.machine_name}</option>`
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
    if(menuType == 22){
        $("#s_machine_type").val(0);
    }
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

async function btnInsert() {
    const message_confirm = "ยืนยันการ" + $("#btn_insert").attr("title");
    let obj = {
        title: message_confirm,
        text: ""
    }
    await showAlertConfirm('add', obj);
}

async function btnReset() {
    let id_table_plan = "tb_plans"
    if (menuType == 47) {
        id_table_plan = "tb_plans_casein";
    }
    $('#' + id_table_plan + ' tbody tr').removeClass('rowSelected');
    if ($('#' + id_table_plan + ' tbody tr td').hasClass("color-row-select")) {
        $('#' + id_table_plan + ' tbody tr td').removeClass('color-row-select');
    }
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
    // $("[name=e_others]").val("");
    if (menuType == 47) {
        $("#e_act_code").val(0);
    } else {
        $("#e_machine_id").val(null).trigger('change');
    }

    plan_id_copy = 0;
    $(".btn_plan").removeClass("disabled");

}

async function btnSave() {
    const status_save = $("#e_save_type").val();
    console.log(status_save);
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
            console.log('971 :>> ');
            showAlertNotiWarning("กรุณาเลือกเครื่องจักร");
            $("#e_machine_id").focus();
            return false;
        }
        if ($("#e_act_code").val() == "0") {
            showAlertNotiWarning("กรุณาเลือกประเภทการทำงาน");
            $("#e_act_code").focus();
            return false;
        }
    }
    var obj_save = await keepValue();
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
    const e_machine_id = $("#e_machine_id").val();
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
        e_plan_date
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
    let capacity_labor = await getCapacityLabor(e_machine_id, e_plan_date);
    if (capacity_labor.length > 0) {
        $("[name=e_capacity_labor],#e_master_capacity_labor").val(capacity_labor[0].master_capacity_labor);
    } else {
        $("[name=e_capacity_labor],#e_master_capacity_labor").val(0);
    }

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

async function setDataPlan(planId, el,table_id_plan) {
    if ($(event.target).hasClass('check_plan')) {
        return
    }
    $('#'+table_id_plan+' tbody tr').removeClass('rowSelected');
    if ($('#'+table_id_plan+' tbody tr td').hasClass("color-row-select")) {
        $('#'+table_id_plan+' tbody tr td').removeClass('color-row-select');
    }
    var is_navId = $("#edit_one_plan_tab").hasClass("nav-link active") == true ? "edit_one_plan_tab" : "edit_multi_plan_tab";
    if (is_navId != 'edit_multi_plan_tab') {
        el.addClass('rowSelected');
        if (el.children().hasClass("color_day")) {
            el.find('.color_day').addClass('color-row-select');
        } else if (el.children().hasClass("color_night")) {
            el.find('.color_night').addClass('color-row-select');
        }
    }
    $(".btn_plan").removeClass("disabled");

    const filteredData = globalData.filter(function (item) {
        return item.id === planId;
    });

    setDataInput(filteredData[0]);
}

/* async function setDataInput(obj) {
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
    $("[name=e_machine_send_remark]").val(obj.machine_send_remark);
    $("[name=e_others]").val(obj.others);
} */

// async function resetDataTable() {
//     $('span.input_total').text(0);
// }

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

    if (menuType == 47) { /* แก้ไขหลายรายการ case in */
        $("#es_act_code").val(0);
    } else {
        $("#es_machine_id").val(null).trigger('change');
        $("#es_okdate").val('');
    }
    $("#es_plan_date").val(moment().format("DD/MM/yyyy"));
    $(".larger").prop("checked", false);
    $("#es_job_status_id").val('');
    $("#es_shift_id").val(0);
    $("#es_remark").val('');
    $("#es_detail").val('');
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
            saleman_id: userData.emp_id
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
    const machine_id = $("#es_machine_id").val();
    const shift_id = $("#es_shift_id").val();
    const remark = $("#es_remark").val();
    const detail = $("#es_detail").val();
    const ok_date = $("#es_okdate").val();

    const obj_edit_mutiple_data = {
        plan_date, job_status_id, machine_id, shift_id, remark, detail, ok_date
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
    return obj_chk_edit_plan
}



//function tab print plan
async function checkDatePlanPrint(date_start) {
    var a = moment(date_start);
    var b = moment();
    let count_day = a.diff(b, 'days')
    if (count_day < -3) {
        date_start = moment().subtract(5, 'days').format('YYYY-MM-DD')
    }
    return date_start
}