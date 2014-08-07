// *****************************************************************************************************
//    								Statistics Controller for GDE
// *****************************************************************************************************
GdeTrackingApp.controller("myStatisticsCtrl",					function($scope,	$location,	$http,	$rootScope,	months, years)
{
  $scope.gdeTrackingAPI = null;
  if ($rootScope.is_backend_ready){
    $scope.gdeTrackingAPI = gapi.client.gdetracking;
  }

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

//	console.log(getPostsEndPointURL);
	$scope.loadVisualizationLibraries	= google.load('visualization', '1.1', null);
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
    			//Add response Items to the full list
    			$scope.data.items = $scope.data.items.concat(response.items);

    			if (response.nextPageToken)	// If there is still more data
    			{
    				$scope.getPostsFromGAE(response.nextPageToken,gplusId,minDate,maxDate,order);	// Get the next page
    			} else
    			{																			// Done
    //				console.log($scope.data.items);
    				if ($rootScope.usrId)												// Check if the user it's an authorized user.
    				{
    				  var loggedGdeName = $('.userName').text();
  						var loggedGdePlusID = $rootScope.usrId;
    //					console.log('User was logged in');
    					for (var i=0;i<$scope.data.items.length;i++)
    					{
    						$scope.name = $scope.data.items[i].gde_name;

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
    					$scope.$apply();
    					drawGeneralStatistics();
    				} else {																// Wait for a valid GDE to log in.
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
    						$scope.$apply();
    						drawGeneralStatistics();
    					});
    				}
    			}
  			};
  		}
		);
	};

	if ($rootScope.is_backend_ready){
	  $scope.getPostsFromGAE(null,$rootScope.usrId,null,null,null);	// Get the GDE Posts
	}

	//MSO - 20140806 - should never happen, as we redirect the user to the main page if not logged in, but just in case keep is
	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('myStatisticsCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//Get data from the backend only if posts are not already loaded
		if($scope.data.items.length==0){
		  //run the function to get data from the backend
		  $scope.getPostsFromGAE(null,$rootScope.usrId,null,null,null);	// Get the GDE Posts
		}

	});
});