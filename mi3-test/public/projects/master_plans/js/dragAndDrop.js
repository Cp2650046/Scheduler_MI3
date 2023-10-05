/* created by Rumm 2014-04-23 */
var dragAndDropApp = {
	enableMoveAllThoseBehind: false,
	mouseDivCSS: {
		'height': 20,
		'width': 180,
	},
	reposition: function (div, e) {
		div.css({
			'left': (e.clientX - 40) + 'px',
			'top': (e.clientY + 25) + 'px',
		});
		return this;
	},
	target: undefined,
	setVirtualDrop: function (element) {
		$('#virtualDrop').remove();
		var virtualDrop = $('<div id="virtualDrop" class="highlight">Drop here</div>');
		if (element.is($('td'))) {
			virtualDrop.prependTo(element);
		}
		else {
			virtualDrop.insertAfter(element);
		}
		return this;
	},
	displayStatus: function (text) {
		if ($('div.dragAndDropStatusMessage').length == 0) {
			$('<div>' + text + '</div>').addClass('dragAndDropStatusMessage').appendTo('body');
		}
		else {
			$('div.dragAndDropStatusMessage').html(text).stop(true, true).show();
		}
		clearTimeout(this.displayStatusTimeout);
		this.displayStatusTimeout = setTimeout(function () {
			$('div.dragAndDropStatusMessage').fadeOut(2000);
		}, 20000);
		return this;
	},
	displayStatusTimeout: undefined,
	reloadSection: function (planDate, machineID) {
		fnc_getdata(planDate, machineID);
		$('span.' + planDate + '.' + machineID).html('0:00');
		fnc_gethr(planDate, machineID);
		return this;
	},
	drop: function () {
		if (!$('#virtualDrop').next('div.draggable').is(dragAndDropApp.target) && $('#virtualDrop').length == 1) { // does not drop at the same place
			dragAndDropApp.killEvents();
			var confirmation = $.responder({
				type: 'prompt',
				message: 'Are you sure you want to drop here?<br>' + (
					$('#virtualDrop').parents('td.dropZone').attr('plan_date') != dragAndDropApp.target.parents('td.dropZone').attr('plan_date') && dragAndDropApp.enableMoveAllThoseBehind ?
						'<input type="checkbox" id="dragAndDrop_moveAllThoseBehind" /><label for="dragAndDrop_moveAllThoseBehind">ย้ายขั้นตอนด้านหลังทั้งหมด</label>'
						: '')
				,
				height: '100px',
				top: '150px',
				ok: function () {
					confirmation.responder('toggleBlockLayer');
					dragAndDropApp.target.insertAfter($('#virtualDrop'));
					dragAndDropApp.save($('#dragAndDrop_moveAllThoseBehind').is(':checked'));
				},
				cancel: function () {
					dragAndDropApp.resetState();
				},
			});
		}
		else {
			dragAndDropApp.killEvents().resetState();
		}
		$('body,div.draggable').removeClass('cursorGrabbing');
		return this;
	},
	save: function (moveAllThoseBehind, moveNow) {
		var ajaxURL = 'masterPlanDragAndDropDataManager.php';
		var data = {
			originalID: this.target.attr('plan_id'),
			originalPlanDate: this.target.attr('plan_date'),
			originalMachineID: this.target.attr('machine_id'),
			originalShiftID: this.target.attr('shift'),
			machineID: this.target.parents('td.dropZone').attr('machine_id'),
			shiftID: this.target.parents('td.dropZone').hasClass('day') ? 1 : 2,
			planDate: this.target.parents('td.dropZone').attr('plan_date'),
			id: new Array(),
		};
		this.target.parents('td.dropZone').find('div.draggable').each(function () {
			data.id.push($(this).attr('plan_id'));
		});
		if (moveAllThoseBehind) {
			$.extend(data, {
				action: 'saveMasterPlanDragAndDrop_moveAllThoseBehind',
				moveNow: typeof moveNow != "undefined" ? (moveNow ? 1 : 0) : 0,
			});
			dragAndDropApp.loadingLayer(false).displayStatus("Loading...");
			$.ajax({
				url: ajaxURL,
				async: false,
				type: "POST",
				data: data,
				dataType: "json",
				success: function (r) {
					// confirmation
					if (typeof r.status != "undefined" && r.status == 'success') {
						if (typeof r.moveList[0] != "undefined" && r.moveList[0].id == 0) { // invalid return from stored proc
							dragAndDropApp.displayStatus("ERROR - " + r.moveList[0].detail);
							dragAndDropApp.reloadSection(data.planDate, data.machineID);
							if (data.planDate != data.originalPlanDate || data.machineID != data.originalMachineID) { // if machine or date is differrent, reload the original box
								dragAndDropApp.reloadSection(data.originalPlanDate, data.originalMachineID);
							}
							dragAndDropApp.resetState();
						}
						else if (!moveNow) {
							dragAndDropApp.displayStatus("Please comfirm.");
							var moveList = dragAndDropApp.createMoveListTable(r.moveList);
							$.responder({
								message: moveList,
								type: 'prompt',
								height: '300px',
								width: '600px',
								ok: function () {
									dragAndDropApp.save(true, true);
								},
								cancel: function () {
									dragAndDropApp.reloadSection(data.planDate, data.machineID);
									if (data.planDate != data.originalPlanDate || data.machineID != data.originalMachineID) { // if machine or date is differrent, reload the original box
										dragAndDropApp.reloadSection(data.originalPlanDate, data.originalMachineID);
									}
									dragAndDropApp.resetState();
								},
							});
						}
						else {
							dragAndDropApp.displayStatus("Success.");
							dragAndDropApp.loadingLayer(true);
							// reload the whole page
							window.location.href = window.location.href;
						}
					}
					else {
						dragAndDropApp.displayStatus("ERROR - " + r.status);
						dragAndDropApp.reloadSection(data.planDate, data.machineID);
						if (data.planDate != data.originalPlanDate || data.machineID != data.originalMachineID) { // if machine or date is differrent, reload the original box
							dragAndDropApp.reloadSection(data.originalPlanDate, data.originalMachineID);
						}
						dragAndDropApp.resetState();
					}
				},
				error: function (a, b) {
					console.error(a, b);
					dragAndDropApp.displayStatus(b.toUpperCase() + ' - ' + a.statusText);
					dragAndDropApp.reloadSection(data.planDate, data.machineID);
					if (data.planDate != data.originalPlanDate || data.machineID != data.originalMachineID) { // if machine or date is differrent, reload the original box
						dragAndDropApp.reloadSection(data.originalPlanDate, data.originalMachineID);
					}
					dragAndDropApp.resetState();
				},
				complete: function () {
				},
			});
		}
		else {
			$.extend(data, {
				action: 'saveMasterPlanDragAndDrop',
			});
			dragAndDropApp.loadingLayer(false).displayStatus("Loading...");
			$.ajax({
				url: ajaxURL,
				async: false,
				type: "POST",
				data: data,
				success: function (r) {
					if (r == 'success') {
						dragAndDropApp.displayStatus("Success");
					}
					else {
						dragAndDropApp.displayStatus("ERROR - " + r);
					}
				},
				error: function (a, b) {
					console.error(a, b);
					dragAndDropApp.displayStatus(b.toUpperCase() + ' - ' + a.statusText);
				},
				complete: function () {
					dragAndDropApp.reloadSection(data.planDate, data.machineID);
					if (data.planDate != data.originalPlanDate || data.machineID != data.originalMachineID) { // if machine or date is differrent, reload the original box
						dragAndDropApp.reloadSection(data.originalPlanDate, data.originalMachineID);
					}
					dragAndDropApp.loadingLayer(false);
				},
			});
			dragAndDropApp.resetState();
		}
		return this;
	},
	killEvents: function () {
		$(document).off('mousemove.dragging  mouseover.shiftContainer mouseover.divDraggable mouseup.drop mousemove.scroll');
		return this;
	},
	resetState: function () {
		dragAndDropApp.target.css({ 'display': 'block' });
		$('div.mouseDiv,#virtualDrop').remove();
		clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
		clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
		dragAndDropApp.target = undefined;
		$('div.highlight').removeClass('highlight');
		return this;
	},
	loadingLayer: function (visible) {
		if (visible) {
			$('div.dragAndDropLoadingLayer').show();
		}
		else {
			$('div.dragAndDropLoadingLayer').hide();
		}
		return this;
	},
	createMoveListTable: function (moveList) {
		var result = $('<div></div>');
		var table = $('<table id="moveList"></table>');
		var tr = $('<tr></tr>');
		var td = $('<td></td>');
		result.append('<h3>กรุณายืนยันรายการย้ายแผนทั้งหมด</h3>');
		table.append(tr.clone().addClass('head')
			.append(td.clone().append('Machine'))
			.append(td.clone().append('Part Name'))
			.append(td.clone().append('Detail'))
			.append(td.clone().append('From date'))
			.append(td.clone().append('To date'))
		);
		$.each(moveList, function (data) {
			table.append(tr.clone()
				.append(td.clone().append(this.machine_id + ' ' + this.machine_name))
				.append(td.clone().append(this.partName))
				.append(td.clone().append(this.detail))
				.append(td.clone().append(this.plan_date))
				.append(td.clone().append(this.plan_date_change))
			);
		});
		result.append(table);
		return result;
	},
	init: function () {
		// check various stuff before applying the feature
		// if ( !authen_login ) {
		// 	dragAndDropApp.displayStatus("Please login to use Drag and Drop feature.");
		// 	return false;
		// }
		// else if ( !authen_scheduler ) {
		// 	dragAndDropApp.displayStatus("You don't have the permission to use Drag and Drop feature!");
		// 	return false;
		// }
		// if (  ! navigator.userAgent.match(/firefox/i) ){
		// 	dragAndDropApp.displayStatus("Please use Firefox to enable Drag and Drop feature!");
		// 	return false;
		// }

		$('head').append('<style>div.mouseDiv{ width:' + dragAndDropApp.mouseDivCSS.width + 'px; height:' + dragAndDropApp.mouseDivCSS.height + 'px; }</style>');
		dragAndDropApp.loadingLayer(true);
		$(document).on('mousedown', 'div.draggable', function (e) {
			if (e.which == 1) { // left click
				$('body,div.draggable').addClass('cursorGrabbing');
				$(this).css({ 'display': 'none' });
				dragAndDropApp.target = $(this);
				var div = $('<div></div>').append($(this).html()).css({
					'background-color': $(this).css('background-color'),
					'font': '13px tahoma',
				}).addClass('mouseDiv').prependTo('body');
				dragAndDropApp.reposition(div, e);
				if (dragAndDropApp.needScrollScript) {
					dragAndDropApp.scrollScript();
				}
				// events
				$(document).on('mousemove.dragging', function (e2) {
					dragAndDropApp.reposition(div, e2);
				}).on('mouseover.shiftContainer', 'td.day, td.night', function () {
					if ($('div.draggable:hover, #virtualDrop:hover').length == 0) {
						dragAndDropApp.setVirtualDrop($(this));
					}
				}).on('mouseover.divDraggable', 'div.draggable', function () {
					dragAndDropApp.setVirtualDrop($(this));
				}).on('mouseup.drop', function () {
					dragAndDropApp.drop();
				});
			}
		}).on('mouseover.dragAndDropStatusMessage', 'div.dragAndDropStatusMessage', function () {
			$(this).css({
				'left': $(this).css('right'),
				'right': $(this).css('left'),
			});
		});
		// because firefox won't scroll while dragging, so we do this
		// check firefox
		if (navigator.userAgent.match(/firefox/i)) {
			dragAndDropApp.needScrollScript = true;
		}
		dragAndDropApp.loadingLayer(false);
	},
	needScrollScript: false,
	needScrollScriptIsScrolling: {
		x: false,
		y: false,
	},
	scrollScript: function () {
		$(document).on('mousemove.scroll', function (eScroll) {
			var winWidth = Number($(window).outerWidth(true));
			var winHeight = Number($(window).outerHeight(true));
			var factor = 10;
			var scrollAmount = 30;
			var intervalTime = 50;
			var direction = { // minus means backward
				x: 1,
				y: 1,
			};
			var scrollNow = {
				x: false,
				y: false,
			};
			if (eScroll.clientX + factor >= winWidth) {
				scrollNow.x = true;
				direction.x = 1;
			}
			else if (eScroll.clientX <= factor) {
				scrollNow.x = true;
				direction.x = -1;
			}
			else {
				clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
			}
			if (eScroll.clientY + factor >= winHeight) {
				scrollNow.y = true;
				direction.y = 1;
			}
			else if (eScroll.clientY <= factor + parseFloat($('#fixtb').css('top')) + $('#headVisibility').outerHeight(true)) { // + the amount of top position of the table
				scrollNow.y = true;
				direction.y = -1;
			}
			else {
				clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
			}

			// horizontal
			if (scrollNow.x) {
				clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
				dragAndDropApp.needScrollScriptIsScrolling.x = setInterval(function () {
					$(window).scrollLeft($(window).scrollLeft() + (direction.x * scrollAmount));
				}, intervalTime);
			}
			// vertical
			if (scrollNow.y) {
				clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
				dragAndDropApp.needScrollScriptIsScrolling.y = setInterval(function () {
					$(window).scrollTop($(window).scrollTop() + (direction.y * scrollAmount));
				}, intervalTime);
			}
		});
	},
};
$(document).ready(function () {
	dragAndDropApp.init();
});

function preventNonNumericalInput(e) {
	e = e || window.event;
	var charCode = (typeof e.which == "undefined") ? e.keyCode : e.which;
	var charStr = String.fromCharCode(charCode);

	if (!charStr.match(/^[0-9]+$/))
		e.preventDefault();
}