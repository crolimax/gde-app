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
	$scope.activitiesByGdeName		= [];
	$scope.data					= {};
	$scope.data.items			= [];
	$scope.activitiesByGdeNameTemp	= {};
	$scope.name					= '';
	$scope.userActivities			= [];

	$scope.sort = {
      column: 'date',
      descending: true
  };
  $scope.changeSorting = function(column) {

      var sort = $scope.sort;

      if (sort.column == column) {
          sort.descending = !sort.descending;
      } else {
          sort.column = column;
          sort.descending = false;
      }
  };

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
					
					var impactSlider		= new google.visualization.ControlWrapper();
					impactSlider.setControlType('NumberRangeFilter');
					impactSlider.setContainerId('impactSlider');
					impactSlider.setOptions(
					{
						'filterColumnLabel': 'Total Impact',
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
		.bind([activitiesSlider,resharesSlider,plus1sSlider,commentsSlider,impactSlider], [gdeTableChart,gdeColumnChart])
		.draw(activitiesByGde_data);
	}

	$scope.loadVisualizationLibraries	= google.load('visualization', '1.1', null);
	$scope.getActivitiesFromGAE = function (nextPageToken,gplusId,minDate,maxDate,order)
	{
	  //Empty the scope objects on the first run
	  if (!nextPageToken){
	    $scope.activitiesByGdeName		= [];
    	$scope.data.items			= [];
    	$scope.activitiesByGdeNameTemp	= {};
    	$scope.name					= '';
    	$scope.userActivities			= [];
	  }

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
	$scope.selectedAG			      = null;
	$scope.editMode			        = "";
	$scope.currentActivityPosts = [];
	$scope.usedInMetadata       = {};
	var getActivityPosts = function (activityRecord){
    $scope.currentActivityPosts = []; //Clean the array
    if (activityRecord.gplus_posts){
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
  }

  var populatePGs = function(){
    $scope.currProductGroupList=[];
	  $.each($rootScope.productGroups, function(k,v)
		{
		  var pgSelector = $rootScope.productGroups[k];
		  if ($scope.currentActivity.product_groups){
		    pgSelector.selected = ($scope.currentActivity.product_groups.indexOf(pgSelector.tag)>=0);
		  }else{
		    pgSelector.selected = false;
		  }

			$scope.currProductGroupList.push(pgSelector); // Push it as a new object in a JSON array.
		});

  };

  var populateATs = function(){
    $scope.currActivityTypesList=[];
	  $.each($rootScope.activityTypes, function(k,v)
		{
		  var actSelector = $rootScope.activityTypes[k];

		  if ($scope.currentActivity.activity_types){
		    actSelector.selected = ($scope.currentActivity.activity_types.indexOf(actSelector.tag)>=0);
		  }else{
		    actSelector.selected = false;
		  }

			$scope.currActivityTypesList.push(actSelector); // Push it as a new object in a JSON array.
		});
  };

  var populateAGs = function(){
    $scope.currActivityGroups =[];

    //Loop over the activity and get the activity group of the selected
    $scope.currActivityTypesList.forEach(function(item){

      if (item.selected){
        //search the currActivityGroups to see if the current group is already in the content list
        var result = $.grep($scope.currActivityGroups, function(e){ return e.tag == item.group; });
        if (result.length==0){
          //Get the ActivityGroup
          $rootScope.activityGroups.some(function(ag){
            if(ag.tag==item.group){
              $scope.currActivityGroups.push(ag);
              $scope.updateAG(ag.tag); //Update the Medatada AGs

              return true;
            }
            return false;
          });
        }
      }

    });

    //Reorder the AGs
		if ($scope.currActivityGroups.length>1){
  		$scope.currActivityGroups =
  		  $scope.currActivityGroups.sort(function(a,b){
              var A = a.id.toLowerCase();
              var B = b.id.toLowerCase();
              if (A < B){
                return -1;
              }else if (A > B){
                return  1;
              }else{
                return 0;
              }
  	      });
		}
		if ($scope.currActivityGroups.length>0){
  		//Set the selected tab the first
  		$("#AGTabs").prop('selected',0);
  		$("#core_animated_pages").prop('selected',0);
  		$scope.selectAGIdx=0;
      $scope.selectedAG=$scope.currActivityGroups[0];
      var tmpMetaArray = [];
      //Remove the unused activity_categories
      $scope.currActivityGroups.forEach(function(item){
        //search in the categoty list
        $scope.metadataArray.some(function(meta){
          if (meta.activity_group == item.tag){
            tmpMetaArray.push(meta);
            return true;
          }
          return false;
        });
      });
      $scope.metadataArray = tmpMetaArray;

		}else{
		  //Clean the metadataObject
		  $scope.metadataArray=[];
		}
  };

  var setCurrActivityDefaults = function(){
    //Activity Defaults
    $scope.currentActivity.gplus_id = $rootScope.usrId;
    if ($scope.currentActivity.activity_title==null){
      $scope.currentActivity.activity_title='';
    }

    if($scope.currentActivity.activity_link == null){
      $scope.currentActivity.activity_link = '';
    }
    if ($scope.currentActivity.post_date == null){
      $scope.currentActivity.post_date = $rootScope.utils.dateToCommonString(new Date());
    }
    if ($scope.currentActivity.date_updated==null){
      $scope.currentActivity.date_updated = $rootScope.utils.dateToCommonString(new Date());
    }
    if ($scope.currentActivity.date_created ==null){
      $scope.currentActivity.date_created = $rootScope.utils.dateToCommonString(new Date());
    }
    if ($scope.currentActivity.activity_types==null){
      $scope.currentActivity.activity_types = [];
    }
    if ($scope.currentActivity.product_groups==null){
      $scope.currentActivity.product_groups = [];
    }
    if ($scope.currentActivity.gplus_posts==null){
      $scope.currentActivity.gplus_posts = [];
    }

    if ($scope.currentActivity.plus_oners==null || $scope.currentActivity.plus_oners==""){
	    $scope.currentActivity.plus_oners=0;

	  }
	  if ($scope.currentActivity.resharers==null || $scope.currentActivity.resharers==""){
	    $scope.currentActivity.resharers=0;

	  }
	  if ($scope.currentActivity.comments==null || $scope.currentActivity.comments==""){
	    $scope.currentActivity.comments=0;
	  }

	  //Metadata defaults
	  if($scope.currentActivity.metadata==null){
	    $scope.metadataArray = [];
	  }else{
	    $scope.metadataArray = $scope.currentActivity.metadata;
	    if($scope.currentActivity.length>1){
  	    //Set the local array ordered by activity_group
  	    $scope.metadataArray =
  	      $scope.metadataArray.sort(function(a,b){
              var A = a.activity_group.toLowerCase();
              var B = b.activity_group.toLowerCase();
              if (A < B){
                return -1;
              }else if (A > B){
                return  1;
              }else{
                return 0;
              }
  	      });
	    }
	  }

  };

  $scope.showActivityTypes= function(){
    toggleDialog('selectActivityTypes');
  };

	$scope.showProductGroups= function(){
    toggleDialog('selectProductGroups');
  };

	$scope.editGDEActivity = function(activityId){
	  //console.log(activityId)
	  //Set the current Editing Activity
	  $scope.currentActivity = $.grep($scope.data.items, function(item){
	    return item.id== activityId;
	  })[0];

    //Set the defaults
    setCurrActivityDefaults();

    //Populate Product Groups and Activities for the selection table
	  populatePGs();
	  populateATs();
	  populateAGs();//Populate the ActivityGroups

	  //Formatted Dates
	  $scope.currDate_updatedLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.date_updated));
    $scope.currDate_createdLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.date_created));
    $scope.currPost_dateLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.post_date));

    $scope.currActLink= $scope.currentActivity.activity_link;

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

    //Set the defaults
    setCurrActivityDefaults();

	  //Populate Product Groups and Activities for the selection table
	  populatePGs();
	  populateATs();
    populateAGs();//Populate the ActivityGroups

    //Cleanups and defaults
    $scope.currentActivityPosts = [];

    $scope.currDate_updatedLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.date_updated));
    $scope.currDate_createdLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.date_created));
    $scope.currPost_dateLocale = $rootScope.utils.dateToCommonString(new Date($scope.currentActivity.post_date));
    $scope.currActLink= '';

	  $scope.editMode = "Create New";

	  //Display the Edit Activity Dialog
	  toggleDialog('singleActivity');
	}

	$scope.updCurrActivity = function(type){
	  //console.log(type);
	  if (type=='at'){
	    $scope.currentActivity.activity_types = [];
  	  $.each($scope.currActivityTypesList, function(k,v)
  		{
  		  var at = $scope.currActivityTypesList[k];
  		  if (at.selected){
  		    $scope.currentActivity.activity_types.push(at.tag);
  		  }
  		});
  		//console.log(JSON.stringify($scope.currentActivity.activity_types));

  		//Update the ActivityGroups
  		populateAGs();
	  }else{
	    $scope.currentActivity.product_groups = [];
  	  $.each($scope.currProductGroupList, function(k,v)
  		{
  		  var pg = $scope.currProductGroupList[k];

  		  if (pg.selected){
  		    $scope.currentActivity.product_groups.push(pg.tag);
  		  }
  		});
  		//console.log(JSON.stringify($scope.currentActivity.product_groups));
	  }

	};

	$scope.saveGDEActivity = function(){

    var readyToSave = false;
    //Update Date variales to avoid Insert/Update errors
    var post_date = $rootScope.utils.verifyDateStringFormat($scope.currPost_dateLocale);
    if (post_date!='Invalid Date'){
      //store the date
      $scope.currentActivity.post_date = post_date;
      readyToSave=true;
    }

    if (!readyToSave){
      alert('Invalid Activity Date format, please use YYYY-MM-DD');
    }else{

  	  $scope.currentActivity.metadata = $scope.metadataArray;

  	  //Sanity Checks on Numbers
  	  if ($scope.currentActivity.plus_oners==null || $scope.currentActivity.plus_oners==""){
  	    $scope.currentActivity.plus_oners=0;

  	  }
  	  if ($scope.currentActivity.resharers==null || $scope.currentActivity.resharers==""){
  	    $scope.currentActivity.resharers=0;

  	  }
  	  if ($scope.currentActivity.comments==null || $scope.currentActivity.comments==""){
  	    $scope.currentActivity.comments=0;
  	  }
  	  //Clear data_created and updated that are calculated on the backend
      $scope.currentActivity.date_updated =null;
      $scope.currentActivity.date_created = null;

      $scope.gdeTrackingAPI.activity_record.insert($scope.currentActivity).execute(
        function(response)
    		{

          if (response.code){
            console.log('gdeTrackingAPI.activity_record.insert(DATA) responded with Response Code: '+response.code + ' - '+ response.message);
            console.log(JSON.stringify($scope.currentActivity));
            alert(response.message);
          }else{
            //Delete the activity from the local arrays if in edit
            if ($scope.editMode=='Edit'){
              if ($scope.data.items.length==1){
                  //only one item, re init all the arrays
                  $scope.data.items=[];
                  $scope.activitiesByGdeNameTemp[$scope.name]['activities']=[];
                  $scope.userActivities=[];

              }else{
                //Find the activity index
                var itmId=null;
                for (var i=0;i<$scope.data.items.length;i++){
                  if ($scope.data.items[i].id== response.id){
                    itmId=i;
                    break;
                  }

                }
                if(itmId){
                  //Remove the Old Item
                  $scope.data.items.splice(itmId,1);
                }
                itmId=null;
                //activitiesByGdeNameTemp[$scope.name]
                for (var i=0;i<$scope.activitiesByGdeNameTemp[$scope.name]['activities'].length;i++){
                  if ($scope.activitiesByGdeNameTemp[$scope.name]['activities'][i].id== response.id){
                    itmId=i;
                    break;
                  }

                }
                if(itmId){
                  //Remove the Old Item
                  $scope.activitiesByGdeNameTemp[$scope.name]['activities'].splice(itmId,1);
                }
                itmId=null;
                for (var i=0;i<$scope.userActivities.length;i++){
                  if ($scope.userActivities[i].id== response.id){
                    itmId=i;
                    break;
                  }

                }
                if(itmId){
                  //Remove the Old Item
                  $scope.userActivities.splice(itmId,1);
                }
              }
            }
            //Update the local Arrays
            $scope.data.items.push(response);
            $scope.utils.updateStats($scope.activitiesByGdeNameTemp[$scope.name], response);
            var activity = $scope.utils.activityFromApi(response);
  					$scope.activitiesByGdeNameTemp[$scope.name]['activities'].push(response);
            $scope.userActivities.push(activity);

            //Apply and refresh
            $scope.$apply();
            //drawGeneralStatistics();

            //Hide the dialog
            toggleDialog('singleActivity');
          }

    		}
    	);
    }
	};

  //Metadata functions
  $scope.selectAG = function(agId){
    $.each($scope.currActivityGroups, function(k,v)
		{
		  var ag = $scope.currActivityGroups[k];
		  if(agId==ag.tag){
		    $scope.selectAGIdx=k;
		    $scope.selectedAG=ag;
		    $("#core_animated_pages").prop('selected',k);
		  }
		});
  };

  $scope.updateAG = function(agId){
    var createNew=true;
    //Check if in the metadataArray is present the
    $scope.metadataArray.some(function(item){
      if(item.activity_group==agId){
        //Activity Group found
        createNew=false;

        //Exit the loop
        return true;
      }
      return false;
    });

    if (createNew) {
      //Create a new metadata object for the current activity_group
      var meta = {};
      meta.activity_group=agId;
      $scope.metadataArray.push(meta);
      if($scope.metadataArray.length>1){
        //Reorder the array
        $scope.metadataArray =
  	      $scope.metadataArray.sort(function(a,b){
              var A = a.activity_group.toLowerCase();
              var B = b.activity_group.toLowerCase();
              if (A < B){
                return -1;
              }else if (A > B){
                return  1;
              }else{
                return 0;
              }
  	      });
      }
    }
  };

  $scope.isUsedInMetadata = function(category,field){
    var toRet=false;

    $scope.currActivityGroups.some(function(item){
      if(item.tag==category){
        //Label of the field is null or empty
        if(item[field]==null ||item[field]==''){
          toRet=false;
        }else{
          toRet=true;
        }
        return true;
      }else{
        return false;
      }
    });

    return toRet;
  };

  $scope.getAGFieldTitle = function(category,field){
    var toRet=field;

    $scope.currActivityGroups.some(function(item){
      if(item.tag==category){
        toRet = item[field];
        return true;
      }else{
        return false;
      }
    });

    return toRet;
  };

});