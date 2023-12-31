var status_plans = [{ name_status: "Work(NO OK)", name_color: "wait_ok" },
                    { name_status: "Work(OK)", name_color: "ok" },
                    { name_status: "Work(Success)", name_color: "success" },
                    { name_status: "OK Important job", name_color: "ok_cus_color" },
                    { name_status: "Waiting for Ok Important job", name_color: "wait_ok_cus_color" },
                    { name_status: "PM", name_color: "pm" },
                    { name_status: "PM รายสัปดาห์", name_color: "pm" },
                    { name_status: "No operator", name_color: "noperson" },
                    { name_status: "5S", name_color: "s5" },
                    { name_status: "Breakdown", name_color: "breakdown" }
                    ]
var navigations = [ { nameType: "Roll Cutter", idType: "36" },
                    { nameType: "Sheet", idType: "35" }, 
                    { nameType: "Web", idType: "34" }, 
                    { nameType: "Digital Print", idType: "74" },
                    { nameType: "Afterpress", idType: "afterpress" },
                    { nameType: "Afterpress1", idType: "afterpress1" },
                    { nameType: "Afterpress2", idType: "afterpress2" },
                    { nameType: "Afterpress3", idType: "afterpress3" },
                    { nameType: "ตัดป้อนแท่น", idType: "cutting" },
                    ]
let numday1 = "";
let numday2 = "";
let check_today = "";
var input_date = "";
let is_login = 1;
var is_title = "Master Plan - Drag and Drop MI3"
var iconNavigation_iconList = "Home Graph Timesheet Report_Job Report_Chart MI Customer Employee Costing itEditor scheduler capacity_labor";
var urlParams = ""
var s_navigation = ""
var s_year = ""
var s_month = ""
const data_date = [];
$(document).ready(function () {
    urlParams = new URLSearchParams(window.location.search)
    const user_account = urlParams.get('user_account')
    // console.log('25 :>> ', user_account);
    $('#iconNavigationContainer').iconNavigation({iconList:iconNavigation_iconList});
    setTitlePlan();
    /*if (user_account != null) {
        loginPermissionMasterPlan(user_account);
        if(s_navigation == 10 || s_navigation == 34 || s_navigation == 35 || s_navigation == 74){
            let myScript = document.createElement("script");
            myScript.setAttribute("src", "./projects/master_plans/js/master-plan-paper-ready.js");
            myScript.setAttribute("async", "false");
            let head = document.head;
            head.insertBefore(myScript, head.firstElementChild);
        }
        init();
        is_login = 1
    }else {
        const userData = JSON.parse(localStorage.getItem('userData'))
        if (userData === null) {
            let obj_alert = { type: 'warning', loading: false, message: 'กรุณา login เข้าสู่ระบบก่อน' }
            main_set_loading(obj_alert)
            window.location.replace("http://192.168.5.3/planning/scheduler/scheduler.php");
        }
    }*/
    
});

function loginPermissionMasterPlan(user_account) {
    let user_password = get_auto_password();
    const sendData = {
        user_account: user_account,
        password: user_password
    }
    $.ajax({
        url: `${api_url}/user/saveuser`,
        headers: { 'Content-Type': 'application/json', 'user_account': user_account },
        method: 'POST',
        data: JSON.stringify(sendData),
        async: false,
        dataType: 'JSON',
        success: async function (data) {
            // console.log(data);
            if (data.user_id > 0) {
                localStorage.setItem('userData', JSON.stringify(data))
            } else {
                alert("กรุณาติดต่อ แผนก MIS");
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

async function main_set_loading(data) {
    let timeOut = 500
    if(data.timeOut){
        timeOut = data.timeOut
    }
    // console.log('data :>> ', data);
    toastr.options = { positionClass: "toast-bottom-right", timeOut: timeOut }
    if (typeof data.url_redirect !== 'undefined') {
        toastr.options.onHidden = () => window.location = data.url_redirect
        toastr.options.onclick = () => window.location = data.url_redirect
    }
    if (data.loading == true) {
        $('body').loading({
            message: data.message,
            theme: 'dark'
        })
    }
    if (data.loading == false) {
        $('body').loading('stop')
        switch (data.type) {
            case 'success':
                toastr.success(data.message)
                break
            case 'error':
                toastr.error(data.message)
                break
            case 'warning':
                toastr.warning(data.message)
                break
            case 'submit':
                toastr.info('OK')
                break
            default:
                break
        }
    }
}

function setMonth(s_month){
    // const current_month = 1 + moment().month();
    // console.log('current_month :>> ', current_month);
    var str_option_month = ""
    for (let m = 1; m <= 12; m++) {
        var is_selected = ""
        if(s_month == m){
            is_selected = "selected"
        }
        str_option_month += `<option value="${m}" ${is_selected}>${m}</option>`
        
    }
    $("#naviagateMasterPlan_month").html(str_option_month);
}

function setOptionYear(s_year) {
    let past_year = moment().add(-10, 'years').year();
    // const current_year = moment().year();
    const future_year = moment().add(1, 'years').year();
    let year = past_year;
    var str_option_year = "";
    var str_selected = "";
    while (year <= future_year) {
        if (year == s_year) {
            str_selected = "selected";
        } else {
            str_selected = "";
        }
        str_option_year += `<option value="${year}" ${str_selected}>${year}</option>`
        year = year + 1
    }
    $("#naviagate_masterPlan_year").html(str_option_year);
    setMonth(s_month);
    setStatusPlanColor();
}

function setStatusPlanColor() {
    let type_id = ""
    if ($("#naviagate_masterplan_typeID").attr('selected', true)) {
        type_id = $("#naviagate_masterplan_typeID").val();
    }
    var str_status_color = "";
    status_plans.forEach(element => {
        // console.log('object :>> ', element);
        if (type_id === "35" || type_id === "34" || type_id === "74" || type_id === "10") {
            str_status_color += `<span class="box-color-size ${element.name_color}"></span>&nbsp;${element.name_status}&nbsp;&nbsp;&nbsp;`
        } else {
            if (element.name_status !== "PM รายสัปดาห์") {
                str_status_color += `<span class="box-color-size ${element.name_color}"></span>&nbsp;${element.name_status}&nbsp;&nbsp;&nbsp;`
            }
        }
    });
    $("#colorInfo").html(str_status_color);
}

async function setHightTable(){
    console.log('157 :>> ', 157);
    if($("#master_plans_tab1").find(".card-body").css('display') === "block"){
        $('div#fixtb').css({
            height:'590px'
        });
    }else{
        console.log('162 :>> ');
        $('div#fixtb').css({
            height:'690px'
        });
    }
}

function setTitlePlan(){
    s_navigation = urlParams.get('navigation');
    $("#naviagate_masterplan_typeID").val(s_navigation);
    s_year = urlParams.get('year');
    s_month = urlParams.get('month');
    is_title = $("#naviagate_masterplan_typeID option:selected").text() + " - Drag and Drop"
    $("#title_plan").text(is_title);
}

async function handleWindowResize() {
    const tab1 = $("#master_plans_tab1").height();
    let screenHeight = $(window).height();
    let allTabHeight = tab1;
    screenHeight = screenHeight - allTabHeight;
    let height = Number(screenHeight.toFixed(2));
    $('#fixtb').height(height);
}