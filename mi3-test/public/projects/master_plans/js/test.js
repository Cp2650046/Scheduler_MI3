var dragAndDropApp = {
	draggable_id: null,
	dropzone_id: null,
	target: undefined,
    needScrollScript: true,
    reposition: function (div, e) {
		//console.log('e.pageX: '+e.pageX)
        div.css({
			'top': (e.pageY-90)+'px',
			'left': (e.pageX+5)+'px'
        });
		this.pagescroll(e)
    },
	needScrollScriptIsScrolling:{
		x: false,
		y: false,
	},
	pagescroll:function(e){
		var winWidth = $(window).outerWidth(true);
		var winHeight = $(window).outerHeight(true);
		var factor = 10;
		var scrollAmount = 30;
		var intervalTime = 30;
		var direction = {
			x:1,
			y:1,
		};
		var scrollNow = {
			x:false,
			y:false,
		};
		if ( e.clientX + factor >= winWidth ) {
			scrollNow.x = true;
			direction.x = 1;
		}
		else if ( e.clientX <= factor ){
			scrollNow.x = true;
			direction.x = -1;
		}
		else{
			clearInterval(this.needScrollScriptIsScrolling.x);
		}
		if ( e.clientY + factor >= winHeight ) {
			scrollNow.y = true;
			direction.y = 1;
		}
		else if ( e.clientY <= factor  + 120 ){ // + the amount of top position of the table
			scrollNow.y = true;
			direction.y = -1;
		}
		else{
			clearInterval(this.needScrollScriptIsScrolling.y);
		}
		
		// horizontal
		if ( scrollNow.x ) {
			clearInterval(this.needScrollScriptIsScrolling.x);
			this.needScrollScriptIsScrolling.x = setInterval(function(){ 
				$(window).scrollLeft($(window).scrollLeft() + (direction.x * scrollAmount));
			}, intervalTime);
		}
		// vertical
		if ( scrollNow.y ) {
			clearInterval(this.needScrollScriptIsScrolling.y);
			this.needScrollScriptIsScrolling.y = setInterval(function(){ 
				$(window).scrollTop($(window).scrollTop() + (direction.y * scrollAmount));
			}, intervalTime);
		}
	},
	kill_events: function() {
		$(document).off('mousemove.dragging mouseover mouseenter mouseup.drop');
		
		$('body').removeClass('mousemove')
		$(".placehover").remove();
		$(".move_plan").remove();
		clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
		clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
	},
	on_placeholder: function(obj){
		$(".placehover").remove();
		if(obj.find('.draggable:hover').length){
			obj.find('.draggable:hover').after('<div class="placehover">Drop here</div>')
		}else{
			obj.prepend('<div class="placehover">Drop here</div>')
		}
	},
	on_placeholder_by_id: function(obj){
		$(".placehover").remove();
		
		if(dragAndDropApp.draggable_id){
			$("#"+dragAndDropApp.draggable_id).after('<div class="placehover">Drop here</div>')
		}else{
			$("#"+dragAndDropApp.dropzone_id).prepend('<div class="placehover">Drop here</div>')
		}
	}
}

$(function(){
    // numday1 = moment().daysInMonth();
    // numday2 = moment().add(2, 'M').daysInMonth();
    // check_today = moment().format("YYYY-MM-DD");
    // setOptionYear(s_year);
    // searchNavigation();
	// render_table().then(()=>{
		// feed_data()
	// })
	
	// $("body").on("contextmenu", e => e.preventDefault()); /* ถ้าจะใช้ inspect เช็คโค้ด ปิด บรรทัดนี้ก่อน */
	$(document).on("mousedown", ".draggable", function(e){
		
		e.preventDefault();
		$('body').addClass('mousemove')
		if(e.which == 3){
			open_popup_form($(this));
			return;
		}
		
		var clone = $(this).clone()
		dragAndDropApp.target = $(this)
		
		var clone_move = $(this).clone().css({
			'background-color': $(this).css('background-color'),
			'border-radius': $(this).css('border-radius'),
			'box-shadow': $(this).css('box-shadow'),
			'width': $(this).css('width')
		}).addClass('move_plan').prependTo('body');
		dragAndDropApp.target.hide()
		
		dragAndDropApp.reposition(clone_move, e)
		$(document).on("mousemove.dragging", function(e2){
			dragAndDropApp.reposition(clone_move, e2)
		}).on("mouseenter", ".dropzone", function(){
			dragAndDropApp.dropzone_id = $(this).attr('id')
			dragAndDropApp.draggable_id = null
			dragAndDropApp.on_placeholder_by_id()
		}).on("mouseenter", ".dropzone .draggable", function(){
			dragAndDropApp.draggable_id = $(this).attr('id')
			dragAndDropApp.on_placeholder_by_id()
		})/*.on("mouseover", ".dropzone", function(){
			dragAndDropApp.on_placeholder($(this))
		})*/
		.on("mouseup.drop", function(){
			
			if ($('.placehover').next('.draggable').is(dragAndDropApp.target)) {
				dragAndDropApp.target.show()
				dragAndDropApp.kill_events()
				return;
			}
			/* ย้ายแผนไปมา save ข้อมูล test ภาพรวม */
			const conn = confirm('Drop here')
			if(conn){
				dragAndDropApp.target.remove();
				clone.insertAfter('.placehover')
				// console.log('156 :>> ', clone.parents('td'));
				var data = {
					original_id: dragAndDropApp.target.attr('plan_id'),
					original_plan_date: dragAndDropApp.target.attr('plan_date'),
					original_machine_id: dragAndDropApp.target.attr('machine_id'),
					original_shift_id: dragAndDropApp.target.attr('shift'),
					machine_id: clone.parents('td.dropzone').attr('machine_id'),
					shift_id: clone.parents('tr').hasClass('day') ? 1 : 2,
					plan_date: clone.parents('td').attr('plan_date'),
					id: [],
					// saleman_id: userData.emp_id
					saleman_id: 2650046
				}
				clone.parents('td').find('div.draggable,div.draggable-disabled').each(function () {
					data.id.push($(this).attr('plan_id'));
				});
				console.log('data :>> ', data);
				saveMasterPlanDragAndDrop(data);
			}else{
				dragAndDropApp.target.show()
			}
			dragAndDropApp.kill_events()
		})
		
	})
})

function open_popup_form(div){
	//  console.log('div :>> ', div);
	var id = div.attr('plan_id');
	var jobID = div.data('jobid');
	var partName = div.data('partname');
	var itid = div.data('itid');
	var waste = div.data('waste');
	var sig = div.data('sig');
	resetCheckRadio();
	initialPaper(id, jobID, partName, itid, waste, sig);
	$("#modal-paperReadyContainer").modal({ backdrop: "static" });

	 if (div.length > 1) {
		 if (div.hasClass('draggable-disabled')[0]) {
			 $("#save_paper").hide()
			 $("input[type=text],input[type=radio]").prop('disabled', true);
		 } else {
			 $("#save_paper").show()
			 $("input[type=text],input[type=radio]").prop('disabled', false);
		 }
	 } else {
		 if (div.hasClass('draggable-disabled')) {
			 $("#save_paper").hide()
			 $("input[type=text],input[type=radio]").prop('disabled', true);
		 } else {
			 $("#save_paper").show()
			 $("input[type=text],input[type=radio]").prop('disabled', false);
		 }
	 }
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

function okPaper() {
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
            paper_trim_remark: $('#PRC_paperRemark').val() == "" ? null : $('#PRC_paperRemark').val(),
            plan_date: $("#PRC_plan_date").val(),
            machine_id: $("#PRC_machine_id").val()
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
        let qty_po = numeral(parseFloat(this.qty)).format('0,0.00');
        tr.clone()
            .append(td.clone().html(this.po_number))
            .append(td.clone().html(this.item_code))
            .append(td.clone().addClass('text-left').html(this.item_name))
            .append(td.clone().addClass('right').html(qty_po))
            .append(td.clone().html(this.unit_name))
            .append(td.clone().html(this.po_status))
            .appendTo('#PRC_POList tbody')
            ;
    });

    if (r.po_list.length === 0) {
        $("#PRC_POList tbody").html(`<tr><td colspan="6">ไม่พบข้อมูล</td></tr>`)
        $("#PRC_POList thead").css({ 'display': 'none' })
    }

    $.each(r.receive_list, function () {
        tr.clone()
            .append(td.clone().html(this.receive_date))
            .append(td.clone().html(this.item_code))
            .append(td.clone().addClass('text-left').html(this.item_name))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .append(td.clone().html(this.unit_name))
            .appendTo('#PRC_ReceiveList tbody')
            ;
    });

    if (r.receive_list.length === 0) {
        $("#PRC_ReceiveList tbody").html(`<tr><td colspan="5">ไม่พบข้อมูล</td></tr>`)
        $("#PRC_ReceiveList thead").css({ 'display': 'none' })
    }

    var sumBooking = 0;
    $.each(r.booking_list, function () {
        tr.clone()
            .append(td.clone().html(this.book_number))
            .append(td.clone().addClass('text-left').html(this.partNames))
            .append(td.clone().addClass('right').html(numeral(this.qty).format('0,0.00')))
            .appendTo('#PRC_bookList tbody')
            ;
        sumBooking += Number(this.qty);
    });
    $('#PRC_totalBook').html(numeral(sumBooking).format('0,0'));
    if (r.booking_list.length === 0) {
        $("#PRC_bookList tbody").html(`<tr><td colspan="3">ไม่พบข้อมูล</td></tr>`)
        $("#PRC_bookList thead").css({ 'display': 'none' })
        $("#PRC_bookList tfoot").css({ 'display': 'none' })
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

    if (r.fwReceive_list.length === 0) {
        $("#PRC_fwReceiveList tbody").html(`<tr><td colspan="3">ไม่พบข้อมูล</td></tr>`);
        $("#PRC_fwReceiveList thead").css({ 'display': 'none' })
        $("#PRC_fwReceiveList tfoot").css({ 'display': 'none' })

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

    if (r.fw_distribution_list.length === 0) {
        $("#PRC_fwDistributionList tbody").html(`<tr><td colspan="2">ไม่พบข้อมูล</td></tr>`);
        $("#PRC_fwDistributionList thead").css({ 'display': 'none' })
        $("#PRC_fwDistributionList tfoot").css({ 'display': 'none' })
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
            $('#PRC_inkRemark').val(r.rs_plan_list.ink_remark);
        }
        // $('#PRC_inkRemark').val(r.rs_plan_list.ink_remark);
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
    $("#PRC_plan_date").val(r.rs_plan_list.plan_date)
    $("#PRC_machine_id").val(r.rs_plan_list.machine_id)
}

function resetCheckRadio() {
    $('#PRC_paperQty').val('');
    $('#PRC_paperRemark').val('');
    $('#PRC_inkRemark').val('');
    $('input[type=radio]').prop('checked', false);
    $("#PRC_POList tbody").empty();
    $("#PRC_POList thead").css({ 'display': 'contents' })
    $("#PRC_ReceiveList tbody").empty();
    $("#PRC_ReceiveList thead").css({ 'display': 'contents' })
    $("#PRC_bookList tbody").empty();
    $("#PRC_bookList thead").css({ 'display': 'contents' })
    $("#PRC_fwReceiveList tbody").empty();
    $("#PRC_fwReceiveList thead").css({ 'display': 'contents' })
    $("#PRC_fwReceiveList tfoot").css({ 'display': 'contents' })
    $("#PRC_fwDistributionList tbody").empty();
    $("#PRC_fwDistributionList thead").css({ 'display': 'contents' })
    $("#PRC_fwDistributionList tfoot").css({ 'display': 'contents' })
    // $('#PRC_diecutReady').prop('checked', false);
    // $('#PRC_diecutNotReady').prop('checked', false);
    // $('#PRC_paperReady').prop('checked', false);
    // $('#PRC_paperNotReady').prop('checked', false);
}

function preventNonNumericalInput(e) {
    if (e.which < 48 || e.which > 57) {
        e.preventDefault();
    }
}

async function setIconPrint(data_paper) {
    $('div[plan_id="' + data_paper.id + '"]').find('img').remove();
    if (data_paper.is_paper_trim_ready === 1) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_paper').append('<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-blue.png" title="[กระดาษพร้อมพิมพ์]">')
    }
    if (data_paper.is_paper_trim_ready === 0) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_paper').append('<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-blue.png" title="[กระดาษไม่พร้อมพิมพ์]">')
    }
    if (data_paper.is_ink_ready === 1) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_ink').append('<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-gray.png" title="[หมึกพร้อมพิมพ์]">')
    }
    if (data_paper.is_ink_ready === 0) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_ink').append('<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-gray.png" title="[หมึกไม่พร้อมพิมพ์]">')
    }
    if (data_paper.is_diecut_ready === 1) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_diecut').append('<img style="vertical-align:top" src="./projects/master_plans/images/checkmark-red.png" title="[Block die-cut พร้อม]">')
    }
    if (data_paper.is_diecut_ready === 0) {
        $('div[plan_id="' + data_paper.id + '"]').find('span.ready_diecut').append('<img style="vertical-align:top" src="./projects/master_plans/images/x-mark-red.png" title="[Block die-cut ไม่พร้อม]">')
    }
}

async function reloadSection(planDate, machineID) {
    // console.log('280 :>> ', machineID + " >> "+planDate);
    await $(`span.font-total`).html('0');
    getData(planDate, machineID);
    getDataHr(planDate, machineID);
}


/* 
function feed_data(){

	const plans = [
		{	
			plan_id: 2130001,
			plan_date: '2023-11-01',
			machine_id: '3840',
			shift_id: 1
		},
		{	
			plan_id: 2130002,
			plan_date: '2023-11-01',
			machine_id: '3840',
			shift_id: 1
		},
		{	
			plan_id: 2130003,
			plan_date: '2023-11-01',
			machine_id: '3840',
			shift_id: 1
		},
		{	
			plan_id: 2130004,
			plan_date: '2023-11-01',
			machine_id: '5501',
			shift_id: 1
		},
		{	
			plan_id: 2130005,
			plan_date: '2023-11-01',
			machine_id: '5501',
			shift_id: 2
		}
	]
	
	plans.forEach((p)=>{
		let shift_name = 'day'
		if(p.shift_id == 2){
			shift_name = 'night'
		}
		$('.'+shift_name+'_'+p.machine_id+'_'+p.plan_date).append('<div class="draggable" id="'+p.plan_id+'">'+p.plan_id+'</div>')
	})
}
function render_table(){
	
	const search_date = '2023-11-30'
	var start_date = moment(search_date).startOf('month')
	const end_date = moment(moment(start_date).add(1, 'months')).endOf('month')
	
	const data_date = []
	const machines = [
		{
			machine_id: '3840',
			machine_name: 'Test 3840',
		},
		{
			machine_id: '5501',
			machine_name: 'Test 5501',
		},
		{
			machine_id: '5502',
			machine_name: 'Test 5502',
		},
		{
			machine_id: '5503',
			machine_name: 'Test 5503',
		},
		{
			machine_id: '5504',
			machine_name: 'Test 5504',
		},
		{
			machine_id: '5505',
			machine_name: 'Test 5505',
		}
	]

	
	const plan_id = '<div class="draggable">1</div><div class="draggable">2</div><div class="draggable">3</div>'
	

	let tr = ''
	let td = '<td>Machine</td>'
	
	
	while(moment(start_date).isBefore(end_date)){
		data_date.push(start_date.format('YYYY-MM-DD'))
		start_date = moment(start_date).add(1, 'days')
	}
	
	data_date.forEach(item => {
		td += '<td>'+moment(item).format('DD-MM-YYYY')+'</td>'
	})
	
	tr += '<tr>'+td+'</tr>'

	machines.forEach(m => {
		let first_td = '<td rowspan="3" align="center" valign="middle">'+m.machine_id+' '+m.machine_name+'</td>'
		let day_td = ''
		let night_td = ''
		let total_td = ''
		data_date.forEach(plan_date => {
			day_td += '<td class="dropzone day_'+m.machine_id+'_'+plan_date+'" id="day_'+m.machine_id+'_'+plan_date+'"></td>'
			night_td += '<td class="dropzone night_'+m.machine_id+'_'+plan_date+'" id="night_'+m.machine_id+'_'+plan_date+'"></td>'
			total_td += '<td class="'+m.machine_id+'_'+plan_date+'">'+m.machine_id+' total: xx</td>'
		})
		
		tr += '<tr class="day">'+first_td+day_td+'</tr>'
		tr += '<tr class="night">'+night_td+'</tr>'
		tr += '<tr class="total">'+total_td+'</tr>'
	})
	
	
	const table = '<table cellpadding="0" cellspacing="0" id="plan_calendar">'+tr+'</table>'
	
	
	$('#main-area').append(table)
	
	return new Promise((res)=>{
		res(true)
	})
} */