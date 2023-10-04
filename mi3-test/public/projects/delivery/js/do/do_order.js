const urlParams = new URLSearchParams(window.location.search)
const path_name = window.location.pathname.split('/')
const param_request_type = path_name[path_name.length - 1]
const param_do = path_name[path_name.length - 2]
const global_vehicle_employee = []

$(async function(){
    var action_groups = ['View', 'Delete']
    await main_switch_project()
    await main_render_action_group(action_groups)
    await update_do_delivery()
    await handle_request_type()
    await fetch_vehicle_employee()
    await fetch_data()
    $('.btn-action-group').on('click', async (e)=>{
        const action = e.target.id
        if(action === 'view'){
            main_validate_row().then(valid => valid && click_btn_view(action))
        }
        if(action === 'delete'){
            main_validate_row().then(valid => valid && click_btn_delete())
        }
    })
})

function click_btn_view(action){
    const do_number = $('.selected').find('.do-number').text()
    const dr_number = $('.selected').find('.dr-number').text()
    window.location = `${base_url}/delivery/do/manage?action=${action}&type_do=${param_do}&request_type=${param_request_type}&dr_number=${dr_number}&do_number=${do_number}`
}

function click_btn_delete(){
    let obj_alert = { type: 'error', loading: false, message: 'ลบรายการไม่สำเร็จ' }
    const do_number = $('.selected').find('.do-number').text()
    const do_status = $('.selected').find('.do-number').closest('tr').attr('status')
    if(do_status >= 3){
        main_set_alert({
            position: 'center', icon: 'warning', title: 'ไม่สามารถลบรายการได้<br>DO มีสถานะ Delivery แล้ว',
            showConfirmButton: false, timer: 1500, width: '350px', height: '50px',
        })
        return false
    }
    Swal.fire({
        position: 'center', icon: 'warning', title: `ยืนยันการลบ ${do_number} ?`,
        showConfirmButton: true, width: '350px', height: '50px',
        showCancelButton: true, confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6', cancelButtonColor: '#d33'
    })
    .then((confirm)=>{
        if(confirm.isConfirmed){
            $.ajax({
                url: `${api_url}/delivery/do/delete?do_number=${do_number}`,
                headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
                method: 'GET',
                dataType: 'JSON',
                beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
                success: function(data){
                    if(data){
                        obj_alert.type = 'success'
                        obj_alert.message = 'ลบรายการสำเร็จ'
                        obj_alert.url_redirect = `${base_url}/delivery/do/${param_do}/${param_request_type}`
                    }
                    main_set_loading(obj_alert)
                },
                error: function(err){
                    console.log(err)
                    main_set_loading(obj_alert)
                }
            })
        }
    })
}

function update_do_delivery(){
    return new Promise((resolve, reject)=>{
        $.ajax({
            url: `${api_url}/delivery/do/update_delivery`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){},
            success: function(data){
                console.log(data)
            },
            error: function(err){
                console.log(err)
            }
        })
        resolve(true)
    })
}

function fetch_vehicle_employee(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/master/vehicle_employee`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: async function(data){
                if(typeof data === 'object'){
                    global_vehicle_employee.push(...data)
                    obj_alert.type = 'respond'
                    obj_alert.message = 'Respond'
                }
                main_set_loading(obj_alert)
            },
            error: function(err){
                console.log(err)
                main_set_loading(obj_alert)
            }
        })
        resolve(true)
    })
}

function fetch_data(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/do/fetch_do?type_do=${param_do}&request_type=${param_request_type}`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: async function(data){
                console.log(data)
                data.length > 0 && render_data(data)
                obj_alert.type = 'respond'
                obj_alert.message = 'Respond'
                main_render_datatable('table_data')
                main_set_loading(obj_alert)
            },
            error: function(err){
                console.log(err)
                main_set_loading(obj_alert)
            }
        })
        resolve(true)
    })
}

async function handle_request_type(){
    return new Promise((resolve, reject)=>{
        if(param_request_type === 'finish_goods'){
            $('#table_data').find('.materials').remove()
        }
        if(param_request_type === 'materials'){
            $('#table_data').find('.finish_goods').remove()
        }
        resolve(true)
    })
}

function render_data(data){
    return new Promise((resolve, reject)=>{
        data.forEach((item, index)=>{
            const { dr_number, delivery_date, delivery_type_id, delivery_type_name, request_work_type_id, request_work_type_name, dr_quantity, delivery_place,
                contact_person, contact_number, with_invoice, remark, job_id, job_name, customer_name, ae_emp_name, fg_quantity, detail, commercial_type, commercial_type_name,
                vehicle_owner_id, vehicle_licens, vehicle_driver_name, vehicle_follower, vehicle_quantity, vehicle_reject, vehicle_reject_remark, vehicle_confirm_quantity,
                do_number, do_status_id, do_status_name, do_status_class, departed, arrived, do_quantity, summary_do_quantity, do_complete_quantity,
                item_name, item_quantity_dr, item_quantity_do, job_confirm_quantity, dr_quanity_remain } = item
            let summary_job = 0
            let follower_emp = []
            let follower_emp_name = ""
            let txt_item = ""
            let dr_remain = do_status_id > 3 ? do_quantity : 0
            let txt_dr_quantity = request_work_type_id === 3 ? item_quantity_dr : dr_quantity
            let txt_do_quantity = request_work_type_id === 3 ? item_quantity_do : vehicle_quantity > 0 ? vehicle_quantity : do_quantity
            let txt_quantity_confirm = request_work_type_id === 3 ? numeral(item_quantity_do).format('0,0')  : numeral(vehicle_quantity - vehicle_reject).format('0,0')
            let txt_quantity_reject = request_work_type_id === 3 ? 0 : numeral(vehicle_reject).format('0,0')
            if(typeof detail == 'undefined' && typeof item_name != 'undefined'){
                txt_item = item_name
            }
            if(typeof detail !== 'undefined'){
                if(detail.length > 0){
                    txt_item = detail.map(x => x.pallet_barcode).join(' ')
                }else{
                    txt_item = item_name
                }
            }
            if(typeof vehicle_follower === 'string'){
                const follower = JSON.parse(vehicle_follower)
                for(let i of follower){
                    const emp = global_vehicle_employee.filter((x, y)=> x.vehicle_emp_id == i)[0]
                    follower_emp.push(emp)
                }
                follower_emp_name = follower_emp.map((x, y) => x.vehicle_emp_name).join('<br>')
            }
            // const truck_licens = vehicle === null ? "" : vehicle.truck_licens
            // let vehicle_reject_remark = "", vehicle_reject_quantity = "", vehicle_quantity = "", balance_do_quantity = ""
            // if(do_status >= 4){
            //     vehicle_reject_remark = vehicle.vehicle_reject_remark === undefined ? "" : vehicle.vehicle_reject_remark
            //     vehicle_reject_quantity = vehicle.vehicle_reject === undefined ? "" : vehicle.vehicle_reject
            //     vehicle_quantity = vehicle.vehicle_quantity === undefined ? "" : vehicle.vehicle_quantity
            //     balance_do_quantity = vehicle_quantity - vehicle_reject_quantity
            // }
            // let sum_pallet_weight = 0
            // let sum_issue_status = 0
            // if(pallet.length > 0){
            //     for(let i of pallet){
            //         sum_pallet_weight += i.pallet_weight
            //         sum_issue_status += i.issue_status
            //     }
            // }
            $('#table_data tbody').append(`
                <tr id="${do_number}" status="${do_status_id}">
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center do-number">${do_number}</td>
                    <td class="text-center project-state">
                        <span class="badge badge-${do_status_class}">${do_status_name}</span>
                    </td>
                    <td class="text-center">${vehicle_licens === null ? "" : vehicle_licens}</td>
                    <td class="text-center">${commercial_type_name}</td>
                    <td class="text-center">${delivery_type_name}</td>
                    <td class="text-center dr-number">${dr_number}</td>
                    <td class="text-wrap">${txt_item}</td>
                    <td class="text-center">${job_id}</td>
                    <td class="text-right">${fg_quantity > 0 ? numeral(fg_quantity).format('0,0') : ""}</td>
                    <td class="text-right">${numeral(txt_dr_quantity).format('0,0')}</td>
                    <td class="text-right">${numeral(txt_do_quantity).format('0,0')}</td>
                    <td class="text-right">${numeral(dr_quanity_remain).format('0,0')}</td>
                    <td class="text-right">${fg_quantity > 0 ? numeral(fg_quantity - job_confirm_quantity).format('0,0') : ""}</td>
                    <td class="text-right">${do_status_id > 3 ? txt_quantity_confirm : ""}</td>
                    <td class="text-right">${do_status_id > 3 ? txt_quantity_reject : ""}</td>
                </tr>
            `)
        })
/*
<td class="text-center">${job_name}</td>
<td class="text-center">${request_work_type_name}</td>
<td class="text-center">${ae_emp_name}</td>
<td class="text-center">${customer_name}</td>
<td class="text-center">${delivery_place}</td>
<td class="text-center">${contact_person}</td>
<td class="text-center">${contact_number}</td>
<td class="text-center">${vehicle_licens === null ? "" : vehicle_licens}</td>
<td class="text-center">${vehicle_driver_name === null ? "" : vehicle_driver_name}</td>
<td class="text-center">${follower_emp_name}</td>
<td class="text-center">${moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
<td class="text-center">${moment(departed, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
<td class="text-center">${moment(arrived, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
<td class="text-center">${with_invoice === 1 ? "&#x2714;" : "&#x2718;"}</td>
<td class="text-center">${remark}</td>
<td class="text-center"><i class="fas fa-folder"></i></td>
<td class="text-center"><i class="fas fa-close"></i></td>
{
    "dr_quantity": 1000,
    "do_quantity": 1000,
    "do_complete_quantity": 1000,
}

*/
        resolve(true)
    })
}

function get_emp_follower(data){
    var follower_emp = []
    for(let i of data){
        let emp = global_vehicle_employee.filter((x)=> x.vehicle_emp_id == i)[0]
        follower_emp.push(emp)
    }
    return follower_emp
}