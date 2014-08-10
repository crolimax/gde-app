// *****************************************************************************************************
//    								Statistics Controller for GDE
// *****************************************************************************************************
GdeTrackingApp.controller("myStatisticsCtrl",					function($scope,	$location,	$http,	$rootScope,	months, years,activityTypes)
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
	$scope.activitiesByGdeName		= [];
	$scope.data					= {};
	$scope.data.items			= [];
	$scope.activitiesByGdeNameTemp	= {};
	$scope.name					= '';
	$scope.userActivities			= [];
	var drawGeneralStatistics	= function ()
	{	// For every GDE in activitiesByGdeNameTemp
//		console.log('drawGeneralStatistics initiated');
		$.each($scope.activitiesByGdeNameTemp, function(k,v)
		{
			$scope.activitiesByGdeName.push($scope.activitiesByGdeNameTemp[k]); // Push it as a new object in a JSON ordered array.
		});
//		console.log($scope.activitiesByGdeName);
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

		for (var i=0;i<$scope.activitiesByGdeName.length;i++)
		{
			activitiesByGde.rows.push(
				$scope.utils.chartDataRow($scope.activitiesByGdeName[i].name, $scope.activitiesByGdeName[i])
			);
		};
//		console.log(activitiesByGde);


		// Sort data by Total Activities
		var activitiesByGde_data		= new google.visualization.DataTable(activitiesByGde);
		activitiesByGde_data.sort(1);

		// Activities by GDE Name
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

	$scope.loadVisualizationLibraries	= google.load('visualization', '1.1', null);
	$scope.getActivitiesFromGAE = function (nextPageToken,gplusId,minDate,maxDate,order)
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
    				$scope.getActivitiesFromGAE(response.nextPageToken,gplusId,minDate,maxDate,order);	// Get the next page
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

    						if (!$scope.activitiesByGdeNameTemp[$scope.name])
    						{
    							$scope.activitiesByGdeNameTemp[$scope.name]					= {};	// Initialize a new JSON unordered array

    							$scope.activitiesByGdeNameTemp[$scope.name]['name']			= $scope.name;
    							$scope.activitiesByGdeNameTemp[$scope.name]['id']				= $scope.data.items[i].gplus_id;

    							$scope.activitiesByGdeNameTemp[$scope.name]['activities']			= [];	// Initialize a new JSON ordered array
    						}

    						$scope.utils.updateStats($scope.activitiesByGdeNameTemp[$scope.name], $scope.data.items[i]);

    						var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    						$scope.activitiesByGdeNameTemp[$scope.name]['activities'].push(activity);
    						$scope.userActivities.push(activity);
    					};
    					$scope.$apply();
    					drawGeneralStatistics();
    				} else {																// Wait for a valid GDE to log in.
    //					console.log('User was not logged in');
    					$scope.$on('gde:logged', function(event,loggedGdeName)				// Listen to the gde:logged
    					{
    //						console.log(loggedGdeName);
    						for (var i=0;i<$scope.data.items.length;i++) //activities by GDE Name
    						{
    							$scope.name = $scope.data.items[i].gde_name;
    							if ($scope.data.items[i].gde_name == loggedGdeName)
    							{
    								if (!$scope.activitiesByGdeNameTemp[$scope.name])
    								{
    									$scope.activitiesByGdeNameTemp[$scope.name]					= {};	// Initialize a new JSON unordered array

    									$scope.activitiesByGdeNameTemp[$scope.name]['name']			= $scope.name;
    									$scope.activitiesByGdeNameTemp[$scope.name]['id']				= $scope.data.items[i].gplus_id;

    									$scope.activitiesByGdeNameTemp[$scope.name]['activities']			= [];	// Initialize a new JSON ordered array
    								}

    								$scope.utils.updateStats($scope.activitiesByGdeNameTemp[$scope.name], $scope.data.items[i]);

    								var activity = $scope.utils.activityFromApi($scope.data.items[i]);
    								$scope.activitiesByGdeNameTemp[$scope.name]['activities'].push(activity);
    								$scope.userActivities.push(activity);
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
	  $scope.getActivitiesFromGAE(null,$rootScope.usrId,null,null,null);	// Get the GDE Activites
	}

	//MSO - 20140806 - should never happen, as we redirect the user to the main page if not logged in, but just in case keep it
	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('myStatisticsCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//Get data from the backend only if activities are not already loaded
		if($scope.data.items.length==0){
		  //run the function to get data from the backend
		  $scope.getActivitiesFromGAE(null,$rootScope.usrId,null,null,null);	// Get the GDE Activites
		}

	});

	//Edit/new an Activity
	$scope.currentActivity			= null;
	$scope.editMode			= "";
	$scope.currentActivityPosts = [];
	var getActivityPosts = function (activityRecord){
    $scope.currentActivityPosts = []; //Clean the array
    //Get the all the posts
    $.each(activityRecord.gplus_posts,
      function(index,value){
        console.log('loading:'+value);
        var requestData = {};
        requestData.limit=1;
        requestData.id = value;

        $scope.gdeTrackingAPI.activity_post.get(requestData).execute(
          function(response)
      		{
      		  //Check if the backend returned and error
            if (response.code){
              console.log('gdeTrackingAPI.activity_post.get('+value+') responded with Response Code: '+response.code + ' - '+ response.message);
            }else{
              //Push the ActivityPost to the array
              $scope.currentActivityPosts.push(response);
              $scope.$apply();
            }

      		}
      	);
      }
    );

  }

  var populatePGs = function(){
    $scope.currProductGroupList=[];
	  $.each($rootScope.productGroups, function(k,v)
		{
		  var pg = $rootScope.productGroups[k];
		  var pgSelector = {};
		  pgSelector.selected = ($scope.currentActivity.product_groups.indexOf(pg.tag)>=0);
		  pgSelector.tag = pg.tag;
		  pgSelector.description = pg.description;

			$scope.currProductGroupList.push(pgSelector); // Push it as a new object in a JSON array.
		});


  };

  var populateATs = function(){
    $scope.currActivityTypesList=[];
	  $.each($rootScope.activityTypes, function(k,v)
		{
		  var pg = $rootScope.activityTypes[k];
		  var actSelector = {};
		  actSelector.selected = ($scope.currentActivity.activity_types.indexOf(pg.tag)>=0);
		  actSelector.tag = pg.tag;
		  actSelector.description = pg.description;

			$scope.currActivityTypesList.push(actSelector); // Push it as a new object in a JSON array.
		});
  };

	$scope.editGDEActivity = function(activityId){
	  console.log(activityId)
	  //Set the current Editing Activity
	  $scope.currentActivity = $.grep($scope.data.items, function(item){
	    return item.id== activityId;
	  })[0];

	  populatePGs();
	  populateATs();

	  $scope.currentActivity.date_updatedLocale = new Date($scope.currentActivity.date_updated).toLocaleDateString();
    $scope.currentActivity.date_createdLocale = new Date($scope.currentActivity.date_created).toLocaleDateString();

	  //console.log(JSON.stringify($scope.currentActivity));

    $scope.editMode ="Edit";
	  //Load ActivityPost Items for the current ActivityRecord
	  getActivityPosts($scope.currentActivity);

	  //Display the Edit Activity Dialog
	  toggleDialog('singleActivity');

	};

	$scope.newActivity = function(){

	  //Initialize the new Activity
	  $scope.currentActivity ={};

    $scope.currentActivity.gplus_id = $rootScope.usrId;
    $scope.currentActivity.date_updated = new Date().toISOString();
    $scope.currentActivity.date_created = new Date().toISOString();

    $scope.currentActivity.date_updatedLocale = new Date().toLocaleDateString();
    $scope.currentActivity.date_createdLocale = new Date().toLocaleDateString();

    $scope.currentActivity.activity_types = [];
    $scope.currentActivity.product_groups = [];

    populatePGs();
	  populateATs();

	  $scope.editMode = "Create New";

	  //Display the Edit Activity Dialog
	  toggleDialog('singleActivity');
	}

	$scope.updCurrActivity = function(type){
	  console.log(type);
	  if (type=='AT'){
	    $scope.currentActivity.activity_types = [];
  	  $.each($scope.currActivityTypesList, function(k,v)
  		{
  		  var at = $scope.currActivityTypesList[k];
  		  if (at.selected){
  		    $scope.currentActivity.activity_types.push(at.tag);
  		  }
  		});
  		console.log(JSON.stringify($scope.currentActivity.activity_types));
	  }else{
	    $scope.currentActivity.product_groups = [];
  	  $.each($scope.currProductGroupList, function(k,v)
  		{
  		  var pg = $scope.currProductGroupList[k];

  		  if (pg.selected){
  		    $scope.currentActivity.product_groups.push(pg.tag);
  		  }
  		});
  		console.log(JSON.stringify($scope.currentActivity.product_groups));
	  }

	};

	$scope.saveGDEActivity = function(){
	  console.log(JSON.stringify($scope.currentActivity));

	  //TODO: Save the Updated Activity to the BackEnd

	};

});