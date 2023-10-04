const urlParams = new URLSearchParams(window.location.search)
const param_job_id = urlParams.get('job_id')
var job_laos = false

$(async function(){
    var action_groups = ['Create', 'Edit', 'Delete', 'Cancel']
    await main_switch_project()
    await main_render_action_group(action_groups)
    await fetch_data()
    $('input[name=is_wrap]').on('change', (e)=> save_wrapjob(e.target.value))
    $('.btn-action-group').on('click', async (e)=>{
        const action = e.target.id
        if(action === 'create'){
            validate_job_laos().then(valid => valid && click_btn_create(action))
        }
        if(action === 'edit'){
            main_validate_row().then(valid => valid && click_btn_edit(action))
        }
        if(action === 'delete'){
            main_validate_row().then(valid => valid && click_btn_delete(action))
        }
        if(action === 'cancel'){
            click_btn_cancel()
        }
    })
})

function click_btn_cancel(){
    window.location = `${base_url}/delivery/dr/`
}

function click_btn_create(action){
    window.location = `${base_url}/delivery/dr/manage?action=${action}&job_id=${param_job_id}`
}

function click_btn_edit(action){
    const dr_number = $('.selected').attr('id')
    window.location = `${base_url}/delivery/dr/manage?action=${action}&job_id=${param_job_id}&dr_number=${dr_number}`
}

function click_btn_delete(action){
    const dr_number = $('.selected').attr('id')
    let obj_alert = { type: 'error', loading: false, message: 'ลบรายการไม่สำเร็จ' }
    Swal.fire({
        position: 'center', icon: 'warning', title: `ยืนยันการลบ ${dr_number} ?`,
        showConfirmButton: true, width: '350px', height: '50px',
        showCancelButton: true, confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6', cancelButtonColor: '#d33'
    })
    .then((confirm)=>{
        if(confirm.isConfirmed){
            $.ajax({
                url: `${api_url}/delivery/dr/${action}?dr_number=${dr_number}`,
                headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
                method: 'GET',
                dataType: 'JSON',
                beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
                success: function(data){
                    if(data.count_do > 0){
                        main_set_alert({
                            position: 'center', icon: 'warning', title: 'ไม่สามารถลบรายการได้<br>เนื่องจาก DR มีการสร้าง DO แล้ว',
                            showConfirmButton: false, timer: 1500, width: '350px', height: '50px',
                        })
                        obj_alert.type = 'respond'
                        obj_alert.message = 'Respond'
                        main_set_loading(obj_alert)
                    }else{
                        obj_alert.type = 'success'
                        obj_alert.message = 'ลบรายการสำเร็จ'
                        obj_alert.url_redirect = `${base_url}/delivery/dr?job_id=${param_job_id}`
                        main_set_loading(obj_alert)
                    } 
                },
                error: function(err){
                    console.log(err)
                    main_set_loading(obj_alert)
                }
            })
            
        }
    })
}

function fetch_data(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/dr/fetch_dr?job_id=${param_job_id}`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: async function(data){
                data.head !== undefined && (render_data(data))
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

function render_data(data){
    return new Promise((resolve, reject)=>{
        const { ae_emp_id, ae_emp_name, customer_id, customer_name, due_date, is_laos, is_wrap, job_id, job_name, quantity, balance } = data.head
        $('#is_wrap_'+is_wrap).prop('checked', true)
        $('input[name=is_wrap]').attr('disabled', is_laos === 0 || data.detail.length > 0 && true)
        $('span[name=job_id]').text(job_id)
        $('span[name=job_name]').text(job_name)
        $('span[name=ae_emp_name]').text(ae_emp_name)
        $('span[name=customer_name]').text(customer_name)
        $('span[name=due_date]').text(due_date === null ? "" : moment(due_date).format('DD/MM/YYYY'))
        $('span[name=quantity]').text(numeral(quantity).format('0,0'))
        $('span[name=balance]').text(numeral(balance).format('0,0'))
        $('input[ae_emp_id]').val(ae_emp_id)
        $('input[customer_id]').val(customer_id)
        job_laos = is_laos === 1 && true
        data.detail.forEach((item, index)=>{
            const { dr_number, dr_quantity, total_delivery, total_reject, delivery_date, request_work_type_name, source_place_name, delivery_place, remark, postpone_name } = item
            const dr_status = render_dr_status(dr_quantity, total_delivery)
            $('#table_data tbody').append(`
                <tr id="${dr_number}">
                    <td class="text-center">${dr_number}</td>
                    <td class="text-center">${moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
                    <td class="text-right">${numeral(dr_quantity).format('0,0')}</td>
                    <td class="text-center">${request_work_type_name}</td>
                    <td class="text-center">${source_place_name}</td>
                    <td class="text-left text-wrap">${delivery_place}</td>
                    <td class="text-right">${numeral(total_delivery - total_reject).format('0,0')}</td>
                    <td class="text-right">${numeral(total_reject).format('0,0')}</td>
                    <td class="text-center project-state">
                        <span class="badge badge-${dr_status.badge_class}">${dr_status.badge_title}</span>
                    </td>
                    <td class="text-left">${remark}</td>
                    <td class="text-left">${postpone_name === null ? "" : postpone_name}</td>
                </tr>
            `)
        })
        resolve(true)
    })
}

function render_dr_status(dr_quantity, total_delivery){
    const dr_quantity_remain = (dr_quantity - total_delivery)
    const badge_success = { badge_title: 'Success', badge_class: 'success'}
    const badge_pending = { badge_title: 'Pending', badge_class: 'secondary'}
    return dr_quantity_remain <= 0 ? badge_success : badge_pending
}

function validate_job_laos(){
    return new Promise((resolve, reject)=>{
        if(job_laos && $('input[name=is_wrap]:checked').length === 0){
            main_set_alert({
                position: 'center', icon: 'warning', title: 'ระบุการส่งปกไปโรงงานลาว',
                showConfirmButton: false, timer: 1500, width: '350px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function save_wrapjob(is_wrap){
    let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
    $.ajax({
        url: `${api_url}/delivery/save_wrap_job`,
        headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
        method: 'POST',
        dataType: 'JSON',
        data: JSON.stringify({ job_id: param_job_id, is_wrap }),
        beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
        success: function(data){
            if(data.success){
                obj_alert.type = 'success'
                obj_alert.message = 'บันทึกข้อมูลสำเร็จ'
            }
            main_set_loading(obj_alert)
        },
        error: function(err){
            console.log(err)
            main_set_loading(obj_alert)
        }
    })
}