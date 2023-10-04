$(async function(){
    await main_switch_project()
    await fetch_data()
})

function fetch_data(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/get_return_pallet`,
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
            const { pallet_barcode, return_status_id, pallet_quantity, job_id, do_number, dr_number, request_work_type_id,
                delivery_date, dr_remark, request_work_type_name, return_status_name, job_name } = item
            $('#table_data tbody').append(`
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-center">${pallet_barcode}</td>
                    <td class="text-center project-state"><span class="badge badge-${render_return_status(return_status_id)}">${return_status_name}</span></td>
                    <td class="text-center">${dr_number}</td>
                    <td class="text-center">${do_number}</td>
                    <td class="text-right">${numeral(pallet_quantity).format('0,0')}</td>
                    <td class="text-center">${job_id}</td>
                    <td class="text-left">${job_name}</td>
                    <td class="text-center">${request_work_type_name}</td>
                    <td class="text-center">${delivery_date === null ? "" : moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')}</td>
                    <td class="text-left">${dr_remark}</td>
                </tr>
            `)
        })
        resolve(true)
    })
}

function render_return_status(status_id){
    switch(status_id){
        case 1:
            return "warning"
        case 2:
            return "success"
        case 3:
            return "danger"
        default:
            return "default"
    }
}