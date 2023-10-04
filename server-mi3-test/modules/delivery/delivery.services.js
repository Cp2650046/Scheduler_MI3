const isDuplicateDR = async (req)=>{
    const { response, dr } = req
    let item_length = 0
    if(response.length > 0){
        item_length = response.filter((u, j)=> u.dr_number === dr.dr_number).length
    }
    return item_length
}

const setJobItem = async (req)=>{
    return `'${[...new Set(req.map(x => x.job_id))].join("','")}'`
}

const setPalletRequestDO = async (req)=>{
    const { dr_data, dr_pallet, do_pallet } = req, data = []
    dr_pallet.length > 0 && (data.push({ ... dr_data, do_number: '', do_quantity: '', detail: dr_pallet }))
    const do_number = [...new Set(do_pallet.map(x => x.do_number))]
    do_number.forEach((do_item, index)=>{
        const pallet = do_pallet.filter((x, i)=> x.do_number === do_item)
        total_quantity = pallet.reduce((p, x) => p + parseInt(x.pallet_quantity), 0)
        data.push({ ...dr_data, do_number: do_item, do_quantity: total_quantity, detail: pallet })
    })
    return data
}

const setItemRequestDO = async (req)=>{
    const { dr_data, dr_item, do_item } = req
    const data = [{ ... dr_data, do_number: '', do_quantity: '', detail: dr_item }]
    const do_number = [...new Set(do_item.map(x => x.do_number))]
    do_number.forEach((x, index)=>{
        const item = do_item.filter((x, i)=> x.do_number === x)
        total_quantity = item.reduce((p, x) => p + parseInt(x.item_quantity), 0)
        data.push({ ...dr_data, do_number: x, do_quantity: total_quantity, detail: item })
    })
    return data
}

const setJOBQuantityFG = async (req)=>{
    const data = [], { dr, fg } = req
    dr.forEach((x, i)=>{
        const fg_index = fg.findIndex(f => f.job_id === x.job_id)
        const total_confirm_quantity = [...new Set(
          dr.filter((u, j)=> u.job_id === x.job_id && u.commercial_type === 1 && u.delivery_type_id === 1)
            .map(x => x.vehicle_confirm_quantity)
        )]
        const total_return_quantity = [...new Set(
          dr.filter((u, j)=> u.job_id === x.job_id && u.commercial_type === 1 && u.delivery_type_id === 2)
            .map(x => x.vehicle_confirm_quantity)
        )]
        const vehicle_quantity = dr.filter((u, j)=> (x.dr_number === u.dr_number) && u.do_status_id > 3).map(x => x.vehicle_quantity)
        const dr_quantity_remain = x.dr_quantity - (vehicle_quantity.reduce((p, x) => p + parseInt(x), 0))
        const job_confirm_quantity = (total_confirm_quantity.reduce((p, x) => p + parseInt(x), 0)) - total_return_quantity
        dr[i]['dr_quanity_remain'] = dr_quantity_remain
        dr[i]['fg_quantity'] = fg[fg_index]['fg_quantity']
        dr[i]['job_confirm_quantity'] = job_confirm_quantity
        data.push(dr[i])
    })
    return data
}

const setJOBQuantityMaterials = async (req)=>{
    const data = [], { dr, fg } = req
    dr.forEach((x, i)=>{
        let fg_quantity = 0
        const item = fg.filter((u, j)=> u.itid === x.itid)[0]
        if(typeof item !== 'undefined'){
            const { is_wrap, itid, partTypeID, ups, sig, qty_per_sig, total_paper, waste_press_qty, waste_afterpress_qty, waste_popup_qty } = item
            const waste_qty = (waste_press_qty + waste_afterpress_qty + waste_popup_qty)
            const calculate_ups = is_wrap === 1 ? partTypeID == 9 || partTypeID == 6 ? ups : 1 : partTypeID == 6 ? ups : 1
            fg_quantity = ((total_paper - (waste_qty * sig)) / sig) * calculate_ups
        }
        dr[i]['dr_quanity_remain'] = x.item_quantity_dr - (x.do_status_id > 3 ? x.item_quantity_do : 0)
        dr[i]['fg_quantity'] = fg_quantity
        dr[i]['job_confirm_quantity'] = x.do_status_id > 3 ? x.item_quantity_do : 0
        data.push(dr[i])
    })
    return data
}

module.exports = {
    isDuplicateDR, setJobItem, setPalletRequestDO, setItemRequestDO, setJOBQuantityFG, setJOBQuantityMaterials
}