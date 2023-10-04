$(async function(){
    var action_groups = ['Create', 'Update', 'Delete']
    await main_switch_project()
    main_render_action_group(action_groups)
    fetch_data()

    $('#save').on('click', async ()=>{
        if(await form_validate() === false){
            main_set_alert({
                position: 'center',
                icon: 'warning',
                title: 'กรุณาระบุข้อมูลให้ครบถ้วน',
                showConfirmButton: false,
                timer: 1000,
                width: '300px',
                height: '100px',
            })
            return false
        }
        create_data()
    })
})

async function fetch_data(){
    let obj_alert = {type: 'error', loading: false, message: 'บันทึกข้อมูลไม่สำเร็จ' }
    main_set_loading({ loading: true, message: 'LOADING ...'})
    $('#create').attr('data-toggle','modal')
    $('#create').attr('data-target','#dataModal')
    if(await render_data() === true){
        obj_alert.type = 'respond'
        obj_alert.message = 'Respond'
    }
    main_set_loading({ type: obj_alert.type, loading: false, message: obj_alert.message})
}

function render_data(){
    return new Promise((resolve, reject)=>{
        const masterData = USER_DATA.projectData.master
        const request_type_work = masterData.filter(item => item.master_tb_name === 'tb_master_request_type_work')
        const request_type = masterData.filter(item => item.master_tb_name === 'tb_master_request_type')
        const request_type_work_master_data = request_type_work[0].master_data
        const request_type_master_data = request_type[0].master_data
        request_type_work_master_data.forEach((item, index) => {
            const request_type_map = request_type_master_data.filter((type) => type.request_type_id === item.request_type_id)
            const { request_type_name } = request_type_map[0]
            $('#table_data tbody').append(`
                <tr>
                    <td class="text-center">${item.request_work_type_id}</td>
                    <td class="text-center">${request_type_name}</td>
                    <td class="text-left">${item.request_work_type_name}</td>
                </tr>
            `)
        })
        main_render_datatable('table_data')
        resolve(true)
    })
    /*
    $.ajax({
        url: `${api_url}/delivery/master_data/request_work_type/view`,
        headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
        method: 'POST',
        dataType: 'JSON',
        beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
        success: function(data){
            if(data.length > 0){
                $('#table_data tbody').empty()
                data.forEach((item, index) => {
                    $('#table_data tbody').append(`
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td class="text-center">${item.request_type_name}</td>
                            <td class="text-left">${item.request_work_type}</td>
                        </tr>
                    `)
                })
                main_render_datatable('table_data')
                main_set_loading({ type: 'OK', loading: false, message: 'OK'})
            }else{
                main_set_loading({ type: 'error', loading: false, message: 'บันทึกข้อมูลไม่สำเร็จ'})
            }
        },
        error: function(err){
            console.log(err)
        }
    })
    */
}

function click_btn_create(){
    $('#dataModal').find('.modal-body').html(`
        <div class="row">
            <div class="col-sm-12">
                <div class="form-group">
                    <label>ประเภท Request</label>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="request_type" value="1">
                        <label class="form-check-label">Request เพื่อส่งสินค้า</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="request_type" value="2">
                        <label class="form-check-label">Request เพื่อส่งวัตถุดิบ</label>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-12">
                <div class="form-group">
                    <label>ประเภทงาน</label>
                    <input type="text" class="form-control form-control-sm" name="request_work_type" placeholder="Enter ...">
                </div>
            </div>
        </div>
    `)
}

function form_validate(){
    return new Promise((resolve, reject)=>{
        const request_type = $('input[name=request_type]:checked')
        const request_work_type = $('input[name=request_work_type]').val()
        const validate = request_type.length > 0 && request_work_type.length > 0 ? true : false
        resolve(validate)
    })
}

function create_data(){
    const request_type = $('input[name=request_type]:checked').val()
    const request_work_type = $('input[name=request_work_type]').val()
    const sendData = { request_type: parseInt(request_type), request_work_type: request_work_type}
    $.ajax({
        url: `${api_url}/delivery/master_data/request_work_type/create`,
        headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
        method: 'POST',
        data: JSON.stringify(sendData),
        dataType: 'JSON',
        beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
        success: function(data){
            if(data === true){
                $('body').on('loading.stop', (event, loadingObj)=>{
                    main_set_switch_master()
                    $('#dataModal').find('.close').click()
                })
                main_set_loading({ type: 'success', loading: false, message: 'บันทึกข้อมูลสำเร็จ'})
                location.reload()
            }else{
                main_set_loading({ type: 'error', loading: false, message: 'บันทึกข้อมูลไม่สำเร็จ'})
            }
        },
        error: function(err){
            console.log(err)
        }
    })
}

function click_btn_update(){
    toastr.success('clicked update')
}