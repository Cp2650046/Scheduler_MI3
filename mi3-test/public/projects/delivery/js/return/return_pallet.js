$(async function(){
    var action_groups = [{ name: 'Return', icon: 'fas fa-reply mr-1' }]
    await main_switch_project()
    await main_render_action_group(action_groups)
    await fetch_data()
    $('#return').on('click', (e)=> main_validate_row().then((valid)=> valid && validate_pallet(e)))
})

function fetch_data(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/get_delivery_pallet`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...' }) },
            success: async function(data){
                data.length > 0 && (render_data(data))
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
        $('#table_data tbody').empty()
        data.forEach((item, index)=>{
            const { do_number, dr_number, pallet_barcode, pallet_quantity } = item
            $('#table_data tbody').append(`
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center dr-number">${dr_number}</td>
                    <td class="text-center do-number">${do_number}</td>
                    <td class="text-center pallet-barcode">${pallet_barcode}</td>
                    <td class="text-right">${numeral(pallet_quantity).format('0,0')}</td>
                </tr>
            `)
        })
        resolve(true)
    })
}

function validate_pallet(e){
    return new Promise((resolve, reject)=>{
        const dr_number = $('.selected').find('.dr-number').text()
        const do_number = $('.selected').find('.do-number').text()
        const pallet_barcode = $('.selected').find('.pallet-barcode').text()
        if(dr_number != "" && do_number != ""){
           window.location = `${base_url}/delivery/do/manage?action=view&type_do=order&request_type=finish_goods&dr_number=${dr_number}&do_number=${do_number}`
        }else{
            return_pallet(dr_number, pallet_barcode)
        }
        resolve(true)
    })
}

function return_pallet(dr_number, pallet_barcode){
    Swal.fire({
        position: 'center', icon: 'warning', title: `ยืนยันการคืนพาเลท<br>${pallet_barcode}`,
        showConfirmButton: true, width: '350px', height: '50px',
        showCancelButton: true, confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6', cancelButtonColor: '#d33'
    })
    .then((confirm)=>{
        if(confirm.isConfirmed){
            let obj_alert = { type: 'error', loading: false, message: 'คืนพาเลทไม่สำเร็จ' }
            $.ajax({
                url: `${api_url}/delivery/save_return_pallet?dr_number=${dr_number}&pallet_barcode=${pallet_barcode}`,
                headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
                method: 'GET',
                dataType: 'JSON',
                beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
                success: function(data){
                    console.log(data)
                    if(data){
                        obj_alert.type = 'success'
                        obj_alert.message = 'คืนพาเลทสำเร็จ'
                        obj_alert.url_redirect = `${base_url}/delivery/return/return_pallet`
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