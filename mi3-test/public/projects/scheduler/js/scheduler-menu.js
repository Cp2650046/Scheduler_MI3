$(document).ready(async function () {
    const userData = JSON.parse(localStorage.getItem('userData'))
    if (userData != null) {
        console.log(1);
        await getMenu(userData.emp_id);
    }
})

async function buildMenu(menuList) {
    // console.log(menuList);
    let div = $('div.menu_list');
    let cardParent = ``;
    // skip this menu
    let menuDisableArray = [59]
    menuList.forEach((element) => {
        // console.log('menu id = ', element.menuID);
        let cardChild = ``;
        let menuDisable = ``;
        if (element.menuID !== 9) {
            menuDisable = `menu_disable`
        }
        element.menuMachineTypeList.forEach((machineType) => {
            // console.log(machineType);
            let textMenuDisable = ``;
            let onclickFuncStr = ``;
            if (element.menuID === 9) {
                if (menuDisableArray.includes(machineType.menu_id)) {
                    menuDisable = `menu_disable`
                } else {
                    menuDisable = ``
                }
            }

            if (menuDisable !== "") {
                textMenuDisable = `<div class="text_unavailable">Unavailable</div>`;
            } else {
                onclickFuncStr = ` onclick="schedulerOpenLink(${machineType.menu_id})" `;
            }

            cardChild += `<div class="card card_menu_sub ${menuDisable} m-2" ${onclickFuncStr}>
                            <div class="card-body ${machineType.menu_class}">
                                <img src="../projects/scheduler/images/${machineType.menu_icon}" alt="${machineType.menu_name}">
                                ${textMenuDisable}
                            </div>
                            <div class="card-footer menu_sub_name">
                                ${machineType.menu_name}
                            </div>
                        </div>`

        })

        cardParent += ` <div class="card card_menu mr-3">
                                <div class="card-header menu_name">
                                    ${element.menuName}
                                </div>
                                <div class="card-body d-flex flex-wrap">
                                    ${cardChild}
                                </div>
                            </div>`;
    });

    div.append(cardParent);
}

async function schedulerOpenLink(id) {
    window.location.href = `/scheduler/${id}`;
}