$(document).ready(function () {
    $(document).on('mousedown.showPaper', 'div.draggable', function () {
        $(this).addClass('showPaper');
        $(document).on('mouseup.showPaper', function () {
            showPaperReady($('div.showPaper'));
            killEvents();
            resetState();
            $('body,div.draggable').removeClass('cursorGrabbing');
            $('div.draggable.showPaper').removeClass('showPaper');
            $(this).off('mouseup.showPaper mousemove.showPaper');
        }).on('mousemove.showPaper', function () {
            $('div.draggable.showPaper').removeClass('showPaper');
            $(this).off('mouseup.showPaper mousemove.showPaper');
        });
    });
});

async function showPaperReady(div) {
    // console.log('div :>> ', div);
    var id = div.attr('plan_id');
    var jobID = div.data('jobid');
    var partName = div.data('partname');
    var itid = div.data('itid');
    var waste = div.data('waste');
    var sig = div.data('sig');
    // console.log('object :>> ', jobID);
    // console.log('partName :>> ', partName);
    // console.log('itid :>> ', itid);
    // debugger
    await initialPaper(id, jobID, partName, itid, waste, sig);
    await $("#modal-paperReadyContainer").modal({ backdrop: "static" });
}

async function initialPaper(id, jobID, partName, itid, waste, sig) {
    $("[name=is_diecutReady]").on("change", function () {
        var value_is_diecutReady = $(this).val();
        if (value_is_diecutReady == 0) {
            $("#PRC_diecut_number").val('')
        }
        if (value_is_diecutReady == 1) {
            $("#PRC_diecutRemark").val('')
        }
    })

    $('#PRC_id').html(id);
    $('#PRC_jobID').html(jobID);
    $('.PRC_partName').html(partName);
    $('.PRC_planQty').html(waste);
    $('.PRC_planSig').html(sig);
    await getPaperInfo(id, jobID, itid);
}

async function okPaper() {
    /*  if (login_emp_id == "") {
         alert('ไม่สามารถบันทึกข้อมูลได้ กรุณา Login ก่อนใช้งาน');
         return false;
     } */
    let is_ink_ready = null
    let is_paper_trim_ready = null
    let is_diecut_ready = null
    if ($('#PRC_inkReady').prop('checked')) {
        is_ink_ready = 1
    } else if ($('#PRC_inkNotReady').prop('checked')) {
        is_ink_ready = 0
    }
    if ($('#PRC_paperReady').prop('checked')) {
        is_paper_trim_ready = 1
    } else if ($('#PRC_paperNotReady').prop('checked')) {
        is_paper_trim_ready = 0
    }
    if ($('#PRC_diecutReady').prop('checked')) {
        is_diecut_ready = 1
    } else if ($('#PRC_diecutNotReady').prop('checked')) {
        is_diecut_ready = 0
    }
    if (is_ink_ready != null || is_paper_trim_ready != null || is_diecut_ready != null) {
        const userData = JSON.parse(localStorage.getItem('userData'))
        console.log('is_ink_ready :>> ', is_ink_ready);
        console.log('is_paper_trim_ready :>> ', is_paper_trim_ready);
        console.log('is_diecut_ready :>> ', is_diecut_ready);

        var data = {
            login_emp_id: userData.emp_id,
            id: $('#PRC_id').html(),
            is_ink_ready,
            ink_remark: $('#PRC_inkRemark').val() == "" ? null : $('#PRC_inkRemark').val(),
            is_diecut_ready,
            diecut_remark: $('#PRC_diecutRemark').val() == "" ? null : $('#PRC_diecutRemark').val(),
            diecut_number: $('#PRC_diecut_number').val() == "" ? null : $('#PRC_diecut_number').val(),
            is_paper_trim_ready,
            paper_trim_qty: $('#PRC_paperQty').val() == "" ? null : $('#PRC_paperQty').val(),
            paper_trim_remark: $('#PRC_paperRemark').val() == "" ? null : $('#PRC_paperRemark').val()
        }
        setPaperAndInkReady(data);
    } else {
        console.log('nothing change about ink ready')
    }
}

function setPaperInfo(r) {
    var tr = $('<tr></tr>');
    var td = $('<td></td>');
    resetCheckRadio();

    $.each(r.po_list, function () {
        let qty_po =  numeral(parseFloat(this.qty)).format('0,0.00');
        tr.clone()
            .append(td.clone().html(this.po_number))
            .append(td.clone().html(this.item_code))
            .append(td.clone().html(this.item_name))
            .append(td.clone().addClass('right').html(qty_po))
            .append(td.clone().html(this.unit_name))
            .append(td.clone().html(this.po_status))
            .appendTo('#PRC_POList tbody')
            ;
    });

    if(r.po_list.length === 0){
        $("#PRC_POList tbody").html(`<tr><td colspan="6">ไม่พบข้อมูล</td></tr>`)
    }

   $.each(r.receive_list, function () {
        tr.clone()
            .append(td.clone().html(this.receive_date))
            .append(td.clone().html(this.item_code))
            .append(td.clone().html(this.item_name))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .append(td.clone().html(this.unit_name))
            .appendTo('#PRC_ReceiveList tbody')
            ;
    });

    if(r.receive_list.length === 0){
        $("#PRC_ReceiveList tbody").html(`<tr><td colspan="5">ไม่พบข้อมูล</td></tr>`)
    }

    var sumBooking = 0;
    $.each(r.booking_list, function () {
        tr.clone()
            .append(td.clone().html(this.book_number))
            .append(td.clone().html(this.partNames))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .appendTo('#PRC_bookList tbody')
            ;
        sumBooking += Number(this.qty);
    });
    $('#PRC_totalBook').html(numeral(sumBooking).format('0,0'));
    if(r.booking_list.length === 0){
        $("#PRC_bookList tbody").html(`<tr><td colspan="3">ไม่พบข้อมูล</td></tr>`)
    }

    var sumFWReceive = 0
    $.each(r.fwReceive_list, function () {
        tr.clone()
            .append(td.clone().html(this.book_number))
            .append(td.clone().html(this.docDate))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .appendTo('#PRC_fwReceiveList tbody')
            ;
        sumFWReceive += Number(this.qty);
    });
    $('.PRC_totalFWReceive').html(numeral(sumFWReceive).format('0, 0'));

    if(r.fwReceive_list.length === 0){
        $("#PRC_fwReceiveList tbody").html(`<tr><td colspan="3">ไม่พบข้อมูล</td></tr>`)
    }

    var sumFWDistribution = 0
    $.each(r.fw_distribution_list, function () {
        tr.clone()
            .append(td.clone().html(this.receive_date))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .appendTo('#PRC_fwDistributionList tbody')
            ;
        sumFWDistribution += Number(this.qty);
    });
    $('.PRC_totalFWDistribution').html(numeral(sumFWDistribution).format('0, 0'));

    if(r.fw_distribution_list.length === 0){
        $("#PRC_fwDistributionList tbody").html(`<tr><td colspan="2">ไม่พบข้อมูล</td></tr>`)
    }

    if (r.part_wi_list.length > 0) {
        $('#PRC_totalPaperPart').html(numeral(r.part_wi_list[0].totSPaper1).format('0, 0'));
    }
    if (r.involved_part_wi_list.length > 0) {
        $('#PRC_totalPaperInvolvedPart').html(numeral(r.involved_part_wi_list[0].wi).format('0, 0'));
    }
    if (r.rs_plan_list.is_ink_ready != null) {
        if (r.rs_plan_list.is_ink_ready == 1) {
            $('#PRC_inkReady').prop('checked', true);
        } else if (r.rs_plan_list.is_ink_ready == 0) {
            $('#PRC_inkNotReady').prop('checked', true);
        }

        $('#PRC_inkRemark').val(r.rs_plan_list.ink_remark);
    }

    if (r.rs_plan_list.is_diecut_ready != null) {
        if (r.rs_plan_list.is_diecut_ready == 1) {
            $('#PRC_diecutReady').prop('checked', true);
            $('#PRC_diecut_number').val(r.rs_plan_list.diecut_number);
            $('#PRC_diecutRemark').val('');
        } else if (r.rs_plan_list.is_diecut_ready == 0) {
            $('#PRC_diecutNotReady').prop('checked', true);
            $('#PRC_diecut_number').val('');
            $('#PRC_diecutRemark').val(r.diecut_remark);
        }
    }
    if (r.rs_plan_list.is_paper_trim_ready != null) {
        if (r.rs_plan_list.is_paper_trim_ready == 1) {
            $('#PRC_paperReady').prop('checked', true);
            $('#PRC_paperQty').val(r.rs_plan_list.paper_trim_qty);
        } else if (r.rs_plan_list.is_paper_trim_ready == 0) {
            $('#PRC_paperNotReady').prop('checked', true);
        }
        $('#PRC_paperRemark').val(r.rs_plan_list.paper_trim_remark);
    }

    if (r.rs_plan_list.type_id == 10) {
        $("#die_cut").show();
    } else {
        $("#die_cut").hide();
    }
    if (r.rs_plan_list.update_by != "" && r.rs_plan_list.update_by != null) {
        console.log('แก้ไขล่าสุด :>> ', $('div#updated-plan'));
        $('div#updated-plan').html(`<span>แก้ไขล่าสุดโดย ${r.rs_plan_list.emp_name} (${r.rs_plan_list.updatedAt})</span>`);
    }
}

function resetCheckRadio(){
    $('#PRC_paperQty').val('');
    $('#PRC_paperRemark').val('');
    $('#PRC_inkRemark').val('');
    $('#PRC_diecutReady').prop('checked', false);
    $('#PRC_diecutNotReady').prop('checked', false);
    $('#PRC_paperReady').prop('checked', false);
    $('#PRC_paperNotReady').prop('checked', false);
}

function preventNonNumericalInput(e){
    if (e.which < 48 || e.which > 57) {
        e.preventDefault();
    }
}

