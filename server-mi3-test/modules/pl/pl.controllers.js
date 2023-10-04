const models = require('./pl.models')
// const services = require('./timesheet.services')

const getMultiProcess = async (req) => {
    const res = await models.getMultiProcessModel(req)
    return res
}

const preparePrePallet = async (req) => {
    const res = await models.preparePrePalletModel(req)
    return res
}

const getTimesheetPalletType = async (req) => {
    const res = await models.getTimesheetPalletTypeModel(req)
    return res
}

const insertPrepallet = async (req) => {
    const res = await models.insertPrepalletModel(req)
    return res
}

const getListPrepallet = async (req) =>{
    const res = await models.getListPrepalletModel(req)
    console.log(res)
    return res
}

const deletePallet = async (req) => {
    const res = await models.deletePalletModel(req)
    return res
}

const updatetPalletQtyTimsheet = async (req) => {
    const res = await models.updatetPalletQtyTimsheetModel(req)
    return res
}

const updatetPalletTypePalletTimsheet = async (req) => {
    const res = await models.updatetPalletTypePalletTimsheetModel(req)
    return res
}

const uploadImage = async (req) =>{
    const res = await models.uploadImageModel(req)
    return res
} 

module.exports = {
    preparePrePallet,
    getTimesheetPalletType,
    getMultiProcess,
    insertPrepallet,
    getListPrepallet,
    deletePallet,
    updatetPalletQtyTimsheet,
    updatetPalletTypePalletTimsheet,
    uploadImage
    
}