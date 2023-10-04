const getFGRequestDOModel = async (req, transaction)=>{
    const sql = ` 
        SELECT
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.delivery_date, dr.dr_quantity,
            dr.delivery_place, dr.with_invoice, dr.remark AS dr_remark, dr.postpone_remark AS postpone_id, dr.commercial_type,
            ISNULL(do_sum.summary_do, '') AS summary_do,
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name,
            customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            mi.job_name, pallet_sum.total_pallet_quantity
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN DR_DO.dbo.tb_master_postpone_remark ON tb_master_postpone_remark.postpone_id = dr.postpone_remark
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id= dr.request_work_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT SUM(do_quantity) AS summary_do FROM DR_DO.dbo.tb_do_head WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        OUTER APPLY (
            SELECT 
                SUM(fg_pallet.qty_pieces) AS total_pallet_quantity
            FROM DR_DO.dbo.tb_dr_pallet AS dr_pallet
            INNER JOIN mi.dbo.FG_Product_Pallet AS fg_pallet ON fg_pallet.pallet_barcode = dr_pallet.pallet_barcode
            WHERE dr_number = dr.dr_number AND fg_pallet.issue_status = 1
            GROUP BY dr_number
        ) pallet_sum
        WHERE ISNULL(do_sum.summary_do, 0) < dr.dr_quantity
        AND dr.request_work_type_id <> 3
        AND dr.commercial_type = 1
        AND EXISTS (SELECT * FROM DR_DO.dbo.tb_dr_pallet WHERE tb_dr_pallet.dr_number = dr.dr_number)
        AND ISNULL(pallet_sum.total_pallet_quantity, 0) >= dr.dr_quantity
        GROUP BY
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.created, dr.commercial_type,
            dr.delivery_date, dr.dr_quantity, dr.delivery_place, dr.with_invoice, dr.remark, dr.postpone_remark,
            do_sum.summary_do, pallet_sum.total_pallet_quantity,
            mi.job_name, hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th, customer.custName,
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getFGRequestNonCommercialDOModel = async (req, transaction)=>{
    let request_condition = `AND dr.request_work_type_id <> 3`
    if(req.request_type === 'materials'){
        request_condition = `AND dr.request_work_type_id = 3`
    }
    const sql = ` 
        SELECT
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.delivery_date, dr.dr_quantity,
            dr.delivery_place, dr.with_invoice, dr.remark AS dr_remark, dr.postpone_remark AS postpone_id, dr.commercial_type,
            ISNULL(do_sum.summary_do, '') AS summary_do,
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name,
            customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            mi.job_name, dr_item.total_item_quantity
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN DR_DO.dbo.tb_master_postpone_remark ON tb_master_postpone_remark.postpone_id = dr.postpone_remark
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id= dr.request_work_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT SUM(do_quantity) AS summary_do FROM DR_DO.dbo.tb_do_head
			WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        OUTER APPLY (
            SELECT SUM(item_quantity) AS total_item_quantity FROM DR_DO.dbo.tb_dr_item
            WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) dr_item
        WHERE ISNULL(do_sum.summary_do, 0) < dr.dr_quantity
        ${request_condition}
		AND dr.commercial_type = 2
        AND ISNULL(dr_item.total_item_quantity, 0) >= dr.dr_quantity
        GROUP BY
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.created, dr.commercial_type,
            dr.delivery_date, dr.dr_quantity, dr.delivery_place, dr.with_invoice, dr.remark, dr.postpone_remark,
            do_sum.summary_do, dr_item.total_item_quantity,
            mi.job_name, hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th, customer.custName,
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getMaterialsRequestDOModel = async (req, transaction)=>{
    const sql = ` 
        SELECT
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.delivery_date, dr.dr_quantity, dr.commercial_type,
            dr.delivery_place, dr.with_invoice, dr.remark AS dr_remark, dr.postpone_remark AS postpone_id, item.item_name, item.item_quantity,
            ISNULL(item.do_number, '') AS do_number,
            ISNULL(item.do_quantity, '') AS do_quantity,
            ISNULL(do_sum.summary_do, '') AS summary_do, 
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name,
            mi.job_name,
            customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN DR_DO.dbo.tb_master_postpone_remark ON tb_master_postpone_remark.postpone_id = dr.postpone_remark
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id= dr.request_work_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT SUM(do_quantity) AS summary_do FROM DR_DO.dbo.tb_do_head WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        OUTER APPLY (
            SELECT
                tb_dr_item.item_name, tb_dr_item.item_quantity,
                tb_dr_item.dr_number, tb_do_head.do_number, tb_do_head.do_quantity
            FROM DR_DO.dbo.tb_dr_item 
            LEFT JOIN DR_DO.dbo.tb_do_item ON tb_do_item.item_name = tb_dr_item.item_name
            LEFT JOIN DR_DO.dbo.tb_do_head ON tb_do_head.do_number = tb_do_item.do_number
            WHERE tb_dr_item.dr_number = dr.dr_number
        ) item
        WHERE ISNULL(do_sum.summary_do, 0) < dr.dr_quantity
        AND dr.request_work_type_id = 3
        AND dr.commercial_type = 1
        GROUP BY
            dr.dr_number, dr.unique_id, dr.job_id, dr.delivery_type_id, dr.request_work_type_id, dr.created, dr.commercial_type,
            dr.delivery_date, dr.dr_quantity, dr.delivery_place, dr.with_invoice, dr.remark, dr.postpone_remark,
            item.do_number, item.do_quantity, do_sum.summary_do, item.item_name, item.item_quantity,
            mi.job_name, hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th, customer.custName,
            tb_master_delivery_type.delivery_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getFGOrderDOModel = async (req, transaction)=>{
    let request_condition = `AND dr.request_work_type_id <> 3`
    if(req.request_type === 'materials'){
        request_condition = `AND dr.request_work_type_id = 3`
    }
    const sql = ` 
        SELECT
            dr.dr_number, dr.delivery_date, dr.delivery_type_id, dr.request_work_type_id, dr.commercial_type,
            dr.dr_quantity, dr.delivery_place, dr.contact_person, dr.contact_number,
            dr.with_invoice, dr.remark, dr.job_id,
            ISNULL(do.do_number, '') AS do_number, 
            ISNULL(do.do_quantity, 0) AS do_quantity,
            do.do_status_id, do.do_status_name, do.do_status_class, do.departed, do.arrived,
            do_sum.summary_do_quantity, do_complete.complete_do_quantity,
            mi.job_name, summary_fg.fg_quantity, customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            tb_master_request_type_work.request_work_type_name,
            tb_master_delivery_type.delivery_type_name,
            do_vehicle.vehicle_owner_id, do_vehicle.vehicle_owner,
            do_vehicle.vehicle_licens_id, do_vehicle.vehicle_licens,
            do_vehicle.vehicle_driver_id, do_vehicle.vehicle_driver_name,
            do_vehicle.vehicle_follower, do_vehicle.vehicle_quantity,
            do_vehicle.vehicle_reject, do_vehicle.vehicle_reject_remark
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id = dr.request_work_type_id
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT do_number, do_quantity, do.departed, do.arrived,
                ISNULL(do_status, '') AS do_status_id,
                ISNULL(tb_master_do_status.do_status_name, '') AS do_status_name,
                ISNULL(tb_master_do_status.do_status_class, '') AS do_status_class
            FROM DR_DO.dbo.tb_do_head AS do
            LEFT JOIN DR_DO.dbo.tb_master_do_status ON tb_master_do_status.do_status_id = do.do_status
            WHERE dr_number = dr.dr_number
        ) do
        OUTER APPLY (
            SELECT SUM(do_quantity) AS summary_do_quantity FROM DR_DO.dbo.tb_do_head
            WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        OUTER APPLY (
            SELECT SUM(do_quantity) AS complete_do_quantity FROM DR_DO.dbo.tb_do_head
            WHERE dr_number = dr.dr_number AND do_status > 3 GROUP BY dr_number
        ) do_complete
        OUTER APPLY (
            SELECT
                vehicle_do.vehicle_owner AS vehicle_owner_id,
                vehicle_owner.comp_name AS vehicle_owner,
                vehicle_do.vehicle_licens AS vehicle_licens_id,
                vehicle.vhregno AS vehicle_licens,
                vehicle_do.vehicle_driver AS vehicle_driver_id,
                hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS vehicle_driver_name,
                vehicle_do.vehicle_follower, vehicle_do.vehicle_quantity,
                vehicle_do.vehicle_reject, vehicle_do.vehicle_reject_remark
            FROM DR_DO.dbo.tb_do_vehicle AS vehicle_do
            LEFT JOIN mi.dbo.employeed_car_company AS vehicle_owner ON vehicle_owner.comp_id = vehicle_do.vehicle_owner
            LEFT JOIN mi.dbo.vehicle ON vehicle.owner = vehicle_do.vehicle_owner AND vehicle.id = vehicle_do.vehicle_licens
            LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = vehicle_do.vehicle_driver COLLATE Thai_CI_AS
            WHERE do_number = do.do_number
        ) do_vehicle
        OUTER APPLY (
            SELECT (SUM(vehicle_do.vehicle_quantity) - SUM(vehicle_do.vehicle_reject)) AS summary_job
            FROM DR_DO.dbo.tb_dr_head AS dr
            LEFT JOIN DR_DO.dbo.tb_do_head AS do ON do.dr_number = dr.dr_number
            LEFT JOIN DR_DO.dbo.tb_do_vehicle AS vehicle_do ON vehicle_do.do_number = do.do_number
            WHERE dr.dr_number = dr.dr_number AND do.do_status > 3 
            GROUP BY dr.dr_number
        ) vehicle_sum
        OUTER APPLY (
            SELECT SUM(fg_quantity) AS fg_quantity FROM mi.dbo.mi_fg
            WHERE jobID = dr.job_id GROUP BY jobID
        ) summary_fg
        WHERE ISNULL(do_sum.summary_do_quantity, 0) >= dr.dr_quantity
        ${request_condition}
        GROUP BY
            dr.dr_number, dr.delivery_date, dr.delivery_type_id, dr.request_work_type_id, dr.commercial_type,
            dr.dr_quantity, dr.delivery_place, dr.contact_person, dr.contact_number,
            dr.with_invoice, dr.remark, dr.created, dr.job_id,
            do.do_number, do.do_status_id, do.do_status_name, do.do_status_class, do.departed, do.arrived,
            do.do_quantity, do_sum.summary_do_quantity, do_complete.complete_do_quantity,
            do_vehicle.vehicle_owner_id, do_vehicle.vehicle_owner,
            do_vehicle.vehicle_licens_id, do_vehicle.vehicle_licens,
            do_vehicle.vehicle_driver_id, do_vehicle.vehicle_driver_name,
            do_vehicle.vehicle_follower, do_vehicle.vehicle_quantity,
            do_vehicle.vehicle_reject, do_vehicle.vehicle_reject_remark,
            mi.job_name, summary_fg.fg_quantity, customer.custName,
            hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th,
            tb_master_request_type_work.request_work_type_name,
            tb_master_delivery_type.delivery_type_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getMaterialsOrderDOModel = async (req, transaction)=>{
    const sql = ` 
        SELECT
            dr.dr_number, dr.delivery_date, dr.delivery_type_id, dr.request_work_type_id,
            dr.dr_quantity, dr.delivery_place, dr.contact_person, dr.contact_number,
            dr.with_invoice, dr.remark, dr.job_id, dr.commercial_type,
            ISNULL(do.do_number, '') AS do_number,
            ISNULL(do.do_quantity, 0) AS do_quantity,
            do.do_status_id, do.do_status_name, do.do_status_class,
            do.departed, do.arrived, do.item_name, do.item_quantity,
            do_sum.summary_do_quantity, do_complete.complete_do_quantity,
            mi.job_name, summary_fg.fg_quantity, customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            tb_master_request_type_work.request_work_type_name,
            tb_master_delivery_type.delivery_type_name,
            do_vehicle.vehicle_owner_id, do_vehicle.vehicle_owner,
            do_vehicle.vehicle_licens_id, do_vehicle.vehicle_licens,
            do_vehicle.vehicle_driver_id, do_vehicle.vehicle_driver_name,
            do_vehicle.vehicle_follower, do_vehicle.vehicle_quantity,
            do_vehicle.vehicle_reject, do_vehicle.vehicle_reject_remark
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id = dr.request_work_type_id
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT 
                do.do_number, do.do_quantity, do.departed, do.arrived,
                tb_do_item.item_name, tb_do_item.item_quantity,
                ISNULL(do_status, '') AS do_status_id,
                ISNULL(tb_master_do_status.do_status_name, '') AS do_status_name,
                ISNULL(tb_master_do_status.do_status_class, '') AS do_status_class
            FROM DR_DO.dbo.tb_do_head AS do
            LEFT JOIN DR_DO.dbo.tb_master_do_status ON tb_master_do_status.do_status_id = do.do_status
            LEFT JOIN DR_DO.dbo.tb_do_item ON tb_do_item.do_number = do.do_number
            WHERE dr_number = dr.dr_number
        ) do
        OUTER APPLY (
            SELECT SUM(do_quantity) AS summary_do_quantity FROM DR_DO.dbo.tb_do_head
            WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        OUTER APPLY (
            SELECT SUM(do_quantity) AS complete_do_quantity FROM DR_DO.dbo.tb_do_head
            WHERE dr_number = dr.dr_number AND do_status > 3 GROUP BY dr_number
        ) do_complete
        OUTER APPLY (
            SELECT
                vehicle_do.vehicle_owner AS vehicle_owner_id,
                vehicle_owner.comp_name AS vehicle_owner,
                vehicle_do.vehicle_licens AS vehicle_licens_id,
                vehicle.vhregno AS vehicle_licens,
                vehicle_do.vehicle_driver AS vehicle_driver_id,
                hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS vehicle_driver_name,
                vehicle_do.vehicle_follower, vehicle_do.vehicle_quantity,
                vehicle_do.vehicle_reject, vehicle_do.vehicle_reject_remark
            FROM DR_DO.dbo.tb_do_vehicle AS vehicle_do
            LEFT JOIN mi.dbo.employeed_car_company AS vehicle_owner ON vehicle_owner.comp_id = vehicle_do.vehicle_owner
            LEFT JOIN mi.dbo.vehicle ON vehicle.owner = vehicle_do.vehicle_owner AND vehicle.id = vehicle_do.vehicle_licens
            LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = vehicle_do.vehicle_driver COLLATE Thai_CI_AS
            WHERE do_number = do.do_number
        ) do_vehicle
        OUTER APPLY (
            SELECT (SUM(vehicle_do.vehicle_quantity) - SUM(vehicle_do.vehicle_reject)) AS summary_job
            FROM DR_DO.dbo.tb_dr_head AS dr
            LEFT JOIN DR_DO.dbo.tb_do_head AS do ON do.dr_number = dr.dr_number
            LEFT JOIN DR_DO.dbo.tb_do_vehicle AS vehicle_do ON vehicle_do.do_number = do.do_number
            WHERE dr.dr_number = dr.dr_number AND do.do_status > 3 
            GROUP BY dr.dr_number
        ) vehicle_sum
        OUTER APPLY (
            SELECT SUM(fg_quantity) AS fg_quantity FROM mi.dbo.mi_fg
            WHERE jobID = dr.job_id GROUP BY jobID
        ) summary_fg
        WHERE ISNULL(do_sum.summary_do_quantity, 0) >= dr.dr_quantity
        AND dr.request_work_type_id = 3
        AND dr.commercial_type = 1
        GROUP BY
            dr.dr_number, dr.delivery_date, dr.delivery_type_id, dr.request_work_type_id,
            dr.dr_quantity, dr.delivery_place, dr.contact_person, dr.contact_number,
            dr.with_invoice, dr.remark, dr.created, dr.job_id, dr.commercial_type,
            do.do_number, do.do_status_id, do.do_status_name, do.do_status_class,
            do.departed, do.arrived, do.item_name, do.item_quantity,
            do.do_quantity, do_sum.summary_do_quantity, do_complete.complete_do_quantity,
            do_vehicle.vehicle_owner_id, do_vehicle.vehicle_owner,
            do_vehicle.vehicle_licens_id, do_vehicle.vehicle_licens,
            do_vehicle.vehicle_driver_id, do_vehicle.vehicle_driver_name,
            do_vehicle.vehicle_follower, do_vehicle.vehicle_quantity,
            do_vehicle.vehicle_reject, do_vehicle.vehicle_reject_remark,
            mi.job_name, summary_fg.fg_quantity, customer.custName,
            hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th,
            tb_master_request_type_work.request_work_type_name,
            tb_master_delivery_type.delivery_type_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

/* -------------------------------- Delivery - Services -------------------------------- */
setJOBQuantityMaterials()
const total_confirm_quantity = [...new Set(
dr.filter((u, j)=> u.job_id === x.job_id && u.commercial_type === 1 && u.delivery_type_id === 1)
    .map(x => x.item_quantity_do)
)]
const vehicle_quantity = dr.filter((u, j)=> (x.dr_number === u.dr_number) && u.do_status_id > 3).map(x => x.vehicle_quantity)
const job_confirm_quantity = (total_confirm_quantity.reduce((p, x) => p + parseInt(x), 0))
if(is_wrap === 1){ // หุ้มปก
    if(partTypeID == 9 || partTypeID == 6){ // Cover/Board
        calculate = ((total_paper - (waste_qty * sig))/ sig) * ups
        //Formula: [[ใบพิมพ์-((พ+รล+P)*ยก)]/ยก]*Ups
    }else{ // อื่นๆ
        calculate = ((total_paper - (waste_qty * sig)) / sig)
        //Formula: [[ใบพิมพ์-((พ+รล+P)*ยก)]/ยก]
    }
}else{ // ไม่หุ้มปก
    if(partTypeID == 9){ // Cover
        calculate = ((total_paper - (waste_qty * sig)) / sig)
        //Formula: [[ใบพิมพ์-((พ+รล+P)*ยก)]/ยก]
    }else if(partTypeID == 6){ // Board
        calculate = ((total_paper - (waste_qty * sig)) / sig) * ups
        //Formula: [[ใบพิมพ์-((พ+รล+P)*ยก)]/ยก]*Ups
    }else{ // อื่นๆ
        calculate = ((total_paper - (waste_qty * sig)) / sig)
        //Formula: [[ใบพิมพ์-((พ+รล+P)*ยก)]/ยก]
    }
}