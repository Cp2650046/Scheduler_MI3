let numday1 ="";
let numday2 ="";
let check_today ="";
$(document).ready(function () {
    setOptionYear();
    numday1 = moment().daysInMonth();
    numday2 = moment().add(2, 'M').daysInMonth();
    check_today = moment().format("YYYY-MM-DD");
    console.log('moment("YYYY-MM-DD") :>> ', moment().add(1, 'month').startOf('month').format("YYYY-MM-DD"));
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
    var input_date = year+'-'+month+'-01'
    let search_date1 = moment(input_date).add(-1, 'days').format("YYYY-MM-DD");
    const next_month = moment(input_date).add(2, 'month').startOf('month').format("YYYY-MM-DD");
    // console.log('next_month :>> ', next_month);
    let search_date2 = moment(next_month).add(-1, 'days').format("YYYY-MM-DD");
    console.log('search_date1 :>> ', search_date1);
    console.log('search_date2 :>> ',search_date2);

    // console.log('input_date :>> ', input_date);
    numday1 = moment(input_date).daysInMonth();
    numday2 = moment(input_date).add(2, 'M').daysInMonth();
    // console.log('numday1 :>> ', numday1);
    // console.log('numday2 :>> ', numday2);
    // console.log('38 :>> ', type_id);
    let machine = await getDataPlaning(type_id,search_date1,search_date2);
    await setPlans(machine.machineList, machine.holidayList);
}

async function setPlans(machines, holidays) {
    // console.log('47 :>> ', machines.length);
    let h = 0;
    var str_body_row = "";
    for (let i = 0; i < machines.length; i++) {
        if (i == 0) {
            h = 40;
            machines[i].machine_id = "Machine";
            machines[i].machine_name = "";
        }
        let machine_subRow = 1;
        while (machine_subRow <= 4) {
            str_body_row += "<tr>";
            if (machine_subRow == 1) {
                str_body_row += `<td height='${h}' width='180' class="${i == 0 ? "" : "machine"}" rowspan="${i == 0 ? 1 : 4}">${machines[i].machine_id} ${machines[i].machine_name}</td>`
            }
            for (let j = 1; j < 2; j++) { // 2 month
                let numday = 0;
                var show_date = "";
                if (j === 1) {
                    numday = numday1
                    show_date = moment().startOf('month').format("YYYY-MM-DD");
                } else {
                    numday = numday2
                    show_date = moment().add(1, 'month').startOf('month').format("YYYY-MM-DD")
                }

                for (let d = 1; d <= numday; d++) {
                    if (d < 10) {
                        d = "0" + d;
                    }
                    var bg = "";
                    var is_holiday = holidays.some((element) => element === show_date)
                    if (show_date === check_today) {
                        bg = "orange";
                    } else if (is_holiday || moment(show_date).weekday() === 0) {
                        bg = "#494949";
                    }

                    if (i === 0) {
                        str_body_row += `<td height="${h}" width="180" bgcolor="${bg}" class="showdate">${show_date}</td>`
                    } else {
                        switch (machine_subRow) {
                            case 1:
                                str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} day dropZone" bgcolor="${bg}" id="day ${machines[i].machine_id}${show_date} "></td>`
                                break;
                            case 2:
                                str_body_row += `<td class="shiftSeparator"></td>`
                                break;
                            case 3:
                                str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} night dropZone" bgcolor="${bg}" id="night ${machines[i].machine_id}${show_date} "></td>`
                                break;
                            case 4:
                                str_body_row += `<td class="sumhr">[${machines[i].machine_id} ${machines[i].machine_name}]  Total <span class="${machines[i].machine_id} ${show_date}">0</span></td>`
                                break;
                        }
                    }
                    show_date = moment(show_date).add(1, 'days').format("YYYY-MM-DD");
                } 		// end of day loop
            }// end of month loop
            if (i === 0) break;
            str_body_row += "</tr>";
            machine_subRow++;
        }
    }
    // console.log('object :>> ', $("#tb_fix tbody"));
    $("#tb_fix tbody").html(str_body_row);
    // console.log('str_body_row :>> ', str_body_row);
}