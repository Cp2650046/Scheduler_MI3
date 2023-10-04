const urlParams = new URLSearchParams(window.location.search)
const param_action = urlParams.get('action')
const param_type_do = urlParams.get('type_do')
const param_request_type = urlParams.get('request_type')
const param_dr_number = urlParams.get('dr_number')
const param_do_number = urlParams.get('do_number')
var global_do_status = 0
var global_do_complete = 0
var global_do_quantity = 0
var global_commercial = 0
var global_delivery = 0
var global_pallet_avaliable = []
var global_pallet = ""
var global_action = ""
var global_vehicle = ""
var global_vehicle_owner = ""
var global_vehicle_licens = ""

$(async function(){
    var action_groups = [
        { name: 'Edit', icon: 'fas fa-edit mr-1' },
        { name: 'Planned', icon: 'fas fa-calendar-alt mr-1' },
        { name: 'Confirm', icon: 'fas fa-truck mr-1' },
        { name: 'Return', icon: 'fas fa-reply mr-1' },
        { name: 'Close', icon: 'fas fa-power-off mr-1' },
        'Save', 'Cancel',
    ]
    await main_switch_project()
    await main_render_action_group(action_groups)
    await fetch_vehicle_master()
    await fetch_vehicle_employee()
    await fetch_data()

    $('.date').datetimepicker({
        sideBySide: true,
        format: 'L',
        format: 'DD/MM/YYYY HH:mm:ss',
        minDate: new Date(),
        ignoreReadonly: true,
        allowInputToggle: true,
    })
    $('.date').on('keydown paste', (e)=>{
        e.stopPropagation()
        e.preventDefault()
        return false
    })
    $('#return').attr('data-toggle','modal').attr('data-target','#dataModal')
    $('.select2').select2({ placeholder: 'เลือกพนักงานขนของ' })
    $(':input[required]:not(:disabled)').on('keyup change blur', (e)=> validate_do())

    $('input[name="departed"]').on('blur', ()=> calculate_duration())
    $('input[name="duration"]').on('click', ()=> calculate_duration())
    $('.number').on('keypress', (e)=> main_number_key(e))
    $('input[name="duration"]').on('keypress', (e)=> e.preventDefault())

    $('#do_information').on('click', '.add-pallet', (e)=> add_pallet(e))
    $('#do_information').on('click', '.remove-pallet', (e)=> remove_pallet(e))
    $('#do_information .pallet-barcode').each((i, t)=> param_request_type === 'materials' || global_commercial === 2 ? autocomplete_item(t) : autocomplete_pallet(t))

    $('#add_vehicle').on('click', ()=> add_vehicle())
    $('#tb_do_vehicle').on('click', '.remove-vehicle', (e)=> remove_vehicle(e))
    $('#tb_do_vehicle').on('keyup', '.vehicle-reject', (e)=> calculate_vehicle_reject(e))
    $('#tb_pallet_return').on('click', '.return-pallet', (e)=> validate_pallet_return(e))
    $('#tb_do_vehicle .vehicle-owner').each((i, t)=> autocomplete_vehicle_owner(t))
    $('#tb_do_vehicle .vehicle-licens').each((i, t)=> autocomplete_vehicle_licens(t))
    $('#tb_do_vehicle .vehicle-driver-name').each((i, t)=> autocomplete_vehicle_driver(t))
    $('.btn-action-group').on('click', async (e)=>{
        const action = e.target.id
        if(action === 'edit'){
            click_btn_edit(action)
        }
        if(action === 'planned'){
            click_btn_planned(action)
        }
        if(action === 'confirm'){
            click_btn_confirm(action)
        }
        if(action === 'return'){
            click_btn_return(action)
        }
        if(action === 'close'){
            click_btn_close()
        }
        if(action === 'save'){
            click_btn_save()
        }
        if(action === 'cancel'){
            click_btn_cancel()
        }
    })
})

function click_btn_close(){
    window.location = `${base_url}/delivery/do/${param_type_do}/${param_request_type}`
}

function click_btn_edit(action){
    global_action = action
    handle_action_group(action)
    $('input[name=departed]').removeAttr('readonly')
    $('input[name=duration]').removeAttr('readonly')
    $('.pallet').find('.btn').attr('disabled', false)
    if(global_do_status >= 2){
        $('#section_vehicle').find('input:not(.hidden-planned)').attr('disabled', false)
        $('#section_vehicle').find('select').attr('disabled', false)
        $('#section_vehicle').find('.btn').attr('disabled', false)
        $('#section_vehicle').find('.vehicle-licens').attr('readonly', 'readonly')
    }
}

function click_btn_planned(action){
    global_action = action
    handle_action_group(action)
    update_do_status(global_do_status + 1)
    $('#section_vehicle').show()
    $('.hidden-planned').hide()
    $('#section_vehicle').find('input:not(.hidden-planned)').attr('disabled', false)
    $('#section_vehicle').find('.vehicle-licens').attr('readonly', 'readonly')
}

function click_btn_confirm(action){
    global_action = action
    handle_action_group(action)
    update_do_status(global_do_status + 1)
    $('.pallet').find('.btn').attr('disabled', true)
    $('#section_vehicle .hidden-planned').show()
    $('#section_vehicle').find('input').attr('disabled', false)
    $('#section_vehicle').find('.vehicle-owner').attr('readonly', 'readonly')
    $('#section_vehicle').find('.vehicle-driver-name').attr('readonly', 'readonly')
    $('#section_vehicle').find('.vehicle-licens').attr('readonly', 'readonly')
    $('#section_vehicle').find('.vehicle-quantity').attr('readonly', 'readonly')
    $('#section_vehicle').find('.vehicle-reject-remark').attr('readonly', 'readonly')
    $('#section_vehicle').find('.vehicle-reject').attr('disabled', false).val(0)
    if(global_commercial === 1 && global_delivery === 1){
        $('#section_vehicle').find('.vehicle-reject').removeAttr('readonly')
    }else{
        $('#section_vehicle').find('.vehicle-reject').attr('readonly', 'readonly')
    }
}

function click_btn_return(action){
    global_action = action
    handle_action_group(action)
    $('#tb_pallet_return tbody').empty()
    global_pallet.forEach(item => {
        const { pallet_barcode, pallet_quantity, pallet_weight, is_do_pallet, do_number } = item
        if(is_do_pallet === 1 && do_number === param_do_number){
            $('#tb_pallet_return tbody').append(`
                <tr>
                    <td class="text-center"><input type="text" class="form-control form-control-sm text-left pallet-barcode" name="pallet[]" value="${pallet_barcode}" readonly></td>
                    <td class="text-center"><input type="text" class="form-control form-control-sm text-left pallet-quantity" name="pallet_quantity[]" value="${pallet_quantity}" readonly></td>
                    <td class="text-center"><input type="text" class="form-control form-control-sm text-left pallet-weight" name="pallet_weight[]" value="${pallet_weight}" readonly></td>
                    <td class="text-center"><button type="button" class="btn btn-block btn-sm btn-warning return-pallet" id="return_${pallet_barcode}"><i class="fas fa-reply"></i></button>
                    </td>
                </tr>
            `)
        }
    })
}

function click_btn_cancel(){
    if(param_action === 'view'){
        window.location = 
            `${base_url}/delivery/do/manage?action=${param_action}&type_do=${param_type_do}&request_type=${param_request_type}&dr_number=${param_dr_number}&do_number=${param_do_number}`
    }else{
        window.location = `${base_url}/delivery/do/${param_type_do}/${param_request_type}`
    }
}

async function click_btn_save(){
    let obj_alert = { type: 'error', loading: false, message: 'บันทึกข้อมูลไม่สำเร็จ' }
    let vehicle_length = $('#tb_do_vehicle tbody tr:visible').length
    let vehicle_reject_length = $('#tb_do_vehicle tbody tr').find('.vehicle-reject:visible').length
    return Promise.all([
        validate_do(),
        validate_do_quantity(),
        vehicle_length > 0 ? validate_vehicle_quantity() : Promise.resolve(true),
        vehicle_length > 0 ? validate_vehicle() : Promise.resolve(true),
        vehicle_reject_length > 0 ? validate_vehicle_reject() : Promise.resolve(true),
    ])
    .then((data)=>{
        console.log(data)
        //return false
        const notCompleted = data.some((item)=> item === false)
        if(!notCompleted){
            $('#section_vehicle').find('select').attr('disabled', false)
            $.ajax({
                url: `${api_url}/delivery/do/save`,
                headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'user_account': USER_DATA.user_account },
                method: 'POST',
                data: $("#delivery_data").serialize(),
                dataType: 'JSON',
                beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
                success: function(data){
                    if(data.success){
                        obj_alert.type = 'success'
                        obj_alert.message = 'บันทึกข้อมูลสำเร็จ'
                        obj_alert.url_redirect = `${base_url}/delivery/do/${param_type_do}/${param_request_type}`
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
            url: `${api_url}/delivery/do/manage?action=${param_action}&request_type=${param_request_type}&dr_number=${param_dr_number}&do_number=${param_do_number}`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: async function(data){
                if(typeof data === 'object'){
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

function fetch_vehicle_master(){
    return new Promise(async (resolve, reject)=>{
        let obj_alert = { type: 'error', loading: false, message: 'ERROR !' }
        await $.ajax({
            url: `${api_url}/delivery/master/vehicle?`,
            headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
            method: 'GET',
            dataType: 'JSON',
            beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
            success: async function(data){
             if(typeof data === 'object'){
                global_vehicle = data
                global_vehicle_owner = set_vehicle_owner(data)
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
                    render_vehicle_employee(data)
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

function render_vehicle_employee(vehicle_employee){
    vehicle_employee.forEach((x, i) => $('select.select2').append(`<option value="${x.vehicle_emp_id}">${x.vehicle_emp_name}</option>`))
}

function render_data(data){
    console.log(data)
    global_do_status = data.do.do_status
    global_action = param_action
    global_pallet = data.detail
    global_commercial = data.dr.commercial_type
    global_delivery = data.dr.delivery_type_id
    global_do_quantity = data.do.do_quantity
    data.dr.dr_quantity > data.complete_do && (global_do_complete = data.complete_do)
    param_action === 'create' && calculate_distance(data.dr.source_place, data.dr.delivery_place)
    render_dr(data.dr)
    render_do(data.do, data.dr.source_place)
    render_vehicle(data.vehicle)
    handle_action_group(param_action)
    param_action === 'view' && handle_action_view()
    if(param_request_type === 'finish_goods' && data.dr.commercial_type === 1 && data.dr.delivery_type_id === 1){
        render_pallet(data.detail)
        $('input[name=do_weight]').parents('div.col-sm-6').show()
    }else{
        render_item(data.detail)
        $('input[name=do_weight]').parents('div.col-sm-6').hide()
    }
    $('#section_vehicle').find('.vehicle-reject').attr('disabled', true)
}

function validate_do(){
    let valid_item = []
    return new Promise(async (resolve, reject)=>{
        $(':input[required]:not(:disabled)').each((index, item)=>{
            let element = $(item)[0]
            let valid = false
            $(element).addClass('is-invalid')
            if(item.value !== ""){
                $(element).removeClass('is-invalid')
                valid = true
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

function validate_do_quantity(){
    return new Promise((resolve, reject)=>{
        let dr_quantity = parseInt(numeral($('input[name=dr_quantity]').val()).format('0'))
        let do_quantity = parseInt(numeral($('input[name=do_quantity]').val()).format('0'))
        if(do_quantity > global_do_quantity){
            do_quantity = (do_quantity - global_do_quantity)
        }
        if(do_quantity === 0){
            main_set_alert({
                position: 'center', icon: 'warning', title: 'ต้องมีรายการอย่างน้อย 1 รายการ',
                showConfirmButton: false, timer: 1000, width: '350px', height: '50px',
            })
            resolve(false)
        }
        if(dr_quantity < (do_quantity + global_do_complete)){
            main_set_alert({
                position: 'center', icon: 'warning', title: 'ยอด DO เกินกว่ายอด DR',
                showConfirmButton: false, timer: 1000, width: '300px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function validate_vehicle(){
    return new Promise(async (resolve, reject)=>{
        let valid_item = []
        let valid = false
        $('#tb_do_vehicle tbody tr').each((index, item)=>{
            let vehicle_owner_id = $(item).find('.vehicle-owner-id').val()
            let vehicle_licens_id = $(item).find('.vehicle-licens-id').val()
            let vehicle_driver_id = $(item).find('.vehicle-driver-id').val()
            let vehicle_quantity = $(item).find('.vehicle-quantity').val()
            let vehicle_follower = $(item).find('.vehicle-follower').val()
            valid = vehicle_owner_id !== '' 
                && vehicle_licens_id !== '' 
                && vehicle_driver_id !== '' 
                && vehicle_quantity !== '' 
                && vehicle_follower.length > 0
            ? true : false
            valid_item.push(valid)
        })
        const valid_total = valid_item.every(x => x === true)
        if(valid_total === false){
            main_set_alert({
                position: 'center', icon: 'warning', title: 'เพิ่มข้อมูลรถจัดส่งให้ครบถ้วน',
                showConfirmButton: false, timer: 1000, width: '350px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function validate_vehicle_quantity(){
    return new Promise((resolve, reject)=>{
        const do_quantity = parseInt(numeral($('input[name=do_quantity]').val()).format('0'))
        let vehicle_quantity = 0
        $('.vehicle-quantity').each((index, item)=> vehicle_quantity = vehicle_quantity + ($(item).val() > 0 ? parseInt($(item).val()) : 0))
        if(vehicle_quantity !== do_quantity){
            main_set_alert({
                position: 'center', icon: 'warning', title: 'ยอดส่งไม่เท่ากับยอด DO',
                showConfirmButton: false, timer: 1000, width: '300px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function validate_vehicle_reject(){
    return new Promise((resolve, reject)=>{
        let valid_total = [], valid_remark = 0
        $('.vehicle-reject').each((index, item)=>{
            let valid = false
            let vehicle_reject = parseInt(numeral($(item).val()).format('0'))
            let vehicle_quantity = parseInt(numeral($(item).closest('tr').find('.vehicle-quantity').val()).format('0'))
            let vehicle_reject_remark = $(item).closest('tr').find('.vehicle-reject-remark').val()
            if(vehicle_reject === 0){
                vehicle_reject <= vehicle_quantity && (valid = true)
            }
            if(vehicle_reject > 0 && vehicle_reject != ""){
                if(vehicle_reject_remark !== ""){
                    vehicle_reject <= vehicle_quantity && (valid = true)
                }else{
                    valid_remark++
                } 
            }
            valid_total.push(valid)
        })
        let message_alert = "ยอด Reject เกินกว่ายอดส่ง"
        const result = valid_total.every(x => x === true)
        valid_remark > 0 && (message_alert = "กรอกสาเหตุการ Reject")
        if(result === false){
            main_set_alert({
                position: 'center', icon: 'warning', title: message_alert,
                showConfirmButton: false, timer: 1000, width: '300px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}

function handle_action_group(action){
    let action_process = []
    let delivery_type_id = $('input[name=delivery_type_id]').val()
    if(action === 'view' || action === 'return'){
        switch(global_do_status){
            case 1:
                if(param_request_type === 'finish_goods' && global_commercial === 1 && delivery_type_id == 1){
                    action_process = ['edit', 'planned', 'return', 'close']
                }else{
                    action_process = ['edit', 'planned', 'close']
                }
                break
            case 2:
                if(param_request_type === 'finish_goods' && global_commercial === 1 && delivery_type_id == 1){
                    action_process = ['edit', 'return', 'close']
                }else{
                    action_process = ['edit', 'close']
                }
                break
            case 3:
                action_process = ['confirm', 'close']
                break
            default:
                action_process = ['close']
                break
        }
    }else{
        action_process = ['save', 'cancel']
    }
    $('.btn-action-group').each((index, item)=>{
        let btn_action = $(item).attr('id')
        let is_action = action_process.some((x)=> x.toLowerCase() === btn_action)
        is_action ? $(item).parent('li').show() : $(item).parent('li').hide()
    })
}

function handle_action_view(){
    switch(global_do_status){
        case 1:
            $('input[name=departed]').attr('readonly', 'readonly')
            $('input[name=duration]').attr('readonly', 'readonly')
            $('.pallet-barcode').attr('readonly', 'readonly')
            $('.pallet').find('.btn').attr('disabled', true)
        break
        case 2:
            $('input[name=departed]').attr('readonly', 'readonly')
            $('input[name=duration]').attr('readonly', 'readonly')
            $('.pallet-barcode').attr('readonly', 'readonly')
            $('.pallet').find('.btn').attr('disabled', true)
            $('#section_vehicle').find('.btn').attr('disabled', true)
            $('#section_vehicle').find('select').attr('disabled', true)
            $('.hidden-planned').hide()
        break
        case 3:
            $('input[name=departed]').attr('readonly', 'readonly')
            $('input[name=duration]').attr('readonly', 'readonly')
            $('.pallet-barcode').attr('readonly', 'readonly')
            $('.pallet').find('.btn').attr('disabled', true)
            $('#section_vehicle').find('select').attr('disabled', true)
            $('#section_vehicle').find('.btn').hide()
            $('.hidden-planned').hide()
        break
        case 4:
            $('input[name=departed]').attr('readonly', 'readonly')
            $('input[name=duration]').attr('readonly', 'readonly')
            $('.pallet-barcode').attr('readonly', 'readonly')
            $('.pallet').find('.btn').attr('disabled', true)
            $('#section_vehicle').find('select').attr('disabled', true)
            $('#section_vehicle').show().find('.btn').hide()
            
        break
        case 5:
            $('input[name=departed]').attr('readonly', 'readonly')
            $('input[name=duration]').attr('readonly', 'readonly')
            $('.pallet-barcode').attr('readonly', 'readonly')
            $('.pallet').find('.btn').attr('disabled', true)
            $('#section_vehicle').find('select').attr('disabled', true)
            $('#section_vehicle').show().find('.btn').hide()
        break
        default:
        break
    }
}

function render_dr(dr_data){
    let delivery_type = render_master_data('tb_master_delivery_type', dr_data.delivery_type_id)
    let request_work_type = render_master_data('tb_master_request_type_work', dr_data.request_work_type_id)
    $('input[name=action]').val(param_action)
    $('input[name=request_type]').val(param_request_type)
    $('input[name=commercial_type_id]').val(dr_data.commercial_type)
    $('input[name=delivery_type_id]').val(dr_data.delivery_type_id)
    $('input[name=created_emp_id]').val(USER_DATA.user_account)
    if(dr_data.created_emp_id !== ""){
        $('input[name=created_emp_id]').val(dr_data.created_emp_id)
    }
    $('input[name=dr_number]').val(dr_data.dr_number)
    $('input[name=job_id]').val(dr_data.job_id)
    $('input[name=job_name]').val(dr_data.job_name)
    $('input[name=delivery_date]').val(moment(dr_data.delivery_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'))
    $('input[name=customer_name]').val(dr_data.customer_name)
    $('input[name=delivery_place]').val(dr_data.delivery_place)
    $('input[name=delivery_type_name]').val(delivery_type.delivery_type_name)
    $('input[name=request_work_type_id]').val(request_work_type.request_work_type_name)
    $('input[name=dr_quantity]').val(numeral(dr_data.dr_quantity).format('0,0'))
    $('input[name=run_on]').val(numeral(dr_data.run_on).format('0,0'))
    $('input[name=remark]').val(dr_data.remark)
    
}

function render_do(do_data){
    if(do_data === false){
        $('input[name=do_number]').val('AUTO')
        update_do_status(1)
    }else{
        const departed = moment(do_data.departed, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')
        const arrived = moment(do_data.arrived, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss')
        const diff_days = (moment(arrived, "DD/MM/YYYY HH:mm:ss").diff(moment(departed, "DD/MM/YYYY HH:mm:ss"), 'days'))
        $('input[name=do_number]').val(do_data.do_number)
        $('input[name=departed]').val(departed)
        $('input[name=arrived]').val(arrived)
        $('input[name=duration]').val(diff_days)
        $('input[name=distance]').val(numeral(do_data.distance).format('0,0 0.00'))
        $('input[name=unique_id]').val(do_data.unique_id)
        $('input[name=updated_emp_id]').val(USER_DATA.emp_id)
        if(do_data.updated_emp_id !== ""){
            $('input[name=updated_emp_id]').val(do_data.updated_emp_id)
        }
        update_do_status(do_data.do_status)
    }
}

async function calculate_distance(source_place_id, delivery_place){
    const { Map } = await google.maps.importLibrary("maps")
    var geocoder = new google.maps.Geocoder()
    geocoder.geocode({
        "address": delivery_place
    }, (results, status)=>{
        if(status == google.maps.GeocoderStatus.OK){
            let master = render_master_data('tb_master_source_place', source_place_id)
            let origin_location = {
                lat: parseFloat(master.source_place_latitudes),
                lng: parseFloat(master.source_place_longitudes)
            }
            let destination_location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            }
            origin = new google.maps.LatLng(origin_location.lat, origin_location.lng)
            destination = new google.maps.LatLng(destination_location.lat, destination_location.lng)
            geocoder = new google.maps.Geocoder()
            var directionsService = new google.maps.DirectionsService()
            var directionsRenderer = new google.maps.DirectionsRenderer()
            var request = {
                origin: origin, destination: destination, 
                waypoints: [], avoidTolls: true,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            }
            directionsService.route(request, (response, status)=>{
                if(status == 'OK'){
                    directionsRenderer.setDirections(response)
                }else{
                    $('input[name=distance]').removeAttr('readonly')
                } 
            })
            directionsRenderer.addListener("directions_changed", ()=>{
                const directions = directionsRenderer.getDirections()
                if(directions){
                    let total = 0, myroute = directions.routes[0]
                    if(!myroute){
                        return false
                    }
                    for(let i = 0; i < myroute.legs.length; i++){
                        total += myroute.legs[i].distance.value
                    }
                    total = total / 1000
                    $('input[name=distance]').val(numeral(total).format('0,0 0.00'))
                    $('input[name=distance]').attr('readonly', 'readonly')
                }
            })
        }
    })
}

function render_vehicle(vehicle){
    if(!vehicle.length){
        return false
    }
    $('#section_vehicle').show()
    vehicle.forEach((item, index)=>{
        index > 0 && add_vehicle()
        let vehicle_follower = JSON.parse(item.vehicle_follower)
        let follower_id = $('#tb_do_vehicle tbody tr:last-child').closest('tr').find('select').attr('id')
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-owner-id').val(item.vehicle_owner_id)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-owner').val(item.vehicle_owner)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-licens-id').val(item.vehicle_licens_id)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-licens').val(item.vehicle_licens)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-driver-id').val(item.vehicle_driver_id)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-driver-name').val(item.vehicle_driver_name)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-quantity').val(item.vehicle_quantity)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-reject').val(item.vehicle_reject)
        $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-reject-remark').val(item.vehicle_reject_remark)
        $('#'+follower_id).val(vehicle_follower)
        $('#'+follower_id).trigger('change')
    })
}

function render_master_data(tb_master, value){
    let master_data = main_get_master_data(tb_master)
    let key_obj = "", key_return = ""
    switch(tb_master){
        case 'tb_master_request_type_work':
            key_obj = 'request_work_type_id'
        break
        case 'tb_master_delivery_type':
            key_obj = 'delivery_type_id'
        break
        case 'tb_master_do_status':
            key_obj = 'do_status_id'
        break
        case 'tb_master_source_place':
            key_obj = 'source_place_id'
        break
    }
    return master_data.filter((x) => x[key_obj] === value)[0]
}

function render_pallet(pallet){
    var pallet_render = pallet
    if(param_action === 'create'){
        pallet_render = pallet.filter(x => x.is_do_pallet === 0)
    }else{
        pallet_render = pallet.filter(x => x.is_do_pallet === 1 && x.do_number === param_do_number)
        global_pallet_avaliable = pallet.filter(x => x.is_do_pallet === 0)
    }
    pallet_render.forEach((item, index)=>index > 0 && (add_pallet()))
    $('div[id^="pallet"]').each((index, item)=>{
        const { pallet_barcode, pallet_quantity, pallet_weight } = pallet_render[index]
        $(item).find('.pallet-barcode').val(pallet_barcode).attr('readonly', 'readonly')
        $(item).find('.pallet-quantity').val(pallet_quantity)
        $(item).find('.pallet-weight').val(pallet_weight)
        $(item).find('.pallet-weight').val(pallet_weight)
        $(item).find('.quantity-name').html(numeral(pallet_quantity).format('0,0'))
        $(item).find('.unit-name').html('(ชิ้น)')
    })
    calculate_do_quantity()
    calculate_do_weight()
}

function render_item(detail){
    detail.forEach((item, index)=> index > 0 && (add_pallet()))
    $('div[id^="pallet"]').each((index, item)=>{
        const { item_name, item_quantity, unit_id, unit_name, sig, part_type_id, item_edition } = detail[index]
        $(item).find('.pallet-barcode').val(item_name).attr('readonly', 'readonly')
        $(item).find('.pallet-quantity').val(item_quantity)
        $(item).find('.pallet-unit-id').val(unit_id)
        $(item).find('.pallet-part-type').val(part_type_id)
        $(item).find('.pallet-sig').val(sig)
        $(item).find('.pallet-edition').val(item_edition)     
        $(item).find('.quantity-name').html(numeral(item_quantity).format('0,0'))
        $(item).find('.unit-name').html(`(${unit_name})`)
    })
    calculate_do_quantity()
    calculate_do_weight()
}

function autocomplete_pallet(e){
    $(e).autocomplete({
        minLength: 0,
        source: global_pallet_avaliable,
        search: function(event, ui){
            $(e).autocomplete({ source: global_pallet_avaliable })
        },
        select: function(event, ui){
            if(global_pallet_avaliable.length > 0){
                let index = global_pallet_avaliable.findIndex(x => x.pallet_barcode === ui.item.pallet_barcode)
                global_pallet_avaliable.splice(index, 1)
            }
            $(e).val(ui.item.pallet_barcode)
            $(e).attr('readonly', 'readonly')
            $(e).parent('div').find('.pallet-quantity').val(ui.item.pallet_quantity)
            $(e).parent('div').find('.pallet-weight').val(ui.item.pallet_weight)
            $(e).parents('div.pallet').find('.quantity-name').html(ui.item.pallet_quantity)
            $(e).parents('div.pallet').find('.unit-name').html('(ชิ้น)')
            calculate_do_quantity()
            calculate_do_weight()
            return false
        },
        change: function(event, ui){
            if(!ui.item){
                $(this).val('')
            }
        }
    })
    .autocomplete('instance')._renderItem = (ul, item)=>{
        return $('<li></li>' )
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm">'+item.pallet_barcode+'</div>')
            .appendTo(ul)
    }
    $(e).on('click', (e)=> {
        if($(e.target).attr('readonly') !== 'readonly'){
            global_pallet_avaliable = global_pallet_avaliable.map(i => ({ label: i.pallet_barcode, ...i }))
            $(e.target).autocomplete('search')
        }
    })
}

function autocomplete_item(e){
    $(e).autocomplete({
        minLength: 0,
        source: global_pallet_avaliable,
        search: function(event, ui){
            $(e).autocomplete({ source: global_pallet_avaliable })
        },
        select: function(event, ui){
            if(global_pallet_avaliable.length > 0){
                let index = global_pallet_avaliable.findIndex(x => x.item_name === ui.item.item_name)
                global_pallet_avaliable.splice(index, 1)
            }
            $(e).val(ui.item.item_name)
            $(e).parent('div').find('.pallet-quantity').val(ui.item.item_quantity)
            $(e).parent('div').find('.pallet-weight').val(ui.item.pallet_weight)
            $(e).parent('div').find('.pallet-unit-id').val(ui.item.unit_id)
            $(e).parent('div').find('.pallet-part-type').val(ui.item.part_type_id)
            $(e).parent('div').find('.pallet-sig').val(ui.item.sig)
            $(e).parent('div').find('.pallet-edition').val(ui.item.item_edition)
            $(e).parents('div.pallet').find('.quantity-name').html(ui.item.item_quantity)
            $(e).parents('div.pallet').find('.unit-name').html(`(${unit_name})`)
            calculate_do_quantity()
            calculate_do_weight()
            return false
        },
        change: function(event, ui){
            if(!ui.item){
                $(this).val('')
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
        if($(e.target).attr('readonly') !== 'readonly'){
            global_pallet_avaliable = global_pallet_avaliable.map(i => ({ label: i.item_name, ...i }))
            $(e.target).autocomplete('search')
        }
    })
}

function add_pallet(){
    let item_clone = $('div[id^="pallet"]').last().clone()
    $('#do_information .card-body').append(item_clone)
    $('div[id^="pallet"]').last().find('input').val('')
    $('div[id^="pallet"]').last().find('span').html('')
    $('div[id^="pallet"]').each((index, item)=>{
        $(item).attr('id', 'pallet_'+(index + 1))
        $(item).find('.pallet-barcode').attr('id', 'pallet_barcode_'+(index + 1))
        param_request_type === 'materials' || global_commercial === 2 ? autocomplete_item($(item).find('.pallet-barcode')) : autocomplete_pallet($(item).find('.pallet-barcode'))
        if($('div[id^="pallet"]').length === (index + 1)){
            $(item).find('.pallet-barcode').removeAttr('readonly')
        }
        $(item).find('.pallet-quantity').attr('id', 'pallet_quantity_'+(index + 1))
        $(item).find('.pallet-weight').attr('id', 'pallet_weight_'+(index + 1))
        $(item).find('.pallet-unit-id').attr('id', 'pallet_unit_id_'+(index + 1))
        $(item).find('.pallet-part-type').attr('id', 'pallet_part_type_'+(index + 1))
        $(item).find('.pallet-sig').attr('id', 'pallet_sig_'+(index + 1))
        $(item).find('.pallet-edition').attr('id', 'pallet_edition_'+(index + 1))
        $(item).find('.unit-name').attr('id', 'unit_name_'+(index + 1))
        $(item).find('.quantity-name').attr('id', 'quantity_name_'+(index + 1))
        $(item).find('.btn-danger').attr('id', 'remove_pallet_'+(index + 1))
        index > 0 && ($(item).find('.btn-primary').parent().empty())
    })
}

function remove_pallet(e){
    let pallet_length = $('div[id^="pallet"]').length
    let add_pallet = $(e.target).parents('div.pallet').find('#add_pallet').length
    let btn_add_pallet = $(e.target).parents('div.pallet').find('#add_pallet').clone()
    let pallet_next = $(e.target).parents('div.pallet').next().attr('id')
    let pallet_barcode = $(e.target).parents('div.pallet').find('.pallet-barcode').val()
    if(pallet_length === 1){
        if(param_action !== 'create'){
            validate_remove_pallet()
        }
        return false
    }
    add_pallet > 0 && $('#'+pallet_next).children('div:first-child').find('div[class^="col"]').first().append(btn_add_pallet)
    if(param_request_type === 'finish_goods'){
        if(global_commercial === 1){
            pallet_barcode != "" && global_pallet_avaliable.push(global_pallet.filter((p, i) => p.pallet_barcode === pallet_barcode)[0])
        }
        if(global_commercial === 2){
            pallet_barcode != "" && global_pallet_avaliable.push(global_pallet.filter((p, i) => p.item_name === pallet_barcode)[0])
        }
    }
    param_request_type === 'materials' && (pallet_barcode != "" && global_pallet_avaliable.push(global_pallet.filter((p, i) => p.item_name === pallet_barcode)[0]))
    $(e.target).parents('.pallet').remove()
    $('div[id^="pallet"]').each((index, item)=>{
        $(item).attr('id', 'pallet_'+(index + 1))
        $(item).find('.pallet-barcode').attr('id', 'pallet_barcode_'+(index + 1))
        $(item).find('.pallet-quantity').attr('id', 'pallet_quantity_'+(index + 1))
        $(item).find('.pallet-weight').attr('id', 'pallet_weight_'+(index + 1))
        $(item).find('.pallet-unit-id').attr('id', 'pallet_unit_id_'+(index + 1))
        $(item).find('.pallet-part-type').attr('id', 'pallet_part_type_'+(index + 1))
        $(item).find('.pallet-sig').attr('id', 'pallet_sig_'+(index + 1))
        $(item).find('.pallet-edition').attr('id', 'pallet_edition_'+(index + 1))
        $(item).find('.unit-name').attr('id', 'unit_name_'+(index + 1))
        $(item).find('.quantity-name').attr('id', 'quantity_name_'+(index + 1))
        $(item).find('.btn-danger').attr('id', 'remove_pallet_'+(index + 1))
    })
    calculate_do_quantity()
    calculate_do_weight()
}

function calculate_duration(){
    let days = param_request_type === 'materials' ? 3 : 1
    let departed = $('input[name="departed"]').val()
    let arrived = $('input[name="departed"]').val()
    let duration = $('input[name="duration"]').val()
    if(duration != "" && arrived != ""){
        days = duration
    }
    $('input[name=duration]').val(days).removeAttr('readonly')
    arrived !== "" && (
        $('input[name=arrived]').val(
        moment(departed.split(' ')[0].split("/").reverse().join("-"))
        .add(days, 'days').format("DD/MM/YYYY")+' '+departed.split(' ')[1])
    )
}

function calculate_do_quantity(){ 
    //$('.vehicle-quantity').each((index, item) => total_do_quantity = total_do_quantity + parseInt($(item).val()))
    //do_quantity = do_quantity + ($(item).val() > 0 ? parseInt($(item).val()) : 0)
    let do_quantity = 0
    $('form .pallet-quantity').each((index, item)=> do_quantity = do_quantity + ($(item).val() > 0 ? parseInt($(item).val()) : 0))
    $("input[name=do_quantity]").val(numeral(do_quantity).format('0,0'))
}

function calculate_do_weight(){ 
    let do_weight = 0
    $('form .pallet-weight').each((index, item)=> do_weight = do_weight + parseFloat($(item).val()))
    $("input[name=do_weight]").val(numeral(do_weight).format('0,0 0.00'))
}

function update_do_status(param_do_status){
    const do_status = render_master_data('tb_master_do_status', param_do_status)
    if(typeof do_status !== 'undefined'){
        $('input[name=do_status_id]').val(param_do_status)
        $('input[name=do_status_name]').val(do_status.do_status_name)
    }else{
        $('input[name=do_status_id]').val(0)
        $('input[name=do_status_name]').val('Pending')
    }
}

function validate_pallet_return(e){
    let txt_alert = `ยืนยันการคืนพาเลทให้กับ FG`
    let pallet_length = $('div[id^="pallet"]').length
    let pallet_return = $(e.target).closest('tr').find('.pallet-barcode').val()
    pallet_length === 1 && (txt_alert = `ยืนยันการคืนพาเลท<br>ให้กับ FG และลบ DO`)
    Swal.fire({
        position: 'center', icon: 'warning', title: txt_alert,
        showConfirmButton: true, width: '350px', height: '50px',
        showCancelButton: true, confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6', cancelButtonColor: '#d33'
    }).then((confirm)=> confirm.isConfirmed && (pallet_length > 1 ? handle_pallet_return(pallet_return) : return_pallet(pallet_return)))
}

function handle_pallet_return(pallet){
    $('#edit').click()
    $('#dataModal').find('.close').click()
    $('#do_information .pallet').find('.btn').attr('disabled', false)
    $('#do_information').find('.pallet-barcode').each((index, item)=>{
        let rows = index + 1
        let pallet_do = $(item).parents('div[id=pallet_'+rows+']').find('.pallet-barcode').val()
        if(pallet_do === pallet){
            $(item).parents('div[id=pallet_'+rows+']').find('.remove-pallet').click()
            $('#section_pallet_return').append(`<input type="hidden" name="pallet_return[]" value="${pallet}">`)
        }
    })
}

function return_pallet(pallet){
    let obj_alert = { type: 'error', loading: false, message: 'คืนพาเลทและลบรายการ DO ไม่สำเร็จ' }
    $.ajax({
        url: `${api_url}/delivery/save_return_pallet?dr_number=${param_dr_number}&do_number=${param_do_number}&pallet_barcode=${pallet}`,
        headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
        method: 'GET',
        dataType: 'JSON',
        beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
        success: function(data){
            if(data){
                obj_alert.type = 'success'
                obj_alert.message = 'คืนพาเลทและลบรายการ DO สำเร็จ'
                obj_alert.url_redirect = `${base_url}/delivery/do/${param_type_do}/${param_request_type}`
            }
            main_set_loading(obj_alert)
        },
        error: function(err){
            console.log(err)
            main_set_loading(obj_alert)
        }
    })
}

function validate_remove_pallet(e){
    return new Promise((resolve, reject)=>{
        Swal.fire({
            position: 'center', icon: 'warning', title: 'ยืนยันการลบรายการและ DO ?',
            showConfirmButton: true, width: '350px', height: '50px',
            showCancelButton: true, confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6', cancelButtonColor: '#d33'
        })
        .then((confirm)=>{
            if(confirm.isConfirmed){
                let obj_alert = { type: 'error', loading: false, message: 'ลบรายการไม่สำเร็จ' }
                $.ajax({
                    url: `${api_url}/delivery/do/delete?do_number=${param_do_number}`,
                    headers:{ 'Content-Type':'application/json', 'user_account': USER_DATA.user_account },
                    method: 'GET',
                    dataType: 'JSON',
                    beforeSend: function(){ main_set_loading({ loading: true, message: 'LOADING ...'}) },
                    success: function(data){
                        if(data){
                            obj_alert.type = 'success'
                            obj_alert.message = 'ลบรายการสำเร็จ'
                            obj_alert.url_redirect = `${base_url}/delivery/do/${param_type_do}/${param_request_type}`
                        }
                        main_set_loading(obj_alert)
                    },
                    error: function(err){
                        console.log(err)
                        main_set_loading(obj_alert)
                    }
                })
                
            }
            resolve(true)
        })   
    })
}

function add_vehicle(){
    let vehicle_follower_id = $('#tb_do_vehicle tbody tr:last-child').find('select').attr('id')
    $('#'+vehicle_follower_id).select2('destroy')
    let item_clone = $('#tb_do_vehicle tbody tr:last-child').clone()
    $('#tb_do_vehicle tbody').append(item_clone)
    $('#tb_do_vehicle tbody tr:last-child').find('td:not(.follower)').find('input').val('')
    $('#tb_do_vehicle tbody tr:last-child').find('.vehicle-licens').attr('readonly', 'readonly')
    $('#tb_do_vehicle tbody tr').each((index, item)=>{
        $(item).attr('id', 'vehicle_'+(index + 1))
        $(item).find('.remove-vehicle').attr('id', 'remove_vehicle_'+(index + 1))
        $(item).find('.vehicle-follower').attr('name', 'vehicle_follower['+index+'][]')
        $(item).find('td.follower').find('select').attr('id','vehicle_follower_'+(index + 1))
        autocomplete_vehicle_owner($(item).find('.vehicle-owner'))
        autocomplete_vehicle_licens($(item).find('.vehicle-licens'))
        autocomplete_vehicle_driver($(item).find('.vehicle-driver-name'))
    })
    $('.select2').select2({ placeholder: 'เลือกพนักงานขนของ' })
}

function remove_vehicle(e){
    let vehicle_length = $('#tb_do_vehicle tbody tr').length
    if(vehicle_length === 1){
        return false
    }
    $(e.target).parents('tr').remove()
    $('#tb_do_vehicle tbody tr').each((index, item)=>{
        $(item).attr('id', 'vehicle_'+(index + 1))
        $(item).find('.remove-vehicle').attr('id', 'remove_vehicle_'+(index + 1))
        $(item).find('.vehicle-follower').attr('name', 'vehicle_follower['+index+'][]')
        $(item).find('td.follower').find('select').attr('id','vehicle_follower_'+(index + 1))
    })
    calculate_vehicle_quantity()
}

function calculate_vehicle_quantity(){
    const do_quantity = parseInt(numeral($('input[name=do_quantity]').val()).format('0'))
    let vehicle_quantity = 0
    $('.vehicle-quantity').each((index, item)=> vehicle_quantity = vehicle_quantity + ($(item).val() > 0 ? parseInt($(item).val()) : 0))
    if(vehicle_quantity > do_quantity){
        main_set_alert({
            position: 'center', icon: 'warning', title: 'จำนวนส่งเกินกว่ายอด DO',
            showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
        })
    }
}

function calculate_vehicle_reject(e){
    let total_reject = 0
    let target = parseInt(numeral($(e.target).val()).format('0'))
    $('#tb_do_vehicle tbody tr').each((index, item)=> total_reject = total_reject + parseInt($(item).find('.vehicle-reject').val()))
    update_do_status(total_reject > 0 ? global_do_status + 2 : global_do_status + 1)
    if(target > 0){
        $(e.target).closest('tr').find('.vehicle-reject-remark').removeAttr('readonly')
    }else{
        $(e.target).closest('tr').find('.vehicle-reject-remark').attr('readonly', 'readonly')
        $(e.target).closest('tr').find('.vehicle-reject-remark').val('')
        $(e.target).val(target)
    }
}

function set_vehicle_owner(data){
    let vehicle_owner = data.reduce((unique, o)=>{
        if(!unique.some(obj => obj.vh_owner_id === o.vh_owner_id && obj.vh_owner_name === o.vh_owner_name)){
            unique.push({
                label: o.vh_owner_id+o.vh_owner_name,
                vh_owner_id: o.vh_owner_id,
                vh_owner_name: o.vh_owner_name
            })
        }
        return unique
    }, [])
    return vehicle_owner
}

function set_vehicle_licens(e){
    let vh_owner_id = $(e).closest('tr').find('.vehicle-owner-id').val()
    global_vehicle_licens = global_vehicle.filter((vh, i)=> vh.vh_owner_id == vh_owner_id)
    global_vehicle_licens = global_vehicle_licens.map(i => ({ label: i.vh_number, ...i }))
}

function autocomplete_vehicle_owner(e){
    $(e).autocomplete({
        minLength: 0,
        source: global_vehicle_owner,
        position: { collision: "flip" },
        search: function(event, ui){
            $(e).autocomplete({ source: global_vehicle_owner })
        },
        select: function(event, ui){
            $(e).closest('tr').find('.vehicle-owner-id').val(ui.item.vh_owner_id)
            $(e).val(`(${ui.item.vh_owner_id}) ${ui.item.vh_owner_name}`)
            $(e).closest('tr').find('.vehicle-licens').removeAttr('readonly')
            $(e).closest('tr').find('.vehicle-licens_id').val('')
            $(e).closest('tr').find('.vehicle-licens').val('')
            set_vehicle_licens(e)
            return false
        },
        change: function(event, ui){
            if(!ui.item){
                $(this).val('')
                $(e).closest('tr').find('.vehicle-licens').attr('readonly', 'readonly')
                $(e).closest('tr').find('.vehicle-licens_id').val('')
                $(e).closest('tr').find('.vehicle-licens').val('')
                autocomplete_vehicle_licens($(e).closest('tr').find('.vehicle-licens'))
            }
        }
    })
    .autocomplete('instance')._renderItem = (ul, item)=>{
        return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm">'+item.vh_owner_id+': '+item.vh_owner_name+'</div>')
            .appendTo(ul)
    }
    $(e).on('click', (e)=> $(e.target).autocomplete('search'))
}

function autocomplete_vehicle_licens(e){
    $(e).autocomplete({
        minLength: 0,
        source: global_vehicle_licens,
        position: { collision: "flip" },
        search: function(event, ui){
            $(e).autocomplete({ source: global_vehicle_licens })
        },
        select: function(event, ui){
            $(e).closest('tr').find('.vehicle-licens-id').val(ui.item.id)
            $(e).val(ui.item.vh_number)
            return false
        },
        change: function(event, ui){
            if(!ui.item){
                $(e).val('')
                $(e).closest('tr').find('.vehicle-licens-id').val('')
            }
        }
    })
    .autocomplete('instance')._renderItem = (ul, item)=>{
        return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm">'+item.vh_number+'</div>')
            .appendTo(ul)
    }
    $(e).on('click', (e)=> $(e.target).attr('readonly') !== 'readonly' && $(e.target).autocomplete('search'))
}

function autocomplete_vehicle_driver(e){
    $(e).autocomplete({
        minLength: 0,
        source: `${api_url}/delivery/master/vehicle_employee`,
        position: { collision: "flip" },
        search: function(event, ui){
            $(this).autocomplete({ source: `${api_url}/delivery/master/vehicle_employee?term=${$(this).val()}` })
        },
        select: function(event, ui){
            $(this).closest('tr').find('.vehicle-driver-id').val(ui.item.vehicle_emp_id)
            $(this).val(`(${ui.item.vehicle_emp_id}) ${ui.item.vehicle_emp_name}`)
            return false
        },
        change: function(event, ui){
            if(!ui.item){
                $(this).val('')
                $(this).closest('tr').find('.vehicle-driver-id').val('')
            }
        }
    })
    .autocomplete('instance')._renderItem = (ul, item)=>{
        return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<div class="form-control-sm">'+item.vehicle_emp_id+': '+item.vehicle_emp_name+'</div>')
            .appendTo(ul)
    }
    $(e).on('click', (e)=> $(e.target).autocomplete('search'))
}