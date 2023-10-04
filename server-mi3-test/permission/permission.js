const connection = require('../config/connection')

const permission = (req, res, next)=>{
    if(!true){
        return res.json({
            success: false, 
            message: 'Not allowed.'
        })
    }
    next()
}

// user permisson from db
const userActionPermission = [false, true, true]

const isInsertPermission = ()=>{
    return userActionPermission[0];
}

const isUpdatePermission = ()=>{
    return userActionPermission[1];
}

const isDeletePermission = ()=>{
    return userActionPermission[2];
}

module.exports = {
    permission, isInsertPermission, isUpdatePermission, isDeletePermission
}