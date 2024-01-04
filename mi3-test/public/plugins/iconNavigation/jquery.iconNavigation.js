( function($) {
	var settings = {
		iconList : "",
		homeUrl :"http://192.168.5.40/sipware",
		root : "http://192.168.5.3/planning",
	};
	settings.iconList = "";
	var allIconsSettings = {
		Home	:{
			url	:settings.homeUrl,
			bp	:"0 -140px",
		},
		Graph	:{
			url	:settings.root + "/index.php",
			bp	:"-24px -140px",
		},
		MI		:{
			url	:settings.root + "/mi/mi0.php",
			bp	:"-72px -188px",
		},
		Customer:{
			url	:settings.root + "/mi/customer.php",
			bp	:"-120px -188px",
		},
		Employee:{
			url	:settings.root + "/mi/employee.php",
			bp	:"-96px -212px"
		},
		Timesheet:{
			url	:settings.root + "/timesheet/timesheet.php",
			bp	:"-168px -212px",
		},
		"Report_Job":{
			url	:settings.root + "/mi/report_job02.php",
			bp	:"-120px -212px",
		},
		"Report_Chart"	:{
			url	:settings.root + "/mi/report_chart.php",
			bp	:"-144px -212px",
		},
		Costing:{
			url	:settings.root + "/costing/costing.php",
			bp	:"-240px -188px",
		},
		itEditor:{
			url	:settings.root + "/it/itEditor.php",
			bp	:"-240px -212px",
		},
		scheduler:{
			//url	:settings.root + "/scheduler/scheduler.php",
			url	:settings.root + "/scheduler/index.php",
			bp	:"0px -236px",
		},
		prepress:{
			url	:settings.root + "/prepress/prepressPlan.php",
			bp	: "-72px -212px",
		},
		capacity_labor	:{
			//url	: settings.homeUrl+ "/MACHINE_PROFILE/capacity_labor/capacity_labor_main.php?DB_MI=1",
			url	: "/MACHINE_PROFILE/capacity_labor/capacity_labor_main.php?DB_MI=1",
			bp	:"-216px -212px",
		},
		"Report_Job_New":{
			url	:settings.root + "/mi/report_job_new.php",
			bp	:"-120px -212px",
		},
		
	};
	var icons = {};
	// styles
	// common styles
	$.each(allIconsSettings,function(key,value){
		settings.iconList += key + " ";
		var theIcon = $('<a class="iconNavigation"></a>');
		theIcon.attr({
			'href':value.url,
			title:key,
		}).css({
		  'background-color': 'transparent',
		  'background-image': 'url("/plugins/iconNavigation/icons.png")',
		  'background-repeat': 'no-repeat',
		  'background-position': value.bp,
		  'border': 'medium none',
		  'border-radius': '6px 6px 6px 6px',
		  'box-shadow': '2px 2px 3px black',
		  'cursor': 'pointer',
		  'height': '24px',
		  'margin-left': '3px',
		  'width': '24px',
		  'display':'inline-block',
		});
		icons[key] = theIcon;
	});
	
	var methods = {
		init	:	function(initialSettings){
			settings = $.extend({
				iconList:settings.iconList
			},initialSettings);
			
			return $(this).each(function(){
				$(this).children('a.iconNavigation').remove();
				var prependObject=$();
				var iconList = settings.iconList.split(" ");
				$.each(iconList,function(){
					prependObject = prependObject.add(icons[this]);
				});
				$(this).prepend(prependObject);
			});
		},
		
	}
	$.fn.iconNavigation = function(method){
		if ( methods[method] ) {
			methods.init.apply( this, arguments );
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} 
		else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} 
		else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.iconNavigation' );
		}  		
	}
	
	
})(jQuery)