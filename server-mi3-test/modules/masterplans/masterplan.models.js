const connection = require('../../config/connection')
const getDataModel = async (req, transaction) => {
    var wh_type_id = "";
    console.log('type_id :>> ', req.type_id);
    if (req.type_id == 'afterpress1') {
        wh_type_id = `m.type_id IN('12','22','26','16','18','25','23', '41','42','43','44','45','46','47','51') AND m.status_id != '0'`;
    }
    else if (req.type_id === 'afterpress2') {
        wh_type_id = `(m.type_id IN('1','6','5','10','11','14','19','20','53','54') AND m.status_id != '0') OR (m.type_id IN('14') AND m.status_id = '1') OR (m.type_id IN('5') AND m.status_id != '0' AND (m.connectedTo is null OR m.connectedTo =1))`;

    } else if (req.type_id === "cutting") {
        wh_type_id = `m.type_id IN('52') AND m.status_id != '0'`;
    }else {
        wh_type_id = `type_id IN('21','9','7') AND status_id != '0'`;
    }
    const sqlDataMachine = `SELECT
                                m.machine_id,
                                m.machine_name
                            FROM
                                mi.dbo.machine AS m
                            WHERE
                            ${wh_type_id}
                            ORDER BY
                                m.machine_id,
                                isnull(m.graph_sequence, 0) `;
    let machineList = (await connection.query(sqlDataMachine))[0];
    let holidayList = await getDataHoliday();
    let planList = await  getDataPlan(req);
    return {
        machineList,
        holidayList,
        planList
    }
}
const getDataHoliday = async () => {
    const sqlDataHoliday= `SELECT
                                holiday
                            FROM
                                mi.dbo.holiday `;
    let holidayList = (await connection.query(sqlDataHoliday))[0];
    return holidayList;
}
const getDataPlan = async (req) => {
    const {type_id,search_date1,search_date2} = req;
    var str_wh = "";
    if (type_id == 'afterpress1') {
        str_wh = `m.type_id IN('12','22','26','16','18','25','23', '41','42','43','44','45','46','47','51') AND m.status_id != '0'`;
    }
    else if (type_id === 'afterpress2') {
        str_wh = `(m.type_id IN('1','6','5','10','11','14','19','20','53','54') AND m.status_id != '0') OR (m.type_id IN('14') AND m.status_id = '1') OR (m.type_id IN('5') AND m.status_id != '0' AND (m.connectedTo is null OR m.connectedTo =1))`;

    } else if (type_id === "cutting") {
        str_wh = `m.type_id IN('52') AND m.status_id != '0'`;
    }else {
        str_wh = `type_id IN('21','9','7') AND status_id != '0'`;
    }
    const sqlDataHoliday= `;with mp as(
                                SELECT
                                m.quantity,
                                m.priority,
                                m.itid,
                                m.id,
                                m.machine_id,
                                m.plan_date,
                                m.jobid,
                                m.job_status_id,
                                m.shift_id,
                                m.detail,
                                m.waste,
                                m.hr1 AS hr,
                                m.waste AS quantity2,
                                d.partName,
                                d.partTypeID,
                                isnull(g.job_name,null ) as job_name,
                                g.jobid as mi_jobid,
                                g.emp_id
                            FROM
                                machine_planning m
                            LEFT JOIN machine ma ON m.machine_id = ma.machine_id
                            LEFT JOIN mi_item d ON m.jobid = d.jobid AND m.itid = d.itid
                            LEFT OUTER JOIN mi g ON m.jobid = g.jobid
                            WHERE
                                1 = 1
                           ${wh}
                            AND m.plan_date BETWEEN '${search_date1}' AND '${search_date2}'
                            GROUP BY
                                m.quantity,
                                m.priority,
                                m.itid,
                                m.id,
                                m.machine_id,
                                m.plan_date,
                                m.jobid,
                                m.job_status_id,
                                m.shift_id,
                                m.detail,
                                m.waste,
                                m.hr1,
                                m.waste,
                                d.partName,
                                d.partTypeID,
                                g.job_name,
                                g.jobid,
                                g.emp_id

                            )
                            SELECT
                                a.id,
                                f.firstname,
                                f.lastname,
                                a.machine_id,
                                a.plan_date,
                                a.jobid,
                                a.job_status_id,
                                a.shift_id,
                                a.detail,
                                a.waste,
                                a.hr,
                                isnull(a.job_name, NULL) AS job_name,
                                a.partName AS partnameB,
                                isnull(a.partTypeID, 0) AS partTypeID,
                                a.plan_date,
                                a.quantity2,
                                SUM (e.qty) AS qty,
                                MIN (a.mi_jobid) mi_jobid
                            FROM
                                mp a
                            LEFT OUTER JOIN timesheet_header c ON a.id = c.plan_id AND c.machine_id NOT LIKE 'P%'
                            LEFT OUTER JOIN timesheet_item e ON c.header_id = e.header_id
                            LEFT OUTER JOIN employee f ON a.emp_id = f.emp_id

                            GROUP BY
                                a.id,
                                a.shift_id,
                                a.priority,
                                a.quantity,
                                a.waste,
                                f.firstname,
                                f.lastname,
                                a.machine_id,
                                a.plan_date,
                                a.jobid,
                                a.job_status_id,
                                a.detail,
                                a.waste,
                                a.hr,
                                a.job_name,
                                a.partName,
                                a.partTypeID,
                                a.quantity2
                            ORDER BY
                                a.shift_id,
                                a.priority ASC `;
    let holidayList = (await connection.query(sqlDataHoliday))[0];
    return holidayList;
}

module.exports = {
    getDataModel,
    getDataHoliday
}