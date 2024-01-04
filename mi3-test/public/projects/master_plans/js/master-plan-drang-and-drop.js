var dragAndDropApp = {
    target: undefined,
    needScrollScript: false,
    reposition: function (div, e) {
        div.css({
            'left': (e.clientX) + 'px',
            'top': (e.clientY) + 'px',
        });
    },
}
async function init() {
    console.log('init')
    $(document).on('mousedown', 'div.draggable', async function (e) {
        // console.log('คลิก 1 ครั้ง :>> ');
        e.preventDefault();
        if (e.which == 1) { // left click
            // console.log('checkTimesheet :>> ', $(this).attr('plan_id'));
            let has_timesheet = 0;
            await hasTimeSheet($(this).attr('plan_id')).then((value) => {
                has_timesheet = value;
                if (has_timesheet == 1) {
                    $(this).removeClass('draggable');
                    $(this).addClass('draggable-disabled');
                } else {
                    $('body,div.draggable').addClass('cursorGrabbing');
                    $(this).css({ 'display': 'none' });
                    dragAndDropApp.target = $(this);
                    var div = $('<div></div>').append($(this).html()).css({
                        'background-color': $(this).css('background-color'),
                        'border-radius': $(this).css('border-radius'),
                        'box-shadow': $(this).css('box-shadow'),
                        'width': $(this).css('width')
                    }).addClass('mouseDiv').prependTo('body');
                    // dragAndDropApp.reposition(div, e);
                    // setVirtualDrop($(this));
                    // events
                    $(document).on('mousemove.dragging', function (e2) {
                        /*if(e2.screenX > $("#fixtb").width()){
                            let rescoll_x =  parseInt(localStorage.getItem('scollX')) + 50;
                            $("#fixtb").scrollLeft(rescoll_x);
                            localStorage.setItem('scollX', rescoll_x);
                        }else if(e2.screenY > $("#fixtb").height()){
                                let rescoll_y =  parseInt(localStorage.getItem('scollY')) + 50;
                                $("#fixtb").scrollTop(rescoll_y);
                                localStorage.setItem('scollY', rescoll_y);
                        }
                        else if(e2.screenX == 0){
                            if(localStorage.getItem('scollX') != 0){
                                let rescoll_x =  parseInt(localStorage.getItem('scollX')) - 50;
                                $("#fixtb").scrollLeft(rescoll_x);
                                localStorage.setItem('scollX', rescoll_x);
                            }
                        }
                        else if(e2.screenY < 230){
                            if(localStorage.getItem('scollY') != 0){
                                let rescoll_y =  parseInt(localStorage.getItem('scollY')) - 50;
                                $("#fixtb").scrollTop(rescoll_y);
                                localStorage.setItem('scollY', rescoll_y);
                            }
                        }*/
                        dragAndDropApp.reposition(div, e2);
                    }).on('mouseover.shiftContainer', 'td.day, td.night, div.draggable-disabled', function () {
                        if ($('div.draggable:hover,#virtualDrop:hover,div.draggable-disabled:hover').length == 0) {
                            setVirtualDrop($(this));
                        }
                    }).on('mouseover.divDraggable', 'div.draggable,div.draggable-disabled', function () {
                        setVirtualDrop($(this));
                    }).on('mouseup.drop', async function () {
                        console.log('mouseup.drop :>> ', 66);
                        await drop();
                    });
                }
            }).catch(err => {
                console.log(err);
            });
        }
    })
}

async function loadingLayer(visible) {
    if (visible) {
        $('div.dragAndDropLoadingLayer').show();
    }
    else {
        $('div.dragAndDropLoadingLayer').hide();
    }
    return this;
}

/* async function scrollScript() {
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
        // console.log('eScroll :>> ', eScroll.clientX);
        // console.log('eScroll :>> ', eScroll.clientY);
        // console.log('winWidth :>> ', winWidth);
        // console.log('winHeight :>> ', winHeight);

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
        else if (eScroll.clientY <= factor) { // + the amount of top position of the table
            scrollNow.y = true;
            direction.y = -1;
        }
        else {
            clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
        }

        // console.log(' scrollNow.x :>> ', scrollNow.x);
        // console.log('direction.x :>> ', direction.x);

        // console.log(' scrollNow.y :>> ', scrollNow.y);
        // console.log('direction.y :>> ', direction.y);
        // debugger
        // horizontal
        if (scrollNow.x) {
            clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
            dragAndDropApp.needScrollScriptIsScrolling.x = setInterval(function () {
                $("#fixtb").scrollLeft($("#fixtb").scrollLeft() + (direction.x * scrollAmount));
            }, intervalTime);
        }
        // vertical
        if (scrollNow.y) {
            clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
            dragAndDropApp.needScrollScriptIsScrolling.y = setInterval(function () {
                $("#fixtb").scrollTop($("#fixtb").scrollTop() + (direction.y * scrollAmount));
            }, intervalTime);
        }
    });
} */

async function setVirtualDrop(element) {
    // console.log('124 :>> ', element);
    $('#virtualDrop').remove();
    var virtualDrop = $('<div id="virtualDrop" class="highlight">Drop here</div>');
    // console.log('element :>> ', element.is($('td')));
    if (element.is($('td'))) {
        console.log('element145 :>> ', element);
        virtualDrop.prependTo(element);
    }
    else {
        console.log('element149 :>> ', element);
        virtualDrop.insertAfter(element);
    }
}

async function drop() {
    if (!$('#virtualDrop').next('div.draggable').is(dragAndDropApp.target) && $('#virtualDrop').length == 1) { // does not drop at the same place
        await killEvents();
        await Swal.fire({
            icon: 'warning',
            title: "",
            text: "Are you sure you want to drop here?",
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonColor: '#609966',
            cancelButtonColor: '#e44646',
            cancelButtonText: `cancel`,
            confirmButtonText: `ok`,
        }).then(async (result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isConfirmed) {
                dragAndDropApp.target.insertAfter($('#virtualDrop'));
                await save($('#dragAndDrop_moveAllThoseBehind').is(':checked'));
            } else {
                resetState();
            }
        })
        $('body,div.draggable').removeClass('cursorGrabbing');
    }
    else {
        // if(s_navigation != 10 && s_navigation != 34 && s_navigation != 35 && s_navigation != 74){
        console.log('192 :>>  else');
        await killEvents();
        await resetState();
        $('body,div.draggable').removeClass('cursorGrabbing');
        // }
    }

}

async function killEvents() {
    $(document).off('mousemove.dragging  mouseover.shiftContainer mouseover.divDraggable mouseup.drop');
}

async function resetState() {
    // console.log('div.mouseDiv,#virtualDrop :>> ', $('div.mouseDiv,#virtualDrop'));
    if (dragAndDropApp.target != undefined) {
        dragAndDropApp.target.css({ 'display': 'block' });
    }
    $('div.mouseDiv,#virtualDrop').remove();
    // clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
    // clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
    $('div.highlight').removeClass('highlight');
    if (dragAndDropApp.target != undefined) {
        dragAndDropApp.target = undefined;
    }
}

async function createMoveListTable(moveList) {
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
}

async function save(moveAllThoseBehind, moveNow) {
    const userData = JSON.parse(localStorage.getItem('userData'))
    // console.log('object :>> ', userData);
    var data = {
        original_id: dragAndDropApp.target.attr('plan_id'),
        original_plan_date: dragAndDropApp.target.attr('plan_date'),
        original_machine_id: dragAndDropApp.target.attr('machine_id'),
        original_shift_id: dragAndDropApp.target.attr('shift'),
        machine_id: dragAndDropApp.target.parents('td.dropZone').attr('machine_id'),
        shift_id: dragAndDropApp.target.parents('td.dropZone').hasClass('day') ? 1 : 2,
        plan_date: dragAndDropApp.target.parents('td.dropZone').attr('plan_date'),
        id: [],
        saleman_id: userData.emp_id
    };
    dragAndDropApp.target.parents('td.dropZone').find('div.draggable,div.draggable-disabled').each(function () {
        data.id.push($(this).attr('plan_id'));
    });
    // console.log('232 :>> ', data);
    // debugger;
    if (moveAllThoseBehind) {
        $.extend(data, {
            moveNow: typeof moveNow != "undefined" ? (moveNow ? 1 : 0) : 0,
        });
        // await saveMasterPlanDragAndDropMoveAllThoseBehind(data);
    }
    else {
        await saveMasterPlanDragAndDrop(data);
    }
}

async function reloadSection(planDate, machineID) {
    // console.log('280 :>> ', machineID + " >> "+planDate);
    await $(`span.font-total`).html('0');
    getData(planDate, machineID);
    getDataHr(planDate, machineID);
}
