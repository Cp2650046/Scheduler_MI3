const connection = require('../../config/connection')
const getDataMachineModel = async (req, transaction) => {
    var wh_type_id = "";
    console.log('type_id :>> ', req.type_id);
    if (req.type_id == 'afterpress') {
        wh_type_id = `(m.type_id IN('12','22','26','16','18','25','23', '41','42','43','44','45','46','47','51','1','6','5','10','11','14','19','20','53','54','21','9','7') AND m.status_id != '0') OR (m.type_id IN('14') AND m.status_id = '1') OR (m.type_id IN('5') AND m.status_id != '0' AND (m.connectedTo is null OR m.connectedTo =1))`;
    }
    else if (req.type_id == 'afterpress1') {
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
    if (type_id == 'afterpress') {
        str_wh = `AND ( ma.type_id IN ('12','22','26','16','18','25','23','41','42','43','44','45','46','47','51','1','6','5','10','11','14','19','20','53','54','21','9','7') OR (ma.type_id='14' and ma.status_id='1'))  AND m.machine_id != '' `;
    }
    else if (type_id === 'afterpress1') {
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

const getDataModel = async (req, transaction) => {
    console.log('176 :>> ', req);
    const { targetDateLast, targetDate, targetMachine } = req
    var wh = "";
    if (targetDateLast == "" || targetDateLast == 'undefined') {
        wh += `AND a.plan_date between '${targetDate}' and '${targetDate}' `;
    } else {
        wh += `AND a.plan_date between '${targetDate}' and '${targetDateLast}'`;
    }

    if (targetMachine === "") {
        wh += `AND a.machine_id='${targetMachine}'`;
    }

    const sql_data = `SELECT
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
                        a.hr1 AS hr,
                        isnull(g.job_name, NULL) AS job_name,
                        d.partName AS partnameB,
                        isnull(d.partTypeID, 0) AS partTypeID,
                        a.plan_date,
                        a.waste AS quantity2,
                        SUM(qty) AS qty,
                        MIN(g.jobid) mi_jobid
                    FROM
                        mi.dbo.machine_planning AS a
                    JOIN mi.dbo.machine AS b ON a.machine_id = b.machine_id
                    LEFT OUTER JOIN mi.dbo.timesheet_header AS c ON a.id = c.plan_id
                    AND c.machine_id NOT LIKE 'P%'
                    LEFT OUTER JOIN mi.dbo.timesheet_item AS e ON c.header_id = e.header_id
                    LEFT OUTER JOIN mi.dbo.mi_item AS d ON a.jobid = d.jobid
                    AND a.itid = d.itid
                    LEFT OUTER JOIN mi.dbo.mi AS g ON a.jobid = g.jobid
                    LEFT OUTER JOIN mi.dbo.employee AS f ON g.emp_id = f.emp_id
                    WHERE
                        1 = 1 ${wh}
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
                        a.hr1,
                        g.job_name,
                        d.partName,
                        d.partTypeID,
                        a.plan_date
                    ORDER BY
                        a.shift_id,
                        a.priority ASC`;
    let plandDtaList = (await connection.query(sql_data))[0];
    return plandDtaList;

}

const getdataHrModel = async (req, transaction) => {
    console.log('248 :>> ', req);
    var target_DateLast = req.targetDateLast
    var target_Date = req.targetDate
    var target_Machine = req.targetMachine
    var str_hr_wh = "";
    if (target_DateLast == "" || target_DateLast == 'undefined') {
        str_hr_wh += `AND a.plan_date between '${target_Date}' and '${target_Date}' `;
    } else {
        str_hr_wh += `AND a.plan_date between '${target_Date}' and '${target_DateLast}'`;
    }

    if (target_Machine == "") {
        str_hr_wh += `AND a.machine_id='${target_Machine}'`;
    }
    const sql_data_hr = `SELECT
                            SUM(CONVERT(INT, hr1)) AS hr1,
                            (SUM(hr1 - CONVERT(INT, hr1))) * 100 AS hr2,
                            a.machine_id AS machine,
                            plan_date AS DATE,
                            machine_name AS machine_n
                        FROM
                            mi.dbo.machine_planning AS a
                        JOIN mi.dbo.machine AS b ON a.machine_id = b.machine_id
                        WHERE
                            1 = 1 ${str_hr_wh}
                        GROUP BY
                            a.machine_id,
                            plan_date,
                            machine_name`;
    let dataHrList = await (connection.query(sql_data_hr));
    // console.log('dataHrList :>> ', dataHrList);
    return dataHrList[0];
}

const sendDataPlanMoveModel = async (req, transaction) => {
    // console.log('280 :>> ', req);
    var { original_id, original_plan_date, original_machine_id, original_shift_id, machine_id, machine_id, shift_id, plan_date, id } = req
    var result = {
        success: 0,
        message: ""
    };
    // 1. original should be existing
    let type_id_denied = [5, 5]
    const sql_check_plan = `SELECT
                                COUNT(*) AS countID
                            FROM
                                mi.dbo.machine_planning
                            WHERE
                                id = '${original_id}'
                            AND plan_date = '${original_plan_date}'
                            AND machine_id = '${original_machine_id}'
                            AND shift_id = ${original_shift_id}
                            `;
    await connection.query(sql_check_plan).then(([data]) => {
        // console.log('298 :>> ', data[0].countID);
        if (data[0].countID == 0) {
            result.success = 2;
            result.message = "Original plan does not exist anymore!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 2. original should not be recorded as a timesheet source
    const sql_check_timesheet = `SELECT
                                    COUNT(*) AS countID
                                FROM
                                    mi.dbo.timesheet_header
                                WHERE
                                    plan_id = ${original_id}
                            `;
    await connection.query(sql_check_timesheet).then(([data]) => {
        // console.log('307 :>> ', data[0].countID);
        if (data[0].countID > 0) {
            result.success = 2;
            result.message = "This plan has been attached to a timesheet!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 3. hard cover is not allowed in drag and drop
    const sql_check_allowed = `SELECT
                                    m.type_id,
                                    mt.type_name
                                FROM
                                    mi.dbo.machine_planning AS mp
                                LEFT JOIN machine AS m ON m.machine_id = mp.machine_id
                                LEFT JOIN machine_type AS mt ON mt.type_id = m.type_id
                                WHERE
                                    mp.id = ${original_id}
                            `;
    await connection.query(sql_check_allowed).then(([data]) => {
        // console.log('319 :>> ', data[0].type_id);
        // console.log('320 :>> ', data[0].type_name);
        if (type_id_denied.includes(data[0].type_id)) {
            result.success = 2;
            result.message = `${data[0].type_name} is not allowed to use drag and drop!`
        }
    })
        .catch(() => {
            result.success = 0;
        })
    if (result.success == 2) {
        return result;
    } else {
        var modifiedUserUpdateStatement = "";
        var i = 0;
        for (let i = 0; i < id.length; i++) {
            const element = id[i];
            console.log('355 :>> ', element);
            if (element == original_id) {
                modifiedUserUpdateStatement = ` , saleman_id = '2133745', key_date = CONVERT(VARCHAR(20), GETDATE(), 20) `;
            } else {
                modifiedUserUpdateStatement = "";
            }
            const sql_update = `UPDATE mi.dbo.machine_planning SET 
                                    machine_id = '${machine_id}',
                                    shift_id = '${shift_id}',
                                    plan_date = '${plan_date}',
                                    priority = ${i},
                                    default_machine_id = ''
                                    ${modifiedUserUpdateStatement}
                                WHERE id = '${element}'`;
            console.log('369 :>> ', sql_update);
            await connection.query(sql_update)
                    .then(() => {
                        result.success = 1;
                        result.message = "สำเร็จ"
                    })
                    .catch(() => {
                        result.message = "อัปเดตไม่สำเร็จ"
                        result.success = 0;
                    })

        }

        return result;
    }
}

const sendDataPlanMoveThoseBehindModel = async (req, transaction) => {
    var { original_id, original_plan_date, original_machine_id, original_shift_id, machine_id, machine_id, shift_id, plan_date, id, moveNow } = req
    var result = {
        success: 0,
        message: ""
    };
    // 1. original should be existing
    let type_id_denied = [5, 5]
    const sql_check_plan = `SELECT
                                COUNT(*) AS countID
                            FROM
                                mi.dbo.machine_planning
                            WHERE
                                id = '${original_id}'
                            AND plan_date = '${original_plan_date}'
                            AND machine_id = '${original_machine_id}'
                            AND shift_id = ${original_shift_id}
                            `;
    await (connection.query(sql_check_plan)[0]).then(([data]) => {
        console.log('298 :>> ', data.countID);
        if (data.countID == 0) {
            result.success = 2;
            result.message = "Original plan does not exist anymore!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 2. original should not be recorded as a timesheet source
    const sql_check_timesheet = `SELECT
                                    COUNT(*) AS countID
                                FROM
                                    mi.dbo.timesheet_header
                                WHERE
                                    plan_id = ${original_id}
                            `;
    await (connection.query(sql_check_timesheet)[0]).then(([data]) => {
        console.log('307 :>> ', data.countID);
        if (data.countID > 0) {
            result.success = 2;
            result.message = "This plan has been attached to a timesheet!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 3. hard cover is not allowed in drag and drop
    const sql_check_allowed = `SELECT
                                    m.type_id,
                                    mt.type_name
                                FROM
                                    mi.dbo.machine_planning AS mp
                                LEFT JOIN machine AS m ON m.machine_id = mp.machine_id
                                LEFT JOIN machine_type AS mt ON mt.type_id = m.type_id
                                WHERE
                                    mp.id = ${original_id}
                            `;
    await (connection.query(sql_check_allowed)[0]).then(([data]) => {
        console.log('319 :>> ', data.type_id);
        console.log('320 :>> ', data.type_name);
        if (type_id_denied.includes(data.type_id)) {
            result.success = 2;
            result.message = `${data.type_name} is not allowed to use drag and drop!`
        }
    })
        .catch(() => {
            result.success = 0;
        })
    if (result.success == 2) {
        return result;
    } else {
        const sql = `EXEC ChangeDateMachinePlanning @id = ${original_id}, @newPlandate = '${plan_date}', @moveNow = ${moveNow}`;
        await (connection.query(sql)[0]).then(([rs_changdate]) => {
            console.log('454 :>> ', rs_changdate);
            if (!moveNow) {
                // print out the result and ask for confirmation
                let moveList = rs_changdate
            } else {

            }
            result.success = 1;
            result.message = "สำเร็จ"
        })
            .catch(() => {
                result.message = "อัปเดตไม่สำเร็จ"
                result.success = 0;
            })
        var modifiedUserUpdateStatement = "";
        id.forEach(element => {
            if (element == original_id) {
                modifiedUserUpdateStatement = ` , saleman_id = "2650046", key_date = convert(varchar(20),getdate(),20) `;
            } else {
                modifiedUserUpdateStatement = "";
            }

            const sql_update = `UPDATE mi.dbo.machine_planning SET 
                                    machine_id = '${machine_id}',
                                    shift_id = '${shift_id}',
                                    plan_date = '${plan_date}',
                                    priority = ${i + 1},
                                    default_machine_id = ''
                                    ${modifiedUserUpdateStatement}
                                WHERE id = '${element}'`;
            await(connection.query(sql_update)[0]).then(([data]) => {
                result.success = 1;
                result.message = "สำเร็จ"
            })
                .catch(() => {
                    result.message = "อัปเดตไม่สำเร็จ"
                    result.success = 0;
                })

        });

        return result;
    }
}


module.exports = {
    getDataMachineModel,
    getDataHoliday,
    getHr,
    getDataModel,
    getdataHrModel,
    sendDataPlanMoveModel,
    sendDataPlanMoveThoseBehindModel
}