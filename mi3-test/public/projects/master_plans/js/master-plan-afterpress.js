$(document).ready(function () {
    numday1 = moment().daysInMonth();
    numday2 = moment().add(2, 'M').daysInMonth();
    check_today = moment().format("YYYY-MM-DD");
    setOptionYear(s_year);
    searchNavigation();
    window.addEventListener('resize', handleWindowResize);
    setTimeout(handleWindowResize, 450);
    // if(s_navigation == 10 || s_navigation == 34 || s_navigation == 35 || s_navigation == 74){
    //     $(document).on('mousedown.showPaper','div.draggable',function(){
    //         $(this).addClass('showPaper');
    //         $(document).on('mouseup.showPaper',function(){
    //             showPaperReady($('div.showPaper'));
    //             $('div.draggable.showPaper').removeClass('showPaper');
    //             $(this).off('mouseup.showPaper mousemove.showPaper');
    //         }).on('mousemove.showPaper',function(){
    //             $('div.draggable.showPaper').removeClass('showPaper');
    //             $(this).off('mouseup.showPaper mousemove.showPaper');
    //         });
    //     });
    // }
});

async function searchNavigation() {
    console.log('25 :>> ', 25);
    let s_type_id = 0;
    if ($("#naviagate_masterplan_typeID").attr('selected', true)) {
        s_type_id = $("#naviagate_masterplan_typeID").val();
    }
    if ($("#naviagate_masterPlan_year").attr('selected', true)) {
        year = $("#naviagate_masterPlan_year").val();
    }
    if ($("#naviagateMasterPlan_month").attr('selected', true)) {
        month = $("#naviagateMasterPlan_month").val();
    }
    // console.log('22 :>> ', s_type_id);
    urlParams.set('navigation', s_type_id);
    urlParams.set('year', year);
    urlParams.set('month', month);

    check_today = moment().format("YYYY-MM-DD");
    input_date = year + '-' + month + '-01'
    let search_date1 = moment(input_date).add(-1, 'days').format("YYYY-MM-DD");
    const next_month = moment(input_date).add(2, 'month').startOf('month').format("YYYY-MM-DD");
    let search_date2 = moment(next_month).add(-1, 'days').format("YYYY-MM-DD");
    numday1 = moment(input_date).daysInMonth();
    numday2 = moment(search_date2).daysInMonth();

    await getDataPlaning(s_type_id, search_date1, search_date2);
    if (is_login == 0) {
        await main_set_loading({ type: 'warning', loading: false, message: "Please login to use Drag and Drop feature.", timeOut: 5000 });
    }
}

async function setPlans(machines, holidays) {
    return new Promise(function (resolve, reject) {
        let h = 0;
        var str_body_row = "";
        var size_td = "td-plan-w";
        if (s_navigation == 10 || s_navigation == 34 || s_navigation == 35 || s_navigation == 74) {
            size_td = "td-plan-h"
        }
        machines.unshift({ machine_id: "Machine", machine_name: "" });
        // console.log('54 :>> ', machines);
        for (let i = 0; i < machines.length; i++) {
            if (i == 0) {
                h = 40;
            }
            let machine_subRow = 1;
            while (machine_subRow <= 4) {
                str_body_row += "<tr>";
                if (machine_subRow == 1) {
                    str_body_row += `<th height="${h}" width="180" bgcolor="#fff" class="${i != 0 ? "machine" : "h_machine"}" rowspan="${i == 0 ? 1 : 4}">${machines[i].machine_id} ${machines[i].machine_name}</th>`
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
                        var bg = "day-color-white";
                        var is_holiday = holidays.some((item) => item.holiday === show_date)
                        // console.log('is_holiday :>> ', is_holiday);
                        if (show_date == check_today) {
                            bg = "holiday-color-orage";
                        } else if (is_holiday || moment(show_date).weekday() === 0) {
                            bg = "holiday-color-gray";
                        }

                        if (i === 0) {
                            str_body_row += `<th height="${h}" width="180" class="showdate ${bg} ${size_td}">${show_date}</th>`
                        } else {
                            switch (machine_subRow) {
                                case 1:
                                    str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} day dropZone ${bg} ${size_td}" id="day${machines[i].machine_id}${show_date}"></td>`
                                    break;
                                case 2:
                                    str_body_row += `<td class="shiftSeparator ${size_td}"></td>`
                                    break;
                                case 3:
                                    str_body_row += `<td plan_date="${show_date}" machine_id="${machines[i].machine_id}" class="${machines[i].machine_id} ${show_date} night dropZone ${bg} ${size_td}" id="night${machines[i].machine_id}${show_date}"></td>`
                                    break;
                                case 4:
                                    str_body_row += `<td class="sumhr ${size_td}">&nbsp;[${machines[i].machine_id} ${machines[i].machine_name}]  Total <span class="${machines[i].machine_id} ${show_date} font-total">0</span></td>`
                                    break;
                            }
                        }
                        show_date = moment(show_date).add(1, 'days').format("YYYY-MM-DD");
                    } // end of day loop
                }// end of month loop
                if (i === 0) {
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
}

async function setDataPlan(plans = [], type) {
    // var chk_single = "";
    // type == 'single';
    // console.log('plans :>> ', plans);
    var is_draggable = 'draggable';
    var size_div = 'div-plan-w';
    if (plans.length > 0) {
        plans.forEach(element => {
            var display = "";
            var shift = "";
            var showtitle = "";
            var status = element.job_status_id;
            plan_id = element.id;
            is_draggable = 'draggable';
            if (element.has_timesheet) {
                is_draggable = 'draggable-disabled';
            } else {
                is_draggable = 'draggable';
            }
            //position day and night for display 
            if (element.shift_id == 1) {
                shift = 'day';
            } else if (element.shift_id == 2) {
                shift = 'night';
            }

            var ready = '', ready_title = '', ready_ink = '', ready_ink_title = '', ready_diecut = '', ready_diecut_title = '';
            if (s_navigation == 34 || s_navigation == 35 || s_navigation == 74 || s_navigation == 10) {
                // var ready = '', ready_title = '';
                size_div = "div-plan-h";
                if (element.is_paper_trim_ready == "1") {
                    ready_title = '[กระดาษพร้อมพิมพ์]';
                    ready = '<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-blue.png" title="' + ready_title + '">';
                } else if (element.is_paper_trim_ready == "0") {
                    ready_title = '[กระดาษไม่พร้อมพิมพ์]';
                    ready = '<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-blue.png" title="' + ready_title + '">';
                }

                //check ready of ink
                // var ready_ink='', ready_ink_title = '';
                if (element.is_ink_ready == "1") {
                    ready_ink_title = '[หมึกพร้อมพิมพ์]';
                    ready_ink = '<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-gray.png" title="' + ready_ink_title + '">';
                } else if (element.is_ink_ready == "0") {
                    ready_ink_title = '[หมึกไม่พร้อมพิมพ์]';
                    ready_ink = '<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-gray.png" title="' + ready_ink_title + '">';
                }
            }
            if(s_navigation == 10){
                 // var ready_diecut='', ready_diecut_title = '';
                if (element.is_diecut_ready == "1") {
                    ready_diecut_title = '[Block die-cut พร้อม]';
                    ready_diecut = '<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-red.png" title="' + ready_diecut_title + '">';
                } else if (element.is_diecut_ready == "0") {
                    ready_diecut_title = '[Block die-cut ไม่พร้อม]';
                    ready_diecut = '<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-red.png" title="' + ready_diecut_title + '">';
                }
            }
           

            if (s_navigation == 36) {
                showtitle = `${element.job_name} ${element.detail} [ ชิ้นส่วน: ${element.partnameB} ] [ ชนิดกระดาษ: ${element.paper_type.replace(/"/, "'")}] [ แกรมกระดาษ: ${element.paper_gm}  ] [ หน้าม้วน(Roll): ${element.paper_roll} ] [ ยอดงานตามแผน: ${numeral(element.qty_paper).format(0, 0)} ] AE: ${element.firstname} ${element.lastname}`;
            } else {
                showtitle = `${element.job_name} ${element.detail} [ ชิ้นส่วน: ${element.partnameB} ] [ จำนวน: ${numeral(element.waste).format(0, 0)} ] AE: ${element.firstname} ${element.lastname} ${ready_title} ${ready_ink_title} ${ready_diecut_title}`;
            }

            /*ตรวจสอบ job ประมาณการ*/
            if (!element.mi_jobid) {
                if (status == '6' || status == '7') {
                    display = "s5";
                } else {
                    display = "success";
                    is_draggable = 'draggable-disabled'
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
                                is_draggable = 'draggable-disabled'
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
            if (type == "single") {
                $('#' + shift + element.machine_id + element.plan_date).find('div').remove();
                console.log('td :>> ', $('#' + shift + element.machine_id + element.plan_date));
            }
            if ($('#' + shift + element.machine_id + element.plan_date).find('div').attr('plan_id') == element.id) { /* check ไม่ให้แผนแสดงซ้ำ */
                $('#' + shift + element.machine_id + element.plan_date).find('div').remove();
            }
            $(`<div machine_id="${element.machine_id}" plan_date="${element.plan_date}" plan_id="${element.id}" shift="${element.shift_id}" data-jobID="${element.jobid}" data-partName="${element.partnameB}" data-itid="${element.itid}" data-waste="${numeral(element.waste).format(0, 0)}" data-sig="${element.sig}" class="${is_draggable} ${display} ${size_div}" title="${element.id} : ${showtitle}">&nbsp;${element.jobid.toUpperCase()} &nbsp;&nbsp;${String(Number(element.hr).toFixed(2)).replace(/\./, ':')}&nbsp;&nbsp;${ready}&nbsp;${ready_ink}&nbsp;${ready_diecut}</div>`).appendTo('#' + shift + element.machine_id + element.plan_date);
            type = "" /* คืนค่าลบครั้งเดียว */
        });
    }
}

async function showHR(showhr = []) {
    if (showhr.length > 0) {
        showhr.forEach(element => {
            var hr1 = element.hr1;
            var hr = Math.floor(element.hr2 / 60);
            var sum1 = hr1 + hr;
            var sum2 = element.hr2 % 60;
            if (sum2 < 10) {
                sum2 = '0' + sum2;
            }
            var sumhr = sum1 + ':' + sum2;
            $(`span.${element.machine}.${element.date}.font-total`).html(sumhr);
        });
    }
}

async function btnPlanGo() {
    // window.location.replace("http://localhost:3131/masterplans?" + urlParams.toString());
    // setTitlePlan();
    // searchNavigation();
    let s_type_id = 0, year = 0,month = 0;
    if ($("#naviagate_masterplan_typeID").attr('selected', true)) {
        s_type_id = $("#naviagate_masterplan_typeID").val();
    }
    if ($("#naviagate_masterPlan_year").attr('selected', true)) {
        year = $("#naviagate_masterPlan_year").val();
    }
    if ($("#naviagateMasterPlan_month").attr('selected', true)) {
       month = $("#naviagateMasterPlan_month").val();
    }
    // console.log('22 :>> ', s_type_id);
    urlParams.set('navigation', s_type_id);
    urlParams.set('year', year);
    urlParams.set('month', month);
    setStatusPlanColor();
    // location.href = "http://localhost:3131/masterplans?" + urlParams.toString()
    window.location.replace("http://localhost:3131/masterplans?" + urlParams.toString());
}
