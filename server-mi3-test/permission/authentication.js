const { isExpired } = require('../modules/user/user.services')

const authentication = (req, res, next)=>{
    if(isExpired(req.headers) === false){
        return res.json({
            success: false, 
            message: 'Not Login'
        })
    }
    console.log('Authened.')
    next()
}

module.exports = {
    authentication
}