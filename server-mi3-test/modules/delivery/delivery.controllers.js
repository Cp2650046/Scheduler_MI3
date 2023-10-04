const mainModels = require('../main/main.models')
const mainServices = require('../main/main.services')
const deliveryModels = require('./delivery.models')
const deliveryServices = require('./delivery.services')

const createDocument = async (req)=>{
    const obj_number = await mainServices.setLastedNumber(req)
    const res = {
        unique_id: await mainModels.getUniqueIdModel(),
        document_number: await mainModels.getLastedNumberModel(obj_number)
    }
    return res
}

/* ---------- Delivery - Master ----------*/
const masterVehicle = async (req)=>{
    const res = await deliveryModels.masterVehicleModel(req)
    return res
}

const masterVehicleEmployee = async (req)=>{
    const res = await deliveryModels.masterVehicleEmployeeModel(req)
    return res
}

// const getRequestWorkType = async (req)=>{
//     const res = await deliveryModels.getRequestWorkTypeModel(req)
//     return res
// }

// const insertRequestWorkType = async (req)=>{
//     const res = await deliveryModels.insertRequestWorkTypeModel(req)
//     return res
// }

/* ---------- Delivery - JOB ----------*/
const getListJob = async (req)=>{
    const res = await deliveryModels.getListJobModel(req)
    return res
}

const saveWrapJOB = async (req)=>{
    const res = await deliveryModels.saveItemJOBModel(req)
    return res
}

/* ---------- Delivery - Datalist ----------*/
const datalistContact = async (req)=>{
    const res = await deliveryModels.datalistContactModel(req)
    return res
}

const datalistAddress = async (req)=>{
    const res = await deliveryModels.datalistAddressModel(req)
    return res
}

/* ---------- Delivery - DR ----------*/
const getListDR = async (req)=>{
    const res = {
        head: await deliveryModels.getDetailJobModel(req),
        detail: await deliveryModels.getDRModel(req)
    }
    return res
}

const getManageDR = async (req)=>{
    const res = {
        head: await deliveryModels.getDetailJobModel(req),
        detail: req.action === 'edit' && (await deliveryModels.getDetailDRModel(req)),
        item: req.action === 'edit' && (await deliveryModels.getDetailDRItemModel(req)),
        edition: await deliveryModels.getFinishGoodsModel(req)
    }
    return res
}

const saveDR = async (req)=>{
    let sendData = { ...req }
    if(req.action === 'create'){
        const document = await createDocument('DR')
        req.dr_number = document.document_number
        sendData = { ...req, unique_id: document.unique_id }
    }
    const res = await deliveryModels.saveDRModel(sendData)
    return res
}

const deleteDR = async (req)=>{
    const res = await deliveryModels.deleteDRModel(req)
    return res
}

const getItemDR = async (req)=>{
    switch (req.request_work_type_id) {
        case '3':
            return await deliveryModels.getMaterialsModel(req)
        default:
            return await deliveryModels.getFinishGoodsModel(req)
    }
}

const getEditionDR = async (req)=>{
    const res = await deliveryModels.getFinishGoodsModel(req)
    return res
}

/* ---------- Delivery - DO ----------*/
const getListDO = async (req)=>{
    switch (req.type_do) {
        case 'request':
            return await getDRRequestDO(req)
        case 'order':
            return await getOderDO(req)
        default:
            return false
    }
}

const getDRRequestDO = async (req)=>{
    let res = []
    const data_dr = await deliveryModels.getDRRequestDOModel(req)
    for(let dr of data_dr){
        const { dr_number, delivery_type_id, commercial_type, dr_quantity, request_work_type_id, summary_do } = dr
        const total_pallet_quantity = await deliveryModels.getTotalPalletRequestModel(dr_number)
        if(delivery_type_id === 1 && commercial_type === 1){
            if(request_work_type_id === 3){
                res.push(dr)
            }
            if(request_work_type_id !== 3){
                if((total_pallet_quantity >= dr_quantity) || (total_pallet_quantity > 0 && summary_do > 0)){
                    const dataRequest = {
                        dr_data: dr,
                        dr_pallet: await deliveryModels.getPalletRequestModel({ dr_number, pallet_type: 'DR'}),
                        do_pallet: await deliveryModels.getPalletRequestModel({ dr_number, pallet_type: 'DO'}),
                    }
                    const data = await deliveryServices.setPalletRequestDO(dataRequest)
                    res.push(...data)
                }
            }
        }else{
            const dataRequest = {
                dr_data: dr,
                dr_item: await deliveryModels.getItemRequestModel({ dr_number, item_type: 'DR'}),
                do_item: await deliveryModels.getItemRequestModel({ dr_number, item_type: 'DO'}),
            }
            const data = await deliveryServices.setItemRequestDO(dataRequest)
            data.forEach(async (item, index) =>{
                if(item.commercial_type === 2){
                    if(await deliveryServices.isDuplicateDR({response: res, dr: item}) > 0){
                        return false
                    }
                }
                res.push(item)
            })
        }
    }
    return res
}

const getOderDO = async (req)=>{
    let res = []
    const data_dr = await deliveryModels.getOrderDOModel(req)
    const job_item = await deliveryServices.setJobItem(data_dr)
    if(req.request_type === 'materials'){
        const job_detail = await deliveryModels.getMaterialsJOBModel(job_item)
        const data = await deliveryServices.setJOBQuantityMaterials({ dr: data_dr, fg: job_detail })
        res.push(...data)
    }
    if(req.request_type === 'finish_goods'){
        const fg_item = await deliveryModels.getFGQuantityModel(job_item)
        const data = await deliveryServices.setJOBQuantityFG({ dr: data_dr, fg: fg_item })
        for(let item of data){
            const { commercial_type, delivery_type_id, do_number } = item
            if(delivery_type_id === 1 && commercial_type === 1){
                res.push({
                    ... item,
                    detail: await deliveryModels.getPalletOrderModel({ do_number: do_number })
                })
            }else{
                res.push(item)
            }
        }
    }
    return res
}

const getManageDO = async (req)=>{
    const { dr_number, do_number, action, request_type } = req
    const resDR = await deliveryModels.getDetailDRModel(req)
    const resCompleteDO = await deliveryModels.getCompleteDoModel(resDR)
    const resVehicle = action === 'view' ? await deliveryModels.getVehicleModel(req) : false
    const resDO = action === 'view' || action === 'edit' ? await deliveryModels.getDetailDOModel(req) : false
    const { commercial_type, delivery_type_id } = resDR
    const resDetail = request_type === 'finish_goods' && commercial_type === 1 && delivery_type_id === 1 ?
        await deliveryModels.getPalletModel({ dr_number, do_number, action }) : 
        await deliveryModels.getDetailDRItemModel({ dr_number, do_number, action })
    const res = {
        dr: resDR,
        do: resDO,
        detail: resDetail,
        vehicle: resVehicle,
        complete_do: resCompleteDO
    }
    return res
}

const saveDO = async (req)=>{
    let sendData = { ...req }
    if(req.action === 'create'){
        const document = await createDocument('DO')
        req.do_number = document.document_number
        sendData = { ...req, unique_id: document.unique_id }
    }
    const res = await deliveryModels.saveDOModel(sendData)
    return res
}

const deleteDO = async (req)=>{
    const res = await deliveryModels.deleteDOModel(req)
    return res
}

const updateDelivery = async (req)=>{
    const res = await deliveryModels.updateDeliveryModel()
    return res
}

/* ---------- Delivery - Pallet ----------*/
const getReturnPallet = async (req)=>{
    const res = await deliveryModels.getReturnPalletModel()
    return res
}

const getDeliveryPallet = async (req)=>{
    const res = await deliveryModels.getDeliveryPalletModel()
    return res
}

const saveReturnPallet = async (req)=>{
    const res = await deliveryModels.saveReturnPalletModel(req)
    return res
}

module.exports = {
    /* ---------- Delivery - Master ----------*/
    masterVehicle, masterVehicleEmployee,
    //getRequestWorkType, //insertRequestWorkType

    /* ---------- Delivery - JOB ----------*/
    getListJob, saveWrapJOB,

    /* ---------- Delivery - Datalist ----------*/
    datalistContact, datalistAddress,

    /* ---------- Delivery - DR ----------*/
    getListDR, getManageDR, saveDR, deleteDR, getItemDR, getEditionDR,

    /* ---------- Delivery - DO ----------*/
    getListDO, getManageDO, saveDO, deleteDO, updateDelivery,

    /* ---------- Delivery - Pallet ----------*/
    getReturnPallet, getDeliveryPallet, saveReturnPallet,
}