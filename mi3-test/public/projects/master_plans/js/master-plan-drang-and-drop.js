var dragAndDropApp = {
    enableMoveAllThoseBehind: false,
    mouseDivCSS: {
        'height': 20,
        'width': 180,
    },
    target: undefined,
    needScrollScript: false,
    needScrollScriptIsScrolling: {
        x: false,
        y: false,
    },
    reposition: function (div, e) {
        div.css({
            'left': (e.clientX - 40) + 'px',
            'top': (e.clientY + 25) + 'px',
        });
        return this;
    },
    displayStatusTimeout: undefined,
}
$(document).ready(function () {
    init();
});

async function init() {
    $('head').append('<style>div.mouseDiv{ width:' + dragAndDropApp.mouseDivCSS.width + 'px; height:' + dragAndDropApp.mouseDivCSS.height + 'px; }</style>');
    await loadingLayer(true);
    $( ".draggable" ).draggable({ scroll: true ,scrollSpeed: 100,revert: true});
    // dragAndDropApp.target.draggable({ });
    // $( ".draggable" ).draggable({ revert: true, helper: "clone" });
    $(document).on('mousedown', 'div.draggable', function (e) {
        console.log('e.which :>> ', e.which);
        if (e.which == 1) { // left click
            $('body,div.draggable').addClass('cursorGrabbing');
            $(this).css({ 'display': 'none' });
            dragAndDropApp.target = $(this);
            // console.log('37 :>> ', dragAndDropApp.target);
            var div = $('<div></div>').append($(this).html()).css({
                                                                    'background-color': $(this).css('background-color'),
                                                                    'font': '13px tahoma',
            }).addClass('mouseDiv').prependTo('body');
            dragAndDropApp.reposition(div, e);
            if (dragAndDropApp.needScrollScript) {
                // scrollScript();
            }
            $(document).on('mousemove.dragging', function (e2) {
                dragAndDropApp.reposition(div, e2);
            }).on('mouseover.shiftContainer', 'td.day, td.night', function () {
                if ($('div.draggable:hover, #virtualDrop:hover').length == 0) {
                    setVirtualDrop($(this));
                }
            }).on('mouseover.divDraggable', 'div.draggable', function () {
                setVirtualDrop($(this));
            }).on('mouseup.drop', function () {
                drop();
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
    console.log('63:>> ', navigator.userAgent.match(/firefox/i));
    if (navigator.userAgent.match(/firefox/i)) {
        dragAndDropApp.needScrollScript = true;
    }
    await loadingLayer(false);
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

async function scrollScript() {
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
        console.log('eScroll :>> ', eScroll.clientX);
        console.log('eScroll :>> ', eScroll.clientY);
        console.log('winWidth :>> ', winWidth);
        console.log('winHeight :>> ', winHeight);
        console.log('needScrollScriptIsScrolling.x :>> ', dragAndDropApp.needScrollScriptIsScrolling.x);
       
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
        else if (eScroll.clientY <= factor + parseFloat($('#fixtb').css('top'))) { // + the amount of top position of the table
            scrollNow.y = true;
            direction.y = -1;
        }
        else {
            clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
        }

        console.log(' scrollNow.x :>> ', scrollNow.x);
        console.log('direction.x :>> ', direction.x); 

        console.log(' scrollNow.y :>> ', scrollNow.y);
        console.log('direction.y :>> ', direction.y); 
        // debugger
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
}

async function setVirtualDrop(element) {
    $('#virtualDrop').remove();
    var virtualDrop = $('<div id="virtualDrop" class="highlight">Drop here</div>');
    if (element.is($('td'))) {
        virtualDrop.prependTo(element);
    }
    else {
        virtualDrop.insertAfter(element);
    }
    return this;
}

async function drop(){
    console.log('148 :>> ', $('#virtualDrop').next('div.draggable').is(dragAndDropApp.target));
    console.log('149 :>> ', $('#virtualDrop').length);
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
            }else{
                resetState();
            }
        })
    }
    else {
        await killEvents()
        await resetState();
    }
    $('body,div.draggable').removeClass('cursorGrabbing');
    // return this;
}

async function killEvents() {
    $(document).off('mousemove.dragging  mouseover.shiftContainer mouseover.divDraggable mouseup.drop mousemove.scroll');
}

async function resetState() {
    console.log('div.mouseDiv,#virtualDrop :>> ', $('div.mouseDiv,#virtualDrop'));
    dragAndDropApp.target.css({ 'display': 'block' });
    $('div.mouseDiv,#virtualDrop').remove();
    clearInterval(dragAndDropApp.needScrollScriptIsScrolling.x);
    clearInterval(dragAndDropApp.needScrollScriptIsScrolling.y);
    dragAndDropApp.target = undefined;
    $('div.highlight').removeClass('highlight');
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
    // console.log('object :>> ', dragAndDropApp.target);
    var data = {
        original_id: dragAndDropApp.target.attr('plan_id'),
        original_plan_date: dragAndDropApp.target.attr('plan_date'),
        original_machine_id: dragAndDropApp.target.attr('machine_id'),
        original_shift_id: dragAndDropApp.target.attr('shift'),
        machine_id: dragAndDropApp.target.parents('td.dropZone').attr('machine_id'),
        shift_id: dragAndDropApp.target.parents('td.dropZone').hasClass('day') ? 1 : 2,
        plan_date: dragAndDropApp.target.parents('td.dropZone').attr('plan_date'),
        id: new Array(),
    };
    dragAndDropApp.target.parents('td.dropZone').find('div.draggable').each(function () {
        data.id.push($(this).attr('plan_id'));
    });
    // console.log('232 :>> ', data);
    // debugger;
    if (moveAllThoseBehind) {
        $.extend(data, {
            moveNow: typeof moveNow != "undefined" ? (moveNow ? 1 : 0) : 0,
        });
        await saveMasterPlanDragAndDropMoveAllThoseBehind(data);
    }
    else {
        await saveMasterPlanDragAndDrop(data);
        await resetState();
    }
    return this;
}

 /*async function displayStatus(text) {
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
} */

async function reloadSection(planDate, machineID) {
    getData(planDate, machineID);
    $('span.' + planDate + '.' + machineID).html('0:00');
    getDataHr(planDate, machineID);
    return this;
}