var apiScheduler = `${api_url}/scheduler`

async function getMenu(empID) {
    // console.log("get menu");
    const url = `${apiScheduler}/get_menu`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { empID },
        async: true,
        dataType: 'JSON',
        beforeSend: function () {
            // console.log("beforeSend");
            main_set_table_loading({ loading: true, message: 'LOADING ...' }, "body");
        },
        success: async function (data) {
            // console.log("success function");
            let dataNextMachine = await getNextMachine();

            const schedulerData = {
                schedulerNextMachine: dataNextMachine,
                schedulerDefaultMachine: data.machineList,
                schedulerMachineTypeList: data.machineTypeList,
                schedulerActCode: await getActCode(),
                schedulerStatuPlanList: await getJobStatus(),
                schedulerSaddleList: await getSaddle()
            }

            localStorage.setItem("schedulerData", JSON.stringify(schedulerData));

            if (data) {
                await buildMenu(data.menuList);
                main_set_loading({ loading: false });
            }
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getData(machineType) {
    const url = `${apiScheduler}/get_data`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { machineType },
        async: false,
        dataType: 'JSON',
        beforeSend: async function () { },
        success: function (data) {
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getMachine(machineType) {
    const url = `${apiScheduler}/get_machine`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { machineType },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.machineList;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getPlanSearch(objSearchData) {
    // console.log(objSearchData);
    // const objFilter = randomObjects(); // test serch function
    const url = `${apiScheduler}/get_plan_search`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: objSearchData,
        async: true,
        dataType: 'JSON',
        beforeSend: async function () {
            await main_set_table_loading({ loading: true, message: 'LOADING ...' }, ".div_table_plan");
            await resetDataTable();
        },
        success: async function (data) {
            res = data;
            globalData = data.planList;
            await btnReset();
            await createPlanTable(data.planList);
            await toggleNav();
            await main_set_table_loading({ loading: false }, ".div_table_plan");
        },
        error: async function (err) {
            // console.log(err);
            await main_set_table_loading({ loading: false }, ".div_table_plan");
        }
    })
    return res
}

async function insertPlan(objPlan) {
    const url = `${apiScheduler}/insert_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: objPlan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function updatePlan(objPlan) {
    const url = `${apiScheduler}/update_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: objPlan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function cancelPlan(objPlan) {
    const url = `${apiScheduler}/cancel_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: objPlan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.success
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function deletePlan(planID, empID) {
    const url = `${apiScheduler}/delete_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { plan_id: planID, empID },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getJob(jobid) {
    const url = `${apiScheduler}/get_data_job`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { jobid },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getCapacityLabor(machine_id, e_plan_date, menu_id) {
    const url = `${apiScheduler}/get_capacity_labor`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            machineId: machine_id,
            planDate: e_plan_date,
            menuId: menu_id
        },
        async: false,
        dataType: 'JSON',
        success: function (data) {
            // console.log(data);
            res = data.master_capacity_labor;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getItem(machine_id, term, a_job) {
    const url = `${apiScheduler}/get_item`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            machine_id,
            term,
            a_job
        },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log('215',data.itemlist);
            res = data.itemlist
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getNextMachine() {
    const url = `${apiScheduler}/get_next_machine`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: {},
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log('263 :>> ', data);
            res = data.result;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getJobStatus() {
    const url = `${apiScheduler}/get_job_status`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: {},
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log('263 :>> ', data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getMenuGroupData(menuID = 22) {
    const url = `${apiScheduler}/get_menu_group_data`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { menuID },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log('getMenuGroupData = ', data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getDataToExcel(obj_data_excel) {
    const url = `${apiScheduler}/get_data_to_excel`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj_data_excel,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log('data_excel = ', data);
            res = data.dataExcel;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function updateMultiplePlan(obj_data_plan) {
    const url = `${apiScheduler}/update_multi_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj_data_plan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log('328 = ', data);
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function cancelMultiplePlan(obj_data_plan) {
    const url = `${apiScheduler}/cancel_multi_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj_data_plan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function deleteMultiplePlan(obj_data_plan) {
    const url = `${apiScheduler}/delete_multi_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'POST',
        data: obj_data_plan,
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log('328 = ', data);
            res = data.success;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getActCode() {
    const url = `${apiScheduler}/get_act_code`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            // console.log(data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

async function getSaddle() {
    const url = `${apiScheduler}/get_saddle`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: {},
        async: false,
        dataType: 'JSON',
        success: function (data) {
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}

// ==========================================================================================


async function randomObjects() {
    const objFilterArray = [
        {
            typeSearch: 1,
            jobID: '',
            machineID: 5815,
            startDate: formatDate("01/01/2023"),
            endDate: formatDate("27/07/2023"),
            machineType: 6,
            shiftID: 0,
            checkedPlanDate: 0
        },
        {
            typeSearch: 2,
            jobID: 'J12200122',
            machineID: 0,
            startDate: formatDate("01/01/2023"),
            endDate: formatDate("03/01/2023"),
            machineType: 6,
            shiftID: 0,
            checkedPlanDate: 1
        },
        {
            typeSearch: 3,
            jobID: 'J12200122',
            machineID: 0,
            startDate: '',
            endDate: '',
            machineType: 0,
            shiftID: 0,
            checkedPlanDate: 0
        },
        {
            typeSearch: 4,
            jobID: '',
            machineID: 0,
            startDate: formatDate("17/01/2023"),
            endDate: formatDate("18/01/2023"),
            machineType: 0,
            shiftID: 0,
            checkedPlanDate: 0
        }
    ]

    const randomIndex = Math.floor(Math.random() * objFilterArray.length)
    return objFilterArray[randomIndex]
}