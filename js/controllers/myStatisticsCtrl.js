// *****************************************************************************************************
//    								Statistics Controller for GDE
// *****************************************************************************************************
GdeTrackingApp.controller("myStatisticsCtrl",					function($scope,	$location,	$http,	$rootScope,	months, years)
{
	var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Show loading sign
	loadingToast		.show();
	
	$('paper-fab')		.css('-webkit-animation',	'hideFab	1s	linear	1	both');	//	-webkit- CSS3 animation
	$('paper-fab')		.css('animation',			'hideFab	1s	linear	1	both');	//	W3C	CSS3 animation
	
	$scope.months				= months;
	$scope.years				= years;
	$scope.monthSelected		= "";
	$scope.yearSelected			= "";
	
	$scope.newMonth				= function (newMonth)
	{
		console.log(newMonth);
	};
	$scope.newYear				= function (newYear)
	{
		console.log(newYear);
	};
	
// ----------------------------------------------
// .............My General Statistics............
// ----------------------------------------------
	$scope.postByGdeName		= [];
	$scope.data					= {};
	$scope.data.items			= [];
	$scope.postByGdeNameTemp	= {};
	$scope.name					= '';
	$scope.userPosts			= [];
	var drawGeneralStatistics	= function ()
	{	// For every GDE in postByGdeNameTemp
//		console.log('drawGeneralStatistics initiated');
		$.each($scope.postByGdeNameTemp, function(k,v)
		{
			$scope.postByGdeName.push($scope.postByGdeNameTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.postByGdeName);
		var activitiesByGde =
		{
			cols:
			[
				{
					id		: 'gdeName',
					label	: 'GDE',
					type	: 'string'
				}
			],
			rows	: []
		};
		$scope.utils.addMetricColumns(activitiesByGde);

		for (var i=0;i<$scope.postByGdeName.length;i++)
		{
			activitiesByGde.rows.push(
				$scope.utils.chartDataRow($scope.postByGdeName[i].name, $scope.postByGdeName[i])
			);
		};
//		console.log(activitiesByGde);
		
					
		// Sort data by Total Activities
		var activitiesByGde_data		= new google.visualization.DataTable(activitiesByGde);
		activitiesByGde_data.sort(1);
					
		// Posts by GDE Name
					var activitiesSlider	= new google.visualization.ControlWrapper();
					activitiesSlider.setControlType('NumberRangeFilter');
					activitiesSlider.setContainerId('activitiesSlider');
					activitiesSlider.setOptions(
					{
						'filterColumnLabel': 'Activities Logged',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});
					
					var resharesSlider		= new google.visualization.ControlWrapper();
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
					
					var plus1sSlider		= new google.visualization.ControlWrapper();
					plus1sSlider.setControlType('NumberRangeFilter');
					plus1sSlider.setContainerId('plus1sSlider');
					plus1sSlider.setOptions(
					{
						'filterColumnLabel': 'Total +1s',
						'ui':
						{
							'labelStacking': 'vertical'
						}
					});
					
					var commentsSlider		= new google.visualization.ControlWrapper();
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

					var gdeTableChart 		= new google.visualization.ChartWrapper();
					gdeTableChart.setChartType('Table');
					gdeTableChart.setContainerId('gdeTableChart');
					gdeTableChart.setOptions(
					{
						'sortColumn'	: 1,
						'sortAscending'	: false,
						'page'			: 'enable',
						'pageSize'		: 30
					});
					
					var gdeColumnChart 		= new google.visualization.ChartWrapper();
					gdeColumnChart.setChartType('ColumnChart');
					gdeColumnChart.setContainerId('gdeColumnChart');
					gdeColumnChart.setOptions(
					{
						'width'				:700,
						'reverseCategories'	: true,
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
						}
					});
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByGDE'))// Draw Charts
		.bind([activitiesSlider,resharesSlider,plus1sSlider,commentsSlider], [gdeTableChart,gdeColumnChart])
		.draw(activitiesByGde_data);
	}
	
	var loggetGdePlusID					= $rootScope.usrId; 
//	console.log(loggetGdePlusID);
	var getPostsEndPointURL				= 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?gplus_id=' + loggetGdePlusID + '&limit=100'; // Query activities from the logged GDE
//	console.log(getPostsEndPointURL);
	$scope.loadVisualizationLibraries	= google.load('visualization', '1.1', null);
	$scope.getPostsFromGAE				= function (getPostsEndPointURL)
	{
		$http({method: 'GET', url: getPostsEndPointURL})
		.success(function(response, status, config)
		{
			console.log();
			for (var i=0;i<response.items.length;i++)
			{
				$scope.data.items.push(response.items[i]);
			};
			if (response.nextPageToken)													// If there is still more data
			{
				var nextUrl = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?gplus_id=' + loggetGdePlusID + '&limit=100&pageToken='+response.nextPageToken; // Adjust the end point URL
				$scope.getPostsFromGAE(nextUrl);										// Add the next page
			} else
			{																			// Done
//				console.log($scope.data.items);
				if ($('.userName').text())												// Check if the user it's a valid GDE.
				{
//					console.log('User was logged in');
					for (var i=0;i<$scope.data.items.length;i++)
					{
						$scope.name = $scope.data.items[i].gde_name;
						var loggedGdeName = $('.userName').text();
						var loggetGdePlusID = $rootScope.usrId;
						if (!$scope.postByGdeNameTemp[$scope.name])
						{
							$scope.postByGdeNameTemp[$scope.name]					= {};	// Initialize a new JSON unordered array

							$scope.postByGdeNameTemp[$scope.name]['name']			= $scope.name;
							$scope.postByGdeNameTemp[$scope.name]['id']				= $scope.data.items[i].gplus_id;

							$scope.postByGdeNameTemp[$scope.name]['posts']			= [];	// Initialize a new JSON ordered array
						}

						$scope.utils.updateStats($scope.postByGdeNameTemp[$scope.name], $scope.data.items[i]);

						var post = $scope.utils.postFromApi($scope.data.items[i]);
						$scope.postByGdeNameTemp[$scope.name]['posts'].push(post);
						$scope.userPosts.push(post);
					};
					drawGeneralStatistics();
				} else {																// Wait for a valid GDE to log.
//					console.log('User was not logged in');
					$scope.$on('gde:logged', function(event,loggedGdeName)				// Listen to the gde:logged
					{
//						console.log(loggedGdeName);
						for (var i=0;i<$scope.data.items.length;i++) // Posts by GDE Name
						{
							$scope.name = $scope.data.items[i].gde_name;
							if ($scope.data.items[i].gde_name == loggedGdeName)
							{
								if (!$scope.postByGdeNameTemp[$scope.name])
								{
									$scope.postByGdeNameTemp[$scope.name]					= {};	// Initialize a new JSON unordered array

									$scope.postByGdeNameTemp[$scope.name]['name']			= $scope.name;
									$scope.postByGdeNameTemp[$scope.name]['id']				= $scope.data.items[i].gplus_id;

									$scope.postByGdeNameTemp[$scope.name]['posts']			= [];	// Initialize a new JSON ordered array
								}

								$scope.utils.updateStats($scope.postByGdeNameTemp[$scope.name], $scope.data.items[i]);

								var post = $scope.utils.postFromApi($scope.data.items[i]);
								$scope.postByGdeNameTemp[$scope.name]['posts'].push(post);
								$scope.userPosts.push(post);
							};
						};
						drawGeneralStatistics();
					});
				}
				
			};
		})
		.error(function(response, status, config)
		{
			window.alert('There was a problem loading the app. This windows will be re-loaded automatically.');
			location.reload(true);
		});
	};
	
	$scope.getPostsFromGAE(getPostsEndPointURL);
});