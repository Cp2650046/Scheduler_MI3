const models = require('./user.models')

const isExpired = async (req)=>{
    const { user_account, authen } = req
    if(authen !== 'login'){
        if(user_account == "" || user_account === undefined){
            return false
        }
    }
    return true
}

const setUser = async (req)=>{
    return {
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

const setMenu = async (req)=>{
    let menu = []
    const menu_st = req.filter((item)=> item.menu_parent === 0)
    menu_st.forEach((parent) => {
        const menu_nd = req.filter((item)=> item.menu_parent === parent.menu_id)
        if(menu_nd.length > 0){
            let child_array = []
            menu_nd.forEach((child) => {
                child_array.push({
                    id: child.menu_id,
                    title: child.menu_name,
                    link: child.menu_link,
                    description: child.menu_description
                })
            })
            menu.push({
                id: parent.menu_id, 
                title: parent.menu_name,
                link: child_array
            })
        }else{
            menu.push({
                id: parent.menu_id, 
                title: parent.menu_name,
                link: parent.menu_link,
                icon: parent.menu_icon,
                description: parent.menu_description
            })
        }
    })
    return menu
}

module.exports = {
    isExpired, 
    setUser, setMenu
}