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
	$scope.postByGdeName			= [];
	$scope.postByRegion				= [];
	$scope.postByProduct			= [];
	$scope.postByActivity			= [];
	$scope.data						= {};
	$scope.data.items				= [];
	$scope.postByGdeNameTemp		= {};
	$scope.postByRegionTemp 		= {};
	$scope.postByProductTemp		= {};
	$scope.postByActivityTemp		= {};
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
			$scope.postByGdeName			= [];
			$scope.postByRegion				= [];
			$scope.postByProduct			= [];
			$scope.postByActivity			= [];
			$scope.data						= {};
			$scope.data.items				= [];
			$scope.postByGdeNameTemp		= {};
			$scope.postByRegionTemp 		= {};
			$scope.postByProductTemp		= {};
			$scope.postByActivityTemp		= {};

// 			console.log($scope.monthSelected.value + " " + $scope.yearSelected.value);
			var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Called to show loading sign
			loadingToast		.show();
			$('.forGooglers')	.css('display','block');

			$scope.monthSince				= months.indexOf($scope.monthSelected) + 1;
			$scope.yearSince				= $scope.yearSelected.value;

    	if ($rootScope.is_backend_ready){
    	  var minDate             = $scope.yearSince +'/'+ ($scope.monthSince<10?"0":"")+$scope.monthSince; //Format date into YYYY/MM
    	  $scope.getPostsFromGAE(null,null,minDate,null,null);	// Get the Posts
    	}
		};
	};
	// ------------------------------------

	var drawGeneralStatistics		= function ()
	{	// For every GDE in postByGdeNameTemp
//		console.log('drawGeneralStatistics initiated');
		$.each($scope.postByGdeNameTemp,	function(k,v)
		{
			$scope.postByGdeName.push($scope.postByGdeNameTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.postByGdeName);
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

		for (var i=0;i<$scope.postByGdeName.length;i++)
		{
			activitiesByGde.rows.push(
				$scope.utils.chartDataRow($scope.postByGdeName[i].name, $scope.postByGdeName[i])
			);
		};
//		console.log(activitiesByGde);
		// For every Product in $scope.postByProductTemp
		$.each($scope.postByProductTemp,	function(k,v)
		{
			$scope.postByProduct.push($scope.postByProductTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.postByProduct);
		var postByProduct =
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
		$scope.utils.addMetricColumns(postByProduct);

		for (var i=0;i<$scope.postByProduct.length;i++)
		{
			postByProduct.rows.push(
				$scope.utils.chartDataRow($scope.postByProduct[i].product, $scope.postByProduct[i])
			);
		};
//		console.log(postByProduct);
		// For every Activity in $scope.postByActivityTemp
		$.each($scope.postByActivityTemp,	function(k,v)
		{
			$scope.postByActivity.push($scope.postByActivityTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.postByActivity);
		var postByActivity =
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
		$scope.utils.addMetricColumns(postByActivity);

		for (var i=0;i<$scope.postByActivity.length;i++)
		{
			postByActivity.rows.push(
				$scope.utils.chartDataRow($scope.postByActivity[i].activity, $scope.postByActivity[i])
			);
		};
//		console.log(postByActivity);
		// For every Region in postByRegionTemp
		$.each($scope.postByRegionTemp,	function(k,v)
		{
			$scope.postByRegion.push($scope.postByRegionTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//					console.log($scope.postByRegion);
		var postsByRegion =
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
		$scope.utils.addMetricColumns(postsByRegion);

		for (var i=0;i<$scope.postByRegion.length;i++)
		{
			postsByRegion.rows.push(
				$scope.utils.chartDataRow($scope.postByRegion[i].region, $scope.postByRegion[i])
			);
		};
//					console.log(postsByRegion);

		// Sort data by Total Activities
					var activitiesByGde_data	= new google.visualization.DataTable(activitiesByGde);
					activitiesByGde_data.sort(1);

					var postByProduct_data		= new google.visualization.DataTable(postByProduct);
					postByProduct_data.sort(1);

					var postByActivity_data		= new google.visualization.DataTable(postByActivity);
					postByActivity_data.sort(1);

					var postByRegion_data		= new google.visualization.DataTable(postsByRegion);
					postByRegion_data.sort(1);

		// Posts by GDE Name
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
		// Posts by Platform
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

		// Posts by Activity
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

		// Posts by Region
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
		.draw(postByProduct_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByGDE'))
		.bind([gdeSelector,activitiesSlider,resharesSlider,plus1sSlider,commentsSlider], [gdeTableChart,gdePieChart])
		.draw(activitiesByGde_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByActivity'))
		.bind([activities_Selector,activities_ActivitiesSlider,activities_ResharesSlider,activities_Plus1sSlider,activities_CommentsSlider], [activityTableChart,activityBarChart])
		.draw(postByActivity_data);

		new google.visualization.Dashboard(document.getElementById('generalStatisticsByRegion'))
		.bind([region_Selector,region_ActivitiesSlider,region_ResharesSlider,region_Plus1sSlider,region_CommentsSlider], [regionTableChart,regionBarChart])
		.draw(postByRegion_data);
	}

	var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Called to show loading sign
	$scope.loadVisualizationLibraries = google.load('visualization', '1.1', null);
	loadingToast		.show();
	$('.forGooglers')	.css('display','block');

	$scope.getPostsFromGAE = function (nextPageToken,gplusId,minDate,maxDate,order)
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
    				$scope.getPostsFromGAE(response.nextPageToken,gplusId,minDate,maxDate,order);	// Get the next page
    			} else if (response.items)
    			{
    //				console.log($scope.data.items);
    				for (var i=0;i<$scope.data.items.length;i++)
    				{
    				  // Posts by GDE Name
    					var name = $scope.data.items[i].gde_name;

    					if (!$scope.postByGdeNameTemp[name])
    					{
    						$scope.postByGdeNameTemp[name]						= {};	// Initialize a new JSON unordered array

    						$scope.postByGdeNameTemp[name]['name']				= name;
    						$scope.postByGdeNameTemp[name]['id']				= $scope.data.items[i].gplus_id;

    						$scope.postByGdeNameTemp[name]['posts']				= [];	// Initialize a new JSON ordered array
    					}

    					$scope.utils.updateStats($scope.postByGdeNameTemp[name], $scope.data.items[i]);

    					var post = $scope.utils.postFromApi($scope.data.items[i]);
    					$scope.postByGdeNameTemp[name]['posts'].push(post);
    					//===============================================//
    					// Posts by Product
    					if ($scope.data.items[i].product_groups)
    					{
    						for (var j=0;j<$scope.data.items[i].product_groups.length;j++)
    						{
    							var product = $scope.data.items[i].product_groups[j];
    							product = product.slice(1,product.length); // Remove the Hash Tag
    							if (!$scope.postByProductTemp[product])
    							{
    								$scope.postByProductTemp[product]						= {};	// Initialize a new JSON unordered array

    								$scope.postByProductTemp[product]['product']			= product;

    								$scope.postByProductTemp[product]['posts']				= [];	// Initialize a new JSON ordered array
    								$scope.postByProductTemp[product]['totalPlus1s']		= 0;	// Initialize a new acumulator for totalPlus1s
    								$scope.postByProductTemp[product]['totalComments']		= 0;	// Initialize a new acumulator for totalComments
    							}

    							$scope.utils.updateStats($scope.postByProductTemp[product], $scope.data.items[i]);

    							var post = $scope.utils.postFromApi($scope.data.items[i]);
    							$scope.postByProductTemp[product]['posts'].push(post);
    						}
    					};
    					//===============================================//
    					// Posts by Activity Type
    					if ($scope.data.items[i].activity_types)
    					{
    						for (j=0;j<$scope.data.items[i].activity_types.length;j++)
    						{
    							var activity = $scope.data.items[i].activity_types[j];
    							activity = activity.slice(1,activity.length); // Remove the Hash Tag
    							if (!$scope.postByActivityTemp[activity])
    							{
    								$scope.postByActivityTemp[activity]						= {}; // Initialize a new JSON unordered array

    								$scope.postByActivityTemp[activity]['activity']			= activity;

    								$scope.postByActivityTemp[activity]['posts']			= [];  // Initialize a new JSON ordered array
    							}

    							$scope.utils.updateStats($scope.postByActivityTemp[activity], $scope.data.items[i]);

    							var post = $scope.utils.postFromApi($scope.data.items[i]);
    							$scope.postByActivityTemp[activity]['posts'].push(post);
    						}
    					};
    					//===============================================//
    					// Posts by GDE Region
    					var region = $scope.data.items[i].gde_region;

    					if (!$scope.postByRegionTemp[region])
    					{
    						$scope.postByRegionTemp[region]						= {}; // Initialize a new JSON unordered array

    						$scope.postByRegionTemp[region]['region']			= region;

    						$scope.postByRegionTemp[region]['posts']			= [];  // Initialize a new JSON ordered array
    					}

    					$scope.utils.updateStats($scope.postByRegionTemp[region], $scope.data.items[i]);

    					var post = $scope.utils.postFromApi($scope.data.items[i]);
    					$scope.postByRegionTemp[region]['posts'].push(post);
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
	  $scope.getPostsFromGAE(null,null,minDate,null,null);	// Get the Posts
	}

	// -------------------------------------
	//MSO - 20140806 - should never happen, as we redirect the user to the main page if not logged in, but just in case keep is
	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('generalStatisticsForGooglersCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//Get data from the backend only if posts are not already loaded
		if($scope.data.items.length==0){
		  //run the function to get data from the backend
		  var minDate             = $scope.yearSince +'/'+ ($scope.monthSince<10?"0":"")+$scope.monthSince; //Format date into YYYY/MM
		  $scope.getPostsFromGAE(null,null,minDate,null,null);	// Get the Posts
		}

	});
});