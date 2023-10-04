$(async function(){
    var action_groups = [{ name: 'View', icon: 'fas fa-folder-open' }]
    await main_switch_project()
    await main_render_action_group(action_groups)
    await fetch_data()
    $('#view').on('click', ()=>{
        const job_id = $('.selected').attr('id')
        main_validate_row().then((valid)=> valid && (window.location = `${base_url}/delivery/dr?job_id=${job_id}`))
    })
})

function fetch_data(){
    return new Promise((resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/job/fetch_job`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...' }) },
            success: async function(data){
                data.length > 0 && (await render_data(data))
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
            const { job_id, job_name, emp_name, customer_name, job_quantity, ok_date, created, job_laos } = item
            $('#table_data tbody').append(`
                <tr id="${job_id}">
                    <td class="text-center">${job_id}</td>
                    <td class="text-left">${job_name}</td>
                    <td class="text-left">${emp_name}</td>
                    <td class="text-left">${customer_name}</td>
                    <td class="text-right">${numeral(job_quantity).format('0,0')}</td>
                    <td class="text-center">${ok_date === "" ? "" : moment(ok_date).format('DD/MM/YYYY')}</td>
                    <td class="text-center">${moment(created).format('DD/MM/YYYY')}</td>
                    <td class="text-center">${job_laos == 1 ? "&#x2714;" : "&#x2718;"}</td>
                </tr>
            `)
        })
        resolve(true)
    })
}