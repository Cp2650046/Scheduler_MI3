$(document).ready(async function () {
    // const urlParams = new URLSearchParams(window.location.search)
    const user_account = '2650046' /*urlParams.get('user_account')*/
    if (user_account != null) {
        login_permission_scheduler(user_account);
    } else {
        const userData = JSON.parse(localStorage.getItem('userData'))
        // if (userData === null) {
        //     let obj_alert = { type: 'warning', loading: false, message: 'คุณได้ใช้ระบบเกินเวลาที่กำหนดกรุณา Login ใหม่อีกครั้ง' }
        //     main_set_loading(obj_alert)
        //     window.location = "http://192.168.5.3/AUTHEN/index.php";
        // }
    }

})

function login_permission_scheduler(user_account) {

    let user_password = get_auto_password()
    const sendData = {
        user_account: user_account,
        password: user_password
    }
    $.ajax({
        url: `${api_url}/user/saveuser`,
        headers: { 'Content-Type': 'application/json', 'user_account': sendData.user_account },
        method: 'POST',
        data: JSON.stringify(sendData),
        async: false,
        dataType: 'JSON',
        success: async function (data) {
            console.log(data);
            if (data.user_id > 0) {
                localStorage.setItem('userData', JSON.stringify(data))
                USER_DATA = { ... JSON.parse(localStorage.getItem('userData')) }
                await getMenu(USER_DATA.emp_id);
                // window.location = `${base_url}/scheduler`
            } else {
                alert("กรุณาติดต่อ แผนก MIS");
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

function formatDate(inputDate) {
    const dateParts = inputDate.split("/");
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2];
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return formattedDate;
}

async function backToMainPage() {
    window.location.href = `/scheduler`;
}

function convertTime(theTime){
	var result;
	var h,m;
	if ( typeof theTime != "string" ) {
		theTime = String(theTime);
	}
	
	theTime = theTime.replace(/,/g,'');
	
	if ( theTime.match(/:/) ){ // minute wise
		theTime = theTime.replace(/:/g,'.');
		h = parseInt(theTime,10);
		m = parseFloat(theTime) - h;
		m = (m / 60 * 100).toFixed(2);
		result =  h + parseFloat(m);	
	}
	else { // decimal wise
		h = parseInt(theTime,10);
		m = parseFloat(theTime) - h;
		m = (m * 60).toFixed(0);
		m = m < 10 ? '0'+m : m;
		result =  h+ ":" +m;	
	}
	return result;
}

function convertDateThai(ch_date){
	if(ch_date != ""){
		return moment(ch_date, 'YYYY-MM-DD').format('DD/MM/YYYY');
	}
    return "";
}

async function main_set_table_loading(data,table_id){
    toastr.options ={
        positionClass: "toast-bottom-right"
    }
    if(data.loading == true){
        $(`${table_id}`).loading({
            message: data.message,
            theme: 'dark'
        });
    }
    if(data.loading == false){
        $(`${table_id}`).loading('stop');
    }
}

async function scheduler_set_user_name() {
    $("#info_user_name").html(USER_DATA.user_name);
}

async function  scheduler_set_badge(){
    $("#info_badge").html(USER_DATA.badge);
}

// async function get_auto_password() {
//     const date = new Date();
//     const monthValue = (date.getMonth() + 1).toString().padStart(2, '0');

//     return "250000@" + monthValue
// }