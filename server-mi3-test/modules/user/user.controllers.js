const models = require('./user.models')
const services = require('./user.services')

const saveUser = async (req)=>{
    let userData = await models.getUserModel(req)
    if(typeof userData !== 'undefined'){
        const resProject = await models.getProjectModel(userData.emp_id)
        userData = { ...userData,
            project: resProject,
            badge: 16,
            notifications: [
                {
                    "message": "5 new messages",
                    "time": "3 mins"
                },
                {
                    "message": "8 friend requests",
                    "time": "12 hours"
                },
                {
                    "message": "3 new reports",
                    "time": "2 days"
                }
            ]
        }
    }
    return userData
}

const saveProject = async (req)=>{
    const resMenu = await models.getMenuModel(req)
    const menu = await services.setMenu(resMenu)
    const resMaster = await models.getMasterModel(req)
    let master_data = []
    if(resMaster.length > 0){
        for(let item of resMaster){
            master_data.push({
                master_id: item.master_id,
                master_tb_name: item.tb_master_name,
                master_description: item.master_description,
                master_data: await models.getMasterDataModel({
                    project_id: req.project_id,
                    project_db: req.project_db,
                    tb_master_name: item.tb_master_name,
                })
            })
        }
    }
    return { 
        menu: menu, 
        master: master_data 
    }
}

module.exports = {
    saveUser, saveProject
}