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
    } else {
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
    let dataplanList = await getDataPlan(req.type_id, req.search_date1, req.search_date2);
    return {
        machineList,
        holidayList,
        dataplanList
    }
}
const getDataHoliday = async () => {
    const sqlDataHoliday = `SELECT
                                holiday
                            FROM
                                mi.dbo.holiday `;
    let holidayList = (await connection.query(sqlDataHoliday))[0];
    return holidayList;
}
const getDataPlan = async (type_id, search_date1, search_date2) => {
    var str_wh = "";
    if (type_id == 'afterpress1') {
        str_wh = `AND ( ma.type_id IN ('12','22','26','16','18','25','23','41','42','43','44','45','46','47','51')) AND m.machine_id != '' `;
    }
    else if (type_id === 'afterpress2') {
        str_wh = `AND (ma.type_id IN ('1','6','5','10','11','14','19','20','53','54') OR (ma.type_id='14' and ma.status_id='1')  )  AND m.machine_id!='' `;

    } else if (type_id === "cutting") {
        str_wh = ` AND ma.type_id IN('52') AND m.machine_id!='' `;
    } else {
        str_wh = `AND ma.type_id IN('21','9','7')  AND m.machine_id!=''`;
    }
    const sqlDataPlan = `;with mp as(
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
                                mi.dbo.machine_planning m
                            LEFT JOIN mi.dbo.machine ma ON m.machine_id = ma.machine_id
                            LEFT JOIN mi.dbo.mi_item d ON m.jobid = d.jobid AND m.itid = d.itid
                            LEFT OUTER JOIN mi.dbo.mi g ON m.jobid = g.jobid
                            WHERE
                                1 = 1
                           ${str_wh}
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
                            LEFT OUTER JOIN mi.dbo.timesheet_header c ON a.id = c.plan_id AND c.machine_id NOT LIKE 'P%'
                            LEFT OUTER JOIN mi.dbo.timesheet_item e ON c.header_id = e.header_id
                            LEFT OUTER JOIN mi.dbo.employee f ON a.emp_id = f.emp_id

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
    let plansList = (await connection.query(sqlDataPlan))[0];
    let hrList = await getHr(str_wh, search_date1, search_date2);
    return {
        plansList
        , hrList
    }
}

const getHr = async (str_wh, search_date1, search_date2) => {
    const sql_hr = `SELECT sum(convert (int,hr1)) as hr1,
                    (sum(hr1 -convert (int,hr1)))*100 as hr2,
                    m.machine_id as machine,
                    plan_date as date,
                    machine_name as machine_n
                    FROM mi.dbo.machine_planning AS m
                    JOIN mi.dbo.machine AS ma ON m.machine_id=ma.machine_id
                    WHERE 1=1 ${str_wh}AND m.plan_date between '${search_date1}' and '${search_date2}'
                    GROUP BY m.machine_id,plan_date,machine_name`;
    let hrList = (await connection.query(sql_hr))[0];
    return hrList;
}

module.exports = {
    getDataModel,
    getDataHoliday
}