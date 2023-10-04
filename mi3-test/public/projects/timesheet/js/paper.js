$(function(){

    let ex_height = localStorage.getItem("ex_height")
    let ex_qty = localStorage.getItem("ex_qty")

    if(!ex_qty){
        $("#ex_qty").val(100);
    }else{
        $("#ex_qty").val(ex_qty);
    }

    if(ex_height){
        $("#ex_height").val(ex_height);
        $("#height").focus()
    }else if(!ex_qty){
        $("#ex_qty").focus()
    }else{
        $("#ex_height").focus()
    }

    $("#ex_qty").on("keyup",(e)=>{
        // console.log($("#ex_height").find(".lable_start"))
        $("#text_height").text(`ความสูงกระดาษ ${$(e.target).val()} แผ่น`)
        // $("#text_height").find(".lable_start").text(`ความสูงกระดาษ ${$(e.target).val()} แผ่น`)
    })

    $("#ex_qty").on("keypress",(e)=>{
        let key = e.which || e.keyCode
        if(key == 13) $("#ex_height").select()
    })

    $("#ex_height").on("keypress",(e)=>{
        let key = e.which || e.keyCode
        if(key == 13) $("#height").select()
    })

    $("#height").on("keypress",(e)=>{
        let key = e.which || e.keyCode
        if(key == 13){
            let qty = cal_qty_result()
            $("#qty_pallet").val(qty)
        }
    })

    $(".cal").on("keyup",(e)=>{
        let qty = cal_qty_result()
        // console.log(qty)
        $("#qty_pallet").val(qty)
    })

    $("#cancel_cal_paper").on("click",()=>{
        $(".cal").each((index,item)=>{
            $(item).val('')
            $(item).removeClass("has_value")
        })
        $("#ex_qty").val(100);
        $("#qty_pallet").val('');
        $("#ex_height").focus()
        $("div#modal-pre-pallet").removeClass("background-backdrop")
    })

    $("#save_cal_paper").on("click",()=>{
        let qty = $("#qty_pallet").val()
        // console.log(qty)
        $("#pre_pallet_qty").val(qty)
        $("div#modal-pre-pallet").removeClass("background-backdrop")
        $("#modal-cal-paper").modal('hide');
    })

    $(".number").on("keypress",(e)=>{
        let key = e.which || e.keyCode
        if(((key) > 47 && (key) < 58) || (key) == 46){
            return true
        }
        else{
            return false
        }
    })
})

function change_format(number){
    let new_format = parseFloat(number)
    return new_format = new_format.toLocaleString()
}

function cal_qty_result(){
    let ex_height = parseFloat($("#ex_height").val())
    let ex_qty = parseFloat($("#ex_qty").val())
    let height = parseFloat($("#height").val())
    let rs_qty = (ex_qty/ex_height)*height
    console.log(rs_qty)
    
    if(ex_height && height){
        localStorage.setItem("ex_height", ex_height);
        localStorage.setItem("ex_qty", ex_qty);
        qty = change_format(rs_qty)
        return qty
    }
    return 0
}