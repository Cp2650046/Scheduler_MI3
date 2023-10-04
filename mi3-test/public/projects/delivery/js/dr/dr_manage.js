const urlParams = new URLSearchParams(window.location.search)
const param_action = urlParams.get('action')
const param_job_id = urlParams.get('job_id')
const param_dr_number = urlParams.get('dr_number')
var validated = 0
var global_quantity = 0
var global_item = []
var global_delivery_date = ""

$(async function(){
    var action_groups =  ['Save', 'Cancel']
    await main_switch_project()
    await main_render_action_group(action_groups)
    await fetch_data()

    $('.date').datetimepicker({
        sideBySide: true,
        format: 'L',
        format: 'DD/MM/YYYY HH:mm',
        minDate: new Date(),
        ignoreReadonly: true,
        allowInputToggle: true,
    })
    $('.date').on('keydown paste', (e)=>{
        e.stopPropagation()
        e.preventDefault()
        return false
    })
    $('.select2').select2({ placeholder: 'Select Edition' })
    $('.btn-action-group').on('click', async (e)=>{
        const action = e.target.id
        if(action === 'save'){
            click_btn_save()
        }
        if(action === 'cancel'){
            click_btn_cancel()
        }
    })
    //$('#dr_attach').on('change', async (e)=> $('label[for=dr_attach]').text(e.target.files[0].name))
    //$('#btn_attachment').attr('disabled', true)
    $('#dr_data').on('blur', '.postpone-event', ()=> param_action === 'edit' && validate_postpone())
    $(':input[required]:not(:disabled)').on('keyup change blur', (e)=> validated === 1 && (validate_dr()))
    $('.dr-item').on('change', ()=> validate_delivery_item().then((valid) => valid && summary_item()))
    $('#add_item').on('click', ()=> add_item().then(() => summary_item()))
    $('#tb_data_item').on('click', '.remove-item', (e)=> remove_item(e).then(() => summary_item()))
    $('#tb_data_item').on('keyup', '.item-quantity', ()=> summary_item())
    $('#tb_data_item').on('keypress', '.number', (e)=> main_number_key(e))
    $('#tb_data_item .item-name').each((i, t)=> render_item_name(t))
    //$('#tb_data_item').on('click', '.item-name', (e)=> render_item_name(e))
})

function click_btn_cancel(){
    window.location = `${base_url}/delivery/dr?job_id=${param_job_id}`
}

async function click_btn_save(){
    let obj_alert = { type: 'error', loading: false, message: 'บันทึกข้อมูลไม่สำเร็จ' }
    return Promise.all([
        validate_dr(), validate_dr_item()
    ])
    .then((data)=>{
        const notCompleted = data.some((item)=> item === false)
        if(notCompleted){
            validated = 1
            return false
        }
        $.ajax({
            url: `${api_url}/delivery/dr/save`,
            headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'user_account': USER_DATA.user_account },
            method: 'POST',
            data: $("#dr_data").serialize(),
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: function(data){
                if(data){
                    obj_alert.type = 'success'
                    obj_alert.message = 'บันทึกข้อมูลสำเร็จ'
                    obj_alert.url_redirect = `${base_url}/delivery/dr?job_id=${param_job_id}`
                }
                main_set_loading(obj_alert)
            },
            error: function(err){
                console.log(err)
                main_set_loading(obj_alert)
            }
        })
    })
}

function fetch_data(){
    return new Promise(async (resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        $.ajax({
            url: `${api_url}/delivery/dr/manage?action=${param_action}&job_id=${param_job_id}&dr_number=${param_dr_number}`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: function(data){
                if(typeof data.head !== 'undefined'){
                    render_data(data)
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

function fetch_item_commercial(request_work_type_id){
    return new Promise(async (resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        await  $.ajax({
            url: `${api_url}/delivery/dr/item?request_work_type_id=${request_work_type_id}&job_id=${param_job_id}`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: function(commercial){
                if(commercial.length > 0){
                    obj_alert.type = 'respond'
                    obj_alert.message = 'Respond'
                    set_global_item(commercial)
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

function render_data(data){
    let { head, detail, edition } = data
    let contactAutocomplete = {
        element_key: 'contact_person', element_show: 'contact_number',
        data_source: `${api_url}/delivery/datalist/contact?job_id=${param_job_id}`,
        field_key: 'contact_person', field_show: 'telephone', field_show_status: true, change_status: false,
    }
    let deliveryPlaceAutocomplete = {
        element_key: 'delivery_place', element_show: 'delivery_place',
        data_source: `${api_url}/delivery/datalist/address?job_id=${param_job_id}&is_laos=${head.is_laos}`,
        field_key: 'delivery_place', field_show: 'delivery_place', field_show_status: false, change_status: false,
    }
    render_title_action()
    handle_delivery_item(0)
    render_edition(edition)
    main_render_autocomplete(contactAutocomplete)
    main_render_autocomplete(deliveryPlaceAutocomplete)
    render_master_data(['tb_master_request_type_work', 'tb_master_source_place'])
    if(detail.postpone_remark > 0){
        $('#postpone_remark').attr('disabled', false)
        $('select#postpone_remark').attr('required', 'required')
        render_master_data(['tb_master_postpone_remark'], { postpone_id:detail.postpone_remark })
    }
    head.is_laos !== 1 && ($('#request_work_type_id').find('option[value=3]').attr('disabled', true))
    param_action === 'create' && (render_action_create(data))
    param_action === 'edit' && (render_action_edit(data))
}

function render_action_create(data){
    $('input[name=action]').val(param_action)
    $('input[name=is_wrap]').val(data.head.is_wrap)
    $('input[name=dr_number]').val('AUTO')
    $('input[name=job_id]').val(data.head.job_id)
    $('input[name=job_name]').val(data.head.job_name)
    $('input[name=created]').val(moment().format('DD/MM/YYYY HH:mm:ss'))
    $('input[name=created_emp_id]').val(USER_DATA.emp_id)
    $('input[name=created_data]').val(USER_DATA.user_name+' '+moment().format('DD/MM/YYYY HH:mm:ss'))
    $('#source_place').find('option[value=2]').attr('selected','selected')  // Default: Bangpakong
}

function render_action_edit(data){
    const { job_id, job_name, is_wrap } = data.head
    const { unique_id, dr_number, dr_quantity, contact_person, contact_number, request_work_type_id, delivery_date, delivery_type_id, commercial_type, po_number, is_coa, 
        with_invoice, remark, source_place, delivery_place, postpone_remark, created, created_emp_id, created_emp_name, updated, updated_emp_id, updated_emp_name } = data.detail
    $('#dr_number_attach').html(dr_number)
    $('input[name=action]').val(param_action)
    $('input[name=is_wrap]').val(is_wrap)
    $('input[name=unique_id]').val(unique_id)
    $('input[name=dr_number]').val(dr_number)
    $('input[name=dr_quantity]').val(numeral(dr_quantity).format('0,0'))
    $('input[name=contact_person]').val(contact_person)
    $('input[name=contact_number]').val(contact_number)
    $('input[name=delivery_date]').val(moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'))
    $('textarea[name=delivery_place]').val(delivery_place)
    $('textarea[name=remark]').val(remark)
    $('input[name=po_number]').val(po_number)
    $('input[name=job_id]').val(job_id)
    $('input[name=job_name]').val(job_name)
    $('input[name=updated_emp_id]').val(USER_DATA.emp_id)
    $('input[name=created]').val(created)
    $('input[name=created_emp_id]').val(created_emp_id)
    $('input[name=created_data]').val(created_emp_name+' '+moment(created, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'))
    $('input[name=is_coa]').prop('checked', is_coa > 0 && true)
    $('#with_invoice_'+with_invoice).prop('checked', true)
    $('#delivery_type_'+delivery_type_id).prop('checked', true)
    $('#commercial_type_'+commercial_type).prop('checked', true)
    $('#source_place option[value='+source_place+']').attr('selected', 'selected')
    $('#request_work_type_id option[value='+request_work_type_id+']').attr('selected', 'selected')
    if(updated !== null){
        $('input[name=updated]').val(updated)
        $('input[name=updated_emp_id]').val(updated_emp_id)
        $('input[name=updated_data]').val(updated_emp_name+' '+moment(updated, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'))
    }
    handle_action_edit(request_work_type_id)
    validate_delivery_item().then(valid => valid && data.item.forEach((item, index) => add_item(item, index)))
    postpone_remark > 0 && ($('select#postpone_remark option[value='+postpone_remark+']').attr('selected', 'selected'))
    global_quantity = parseInt(dr_quantity)
    global_delivery_date = moment(delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')
}

function render_title_action(){
    let icon_action = ""
    param_action === 'create' && (icon_action = 'fas fa-file-alt')
    param_action === 'edit' && (icon_action = 'fas fa-edit')
    $('.card-title').empty().append(`
        <i class="${icon_action} mr-1"></i>
        ${param_action.charAt(0).toUpperCase() + param_action.slice(1)} Delivery Request
    `)
}

function render_master_data(tb_master, option_type){
    tb_master.forEach((tb_item, tb_index)=>{
        let element = ""
        let element_item = {id: 0, name: ""}
        let master_data = main_get_master_data(tb_item)
        switch(tb_item){
            case 'tb_master_request_type_work':
                element = $('select[name=request_work_type_id]')
                element_item.id = 'request_work_type_id'
                element_item.name = 'request_work_type_name'
            break
            case 'tb_master_source_place':
                element = $('select[name=source_place]')
                element_item.id = 'source_place_id'
                element_item.name = 'source_place_name'
            break
            case 'tb_master_postpone_remark':
                let key_obj = Object.keys(option_type)[0]
                master_data = master_data.filter((x) => x[key_obj] === option_type[key_obj])
                element = $('select[name=postpone_remark]')
                element_item.id = 'postpone_id'
                element_item.name = 'postpone_name'
            break
        }
        element.empty()
        master_data.forEach((item, index)=>{
            index === 0 && (main_default_option(element, index))
            element.append(`<option value="${item[element_item.id]}">${item[element_item.name]}</option>`)
            master_data.length === (index + 1) && (main_default_option(element, (index + 1)))
        })
    })
}

function render_edition(edition){
    edition.forEach((x, i) =>{
        $('select.select2').append(`
            <option value="${x.item_id}">${x.item_name}</option>
        `)
    })
}

function render_item(item){
    return new Promise(async (resolve, reject)=>{
        $('#tb_data_item tbody tr:last-child').find('.item-major-id').val(item.major_id)
        $('#tb_data_item tbody tr:last-child').find('.item-minor-id').val(item.minor_id)
        $('#tb_data_item tbody tr:last-child').find('.item-part-type').val(item.part_type_id)
        $('#tb_data_item tbody tr:last-child').find('.item-sig').val(item.sig)
        $('#tb_data_item tbody tr:last-child').find('.item-name').val(item.item_name)
        $('#tb_data_item tbody tr:last-child').find('.item-quantity').val(item.item_quantity)
        $('#tb_data_item tbody tr:last-child').find('.item-unit-id').val(item.unit_id)
        $('#tb_data_item tbody tr:last-child').find('.item-unit-name').val(item.unit_name)
        if(typeof item.minor !== 'undefined'){
            $('#tb_data_item tbody tr:last-child').find('.item-minor').val(item.minor)
        }
        if(typeof item.item_edition !== 'undefined'){
            if(item.item_edition.length > 0){
                let edition = JSON.parse(item.item_edition)
                let edition_id = $('#tb_data_item tbody tr:last-child').closest('tr').find('div.select2-purple').find('select').attr('id')
                $('div.select2-purple:visible').length === 0 && $('.edition').show()
                $('#tb_data_item tbody tr:last-child').closest('tr').find('div.select2-purple').show()
                $('#'+edition_id).val(edition)
                $('#'+edition_id).trigger('change')
            }
        }
        resolve(true)
    })
}

function render_item_name(e){
    let commercial_type = $('input[name=commercial_type]:checked').val()
    let request_work_type_id = $('#request_work_type_id option:selected').val()
    $(e).autocomplete({
        minLength: 0,
        source: global_item,
        //position: { collision: "flip" },
        search: function(event, ui){
            $(e).autocomplete({ source: global_item })
        },
        select: function(event, ui){
            const unit_id = request_work_type_id == 3 ? render_item_component($(e), ui.item) : ui.item.unit_id
            $(e).val(ui.item.item_name)
            render_item_unit($(e), unit_id)
            return false
        },
        change: function(event, ui){
            //let major_id = parseInt($(event.target).closest('td').find('.item-major-id').val())
            let minor_id = parseInt($(event.target).closest('td').find('.item-minor-id').val())
            let is_minor = parseInt($(event.target).closest('td').find('.item-minor').val())
            if(!ui.item){
                if(request_work_type_id == 3 && commercial_type == 1){
                    if(minor_id === 0 && is_minor === 1){
                        return false
                    }
                }
                $(this).val('')
                $(this).closest('tr').find('.item-unit-id').val('')
                $(this).closest('tr').find('.item-unit-name').val('')
            }
        }
    })
    .autocomplete('instance')._renderItem = (ul, item)=>{
        return $('<li></li>' )
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm">'+item.item_name+'</div>')
            .appendTo(ul)
    }
    $(e).on('click', (e)=> {
        global_item = global_item.map(i => ({ label: i.item_name, ...i }))
        $(e.target).autocomplete('search')
    })
}

function render_item_unit(item_name, unit_id){
    let master_unit = main_get_master_data('tb_master_unit')
    let unit = master_unit.filter((item, index) => item.unit_id == unit_id)[0]
    if(typeof unit === 'undefined'){
        item_name.closest('tr').find('.item-unit-id').val('')
        item_name.closest('tr').find('.item-unit-name').val('')
        return false
    }
    item_name.closest('tr').find('.item-unit-id').val(unit.unit_id)
    item_name.closest('tr').find('.item-unit-name').val(unit.unit_name)
}

function render_item_component(item_name, item){
    let unit_id = item.unit_id
    let compoment_wrap = [2, 6, 9, 90]  // Cover, Board
    let is_wrap = $('input[name=is_wrap]').val()
    let is_matched = compoment_wrap.some((p)=> p == item.part_type_id)
    if(is_matched && is_wrap == 1){
        if(item.minor_id == 0 && unit_id != 1){
            unit_id = 1
            item_name.closest('tr').find('.item-minor').val(1)
            item_name.val(`หุ้มปก (Cover+Board+Spine) + ${item.item_name}`)
            index = global_item.findIndex(x => x.major_id === item.major_id)
            global_item.splice(index, 1)
            global_item.push({
                major_id: item.major_id,
                minor_id: item.minor_id,
                item_name: `หุ้มปก (Cover+Board+Spine) + ${item.item_name}`,
                unit_id: unit_id,
                unit_name: 'ชิ้น',
                sig: item.sig,
                part_type_id: item.part_type_id,
                part_type_name: item.part_type_name
            })
        }
        item_name.closest('tr').find('.item-major-id').val(item.major_id)
        item_name.closest('tr').find('.item-minor-id').val(item.minor_id)
        item_name.closest('tr').find('.item-part-type').val(item.part_type_id)
        item_name.closest('tr').find('.item-sig').val(item.sig)
        $('div.select2-purple:visible').length === 0 && $('.edition').show()
        item_name.closest('tr').find('div.select2-purple').show()
    }
    if(is_matched && is_wrap == 2){
        item_name.closest('tr').find('.item-major-id').val(item.major_id)
        item_name.closest('tr').find('.item-minor-id').val(item.minor_id)
        item_name.closest('tr').find('.item-part-type').val(item.part_type_id)
        item_name.closest('tr').find('.item-sig').val(item.sig)
        item_name.closest('tr').find('div.select2-purple').hide()
    }
    if(is_matched === false){
        if(item.sig > 1){
            item_name.closest('tr').find('.item-minor').val(1)
            item_name.closest('tr').find('.item-major-id').val(item.major_id)
            item_name.closest('tr').find('.item-minor-id').val(item.minor_id)
            item_name.closest('tr').find('.item-part-type').val(item.part_type_id)
            item_name.closest('tr').find('.item-sig').val(1)
            item_name.closest('tr').find('div.select2-purple').hide()
            for(let i = 1; i < item.sig; i++){
                let separate_item = { ...item }
                separate_item.sig = 1
                separate_item.minor = 1
                add_item(separate_item, i)
            }
        }
    }
    return unit_id
}

function validate_dr(){
    let valid_item = []
    return new Promise(async (resolve, reject)=>{
        $(':input[required]:not(:disabled)').each((index, item)=>{
            let type_item = item.type === 'select-one' ? item.localName : item.type
            let element = $(item)[0]
            let valid = false
            switch(type_item){
                case 'text':
                case 'textarea':
                    $(element).addClass('is-invalid')
                    if(item.value !== ""){
                        $(element).removeClass('is-invalid')
                        valid = true
                    }
                    break
                case 'radio':
                    let checked = $('input[name='+item.name+']:checked').length
                    let invalid_element = $(element).closest('div.row').children()[1]
                    if(checked === 0){
                        $(invalid_element).addClass('is-invalid')
                        if($(invalid_element).find('span').length === 0){
                            $(invalid_element).append('<span class="txt-alert">You must choose one</span>')
                        }
                    }else{
                        $(element).removeClass('is-invalid')
                        $(invalid_element).find('span').remove()
                        valid = true
                    }
                    break
                case 'select':
                    let selected = parseInt($('select[name='+item.name+'] option:selected').val())
                    $(element).addClass('is-invalid')
                    if(selected > 0){
                        $(element).removeClass('is-invalid')
                        valid = true
                    }
                    break
            }
            valid_item.push(valid)
        })
        const valid_total = valid_item.every(x => x === true)
        if(valid_total === false){
            resolve(false)
        }
        resolve(true)
    })
}

function validate_dr_item(){
    let item_name = []
    let valid_item = []
    let duplicate = false
    let invalid = false
    let request_work_type_id = $('#request_work_type_id option:selected').val()
    return new Promise(async (resolve, reject)=>{
        let valid = false
        $('#tb_data_item tbody tr').each((index, item)=>{
            let tr_name = $(item).find('.item-name').val()
            let tr_unit = $(item).find('.item-unit-name').val()
            let tr_quantity = $(item).find('.item-quantity').val()
            valid = tr_name !== '' && tr_unit !== '' && tr_quantity !== '' ? true : false
            item_name.push(tr_name)
            valid_item.push(valid)
        })
        //duplicate = request_work_type_id == 3 && (item_name.some((name, index) => item_name.indexOf(name) !== index))
        duplicate = item_name.some((name, index) => item_name.indexOf(name) !== index)
        invalid = valid_item.every(x => x === true)
        if(duplicate){
            main_set_alert({
                position: 'center', icon: 'warning', title: `ชื่อ${$('#title_item').text()}ซ้ำ`,
                showConfirmButton: false, timer: 1000, width: '300px', height: '50px',
            })
            resolve(false)
        }
        if(invalid === false){
            main_set_alert({
                position: 'center', icon: 'warning', title: `ระบุข้อมูล${$('#title_item').text()}`,
                showConfirmButton: false, timer: 1000, width: '300px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function validate_delivery_item(){
    return new Promise(async (resolve, reject)=>{
        let non_commercial = main_get_master_data('tb_master_non_commercial')
        let commercial_type = $('input[name=commercial_type]:checked').val()
        let request_work_type_id = $('#request_work_type_id option:selected').val()
        if(typeof commercial_type !== 'undefined' && request_work_type_id > 0){
            if(commercial_type == 2){
                global_item = []
                non_commercial.forEach((item, index)=> global_item.push(item))
            }
            if(commercial_type == 1){
                fetch_item_commercial(request_work_type_id)
            }
            handle_delivery_item(commercial_type)
            handle_request_type(request_work_type_id, commercial_type)
            resolve(true)
        }
        resolve(false)
    })
}

function validate_postpone(){
    const commercial_type = parseInt($('input[name=commercial_type]:checked').val()) 
    if(commercial_type === 1){
        let i = 0
        const target_quantity = $('input[name=dr_quantity]').val()
        const target_delivery_date = $('input[name=delivery_date]').val()
        const diff = moment(target_delivery_date,"DD/MM/YYYY HH:mm:ss").diff(moment(global_delivery_date,"DD/MM/YYYY HH:mm:ss"))
        i = (global_quantity - parseInt(target_quantity.replaceAll(',', ''))) === 0 ? i : i + 1
        i = diff > 0 ? i + 2 : i
        set_postpone_remark(i)
    }
}

function handle_request_type(request_work_type_id, commercial_type){
    let item_length = $('#tb_data_item tbody tr').length
    $('#tb_data_item tbody tr:first-child').find('td:not(.edition)').find('input').val('')
    if(commercial_type == 1){
        if(request_work_type_id == 3){ // งานโรงงานลาว
            $('input[name=with_invoice]:checked').prop('checked', false) 
            $('input[name=with_invoice]').attr('disabled', true)
            $('input[name=with_invoice]').parents('.is-invalid').find('.txt-alert').remove()
            $('input[name=with_invoice]').parents('.is-invalid').removeClass('is-invalid')
            $('input[name=with_invoice]').parents('.row').find('.col-form-label').find('span').remove()
            $('#title_item').text('รายการวัตถุดิบ')
            $('#tb_data_item thead th:first-child').text('ชื่อวัตถุดิบ')
        }else{ // งานปกติ
            $('input[name=with_invoice]').attr('disabled', false)
            $('input[name=with_invoice]').parents('.row').find('.col-form-label').find('span').remove()
            $('input[name=with_invoice]').parents('.row').find('.col-form-label').append(`<span class="txt-alert ml-1">*</span>`)
            $('#title_item').text('รายการสินค้า')
            $('#tb_data_item thead th:first-child').text('ชื่อผลิตภัณฑ์')
        }
    }else{
        $('input[name=with_invoice]').attr('disabled', false)
        $('input[name=with_invoice]').parents('.row').find('.col-form-label').find('span').remove()
        $('input[name=with_invoice]').parents('.row').find('.col-form-label').append(`<span class="txt-alert ml-1">*</span>`)
        $('#title_item').text('รายการที่ไม่ใช่สินค้า')
        $('#tb_data_item thead th:first-child').text('รายการ')
    }
    for(let i = 1; i <= item_length; i++){
        i > 1 && $('tr#item_'+i).remove()
    }
}

function handle_delivery_item(commercial_type){
    if(commercial_type > 0){
        $('#tb_data_item').find('input').attr('disabled', false)
        $('#tb_data_item').find('.remove_item').show()
        $('#add_item').show()
    }else{
        $('#tb_data_item').find('input').attr('disabled', true)
        $('#tb_data_item').find('.remove_item').hide()
        $('#add_item').hide()
        $('.edition').hide()
    }
}

function handle_action_edit(request_work_type_id){
    $('input[name=delivery_type_id]').attr('disabled', true)
    $('input[name=commercial_type]').attr('disabled', true)
    if(request_work_type_id === 3){
        $('#request_work_type_id').find('option').attr('disabled', true)
        $('#request_work_type_id').find('option[value='+request_work_type_id+']').attr('disabled', false)
    }
}

function set_global_item(commercial){
    global_item = []
    let is_wrap = $('input[name=is_wrap]').val()
    for(let i = 0; i < commercial.length; i++){
        if(is_wrap == 1){
            if(commercial[i].part_type_id === 6){
                continue
            }
            global_item.push(commercial[i])
        }else{
            global_item.push(commercial[i])
        }
    }
}

function set_postpone_remark(postpone_type){
    if(postpone_type === 0){
        $('select#postpone_remark').empty().attr('disabled', true)
        $('select#postpone_remark').removeAttr('required')
    }else{
        $('select#postpone_remark').empty().attr('disabled', false)
        $('select#postpone_remark').attr('required', 'required')
        render_master_data(['tb_master_postpone_remark'], { postpone_type: postpone_type })
    }
}

function add_item(item = {}, index = 0){
    return new Promise(async (resolve, reject)=>{
        let edition_id = $('#tb_data_item tbody tr:last-child').find('td.edition').find('select').attr('id')
        $('#'+edition_id).select2('destroy')
        let tr_clone = $('#tb_data_item tbody tr:last-child').clone()
        let item_length = ($('#tb_data_item tbody tr').length) + 1
        if(Object.keys(item).length > 0 && index == 0){
            item_length = $('#tb_data_item tbody tr').length
            $('#tb_data_item tbody').empty()
        }
        $('#tb_data_item tbody').append(tr_clone)
        $('#tb_data_item tbody tr:last-child').attr('id', 'item_'+item_length)
        $('#tb_data_item tbody tr:last-child').find('.btn').attr('id','remove_item_'+item_length)
        $('#tb_data_item tbody tr:last-child').find('td.edition').find('select').attr('id','edition_'+item_length)
        $('#tb_data_item tbody tr:last-child').find('.item-edition').attr('name', 'item_edition['+(item_length - 1)+'][]')
        $('#tb_data_item tbody tr:last-child').find('td:not(.edition)').find('input').val('')
        $('.select2').select2({ placeholder: 'Select Edition' })
        $('#tb_data_item tbody tr:last-child').find('div.select2-purple').hide()
        render_item_name($('#tb_data_item tbody tr:last-child').find('.item-name'))
        Object.keys(item).length > 0 && (render_item(item))
        resolve(true)
    })
}

function remove_item(e){
    return new Promise(async (resolve, reject)=>{
        if($('#tb_data_item tbody tr').length <= 1){
            return false
        }
        $(e.target).parents('tr').remove()
        $('#tb_data_item tbody tr').each((index, item)=>{
            let rows_id = index + 1
            $(item).attr('id', 'item_'+rows_id)
            $(item).find('.btn').attr('id', 'remove_item_'+rows_id)
            $(item).find('td.edition').find('select').attr('id','edition_'+rows_id)
            $(item).find('.item-edition').attr('name', 'item_edition['+(rows_id - 1)+'][]')
        })
        resolve(true)
    })
}

function summary_item(){
    let dr_quantity = 0
    $('#tb_data_item tbody tr').each((index, item)=>{
        let item_quantity = parseInt($(item).find('.item-quantity').val())
        item_quantity > 0 && (dr_quantity = dr_quantity + item_quantity)
    })
    $('input[name=dr_quantity]').val(numeral(dr_quantity).format('0,0'))
    param_action === 'edit' && validate_postpone()
    
}