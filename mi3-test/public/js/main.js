$(function () {
    // Example using jQuery for an AJAX request
    main_authentication()
    $('#log_out').on('click', () => window.location = base_url)
    $('#show_notification').parent().find('a.dropdown-footer').on('click', () => console.log('notification...'))
    $('.content-header').scroll(() => $('.ui-autocomplete').hide())
})

function main_authentication() {
    const url = window.location.pathname.split('/')[1]
    if (url !== 'login' && url !== 'timesheet' && url !== 'scheduler' && url !== 'masterplans') {
        const projectData = JSON.parse(localStorage.getItem('projectData'))
        const userData = JSON.parse(localStorage.getItem('userData'))
        if (projectData === null && userData === null) {
            window.location = base_url
        }
    }
}


function get_auto_password() {
    var rs_password = ""
    const date = new Date();
    const monthValue = (date.getMonth() + 1).toString().padStart(2, '0');
    rs_password = "250000@" + monthValue
    return rs_password;
}

function main_switch_project() {
    return new Promise(async (resolve, reject) => {
        let switched = true
        const switch_project = window.location.pathname.split('/')
        const projectData = JSON.parse(localStorage.getItem('projectData'))
        const userData = JSON.parse(localStorage.getItem('userData'))
        if (projectData !== null && userData !== null) {
            if (projectData.menu[0].link === `/${switch_project[1]}`) {
                if (projectData.is_reload === 0) {
                    switched = false
                }
            }
        }
        switched ? await main_get_project() : main_get_user_permission()
        resolve(true)
    })
}

function main_get_project() {
    const switch_project = window.location.pathname.split('/')
    const { project, emp_id, user_account } = JSON.parse(localStorage.getItem('userData'))
    const project_render = project.filter((item) => item.project_link === `/${switch_project[1]}`)
    if (project_render.length === 1) {
        const { project_id, project_db, group_user_id } = project_render[0]
        const query = `emp_id=${emp_id}&project_id=${project_id}&project_db=${project_db}&group_user_id=${group_user_id}`
        return $.ajax({
            url: `${api_url}/user/saveproject?${query}`,
            headers: { 'Content-Type': 'application/json', 'user_account': user_account },
            method: 'GET',
            dataType: 'JSON',
            success: function (data) {
                const projectData = {
                    project_id: project_id,
                    menu: data.menu,
                    master: data.master,
                    is_reload: 0
                }
                localStorage.setItem('projectData', JSON.stringify(projectData))
                main_get_user_permission()
            },
            error: function (err) {
                console.log(err)
            }
        })
    } else {
        console.log(project_render)
    }
}

function main_get_user_permission() {
    USER_DATA = { ...JSON.parse(localStorage.getItem('userData')) }
    USER_DATA.projectData = { ...JSON.parse(localStorage.getItem('projectData')) }
    main_set_display_layout()
    main_set_user_name()
    main_set_badge()
    main_generate_notifications()
    main_render_project()
    main_render_sidebar()
    main_render_breadcrumb()
    main_set_active_link()
}

function main_get_master_data(tb_master) {
    const objMaster = USER_DATA.projectData.master
    const master = objMaster.filter(item => item.master_tb_name === tb_master)
    return master[0].master_data
}


function main_set_display_layout() {
    const urlParams = new URLSearchParams(window.location.search)
    const report_layout = urlParams.get('report_layout')
    if (report_layout == 1) {
        $("nav").hide()
        $("aside").hide()
        $("#action_bar").hide()
        $(".content-wrapper").css({ margin: '0' })
    }
    // $("aside").hide()
    // $(".content-wrapper").css({margin: '0'})
}

function main_set_active_link() {
    const url = window.location
    $('ul.nav-sidebar a').filter(function () {
        return this.href == url;
    }).addClass('active');
    $('ul.nav-treeview a').filter(function () {
        return this.href == url;
    }).parentsUntil(".nav-sidebar > .nav-treeview").addClass('menu-open').prev('a').addClass('active');
}

function main_set_user_name() {
    $("#info_user_name").html(USER_DATA.user_name)
}

function main_set_badge() {
    $("#info_badge").html(USER_DATA.badge)
}

function main_set_breadcrumb(item) {
    const txtlength = item.length
    return txtlength > 2 ? item.charAt(0).toUpperCase() + item.slice(1) : item.toUpperCase()
}

function main_set_switch() {
    let projectData = JSON.parse(localStorage.getItem('projectData'))
    projectData.is_reload = 1
    localStorage.setItem('projectData', JSON.stringify(projectData))
}

function main_set_alert(data) {
    Swal.fire({
        position: data.position,
        icon: data.icon,
        title: data.title,
        showConfirmButton: data.showConfirmButton,
        timer: data.timer,
        width: data.width,
        height: data.height,
        showCancelButton: data.showCancelButton,
        confirmButtonText: data.confirmButtonText,
        confirmButtonColor: data.confirmButtonColor,
        cancelButtonColor: data.cancelButtonColor
    })
}

function main_set_loading(data) {
    toastr.options = { positionClass: "toast-bottom-right", timeOut: 100 }
    if (typeof data.url_redirect !== 'undefined') {
        toastr.options.onHidden = () => window.location = data.url_redirect
        toastr.options.onclick = () => window.location = data.url_redirect
    }
    if (data.loading == true) {
        $('body').loading({
            message: data.message,
            theme: 'dark'
        })
    }
    if (data.loading == false) {
        $('body').loading('stop')
        switch (data.type) {
            case 'success':
                toastr.success(data.message)
                break
            case 'error':
                toastr.error(data.message)
                break
            case 'warning':
                toastr.warning(data.message)
                break
            case 'submit':
                toastr.info('OK')
                break
            default:
                break
        }
    }
}

function main_generate_notifications() {
    const notifications = USER_DATA.notifications
    if (notifications.length > 0) {
        notifications.forEach((item) => {
            $("#show_notification").append(`
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item">
                <i class="fas fa-envelope mr-2"></i>${item.message}
                <span class="float-right text-muted text-sm">${item.time}</span>
            </a>`
            )
        })
    }
}

function main_generate_class(txt) {
    const text = txt.toLowerCase()
    switch (text) {
        case 'create':
        case 'save':
        case 'view':
        case 'planned':
            return 'primary'
        case 'edit':
        case 'update':
        case 'print':
            return 'info'
        case 'return':
            return 'warning'
        case 'cancel':
            return 'secondary'
        case 'approve':
        case 'confirm':
            return 'success'
        case 'reject':
        case 'delete':
        case 'close':
            return 'danger'
        default:
            return 'default'
    }
}


function main_render_project() {
    const project = USER_DATA.project
    if (project.length == 0) {
        return false
    }
    $('#modal-xl').find('.modal-body').empty()
    project.forEach((item) => {
        if (typeof item.project_id === 'number') {
            let icon = main_default_icon(item)
            $('#modal-xl').find('.modal-body').append(`
                <a class="btn btn-app" href="${item.project_link}">
                    <i class="fas fa-${icon}"></i>${item.project_name}
                </a>
            `)
        }
    })
}

function main_render_sidebar() {
    const menus = USER_DATA.projectData.menu
    if (menus.length == 0) {
        return
    }
    $("#show_menus").empty();
    menus.forEach((item, index) => {
        if (typeof item.link === 'string') {
            let icon = main_default_icon(item)
            $("#show_menus").append(`
                <li class="nav-item">
                <a href="${item.link}" class="nav-link">
                  <i class="nav-icon ${icon}"></i>
                  <p>${item.title}</p>
                </a>
              </li>
            `)
        }
        if (typeof item.link === 'object') {
            let icon = main_default_icon(item)
            if (icon == "fa-minus") {
                icon = "fa-plus"
            }
            $("#show_menus").append(`
                <li class="nav-item">
                    <a href="#" class="nav-link">
                        <i class="nav-icon fas ${icon}"></i>
                        <p>
                            ${item.title}
                            <i class="fas fa-angle-left right"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview child-item-${index}"></ul>
                </li>
            `)
            if (item.link.length == 0) {
                return
            }
            item.link.forEach((sub_item) => {
                let icon = main_default_icon(item)
                $(".child-item-" + index).append(`
                    <li class="nav-item">
                        <a href="${sub_item.link}" class="nav-link">
                            <i class="fas ${icon} nav-icon"></i>
                            <p>${sub_item.title}</p>
                        </a>
                    </li>
                `)
            })
        }
    })
}

function main_render_breadcrumb() {
    const arr_pathname = window.location.pathname.split('/')
    let breadcrumb = arr_pathname.map(item => item.toLowerCase().split('_').map((word) => main_set_breadcrumb(word)).join(' '))
    $('#show_navigation_group').empty()
    breadcrumb.shift()
    breadcrumb.forEach((item, index) => {
        let breadcrumb_class = ""
        let breadcrumb_html = ""
        if (index >= 0) {
            breadcrumb_class = 'active'
            breadcrumb_html = item
        } else {
            breadcrumb_html = `<a href="#">${item}</a>`
        }
        $('#show_navigation_group').append(`<li class="breadcrumb-item ${breadcrumb_class}">${breadcrumb_html}</li>`)
    })
}

function main_render_action_group(action_groups) {
    return new Promise(async (resolve, reject) => {
        if (action_groups.length <= 0) {
            return
        }
        $("#show_action_group").empty()
        action_groups.forEach((item) => {
            if (typeof (item) === 'string') {
                const class_name = main_generate_class(item)
                $("#show_action_group").append(`
                    <li class="m-05">
                        <button type="button" class="btn btn-block btn-sm btn-${class_name} btn-action-group" id="${item.toLowerCase()}">${item}</button>
                    </li>
                `)
            }
            if (typeof (item) === 'object') {
                const class_name = main_generate_class(item.name)
                $("#show_action_group").append(`
                    <li class="m-05">
                        <button type="button" class="btn btn-block btn-sm btn-${class_name} btn-action-group" id="${item.name.toLowerCase()}">
                            <i class="${item.icon}"></i> ${item.name}
                        </button>
                    </li>
                `)
            }
        })
        /*
        $(".btn-action-group").on("click", (e)=>{
            const id = $(e.target).attr("id")
            switch(id){
                case 'create':
                    if(typeof click_btn_create === "function"){
                        click_btn_create()
                        return
                    }
                    toastr.warning('no function handler create')
                return
                default:
                    //toastr.warning('no function handler click')
                return
            }
        })
        */
        resolve(true)
    })
}

function main_render_datatable(table_id) {
    var table = $('#' + table_id).DataTable({
        'select': 'single'
    })
    table.on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected')
        } else {
            table.$('tr.selected').removeClass('selected')
        }
    })
    // var table = $('#'+table_id).DataTable({
    //     dom: 'Bflrtip',
    //     buttons: ['print', 'excel', 'pdf'],
    // })

    // var table = $('#'+table_id).DataTable({
    //     'bJQueryUI': true,
    //     'sPaginationType': 'full_numbers',
    //     'bLengthChange': false,
    //     'bSort': true,
    //     'info':true,
    // })
}

function main_render_autocomplete(param) {
    const { element_key, element_show, data_source, field_key, field_show, field_show_status, change_status } = param
    $('#' + element_key).autocomplete({
        minLength: 0,
        source: data_source + '&term=' + $('#' + element_key).val(),
        search: function (event, ui) {
            $('#' + element_key).autocomplete({ source: data_source + '&term=' + $('#' + element_key).val() })
        },
        select: function (event, ui) {
            $('#' + element_key).val(ui.item.field_key)
            $('#' + element_key).html(ui.item.field_key)
            if (element_key !== element_show) {
                $('input[name=' + element_show + ']').val(ui.item.field_show)
                $('#' + element_show).val(ui.item.field_show)
                $('#' + element_show).html(ui.item.field_show)
            }
            return false
        },
        change: function (event, ui) {
            if (change_status === false) {
                if (!ui.item) {
                    $('#' + element_key).val('')
                    $('#' + element_show).val('')
                    $(this).val('')
                }
            }
        }
    })
        .autocomplete('instance')._renderItem = (ul, item) => {
            if (field_show_status) {
                return $('<li style="width:auto;"></li>')
                    .data('item.autocomplete', item)
                    .append('<div class="form-control-sm">' + item.field_key + ' : ' + item.field_show + '</div>')
                    .appendTo(ul)
            } else {
                return $('<li></li>')
                    .data('item.autocomplete', item)
                    .append('<div class="form-control-sm">' + item.field_key + '</div>')
                    .appendTo(ul)
            }
        }
    $('#' + element_key).on('click', () => $('#' + element_key).autocomplete('search'))
}

function main_default_icon(obj) {
    if (obj.icon) {
        return obj.icon
    }
    if (obj.project_icon) {
        return obj.project_icon
    }
    return 'fa-minus'
}

function main_default_option(element, index) {
    if (index === 0) {
        element.prepend(`<option value="0">เลือก</option>`)
    }
    // if(index > 0){
    //     element.append(`<option value="">เพิ่มตัวเลือก</option>`)
    // }
}

function main_number_key(e) {
    var charCode = (e.which) ? e.which : e.keyCode
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) return false
    return true
}

function main_validate_row() {
    return new Promise((resolve, reject) => {
        if ($('.selected').length === 0) {
            main_set_alert({
                position: 'center', icon: 'warning', title: 'กรุณาเลือกรายการ',
                showConfirmButton: false, timer: 1000, width: '250px', height: '50px',
            })
            resolve(false)
        }
        resolve(true)
    })
}