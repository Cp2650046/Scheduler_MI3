let numday1 = "";
let numday2 = "";
let check_today = "";
var input_date = "";
$(document).ready(function () {
    setOptionYear();
    numday1 = moment().daysInMonth();
    numday2 = moment().add(2, 'M').daysInMonth();
    check_today = moment().format("YYYY-MM-DD");
    // console.log('moment("YYYY-MM-DD") :>> ', moment().add(1, 'month').startOf('month').format("YYYY-MM-DD"));
    // let numday1 = moment().daysInMonth();
    // let numday2 = moment().add(2, 'M').daysInMonth();
    // console.log('6 :>> ', moment().daysInMonth());
    // console.log('7 :>> ',moment().add(2, 'M').daysInMonth())
    let widthT = ((numday1 + numday2) + 1) * 180
    console.log('widthT :>> ', widthT);
    // $("#tb_fix").css({width:widthT+'px'});
    // $('div#fixtb').css({
    //     width:$('#tb_fix').width()+'px',
    //     height:$('#tb_fix').height()+'px'
    // });
    searchNavigation();
    
    // table head row visibility
});

function setOptionYear() {
    let past_year = moment().add(-10, 'years').year();
    const current_year = moment().year();
    const future_year = moment().add(1, 'years').year();
    let year = past_year;
    var str_option_year = "";
    var str_selected = "";
    while (year <= future_year) {
        if (year == current_year) {
            str_selected = "selected";
        } else {
            str_selected = "";
        }
        str_option_year += `<option value="${year}" ${str_selected}>${year}</option>`
        year = year + 1
    }
    $("#naviagate_masterPlan_year").html(str_option_year);
}

async function searchNavigation() {
    var type_id = 0;
    if ($("#naviagate_masterplan_typeID").attr('selected', true)) {
        type_id = $("#naviagate_masterplan_typeID").val();
    }
    if ($("#naviagate_masterPlan_year").attr('selected', true)) {
        year = $("#naviagate_masterPlan_year").val();
    }
    if ($("#naviagateMasterPlan_month").attr('selected', true)) {
        month = $("#naviagateMasterPlan_month").val();
    }
    // console.log('month :>> ', month);
    // console.log('month :>> ', year);
    check_today = moment().format("YYYY-MM-DD");
    input_date = year + '-' + month + '-01'
    let search_date1 = moment(input_date).add(-1, 'days').format("YYYY-MM-DD");
    const next_month = moment(input_date).add(2, 'month').startOf('month').format("YYYY-MM-DD");
    // console.log('next_month :>> ', next_month);
    let search_date2 = moment(next_month).add(-1, 'days').format("YYYY-MM-DD");
    // console.log('search_date1 :>> ', search_date1);
    // console.log('search_date2 :>> ', search_date2);

    // console.log('input_date :>> ', input_date);
    numday1 = moment(input_date).daysInMonth();
    numday2 = moment(search_date2).daysInMonth();
    // console.log('numday1 :>> ', numday1);
    // console.log('numday2 :>> ', numday2);
    // console.log('38 :>> ', type_id);
    let machine = await getDataPlaning(type_id, search_date1, search_date2);
    await setPlans(machine.machineList, machine.holidayList).then(async (value) => {
        console.log(value)
        if(value){
            await setDataPlan(machine.dataplanList.plansList,'all');
            await showHR(machine.dataplanList.hrList);
            // await setTableAfterPress();
        }
    }).catch(err => {
        console.log(err.toString());
    });
    // await setDataPlan(machine.dataplanList.plansList,'all');
    // await showHR(machine.dataplanList.hrList);
    // await setTableAfterPress();
}

async function setPlans(machines, holidays) {
    // console.log('47 :>> ', machines.length);
    return new Promise(function (resolve, reject) {
        let h = 0;
        var str_body_row = "";
        machines.unshift({machine_id: "Machine", machine_name: ""});
        // console.log('85 :>> ', machines);
        for (let i = 0; i < machines.length; i++) {
            if (i == 0) {
                h = 40;
                // machines[i].machine_id = "Machine";
                // machines[i].machine_name = "";
            }
            let machine_subRow = 1;
            while (machine_subRow <= 4) {
                str_body_row += "<tr>";
                if (machine_subRow == 1) {
                    str_body_row += `<th height="${h}" width="180" bgcolor="#fff" class="${i != 0 ? "machine" : ""}" rowspan="${i == 0 ? 1 : 4}">${machines[i].machine_id} ${machines[i].machine_name}</th>`
                }
                for (let j = 1; j <= 2; j++) { // 2 month
                    let numday = 0;
                    var show_date = "";
                    if (j === 1) {
                        numday = numday1
                        show_date = moment(input_date).startOf('month').format("YYYY-MM-DD");
                    } else {
                        numday = numday2
                        show_date = moment(input_date).add(1, 'month').startOf('month').format("YYYY-MM-DD")
                    }
                    for (let d = 1; d <= numday; d++) {
                        // if (d < 10) {
                        //     d = "0" + d;
                        // }
                        var bg = "#fff";
                        var is_holiday = holidays.some((element) => element === show_date)
                        if (show_date === check_today) {
                            bg = "orange";
                        } else if (is_holiday || moment(show_date).weekday() === 0) {
                            bg = "#494949";
                        }

                        if (i === 0) {
                            str_body_row += `<th height="${h}" width="180" bgcolor="${bg}" class="showdate">${show_date}</th>`
                        } else {
                            switch (machine_subRow) {
                                case 1:
                                    str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} day dropZone" bgcolor="${bg}" id="day${machines[i].machine_id}${show_date}"></td>`
                                    break;
                                case 2:
                                    str_body_row += `<td class="shiftSeparator"></td>`
                                    break;
                                case 3:
                                    str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} night dropZone" bgcolor="${bg}" id="night${machines[i].machine_id}${show_date}"></td>`
                                    break;
                                case 4:
                                    str_body_row += `<td class="sumhr">[${machines[i].machine_id} ${machines[i].machine_name}]  Total <span class="${machines[i].machine_id} ${show_date}">0</span></td>`
                                    break;
                            }
                        }
                        show_date = moment(show_date).add(1, 'days').format("YYYY-MM-DD");
                    } // end of day loop
                }// end of month loop
                if (i === 0){
                    break;
                }
                str_body_row += "</tr>";
                machine_subRow++;
            }
        }
        // console.log('object :>> ', str_body_row);
        $("#tb_fix tbody").html(str_body_row);
        resolve(str_body_row);
    });
    // console.log('str_body_row :>> ', str_body_row);
}

async function setDataPlan(plans, type) {
    var chk_single = "";
    type == 'single';
    plans.forEach(element => {
        var display = "";
        var shift = "";
        var showtitle = "";
        var qty = element.qty;
        var quantity2 = element.quantity2;
        quantity2 = ((quantity2 * 95) / 100);
        var status = element.job_status_id;
        plan_id = element.id;
        if (qty >= quantity2 && (quantity2 != 0 || quantity2 == "")) {
            status = 4;
        }
        //position day and night for display 
        if (element.shift_id == 1) {
            shift = 'day';
        } else if (element.shift_id == 2) {
            shift = 'night';
        }

        showtitle = element.job_name + " " + element.detail + "  [ ชิ้นส่วน: " + element.partnameB + "  ]  [ จำนวน: " + numeral(element.waste).format(0,0) + "]  AE:" + element.firstname + "  " + element.lastname;
        showtitle = showtitle.replace(/"/g, '&quot;');

        /*ตรวจสอบ job ประมาณการ*/
        if (!element.mi_jobid) {
            if (status == '6' || status == '7') {
                display = "s5";
            } else {
                display = "success";
            }
        } else {

            switch (element.jobid) {
                case 'ไม่มีช่าง':
                    display = "noperson";
                    break;
                case 'PM':
                    display = "pm";
                    break;
                case '5 ส':
                    display = "s5";
                    break;
                case 'Breakdown':
                    display = "breakdown";
                    break;
                default:
                    switch (status) {
                        case 1:
                            display = "wait_ok";
                            break;
                        case 2:
                            display = "ok";
                            break;
                        case 4:
                            display = "success";
                            break;
                        case 6:
                            display = "ok_cus_color";
                            break;
                        case 7:
                            display = "wait_ok_cus_color";
                            break;
                        default:
                            display = "success";
                            break;
                    }
                    break;
            }
        }

        // console.log(`#${shift} ${element.machine_id}${element.plan_date}`)
        $(`<div machine_id="${element.machine_id} plan_date="${element.plan_date}" plan_id="${element.id}" plan_date="${element.plan_date}" shift="${element.shift_id}" class="draggable ${display}" title="${element.id}" $showtitle>&nbsp; ${element.jobid} &nbsp;&nbsp;&nbsp; ${String(Number(element.hr).toFixed(2)).replace(/\./, ':')}</div>`).appendTo('#'+shift+element.machine_id+element.plan_date);

        // if (chk_single) { // ดึงค่ามาเป็นครั้ง
        //     config_menu(element.id);
        // }

    });

}

async function showHR(showhr) {
    showhr.forEach(element => {
        var plan_date = element.date;
        var p_month = plan_date.substring(5, 7);
        var p_day = plan_date.substring(8, 10);
        var hr1 = element.hr1;
        var hr = Math.floor(element.hr2 / 60);
        var sum1 = hr1 + hr;
        var sum2 = element.hr2 % 60;
        if (sum2 < 10) {
            sum2 = '0' + sum2;
        }
        var sumhr = sum1 + ':' + sum2;
        $('span.' + element.machine + '.' + element.date).html(sumhr);
    });
}

async function setTableAfterPress(){
    // table head row visibility
    var headTable;
    headTable = $('<table id="headVisibility"></table>');
    headTable.append($('#fixtb tr').first().clone());
    headTable.appendTo('body');
    $('#headVisibility').css({
        'width':$('#fixtb').css('width'),
    });
    $('#headVisibility').find('td').css('width',(parseFloat($('#fixtb tr td').first().outerWidth(true)-3)+'px'));
    $(document).on('scroll.headVisibility',function(){
        $('#headVisibility').css('top',($(window).scrollTop()+parseFloat($('#fixtb').css('top')))+'px');
    });
}

async function btnPlanGo(){
    searchNavigation();
     /*var targetLocation = "";
   switch( $('#naviagateMasterPlan_typeID').val() ){
        case "34":
        case "35":
        case "10":
            targetLocation = "/planning/masterplan/planningWithDragAndDrop.php";
        break;
        case "36":
            targetLocation = "/planning/masterplan/planningcuttingWithDragAndDrop.php";
        break;
        case "afterpress1":
        case "afterpress2":
        case "afterpress3":
        case "cutting":
            targetLocation = "/planning/masterplan/planningafpressWithDragAndDrop.php";
        break;
    }
    window.location.href = location.protocol + '//' + location.host + targetLocation + "?inputdate="+$('#naviagateMasterPlan_year').val() + '-' + $('#naviagateMasterPlan_month').val() + '&type_id=' + $('#naviagateMasterPlan_typeID').val();
    */
}