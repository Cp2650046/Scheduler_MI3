async function main_set_loading(data) {
    console.log('data :>> ', data);
    toastr.options = { positionClass: "toast-bottom-right", timeOut: 500 }
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