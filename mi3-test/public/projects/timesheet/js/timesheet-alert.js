var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
})

async function alert_max_capacity_labor() {
    Swal.fire({
        title: 'ไม่สามารถเลือกคนเกินจำนวนที่วางแผนได้',
        icon: 'warning',
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText:
            '<i class="fa fa-thumbs-up"></i> เข้าใจแล้ว!',
    })
}

async function alert_select_plans() {
    Swal.fire({
        title: 'กรุณาเลือกแผนก่อน',
        icon: 'warning',
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText:
            '<i class="fa fa-thumbs-up"></i> เข้าใจแล้ว!',
    })
}

async function alert_timesheet_header_create() {
    Swal.fire({
        title: 'Timesheet Header Create!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
    })
}

async function alert_paper_status(data) {
    Toast.fire({
        icon: data.icon,
        title: data.message
    })
}

async function alert_error(text) {
    Swal.fire({
        icon: 'error',
        title: 'ERROR...',
        text: text,
        // footer: '<a href="">Why do I have this issue?</a>'
    })
}

async function alert_valid(text) {
    Swal.fire({
        icon: 'warning',
        title: text,
        confirmButtonText:
            '<i class="fa fa-thumbs-up"></i> ตกลง',
        // text: text,
        // footer: '<a href="">Why do I have this issue?</a>'
    })
}

async function alert_success(text) {
    Swal.fire({
        icon: 'success',
        title: text,
        confirmButtonText:
            '<i class="fa fa-thumbs-up"></i> ตกลง',
        // text: text,
        // footer: '<a href="">Why do I have this issue?</a>'
    })
}

async function alert_delete_timesheet(header_id, url) {

    Swal.fire({
        icon: 'question',
        title: 'คุณแน่ใจหรือไม่ว่าต้องการลบ Timesheet อันนี้',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: 'ยืนยันลบ',
        confirmButtonColor: 'rgb(220, 53, 69, 1)',
        cancelButtonText: 'ปิด',
    }).then(async (result) => {
        if (result.isConfirmed) {
            await delete_timesheet(header_id)
            Swal.fire({
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                title: 'ลบ Timesheet สำเร็จ',
                timer: 3000,
                icon: 'success',
                willClose: () => {
                    window.location.href = document.referrer
                    // history.go(-1)
                    // window.history.back()
                    // console.log(document.referrer);
                }
            })
        }
    })
}

async function alert_old_timesheet(url) {
    Swal.fire({
        icon: 'question',
        title: 'Plan นี้มีการทำ Timesheet ค้างอยู่ <br>ต้องการจะทำต่อหรือไม่ ?',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: 'ต้องการทำต่อ',
        // confirmButtonColor: 'rgb(220, 53, 69, 1)',
        cancelButtonText: 'ไม่ต้องการ',
    }).then(async (result) => {
        if (result.isConfirmed) {
            window.location.href = url
            // window.location.reload()
        }
    })
}

async function alert_end_timesheet(text, func) {
    return Swal.fire({
        title: `ยืนยันว่าต้องการ <span class="text-warning">${text}?</span>`,
        showDenyButton: true,
        confirmButtonText: 'ต้องการจบงาน',
        denyButtonText: `ยกเลิก`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: 'question',
    }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
            await func(header_id)
        } else if (result.isDenied) {
            return
        }
    })
}

async function alert_delete_worker(emp_id, emp_name) {
    let checked_machines = $(`input[name='machines']:checked`).length === 1 ? true : false
    if (!checked_machines) {
        await alert_valid(`กรุณาเลือกเครื่องจักรก่อน`)
        return
    }
    
    return Swal.fire({
        title: `ยืนยันว่าต้องการลบ Worker <br><span class="text-warning"> (${emp_id}) ${emp_name}?</span>`,
        showDenyButton: true,
        confirmButtonText: 'ยืนยันลบ',
        denyButtonText: `ยกเลิก`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: 'question',
    }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
            await delete_worker(emp_id)
        } else if (result.isDenied) {
            return
        }
    })
}

async function alert_delete_ma_worker(emp_id, emp_name, tr) {
    return Swal.fire({
        title: `ยืนยันว่าต้องการลบ Worker <br><span class="text-warning"> (${emp_id}) ${emp_name}?</span>`,
        showDenyButton: true,
        confirmButtonText: 'ยืนยันลบ',
        denyButtonText: `ยกเลิก`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        icon: 'question',
    }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
            await delMaWorkerFunc(emp_id, tr)
            // await delete_worker(emp_id)
        } else if (result.isDenied) {
            return
        }
    })
}
