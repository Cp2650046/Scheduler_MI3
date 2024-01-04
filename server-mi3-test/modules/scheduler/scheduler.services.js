const connection = require('../../config/connection');

const chkTimesheet = async (planId) => {

    const sqlDataJob = `SELECT
                            * 
                        FROM
                            mi.dbo.machine_planning mp 
                        WHERE
                            mp.id = ${planId} 
                            AND EXISTS ( SELECT plan_id FROM mi.dbo.timesheet_header h WHERE h.plan_id = mp.id ) `
    let rowTimesheet = (await connection.query(sqlDataJob))[0].length;
    return rowTimesheet;
}

const chkIsCaseIn = async (machineId) => {
    const sqlDataJob = `SELECT * FROM mi.dbo.machine WHERE machine_id = '${machineId}' AND type_id = '5' `
    let rowMachine = (await connection.query(sqlDataJob))[0].length;
    return rowMachine;
}

const chkValuePlanList = async (planList) => {
    planList.forEach(async plan => {
        if (plan.hr1 === null || plan.hr1 === 0.00) {
            // console.log("plan.hr =>", plan.hr);
            if (plan.hr === null) {
                plan.hr = 0
            }
            let decimalArray = await explodeDecimal(plan.hr);
            // console.log(decimalArray);
            let sec = (60 * Number(decimalArray[1])) / 100;
            if (sec < 10) {
                sec = '0' + sec;
            }
            // console.log(sec);

            plan.hr1 = decimalArray[0] + "." + sec;
        }
        // console.log("plan.job_status_id => ", plan.job_status_id);
        plan.machine_id = plan.machine_id === null ? '' : plan.machine_id;
        plan.job_status_name = plan.job_status_id === null || plan.job_status_id === 0 ? '' : plan.job_status_name;
        plan.partName = plan.partName === null ? '' : plan.partName;
        plan.shift_name = plan.shift_id === null || plan.shift_id === 0 ? '' : plan.shift_name;
        plan.sig = plan.sig === null ? 0 : plan.sig;
        plan.paper_size = plan.paper_size === null ? '' : plan.paper_size;
        plan.paper_type = plan.paper_type === null ? '' : plan.paper_type;
        plan.saleman_id = plan.saleman_id === null ? '' : plan.saleman_id;
        plan.key_date = plan.key_date === null ? '' : plan.key_date;
        plan.due1 = plan.due1 === null ? '' : plan.due1;
        plan.waste = plan.waste === null ? 0 : plan.waste;
        plan.make_ready = plan.make_ready === null ? 0.00 : plan.make_ready;
        plan.process_time1 = plan.process_time1 === null ? 0.00 : plan.process_time1;
        plan.speed = plan.speed === null ? 0 : plan.speed;
        plan.date_paper_in = plan.date_paper_in === null ? '' : plan.date_paper_in;
        plan.date_plate_in = plan.date_plate_in === null ? '' : plan.date_plate_in;
        plan.date_ink_in = plan.date_ink_in === null ? '' : plan.date_ink_in;
        plan.waterbase = plan.waterbase === null ? '' : plan.waterbase;
        plan.varnish = plan.varnish === null ? '' : plan.varnish;
        plan.recive_dep = plan.recive_dep === null ? '' : plan.recive_dep;
        plan.send_dep_name = plan.send_dep_name === null ? '' : plan.send_dep_name;
        plan.remark = plan.remark === null ? '' : plan.remark;
        plan.machine_id_send = plan.machine_id_send === null ? '' : plan.machine_id_send;
        plan.detail = plan.detail === null ? '' : plan.detail;

        if (plan.ok_date !== undefined && plan.ok_date) {
            plan.ok_date = plan.ok_date === null ? '' : plan.ok_date;
        }
    });

    return planList;
}

const explodeDecimal = async (decimalNumber = 0.00) => {
    const decimalPart = (decimalNumber.toFixed(2)).toString().split('.');
    if (decimalPart) {
        // console.log('decimalNumber => ', decimalNumber);
        // console.log('decimalPart => ', decimalPart);
        return decimalPart;
    } else {
        return [];
    }
}

module.exports = {
    chkTimesheet,
    chkValuePlanList,
    chkIsCaseIn
}