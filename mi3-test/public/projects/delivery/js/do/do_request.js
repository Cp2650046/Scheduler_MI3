const urlParams = new URLSearchParams(window.location.search)
const path_name = window.location.pathname.split('/')
const param_request_type = path_name[path_name.length - 1]
const param_do = path_name[path_name.length - 2]
var pallet = []

$(async function(){
    var action_groups = ['Create', 'Edit', 'Delete']
    await main_switch_project()
    await main_render_action_group(action_groups)
    await handle_request_type()
    await fetch_data()
    $('#dataModal').on('show.bs.modal', (event)=> render_pallet(event))
    $('.btn-action-group').on('click', async (e)=>{
        const action = e.target.id
        if(action === 'create'){
            main_validate_row().then(valid => valid && click_btn_create(action))
        }
        if(action === 'edit'){
            main_validate_row().then(valid => valid && click_btn_edit(action))
        }
        if(action === 'delete'){
            main_validate_row().then(valid => valid && click_btn_delete(action))
        }
    })
})

function click_btn_create(action){
    const dr_number = $('.selected').attr('id')
    const do_number = $('.selected').find('.do-number').text()
    if(do_number != ""){
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณาสร้าง DO จากรายการ DR',
            showConfirmButton: false, timer: 1500, width: '350px', height: '50px',
        })
        return false
    }
    window.location = `${base_url}/delivery/do/manage?action=${action}&type_do=${param_do}&request_type=${param_request_type}&dr_number=${dr_number}`
}

function click_btn_edit(action){
    const dr_number = $('.selected').attr('id')
    const do_number = $('.selected').find('.do-number').text()
    if(do_number == ""){
        main_set_alert({
            position: 'center', icon: 'warning', title: 'กรุณาสร้างรายการ DO',
            showConfirmButton: false, timer: 1500, width: '350px', height: '50px',
        })
        return false
    }
    window.location = `${base_url}/delivery/do/manage?action=${action}&type_do=${param_do}&request_type=${param_request_type}&dr_number=${dr_number}&do_number=${do_number}`
}

function click_btn_delete(){
    const do_number = $('.selected').find('.do-number').text()
    let obj_alert = { type: 'error', loading: false, message: 'ลบรายการไม่สำเร็จ' }
    if(do_number === ''){
        main_set_alert({
            position: 'center', icon: 'warning', title: 'ไม่สามารถลบรายการได้<br>DR นี้ยังไม่มีการสร้าง DO',
            showConfirmButton: false, timer: 1500, width: '350px', height: '70px',
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
                if(typeof data === 'object'){
                    render_data(data)
                    param_request_type === 'finish_goods' && (pallet = data)
                }
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

function handle_request_type(){
    return new Promise((resolve, reject)=>{
        if(param_request_type === 'finish_goods'){
            $('#table_data').find('.materials').remove()
            $('.card-header').find('small').html('ประเภทส่งงานเป็นสินค้า: แสดงเฉพาะ DR ที่มีการจ่ายพาเลทครบแล้ว')
        }
        if(param_request_type === 'materials'){
            $('#table_data').find('.finish_goods').remove()
            $('.card-header').find('small').html('')
        }
        resolve(true)
    })
}

function render_data(data){
    data.forEach((item, index)=>{
        const { unique_id, dr_number, delivery_date, dr_quantity, delivery_place, with_invoice, dr_remark, postpone_id, postpone_name,
            delivery_type_id, delivery_type_name, request_work_type_id, request_work_type_name, commercial_type, commercial_type_name,
            job_id, job_name, customer_name, ae_emp_name, do_number, do_quantity, item_name, item_quantity, detail } = item
        let pallet_barcode = "", pallet_weight = "", pallet = ""
        let quantity = param_request_type === 'materials' && commercial_type === 1 ? item_quantity : dr_quantity
        let item_materials = param_request_type === 'materials' && commercial_type === 2 ? "" : item_name
        if(commercial_type === 1 && delivery_type_id === 1){
            if(typeof detail !== 'undefined'){
                if(detail.length > 0){
                    pallet_barcode = item.detail.map(item => ` ${item.pallet_barcode}`).join(',')
                    pallet_weight = item.detail.map(item => item.pallet_weight).reduce((total, x)=> total + x, 0).toFixed(2)
                    pallet = calculate_pallet_quantity(item.detail)
                }
            }
        }
        let dr_rows = `
            <tr id="${dr_number}">
                <td class="text-center">${index + 1}</td>
                <td class="text-center">${dr_number}</td>
                <td class="text-center">${moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
                <td class="text-right">${numeral(quantity).format('0,0')}</td>
                <td class="text-center">${delivery_type_name}</td>
                <td class="text-center">${commercial_type_name}</td>
                <td class="text-left">${postpone_name != undefined ? postpone_name : ""}</td>
                <td class="text-center">${job_id}</td>
                <td class="text-left">${job_name}</td>
                <td class="text-center do-number">${do_number}</td>
        `
        if(param_request_type === 'finish_goods'){
            dr_rows += `
                <td class="text-right">${do_quantity > 0 ? numeral(do_quantity).format('0,0') : ""}</td>
                <td class="text-center">${pallet_barcode ? `<span data-toggle="modal" data-target="#dataModal"><a class="txt-link">${pallet_barcode}</a></span> ` : ""}</td>
                <td class="text-center">${pallet_weight > 0 ? pallet_weight : ""}</td>
            `
        }
        if(param_request_type === 'materials'){
            dr_rows += `<td class="text-center">${item_materials}</td>`
        }
        dr_rows += `
                <td class="text-center">${request_work_type_name}</td>
                <td class="text-left">${customer_name}</td>
                <td class="text-left">${delivery_place}</td>
                <td class="text-center">${ae_emp_name}</td>
        `
        if(param_request_type === 'finish_goods'){
            dr_rows += `<td class="text-center">${with_invoice === 1 ? "&#x2714;" : "&#x2718;"}</td>`
        }
        dr_rows += ` 
                <td class="text-center"><i class="fas fa-folder"></i></td>
                <td class="text-left">${dr_remark}</td>
            </tr>
        `
        $('#table_data tbody').append(dr_rows)
    })
}

function render_pallet(event){
    const dr_number = $(event.relatedTarget).closest('tr').attr('id')
    const do_number = $(event.relatedTarget).closest('tr').find('.do-number').text()
    const filter_key = do_number !== "" ? 'do_number' : 'dr_number'
    const filter_value = do_number !== "" ? do_number : dr_number
    const delivery_pallet = pallet.filter(item => item[filter_key] === filter_value)[0]
    $('#table_pallet tbody').empty()
    $(event.target).find('.modal-title').text(`รายละเอียดพาเลท (${filter_value})`)
    delivery_pallet.detail.forEach((item, index)=>{
        const { pallet_barcode, pallet_quantity, pallet_weight, pallet_remark, issue_status, receive_date, receive_emp_id, receive_emp_name,
            pieces_per_pack, packs_per_box, boxs_per_pallet, dimension_per_pack, location_id, location_code, location_name } = item
        $('#table_pallet tbody').append(`
            <tr id="${pallet_barcode}">
                <td class="text-center">${index + 1}</td>
                <td class="text-center">${moment(receive_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
                <td class="text-center">${pallet_barcode}</td>
                <td class="text-center">${delivery_pallet.job_id}</td>
                <td class="text-left">${delivery_pallet.job_name}</td>
                <td class="text-center">${receive_emp_name}</td>
                <td class="text-center">${pallet_remark}</td>
                <td class="text-center">${location_code}</td>
                <td class="text-center">${numeral(pallet_quantity).format('0,0')}</td>
                <td class="text-center">${numeral(boxs_per_pallet).format('0,0')}</td>
                <td class="text-center">${numeral(pallet_weight).format('0,0 0.00')}</td>
                <td class="text-center">${dimension_per_pack}</td>
            </tr>
        `)
    })
}

function calculate_pallet_quantity(pallet){
	let dr_quantity_balance = 0
	let sum_pallet_quantity = 0
	sum_pallet_quantity = pallet.reduce((p, x) => p + parseInt(x.pallet_quantity), 0)
	return { dr_quantity_balance, sum_pallet_quantity }
}