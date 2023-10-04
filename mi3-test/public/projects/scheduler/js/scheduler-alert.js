async function showAlertConfirm(type, obj) {
    switch (type) {
        case 'cancel':
        case 'delete':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showDenyButton: true,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: `ยกเลิก`,
                denyButtonText: `ยืนยัน`,
            }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isDenied) {
                    obj.func(obj.planId, obj.machineId,userData.emp_id);
                }
            })
            break;
        case 'save':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    await insertPlan(obj.obj_save).then(async (result)=>{
                        if(result == 1){
                            await showAlertWithTimer("บันทึกสำเร็จ","success",1000);
                            await btnReset();
                            await searchPlan(1);
                            plan_id_coppy = 0
                        }else{
                            await showAlertWithTimer("บันทึกไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
        case 'update':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    await updatePlan(obj.obj_save).then(async (result)=>{
                        if(result == 1){
                            showAlertWithTimer("บันทึกสำเร็จ","success",1000);
                            btnReset();
                            searchPlan();
                            plan_id_coppy = 0
                            $("#e_btn_copy").removeClass("disabled");
                        }else{
                            showAlertWithTimer("บันทึกไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
        case 'add':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    await btnReset();
                    $("#e_save_type").val("4");
                    $("#btn_insert").addClass("disabled");
                }
            })
        break;
        case 'deleteMulti':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteMultiplePlan(obj.obj_data).then(async (result)=>{
                        if(result == 1){
                            showAlertWithTimer("ลบสำเร็จ","success",1000);
                            await resetCheckboxPlans();
                            await resetInputPlans();
                            await searchPlan();
                        }else{
                            showAlertWithTimer("ลบไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
        case 'cancelMulti':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await cancelMultiplePlan(obj.obj_data).then(async (result)=>{
                        if(result == 1){
                            showAlertWithTimer("ยกเลิกสำเร็จ","success",1000);
                            await resetCheckboxPlans();
                            await resetInputPlans();
                            await searchPlan();
                        }else{
                            showAlertWithTimer("ยกเลิกไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
        case 'updateMulti':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await updateMultiplePlan(obj.obj_data).then(async (result)=>{
                        if(result == 1){
                            showAlertWithTimer("บันทึกสำเร็จ","success",1000);
                            await resetCheckboxPlans();
                            await resetInputPlans();
                            await searchPlan();
                        }else{
                            showAlertWithTimer("บันทึกไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
        case 'copyMulti':
            Swal.fire({
                icon: 'warning',
                title: obj.title,
                text: obj.text,
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonColor: '#609966',
                cancelButtonText: `ยกเลิก`,
                confirmButtonText: `ยืนยัน`,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await updateMultiplePlan(obj.obj_data).then(async (result)=>{
                        if(result == 1){
                            showAlertWithTimer("คัดลอกสำเร็จ","success",1000);
                            await resetCheckboxPlans();
                            await resetInputPlans();
                            await searchPlan();
                        }else{
                            showAlertWithTimer("คัดลอกไม่สำเร็จ","error",1000);
                        }
                    })
                }
            })
        break;
    }
    return
}

async function showAlertNotiSuccess(text) {
    Swal.fire(text, '', 'success')
}

async function showAlertNotiError(text) {
    Swal.fire(text, '', 'error')
}

async function showAlertNotiWarning(text) {
    Swal.fire(text, '', 'warning')
}

async function showAlertWithTimer(text, icon, timer) {
    Swal.fire({
        icon: icon,
        title: text,
        showConfirmButton: false,
        timer: timer
    })
}