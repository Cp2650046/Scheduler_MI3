$(function () {
    localStorage.clear()
    $('input[name=username], input[name=password]').on('keyup', (e) => e.which === 13 && $('button[name=login]').click())
    $('button[name=login]').on('click', () => login_permission())
})

function validate_data(userData) {
    return new Promise((resolve, reject) => {
        const { username, password } = userData
        $('input[name=username], input[name=password]').parent('div').removeClass('txt-validate')
        $('.txt-alert').html('')
        if (username == "" || password == "") {
            $('input[name=username], input[name=password]').parent('div').addClass('txt-validate')
            $('.txt-alert').html(`กรุณากรอก Username และ Password`)
            resolve(false)
        }
        resolve(true)
    })
}

function login_permission() {
    const sendData = {
        user_account: $('input[name=username]').val(),
        password: $('input[name=password]').val()
    }
    validate_data(sendData).then(valid => {
        if (valid) {
            let text_alert = {
                position: 'center', icon: 'error', title: 'Login Error !',
                showConfirmButton: false, timer: 1000, width: '400px', height: '100px'
            }
            let obj_alert = { type: 'error', loading: false, message: 'Username/Password ไม่ถูกต้อง !' }
            $.ajax({
                url: `${api_url}/user/saveuser`,
                headers: { 'Content-Type': 'application/json', 'user_account': sendData.user_account },
                method: 'POST',
                data: JSON.stringify(sendData),
                dataType: 'JSON',
                beforeSend: function () { main_set_loading({ loading: true, message: 'LOADING ...' }) },
                success: function (data) {
                    if (data.user_id > 0) {
                        obj_alert.type = 'respond'
                        obj_alert.message = 'Respond'
                        main_set_loading(obj_alert)
                        localStorage.setItem('userData', JSON.stringify(data))
                        window.location = `${base_url}/dashboard`
                    } else {
                        $('.txt-alert').html(`Username/Password ไม่ถูกต้อง`)
                        obj_alert.type = 'respond'
                        obj_alert.message = 'Respond'
                        main_set_loading(obj_alert)
                        //main_set_alert(text_alert)
                    }
                },
                error: function (err) {
                    console.log(err)
                    main_set_loading(obj_alert)
                    //main_set_alert(text_alert)
                }
            })
        }
    })
}