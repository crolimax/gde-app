// *****************************************************************************************************
//    								Statistics Controller for Googlers
// *****************************************************************************************************
GdeTrackingApp.controller("generalStatisticsForGooglersCtrl",	function($rootScope, $scope,	$location,	$http,	months,	years)
{
  $scope.gdeTrackingAPI = null;
  if ($rootScope.is_backend_ready){
    $scope.gdeTrackingAPI = gapi.client.gdetracking;
  }

	$('paper-fab')		.css('-webkit-animation',	'hideFab	1s	linear	1	both');	//	-webkit- CSS3 animation
	$('paper-fab')		.css('animation',			'hideFab	1s	linear	1	both');	//	W3C	CSS3 animation

	$scope.months				= months;
	$scope.years				= years;

	// ------------------------------------
	//		Initialize local data
	// ------------------------------------
	$scope.activityByGdeName			= [];
	$scope.activityByRegion				= [];
	$scope.activityByProduct			= [];
	$scope.activityByActivity			= [];
	$scope.data						= {};
	$scope.data.items				= [];
	$scope.activityByGdeNameTemp		= {};
	$scope.activityByRegionTemp 		= {};
	$scope.activityByProductTemp		= {};
	$scope.activityByActivityTemp		= {};
	// ------------------------------------

	// ------------------------------------
	//		Date Range Filter
	// ------------------------------------
	$scope.dateFilter				= function ()
	{
		if ( $scope.monthSelected && $scope.yearSelected )
		{
			// ------------------------------------
			//		Reset local data
			// ------------------------------------
			$scope.activityByGdeName			= [];
			$scope.activityByRegion				= [];
			$scope.activityByProduct			= [];
			$scope.activityByActivity			= [];
			$scope.data						= {};
			$scope.data.items				= [];
			$scope.activityByGdeNameTemp		= {};
			$scope.activityByRegionTemp 		= {};
			$scope.activityByProductTemp		= {};
			$scope.activityByActivityTemp		= {};

// 			console.log($scope.monthSelected.value + " " + $scope.yearSelected.value);
			var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Called to show loading sign
			loadingToast		.show();
			$('.forGooglers')	.css('display','block');

			$scope.monthSince				= months.indexOf($scope.monthSelected) + 1;
			$scope.yearSince				= $scope.yearSelected.value;

    	if ($rootScope.is_backend_ready){
    	  var minDate             = $scope.yearSince +'/'+ ($scope.monthSince<10?"0":"")+$scope.monthSince; //Format date into YYYY/MM
    	  $scope.getactivitiesFromGAE(null,null,minDate,null,null);	// Get the activities
    	}
		};
	};
	// ------------------------------------

	var drawGeneralStatistics		= function ()
	{	// For every GDE in activityByGdeNameTemp
//		console.log('drawGeneralStatistics initiated');
		$.each($scope.activityByGdeNameTemp,	function(k,v)
		{
			$scope.activityByGdeName.push($scope.activityByGdeNameTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.activityByGdeName);
		var activitiesByGde = {
			cols: [
				{
					id		: 'gdeName',
					label	: 'GDE',
					type	: 'string'
				}
			],
			rows: []
		};
		$scope.utils.addMetricColumns(activitiesByGde);

		for (var i=0;i<$scope.activityByGdeName.length;i++)
		{
			activitiesByGde.rows.push(
				$scope.utils.chartDataRow($scope.activityByGdeName[i].name, $scope.activityByGdeName[i])
			);
		};
//		console.log(activitiesByGde);
		// For every Product in $scope.activityByProductTemp
		$.each($scope.activityByProductTemp,	function(k,v)
		{
			$scope.activityByProduct.push($scope.activityByProductTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.activityByProduct);
		var activityByProduct =
		{
			cols:
			[
				{
					id		: 'product',
					label	: 'Product',
					type	: 'string'
				}
			],
			rows: []
		};
		$scope.utils.addMetricColumns(activityByProduct);

		for (var i=0;i<$scope.activityByProduct.length;i++)
		{
			activityByProduct.rows.push(
				$scope.utils.chartDataRow($scope.activityByProduct[i].product, $scope.activityByProduct[i])
			);
		};
//		console.log(activityByProduct);
		// For every Activity in $scope.activityByActivityTemp
		$.each($scope.activityByActivityTemp,	function(k,v)
		{
			$scope.activityByActivity.push($scope.activityByActivityTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.activityByActivity);
		var activityByActivity =
		{
			cols:
			[
				{
					id		: 'activity',
					label	: 'Activity',
					type	: 'string'
				}
			],
			rows: []
		};
		$scope.utils.addMetricColumns(activityByActivity);

		for (var i=0;i<$scope.activityByActivity.length;i++)
		{
			activityByActivity.rows.push(
				$scope.utils.chartDataRow($scope.activityByActivity[i].activity, $scope.activityByActivity[i])
			);
		};
//		console.log(activityByActivity);
		// For every Region in activityByRegionTemp
		$.each($scope.activityByRegionTemp,	function(k,v)
		{
			$scope.activityByRegion.push($scope.activityByRegionTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//					console.log($scope.activityByRegion);
		var activitiesByRegion =
		{
			cols:
			[
				{
					id		: 'region',
					label	: 'Region',
					type	: 'string'
				}
			],
			rows: []
		};
		$scope.utils.addMetricColumns(activitiesByRegion);

		for (var i=0;i<$scope.activityByRegion.length;i++)
		{
			activitiesByRegion.rows.push(
				$scope.utils.chartDataRow($scope.activityByRegion[i].region, $scope.activityByRegion[i])
			);
		};
//					console.log(activitiesByRegion);

		// Sort data by Total Activities
					var activitiesByGde_data	= new google.visualization.DataTable(activitiesByGde);
					activitiesByGde_data.sort(1);

					var activityByProduct_data		= new google.visualization.DataTable(activityByProduct);
					activityByProduct_data.sort(1);

					var activityByActivity_data		= new google.visualization.DataTable(activityByActivity);
					activityByActivity_data.sort(1);

					var activityByRegion_data		= new google.visualization.DataTable(activitiesByRegion);
					activityByRegion_data.sort(1);

		// activities by GDE Name
					var gdeSelector				= new google.visualization.ControlWrapper();
					gdeSelector					.setControlType('CategoryFilter');
					gdeSelector					.setContainerId('gdeSelector');
					gdeSelector					.setOptions(
					{
						'filterColumnLabel'	: 'GDE',
						'ui':
						{
							'caption'				: 'GDE name...',
							'labelStacking'			: 'vertical',
							'selectedValuesLayout'	: 'belowStacked',
							'allowTyping'			: true,
							'allowMultiple'			: true
						}
					});

					var activitiesSlider		= new google.visualization.ControlWrapper();
					activitiesSlider			.setControlType('NumberRangeFilter');
					activitiesSlider			.setContainerId('activitiesSlider');
					activitiesSlider			.setOptions(
					{
						'filterColumnLabel': 'Activities Logged',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var resharesSlider			= new google.visualization.ControlWrapper();
					resharesSlider.setControlType('NumberRangeFilter');
					resharesSlider.setContainerId('resharesSlider');
					resharesSlider.setOptions(
					{
						'filterColumnLabel': 'Total Resharers',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var plus1sSlider			= new google.visualization.ControlWrapper();
					plus1sSlider				.setControlType('NumberRangeFilter');
					plus1sSlider				.setContainerId('plus1sSlider');
					plus1sSlider				.setOptions(
					{
						'filterColumnLabel': 'Total +1s',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var commentsSlider			= new google.visualization.ControlWrapper();
					commentsSlider.setControlType('NumberRangeFilter');
					commentsSlider.setContainerId('commentsSlider');
					commentsSlider.setOptions(
					{
						'filterColumnLabel': 'Total Comments',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var gdeTableChart			= new google.visualization.ChartWrapper();
					gdeTableChart				.setChartType('Table');
					gdeTableChart				.setContainerId('gdeTableChart');
					gdeTableChart				.setOptions(
					{
						'sortColumn': 1,
						'sortAscending': false,
						'page': 'enable',
						'pageSize':30
					});

					var gdePieChart				= new google.visualization.ChartWrapper();
					gdePieChart					.setChartType('PieChart');
					gdePieChart					.setContainerId('gdePieChart');
					var offset					= 0.2;
					var slices					= [];
					for (i=0;i<20;i++)
					{
						var slice	= {'offset':offset};
						offset		= offset - 0.002;
						slices		.push(slice);
					};
					for (i=0;i<160;i++)
					{
						var slice	= {'offset':offset};
						offset		= offset - 0.001;
						slices		.push(slice);
					};
//					console.log(slices);
					gdePieChart.setOptions(
					{
						'width'				: 650,
						'pieHole'			: 0.5,
						'reverseCategories'	: true,
						'pieStartAngle'		: 30,
						'slices'			: slices,
						'legend'			:
						{
							'position'	: 'none'
						}
					});
		// activities by Platform
					var platformsSelector		= new google.visualization.ControlWrapper();
					platformsSelector.setControlType('CategoryFilter');
					platformsSelector.setContainerId('platformsSelector');
					platformsSelector.setOptions(
					{
						'filterColumnLabel': 'Product',
						'ui':
						{
							'caption'				: 'Product...',
							'labelStacking'			: 'vertical',
							'selectedValuesLayout'	: 'belowStacked',
							'allowTyping': true,
							'allowMultiple': true
						}
					});

					var platformsActivitiesSlider = new google.visualization.ControlWrapper();
					platformsActivitiesSlider.setControlType('NumberRangeFilter');
					platformsActivitiesSlider.setContainerId('platformsActivitiesSlider');
					platformsActivitiesSlider.setOptions(
					{
						'filterColumnLabel': 'Activities Logged',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var platformsResharesSlider	= new google.visualization.ControlWrapper();
					platformsResharesSlider.setControlType('NumberRangeFilter');
					platformsResharesSlider.setContainerId('platformsResharesSlider');
					platformsResharesSlider.setOptions(
					{
						'filterColumnLabel': 'Total Resharers',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var platformsPlus1sSlider	= new google.visualization.ControlWrapper();
					platformsPlus1sSlider.setControlType('NumberRangeFilter');
					platformsPlus1sSlider.setContainerId('platformsPlus1sSlider');
					platformsPlus1sSlider.setOptions(
					{
						'filterColumnLabel': 'Total +1s',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var platformsCommentsSlider			= new google.visualization.ControlWrapper();
					platformsCommentsSlider.setControlType('NumberRangeFilter');
					platformsCommentsSlider.setContainerId('platformsCommentsSlider');
					platformsCommentsSlider.setOptions(
					{
						'filterColumnLabel': 'Total Comments',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});


					var platformsTableChart		= new google.visualization.ChartWrapper();
					platformsTableChart.setChartType('Table');
					platformsTableChart.setContainerId('platformsTableChart');
					platformsTableChart.setOptions(
					{
						'sortColumn'	: 1,
						'sortAscending'	: false,
						'page'			: 'enable',
						'pageSize'		:30
					});

					var platformsBarChart 		= new google.visualization.ChartWrapper();
					platformsBarChart.setChartType('BarChart');
					platformsBarChart.setContainerId('platformsBarChart');
					platformsBarChart.setOptions(
					{
						'width'				:650,
						'isStacked'			: true,
						'reverseCategories'	: true,
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
							'maxLines'	:3
						}
					});

		// activities by Activity
					var activities_Selector 	= new google.visualization.ControlWrapper();
					activities_Selector.setControlType('CategoryFilter');
					activities_Selector.setContainerId('activities_Selector');
					activities_Selector.setOptions(
					{
						'filterColumnLabel': 'Activity',
						'ui':
						{
							'caption'				: 'Activity...',
							'labelStacking'			: 'vertical',
							'selectedValuesLayout'	: 'belowStacked',
							'allowTyping'			: true,
							'allowMultiple'			: true
						}
					});

					var activities_ActivitiesSlider	= new google.visualization.ControlWrapper();
					activities_ActivitiesSlider.setControlType('NumberRangeFilter');
					activities_ActivitiesSlider.setContainerId('activities_ActivitiesSlider');
					activities_ActivitiesSlider.setOptions(
					{
						'filterColumnLabel': 'Activities Logged',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var activities_ResharesSlider	= new google.visualization.ControlWrapper();
					activities_ResharesSlider.setControlType('NumberRangeFilter');
					activities_ResharesSlider.setContainerId('activities_ResharesSlider');
					activities_ResharesSlider.setOptions(
					{
						'filterColumnLabel': 'Total Resharers',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var activities_Plus1sSlider		= new google.visualization.ControlWrapper();
					activities_Plus1sSlider.setControlType('NumberRangeFilter');
					activities_Plus1sSlider.setContainerId('activities_Plus1sSlider');
					activities_Plus1sSlider.setOptions(
					{
						'filterColumnLabel': 'Total +1s',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var activities_CommentsSlider		= new google.visualization.ControlWrapper();
					activities_CommentsSlider.setControlType('NumberRangeFilter');
					activities_CommentsSlider.setContainerId('activities_CommentsSlider');
					activities_CommentsSlider.setOptions(
					{
						'filterColumnLabel': 'Total Comments',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var activityTableChart			= new google.visualization.ChartWrapper();
					activityTableChart.setChartType('Table');
					activityTableChart.setContainerId('activityTableChart');
					activityTableChart.setOptions(
					{
						'sortColumn'	: 1,
						'sortAscending'	: false,
						'page'			: 'enable',
						'pageSize'		:30
					});

					var activityCommentsSlider			= new google.visualization.ControlWrapper();
					activityCommentsSlider.setControlType('NumberRangeFilter');
					activityCommentsSlider.setContainerId('commentsSlider');
					activityCommentsSlider.setOptions(
					{
						'filterColumnLabel': 'Total Comments',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var activityBarChart			= new google.visualization.ChartWrapper();
					activityBarChart.setChartType('BarChart');
					activityBarChart.setContainerId('activityBarChart');
					activityBarChart.setOptions(
					{
						'width'			:650,
						'isStacked'		: true,
						'reverseCategories': true,
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
							'maxLines'	:4
						}
					});

		// activities by Region
					var region_Selector				= new google.visualization.ControlWrapper();
					region_Selector.setControlType('CategoryFilter');
					region_Selector.setContainerId('region_Selector');
					region_Selector.setOptions(
					{
						'filterColumnLabel': 'Region',
						'ui':
						{
							'caption'				: 'Region...',
							'labelStacking'			: 'vertical',
							'selectedValuesLayout'	: 'belowStacked',
							'allowTyping'			: true,
							'allowMultiple'			: true
						}
					});

					var region_ActivitiesSlider		= new google.visualization.ControlWrapper();
					region_ActivitiesSlider.setControlType('NumberRangeFilter');
					region_ActivitiesSlider.setContainerId('region_ActivitiesSlider');
					region_ActivitiesSlider.setOptions(
					{
						'filterColumnLabel': 'Activities Logged',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var region_ResharesSlider		= new google.visualization.ControlWrapper();
					region_ResharesSlider.setControlType('NumberRangeFilter');
					region_ResharesSlider.setContainerId('region_ResharesSlider');
					region_ResharesSlider.setOptions(
					{
						'filterColumnLabel': 'Total Resharers',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var region_Plus1sSlider			= new google.visualization.ControlWrapper();
					region_Plus1sSlider.setControlType('NumberRangeFilter');
					region_Plus1sSlider.setContainerId('region_Plus1sSlider');
					region_Plus1sSlider.setOptions(
					{
						'filterColumnLabel': 'Total +1s',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var region_CommentsSlider			= new google.visualization.ControlWrapper();
					region_CommentsSlider.setControlType('NumberRangeFilter');
					region_CommentsSlider.setContainerId('region_CommentsSlider');
					region_CommentsSlider.setOptions(
					{
						'filterColumnLabel': 'Total Comments',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});

					var regionTableChart			 = new google.visualization.ChartWrapper();
					regionTableChart.setChartType('Table');
					regionTableChart.setContainerId('regionTableChart');
					regionTableChart.setOptions(
					{
						'sortColumn'	: 1,
						'sortAscending'	: false,
						'page'			: 'enable',
						'pageSize'		: 30
					});

					var regionBarChart 				= new google.visualization.ChartWrapper();
					regionBarChart.setChartType('BarChart');
					regionBarChart.setContainerId('regionBarChart');
					regionBarChart.setOptions(
					{
						'width'				:650,
						'isStacked'			: true,
						'reverseCategories'	: true,
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
							'maxLines'	:4
						}
					});


		// Draw Charts
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByPlatform'))
		.bind([platformsSelector,platformsActivitiesSlider,platformsResharesSlider,platformsPlus1sSlider,platformsCommentsSlider], [platformsTableChart,platformsBarChart])
		.draw(activityByProduct_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByGDE'))
		.bind([gdeSelector,activitiesSlider,resharesSlider,plus1sSlider,commentsSlider], [gdeTableChart,gdePieChart])
		.draw(activitiesByGde_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByActivity'))
		.bind([activities_Selector,activities_ActivitiesSlider,activities_ResharesSlider,activities_Plus1sSlider,activities_CommentsSlider], [activityTableChart,activityBarChart])
		.draw(activityByActivity_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByRegion'))
		.bind([region_Selector,region_ActivitiesSlider,region_ResharesSlider,region_Plus1sSlider,region_CommentsSlider], [regionTableChart,regionBarChart])
		.draw(activityByRegion_data);
	}

	var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Called to show loading sign
	$scope.loadVisualizationLibraries = google.load('visualization', '1.1', null);
	loadingToast		.show();
	$('.forGooglers')	.css('display','block');

	$scope.getactivitiesFromGAE = function (nextPageToken,gplusId,minDate,maxDate,order)
	{
    //Create request data object
    var requestData = {};
    requestData.limit=100;
    requestData.gplus_id = gplusId;
    requestData.pageToken=nextPageToken;
    requestData.minDate=minDate;
    requestData.maxDate=maxDate;
    requestData.order=order;

    $scope.gdeTrackingAPI.activity_record.list(requestData).execute(
      function(response)
  		{
  		  //Check if the backend returned and error
        if (response.code){
          window.alert('There was a problem loading the app. This windows will be re-loaded automatically. Error: '+response.code + ' - '+ response.message);
          location.reload(true);
        }else{
  		    //Everything ok, keep going
    			if (response.items)	// If there is data
    			{
    			  //Add response Items to the full list
    			  $scope.data.items = $scope.data.items.concat(response.items);

    			} else
    			{
    				window.alert('There are no recorded activities after the date you selected.');
    			}
    			if (response.nextPageToken)	// If there is still more data
    			{
    				$scope.getactivitiesFromGAE(response.nextPageToken,gplusId,minDate,maxDate,order);	// Get the next page
    			} else if (response.items)
    			{
    //				console.log($scope.data.items);
    				for (var i=0;i<$scope.data.items.length;i++)
    				{
    				  // activities by GDE Name
    					var name = $scope.data.items[i].gde_name;

    					if (!$scope.activityByGdeNameTemp[name])
    					{
    						$scope.activityByGdeNameTemp[name]						= {};	// Initialize a new JSON unordered array

    						$scope.activityByGdeNameTemp[name]['name']				= name;
    						$scope.activityByGdeNameTemp[name]['id']				= $scope.data.items[i].gplus_id;

    						$scope.activityByGdeNameTemp[name]['activities']				= [];	// Initialize a new JSON ordered array
    					}

    					$scope.utils.updateStats($scope.activityByGdeNameTemp[name], $scope.data.items[i]);

    					var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    					$scope.activityByGdeNameTemp[name]['activities'].push(activity);
    					//===============================================//
    					// activities by Product
    					if ($scope.data.items[i].product_groups)
    					{
    						for (var j=0;j<$scope.data.items[i].product_groups.length;j++)
    						{
    							var product = $scope.data.items[i].product_groups[j];
    							product = product.slice(1,product.length); // Remove the Hash Tag
    							if (!$scope.activityByProductTemp[product])
    							{
    								$scope.activityByProductTemp[product]						= {};	// Initialize a new JSON unordered array

    								$scope.activityByProductTemp[product]['product']			= product;

    								$scope.activityByProductTemp[product]['activities']				= [];	// Initialize a new JSON ordered array
    								$scope.activityByProductTemp[product]['totalPlus1s']		= 0;	// Initialize a new acumulator for totalPlus1s
    								$scope.activityByProductTemp[product]['totalComments']		= 0;	// Initialize a new acumulator for totalComments
    							}

    							$scope.utils.updateStats($scope.activityByProductTemp[product], $scope.data.items[i]);

    							var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    							$scope.activityByProductTemp[product]['activities'].push(activity);
    						}
    					};
    					//===============================================//
    					// activities by Activity Type
    					if ($scope.data.items[i].activity_types)
    					{
    						for (j=0;j<$scope.data.items[i].activity_types.length;j++)
    						{
    							var activity_type = $scope.data.items[i].activity_types[j];
    							activity_type = activity_type.slice(1,activity_type.length); // Remove the Hash Tag
    							if (!$scope.activityByActivityTemp[activity_type])
    							{
    								$scope.activityByActivityTemp[activity_type]						= {}; // Initialize a new JSON unordered array

    								$scope.activityByActivityTemp[activity_type]['activity_type']			= activity_type;

    								$scope.activityByActivityTemp[activity_type]['activities']			= [];  // Initialize a new JSON ordered array
    							}

    							$scope.utils.updateStats($scope.activityByActivityTemp[activity_type], $scope.data.items[i]);

    							var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    							$scope.activityByActivityTemp[activity_type]['activities'].push(activity);
    						}
    					};
    					//===============================================//
    					// activities by GDE Region
    					var region = $scope.data.items[i].gde_region;

    					if (!$scope.activityByRegionTemp[region])
    					{
    						$scope.activityByRegionTemp[region]						= {}; // Initialize a new JSON unordered array

    						$scope.activityByRegionTemp[region]['region']			= region;

    						$scope.activityByRegionTemp[region]['activities']			= [];  // Initialize a new JSON ordered array
    					}

    					$scope.utils.updateStats($scope.activityByRegionTemp[region], $scope.data.items[i]);

    					var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    					$scope.activityByRegionTemp[region]['activities'].push(activity);
    					//===============================================//
    				};
    				drawGeneralStatistics()
    			};
        }
  		}
  	);
	};

	// -------------------------------------
	//  Start showing last month statistics
	// -------------------------------------
	var today						    = new Date();

	$scope.monthSince				= today.getMonth() + 1;
	$scope.yearSince				= today.getFullYear();

	if ($rootScope.is_backend_ready){
	  var minDate             = $scope.yearSince +'/'+ ($scope.monthSince<10?"0":"")+$scope.monthSince; //Format date into YYYY/MM
	  $scope.getactivitiesFromGAE(null,null,minDate,null,null);	// Get the activities
	}

	// -------------------------------------
	//MSO - 20140806 - should never happen, as we redirect the user to the main page if not logged in, but just in case keep is
	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('generalStatisticsForGooglersCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//Get data from the backend only if activities are not already loaded
		if($scope.data.items.length==0){
		  //run the function to get data from the backend
		  var minDate             = $scope.yearSince +'/'+ ($scope.monthSince<10?"0":"")+$scope.monthSince; //Format date into YYYY/MM
		  $scope.getactivitiesFromGAE(null,null,minDate,null,null);	// Get the activities
		}

	});
});