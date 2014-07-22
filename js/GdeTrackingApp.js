"use strict";

// =====================================================================================================
//								Google JS API & AngularJS load control
// =====================================================================================================
google.setOnLoadCallback(function ()
{
    angular.bootstrap(document.body,['GdeTrackingApp']);
});
google.load(
	'visualization',
	'1',
	{
		packages:
			[
				'controls'
			]
	}
);

// =====================================================================================================
//											Polymer
// =====================================================================================================

function toggleDialog(id) 
{
	var dialog = document.querySelector('paper-dialog[id=' + id + ']');
	dialog.toggle();
}
document.addEventListener('polymer-ready', function() 
{
	var navicon		= document.getElementById('navicon');
	var drawerPanel	= document.getElementById('drawerPanel');
	navicon.addEventListener('click', function() 
	{
		drawerPanel.togglePanel();
	});
});
// =====================================================================================================
//											AngularJS
// =====================================================================================================
var GdeTrackingApp	= angular.module('GdeTrackingApp'	, [ 'ngRoute' , 'google-maps' , 'googlePlusSignin' ]);

// *****************************************************************************************************
//  								Dynamic HTML navigation
// *****************************************************************************************************
GdeTrackingApp.config(function($routeProvider)
{
	$routeProvider.
		when('/',
		{
			controller	: 'startCtrl',
			templateUrl	:'html/start.html'
		}).
		when('/myStatistics',
		{
			controller	: 'myStatisticsCtrl',
			templateUrl	:'html/myStatistics.html'
		}).
		when('/generalStatisticsForGooglers',
		{
			controller	: 'generalStatisticsForGooglersCtrl',
			templateUrl	:'html/generalStatisticsForGooglers.html'
		}).
		otherwise({redirectTo:'/'});
});

// *****************************************************************************************************
//   									AngularJS Factories
// *****************************************************************************************************
GdeTrackingApp.factory("gdeList",		[function()
{
	var gdeList	= [];
	
	return gdeList;
}]);
GdeTrackingApp.factory("mapOptions",	[function()
{
	var mapOptions =
	{
		center:
		{
			latitude	: 27.371767300523047,
			longitude	: -3.8203125000000027
		},
		zoom	: 2,
		icon	: {icon:'../img/favicon.png'}
	};
	return mapOptions;
}]);
GdeTrackingApp.factory("mapCenters",	[function()
{
	var mapCenters =
	{
		'World':
		{
			center:
			{
				latitude	: 27.371767300523047,
				longitude	: -3.8203125000000027
			},
			zoom: 2
		},
		'Asia':
		{
			center:
			{
				latitude	: 28.767659105690974,
				longitude	: 91.453125
			},
			zoom: 3
		},
		'Africa':
		{
			center:
			{
				latitude	: 6.140554782450104,
				longitude	: 23.601562499999996
			},
			zoom: 3
		},
		'Europe':
		{
			center:
			{
				latitude	: 58.35563036280954,
				longitude	: 19.910156249999996
			},
			zoom: 3
		},
		'North America':
		{
			center:
			{
				latitude	: 49.610709938074166,
				longitude	: -100.67578125
			},
			zoom: 3
		},
		'South America':
		{
			center:
			{
				latitude	: -21.616579336740593,
				longitude	: -60.0703125
			},
			zoom: 3
		},
		'Oceania':
		{
			center:
			{
				latitude	: -23.725011735951973,
				longitude	: 129.59765625
			},
			zoom: 4
		}
	};
	return mapCenters;
}]);
GdeTrackingApp.factory("mapMarkers",	[function()
{
	var mapMarkers = [];
	
	return mapMarkers;
}]);

// *****************************************************************************************************
//      						utility functions for accumulating stats
// *****************************************************************************************************
GdeTrackingApp.run(function ($rootScope) {
	$rootScope.utils = {
		'postFromApi': function (apiData) {
			var post = {};
			post.gde_name		= apiData.gde_name;
			post.title			= apiData.activity_title;
			post.url			= apiData.activity_link;
			post.gplus_id		= apiData.gplus_id;
			post.resharers		= parseInt(apiData.resharers || 0, 10);
			post.post_id		= apiData.id;
			post.plus_oners		= parseInt(apiData.plus_oners || 0, 10);
			post.date			= apiData.post_date;
			post.id				= apiData.id;
			post.product_group	= apiData.product_groups;
			post.activity_type	= apiData.activity_types;
			return post;
		},
		'updateStats': function (dataset, apiData) {
			dataset['totalPlus1s']		= (dataset['totalPlus1s'] || 0) + parseInt(apiData.plus_oners || 0, 10);
			dataset['totalResharers']	= (dataset['totalResharers'] || 0) + parseInt(apiData.resharers || 0, 10);
		}
	};
});
// *****************************************************************************************************
//    								plusLoginCtrl Controller
//					Library source: http://jeradbitner.com/angular-directive.g-signin/
// *****************************************************************************************************
GdeTrackingApp.controller('plusLoginCtrl',						function($scope,	$location,	$http,	$rootScope)
{
	$location.path('/');		// Forces the App to always load in the Welcome Screen
	$scope.$on('event:google-plus-signin-success', function (event, authResult)
	{																				// User successfully authorized the G+ App!
//		console.log(event);
		$('.signinButton')	.css('display','none');
		$('.signout')		.css('display','block');
		gapi.client.load('plus', 'v1', function()
		{
			var request	= gapi.client.plus.people.get(
			{
				'userId': 'me'
			});
			request.execute(function(resp)
			{
//				console.log(resp);
				$rootScope.$broadcast('gde:logged',resp.displayName);
				$scope.userName			= resp.displayName;
				$scope.userImageUrl		= (resp.image.url).replace("=50", "=90");
				$scope.userEmails		= resp.emails;
				$scope.id				= resp.id;
				$rootScope.usrId		= resp.id;
				
			    for (var i=0;i<$scope.userEmails.length;i++)
				{
					var emailDomain = $scope.userEmails[i].value.substring($scope.userEmails[i].value.indexOf('@'));
					if (emailDomain == '@google.com')	//	Detect if domain matches an official Google domain (Googlers only).
					{
						console	.log('You are a Googler!');
						console	.log('Hope you like the detailed GDE program statistics.');
						$('#generalStatisticsForGooglers')	.css('display','block');
					}
				}
    			
				$('.userName')	.text($scope.userName);	// Binds the user name into the DOM using a class via jQuery so it can be repeated throughout the document.
				var userImage			= document.createElement('img');
				userImage.src			= $scope.userImageUrl;
				userImage.alt			= 'g+ image';
				$('#userImg')	.html(userImage);
				
				var checkUserEndPointURL = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/account/'+resp.id+'?fields=type';
				//Get the user Account Object
				$http({method: 'GET', url: checkUserEndPointURL})
				.success(function(response, status, config)
				{
					$scope.type	= response.type;
					console.log('Welcome '+$scope.userName+'!');
					
					$('#generalStatisticsForGooglers')			.css('display','none');	//Hide the previously shown menu
					//Show the right menu by user type
					switch (response.type){
					    case 'administrator':
					        console.log('You are an administrator of this app!');
					        $('#generalStatisticsForGooglers')	.css('display','block');
					        break;
					    case 'manager':
					        console.log('You are a manager of this app!');
					        $('#generalStatisticsForGooglers')	.css('display','block');
					        break;
					    case 'active':
					        console.log('You are a GDE!');
					        $('#gdeStatistics')					.css('display','block');
					        break;
					    default:
					        break;	//disabled users

					}
				})
				/*
				.error(function(response, status, config)//....doesn't work with 404 responses
				{
				    console.log('error');
				    //Googlers are not stored in
				    for (var i=0;i<$scope.userEmails.length;i++)
    				{
    					var emailDomain = $scope.userEmails[i].value.substring($scope.userEmails[i].value.indexOf('@'));
    					//if (emailDomain == '@google.com')
    					if (emailDomain == '@mail.com')
    					{
    						console.log('Welcome Googler '+$scope.userName+'!');
    						$('#generalStatisticsForGooglers').css('display','block');
    					}
    				}
				})*/
				;
				
			});
		});
	});
	$scope.$on('event:google-plus-signin-failure', function (event, authResult)
	{																					// User has not authorized the G+ App!
		$('.signinButton')	.css('display','block');
//		$('.signout')		.css('display','none');
		$('#userImg')		.html = '';
		$('.userName')		.text= '';
		console.log('Error in sign in flow.');
		console.log(authResult);
	});
});

// *****************************************************************************************************
//    								paper-fab Controller
// *****************************************************************************************************
GdeTrackingApp.controller("fabCtrl",							function($scope,	$location)
{
	$('paper-fab')	.click( function()			// Triggers Animation on paper-fab click
	{
		if ($('paper-fab')	.attr('id')	== 'fabLeft')			// Cycle between left and right animation
		{
//			console.log('left');
			$('.mapArea')		.css('-webkit-animation'	, 'mapSlideLeft		1s	linear	1	both');	//	-webkit- CSS3 animation
			$('.mapArea')		.css('animation'			, 'mapSlideLeft		1s	linear	1	both');	//	W3C	CSS3 animation
			$('paper-fab')		.css('-webkit-animation'	, 'fabGoesLeft		1s	linear	1	both');	//	-webkit- CSS3 animation
			$('paper-fab')		.css('animation'			, 'fabGoesLeft		1s	linear	1	both');	//	W3C	CSS3 animation
			$('paper-fab')		.attr('id','fabRight');		//	Updates the element's id
			setTimeout(function()	//	Show GDE List
				{
					$('.gdeList')	.css('opacity' , '1');
					$('.scrollBar')	.css('display' , 'inline');
					$('.scrollBar')	.css('overflow-y' , 'auto');
				},
				1010				//	Wait 1 second before showing
			);
		}	else if ($('paper-fab')	.attr('id')	== 'fabRight')
		{
//			console.log('right');
			$('.gdeList')		.css('opacity' 				, '0');		
			$('.scrollBar')		.css('overflow-y' 			, 'hidden');
			$('.scrollBar')		.css('display' 				, 'block');								//	Hice GDE List
			$('.mapArea')		.css('-webkit-animation'	, 'mapSlideRight	1s	linear	1	both');	//	-webkit- CSS3 animation
			$('.mapArea')		.css('animation'			, 'mapSlideRight	1s	linear	1	both');	//	W3C	CSS3 animation
			$('paper-fab')		.css('-webkit-animation'	, 'fabGoesRight		1s	linear	1	both');	//	-webkit- CSS3 animation
			$('paper-fab')		.css('animation'			, 'fabGoesRight		1s	linear	1	both');	//	W3C	CSS3 animation
			$('paper-fab')		.attr('id','fabLeft');		//	Updates the element's id
		};
	});
});

// *****************************************************************************************************
//    									Menu Controller
// *****************************************************************************************************
GdeTrackingApp.controller("menuCtrl",							function($scope,	$location)
{
	$scope.showGeneralStatisticsForGooglers	= function()	// Click detection
	{
//		console.log('showGeneralStatisticsForGooglers');
		$location.path('/generalStatisticsForGooglers');
	};
	$scope.showGdeStatistics				= function()	// Click detection
	{
//		console.log('showGdeStatistics');
		$location.path('/myStatistics');
	};
});

// *****************************************************************************************************
//    								Google Maps Controller
// *****************************************************************************************************
GdeTrackingApp.controller("startCtrl",							function($scope,	$http,	mapOptions,	mapCenters,	mapMarkers)
{
	var mapWidth		= screen.width	* 0.7	+ 'px';	// Adjust Google Maps container to 70% of screen width
	var mapHeight		= screen.height	* 0.6	+ 'px';	// Adjust Google Maps container to 60% of screen height
	$('.mapZone')						.css('width',	mapWidth);
	$('.mapZone')						.css('height',	mapHeight);
	$('.angular-google-map-container')	.css('width',	mapWidth);
	$('.angular-google-map-container')	.css('height',	mapHeight);
	$('.angular-google-map-container')	.css('border-bottom-left-radius',	'0.5em');
	$('.angular-google-map-container')	.css('border-bottom-right-radius',	'0.5em');
	$scope.map			= mapOptions;
	$scope.focusMap		= function (zone)
	{
		mapOptions	= mapCenters[zone];
		$scope.map	= mapOptions;
	};
	$scope.markers		= mapMarkers;
	$scope.gdeList		= [];
	$scope.gdeNumber	= '...';
	var getGdeListEndPointURL	= 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/account/account?limit=100&type=active';
	
	$scope.getGdeList			= function (userURL)
	{
//	    console.log($scope.gdeList.length);
//	    console.log(userURL);
	    $http({method: 'GET', url: userURL})
		.success(function(response, status, config)
		{
//			console.log('getPostsFromGAE response ok');
			for	(var i=0;	i<response.items.length;	i++)
			{
			    //MSO - 20140605 - Check the deleted field
			    if (response.items[i].deleted==false)
				{
//					console.log(response.items[i]);
				    $scope.gdeList.push(response.items[i]);
				}
			};
//			console.log(response);
			if	(response.nextPageToken)	// If there is still more data
			{
				var nextUrl			= getGdeListEndPointURL+'&pageToken='+response.nextPageToken; // Adjust the end point URL
				$scope.getGdeList(nextUrl);	// Add the next page
			} else
			{
			    $scope.gdeNumber	= $scope.gdeList.length;
    			for (var i=0;i<$scope.gdeNumber;i++)
    			{
    				var coords					= JSON.parse($scope.gdeList[i].geocode);
    				var badge					= $scope.gdeList[i].pg_filename;
    				var gdeName					= $scope.gdeList[i].display_name;
    				var gdeBadge				= $scope.gdeList[i].product_group;
    				var icon					= 'img/badges/'+badge+'.png';
					$scope.gdeList[i].pic_url	= ($scope.gdeList[i].pic_url).replace("=50", "=100");
    				mapMarkers[i]				= {};
    				mapMarkers[i]["latitude"]	= coords.lat;
    				mapMarkers[i]["longitude"]	= coords.lng;
    				mapMarkers[i]["icon"]		= icon;
    				mapMarkers[i]["name"]		= gdeName;
    				mapMarkers[i]["badge"]		= gdeBadge;
    			};
    			$scope.markers		= mapMarkers;
    			$scope.markerClick	= function(name,badge)
    			{
    				window.alert(name+' - ' + badge + ' GDE');
    			};	
				//	Trigger CSS3 animation after map loads
				$('paper-fab')	.css('-webkit-animation'	, 'fabAppears	2s	linear	1	both');	//	-webkit- CSS
				$('paper-fab')	.css('animation'			, 'fabAppears	2s	linear	1	both');	//	W3C	CSS
				$('.mapArea')	.css('-webkit-animation'	, 'mapAppears	2s	linear	1	both');	//	-webkit- CSS
				$('.mapArea')	.css('animation'			, 'mapAppears	2s	linear	1	both');	//	W3C	CSS
			}
		})
		.error(function(response, status, config)
		{
			window.alert('There was a problem connecting with Google App Engine. Try again in a few minutes. Error: '+status);
		});
	};
	$scope.getGdeList(getGdeListEndPointURL);
	
});

// *****************************************************************************************************
//    								Statistics Controllers
// *****************************************************************************************************
GdeTrackingApp.controller("generalStatisticsForGooglersCtrl",	function($scope,	$http)
{
	$('paper-fab')		.css('-webkit-animation',	'hideFab	1s	linear	1	both');	//	-webkit- CSS3 animation
	$('paper-fab')		.css('animation',			'hideFab	1s	linear	1	both');	//	W3C	CSS3 animation
	
// -----------------------------------------------------------------------------------------------------
//     								General Statistics by GDE
// -----------------------------------------------------------------------------------------------------
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
	var drawGeneralStatistics		= function ()
	{	// For every GDE in postByGdeNameTemp
//		console.log('drawGeneralStatistics initiated');
		$.each($scope.postByGdeNameTemp,	function(k,v)
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
					},
					{
						id		: 'activitiesLogged',
						label	: 'Activities Logged',
						type	: 'number'
					},
					{
						id		: 'totalResharers',
						label	: 'Total Resharers',
						type	: 'number'
					},
					{
						id		: 'totalPlus1s',
						label	: 'Total +1s',
						type	: 'number'
					}
				],
			rows: []
		};
		for (var i=0;i<$scope.postByGdeName.length;i++)
		{
			var gdeName				= $scope.postByGdeName[i].name;
			var activitiesLogged	= $scope.postByGdeName[i].posts.length;
			var totalResharers		= $scope.postByGdeName[i].totalResharers;
			var totalPlus1s			= $scope.postByGdeName[i].totalPlus1s;
			var gde					= {c:[]};
			gde.c.push({v:gdeName});
			gde.c.push({v:activitiesLogged});
			gde.c.push({v:totalResharers});
			gde.c.push({v:totalPlus1s});
			activitiesByGde.rows.push(gde);
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
				},
				{
					id		: 'activitiesLogged',
					label	: 'Activities Logged',
					type	: 'number'
				},
				{
					id		: 'totalResharers',
					label	: 'Total Resharers',
					type	: 'number'
				},
				{
					id		: 'totalPlus1s',
					label	: 'Total +1s',
					type	: 'number'
				}
			],
			rows: []
		};
		for (var i=0;i<$scope.postByProduct.length;i++)
		{
			var productName			= $scope.postByProduct[i].product;
			var activitiesLogged	= $scope.postByProduct[i].posts.length;
			var totalResharers		= $scope.postByProduct[i].totalResharers;
			var totalPlus1s			= $scope.postByProduct[i].totalPlus1s;
			var product				= {c:[]};
			product.c.push({v:productName});
			product.c.push({v:activitiesLogged});
			product.c.push({v:totalResharers});
			product.c.push({v:totalPlus1s});
			postByProduct.rows.push(product);
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
				},
				{
					id		: 'activitiesLogged',
					label	: 'Activities Logged',
					type	: 'number'
				},
				{
					id		: 'totalResharers',
					label	: 'Total Resharers',
					type	: 'number'
				},
				{
					id		: 'totalPlus1s',
					label	: 'Total +1s',
					type	: 'number'
				}
			],
			rows: []
		};
		for (var i=0;i<$scope.postByActivity.length;i++)
		{
			var activityName		= $scope.postByActivity[i].activity;
			var activitiesLogged	= $scope.postByActivity[i].posts.length;
			var totalResharers		= $scope.postByActivity[i].totalResharers;
			var totalPlus1s			= $scope.postByActivity[i].totalPlus1s;
			var product				= {c:[]};
			product.c.push({v:activityName});
			product.c.push({v:activitiesLogged});
			product.c.push({v:totalResharers});
			product.c.push({v:totalPlus1s});
			postByActivity.rows.push(product);
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
							},
							{
								id		: 'activitiesLogged',
								label	: 'Activities Logged',
								type	: 'number'
							},
							{
								id		: 'totalResharers',
								label	: 'Total Resharers',
								type	: 'number'
							},
							{
								id		: 'totalPlus1s',
								label	: 'Total +1s',
								type	: 'number'
							}
						],
						rows: []
					};
					for (var i=0;i<$scope.postByRegion.length;i++)
					{
						var regionName			= $scope.postByRegion[i].region;
						var activitiesLogged	= $scope.postByRegion[i].posts.length;
						var totalResharers		= $scope.postByRegion[i].totalResharers;
						var totalPlus1s			= $scope.postByRegion[i].totalPlus1s;
						var gde					= {c:[]};
						gde.c.push({v:regionName});
						gde.c.push({v:activitiesLogged});
						gde.c.push({v:totalResharers});
						gde.c.push({v:totalPlus1s});
						postsByRegion.rows.push(gde);
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
					gdeSelector.setControlType('CategoryFilter');
					gdeSelector.setContainerId('gdeSelector');
					gdeSelector.setOptions(
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

					var gdeTableChart			= new google.visualization.ChartWrapper();
					gdeTableChart.setChartType('Table');
					gdeTableChart.setContainerId('gdeTableChart');
					gdeTableChart.setOptions(
					{
						'sortColumn': 1,
						'sortAscending': false,
						'page': 'enable',
						'pageSize':30
					});
					
					var gdePieChart				= new google.visualization.ChartWrapper();
					gdePieChart.setChartType('PieChart');
					gdePieChart.setContainerId('gdePieChart');
					gdePieChart.setOptions(
					{
						'width'				: 700,
						'pieHole'			: 0.5,
						'reverseCategories'	: true,
						'pieStartAngle'		: 30,
						'slices':
						[
							{'offset': 0.2},
							{'offset': 0.195},
							{'offset': 0.19},
							{'offset': 0.185},
							{'offset': 0.18},
							{'offset': 0.175},
							{'offset': 0.17},
							{'offset': 0.165},
							{'offset': 0.16},
							{'offset': 0.155},
							{'offset': 0.15},
							{'offset': 0.145},
							{'offset': 0.14},
							{'offset': 0.135},
							{'offset': 0.13},
							{'offset': 0.125},
							{'offset': 0.12},
							{'offset': 0.115},
							{'offset': 0.11},
							{'offset': 0.105},
							{'offset': 0.1},
							{'offset': 0.095},
							{'offset': 0.09},
							{'offset': 0.085},
							{'offset': 0.08},
							{'offset': 0.075},
							{'offset': 0.07},
							{'offset': 0.065},
							{'offset': 0.06},
							{'offset': 0.055},
							{'offset': 0.05},
							{'offset': 0.045},
							{'offset': 0.04},
							{'offset': 0.035},
							{'offset': 0.03},
							{'offset': 0.025},
							{'offset': 0.02},
							{'offset': 0.015},
							{'offset': 0.01}
						],
						'legend':
						{
							'position'	: 'top',
							'alignment'	: 'center',
							'maxLines'	: 4
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
						'width'				:700,
						'isStacked'			: true,
						'reverseCategories'	: true,
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
							'maxLines'	:4
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
					
					var activityBarChart			= new google.visualization.ChartWrapper();
					activityBarChart.setChartType('BarChart');
					activityBarChart.setContainerId('activityBarChart');
					activityBarChart.setOptions(
					{
						'width'			:700,
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
						'width'				:700,
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
		.bind([platformsSelector,platformsActivitiesSlider,platformsResharesSlider,platformsPlus1sSlider], [platformsTableChart,platformsBarChart])
		.draw(postByProduct_data);
					
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByGDE'))
		.bind([gdeSelector,activitiesSlider,resharesSlider,plus1sSlider], [gdeTableChart,gdePieChart])
		.draw(activitiesByGde_data);
					
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByActivity'))
		.bind([activities_Selector,activities_ActivitiesSlider,activities_ResharesSlider,activities_Plus1sSlider], [activityTableChart,activityBarChart])
		.draw(postByActivity_data);
					
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByRegion'))
		.bind([region_Selector,region_ActivitiesSlider,region_ResharesSlider,region_Plus1sSlider], [regionTableChart,regionBarChart])
		.draw(postByRegion_data);
	}
				
	var getPostsEndPointURL = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?limit=100';
	$scope.loadVisualizationLibraries = google.load('visualization', '1.1', null);
	$scope.getPostsFromGAE = function (getPostsEndPointURL)
	{
		$http({method: 'GET', url: getPostsEndPointURL})
		.success(function(response, status, config)
		{
//			console.log('getPostsFromGAE response ok');
			for (var i=0;i<response.items.length;i++)
			{
				$scope.data.items.push(response.items[i]);
			};
			
			if (response.nextPageToken) // If there is still more data
			{
				var nextUrl = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?limit=100&pageToken='+response.nextPageToken; // Adjust the end point URL
				$scope.getPostsFromGAE(nextUrl); // Add the next page
			} else
			{
				// Done
//				console.log(data.items);
				for (var i=0;i<$scope.data.items.length;i++) // Posts by GDE Name
				{
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
				};
//				console.log(postByGdeNameTemp);
				for (var i=0;i<$scope.data.items.length;i++)// Posts by Product
				{
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
								$scope.postByProductTemp[product]['totalPlus1s']		= 0;	// Initialize a new acumulator for total+1s
							}

							$scope.utils.updateStats($scope.postByProductTemp[product], $scope.data.items[i]);

							var post = $scope.utils.postFromApi($scope.data.items[i]);
							$scope.postByProductTemp[product]['posts'].push(post);
						}
					};
				};
//				console.log($scope.postByProductTemp);
				for (var i=0;i<$scope.data.items.length;i++)// Posts by Activity Type
				{
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
				};
//				console.log($scope.postByActivityTemp);
				for (var i=0;i<$scope.data.items.length;i++) // Posts by GDE Region
				{
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
				};
//				console.log(postByRegionTemp);
				drawGeneralStatistics()
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
GdeTrackingApp.controller("myStatisticsCtrl",					function($scope,	$location,	$http,	$rootScope)
{
	$('paper-fab')		.css('-webkit-animation',	'hideFab	1s	linear	1	both');	//	-webkit- CSS3 animation
	$('paper-fab')		.css('animation',			'hideFab	1s	linear	1	both');	//	W3C	CSS3 animation
	
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
				},
				{
					id		: 'activitiesLogged',
					label	: 'Activities Logged',
					type	: 'number'
				},
				{
					id		: 'totalResharers',
					label	: 'Total Resharers',
					type	: 'number'
				},
				{
					id		: 'totalPlus1s',
					label	: 'Total +1s',
					type	: 'number'
				}
			],
			rows	: []
		};
		for (var i=0;i<$scope.postByGdeName.length;i++)
		{
//			console.log($('.userName').text());
			var gdeName				= $scope.postByGdeName[i].name;
			var activitiesLogged	= $scope.postByGdeName[i].posts.length;
			var totalResharers		= $scope.postByGdeName[i].totalResharers;
			var totalPlus1s			= $scope.postByGdeName[i].totalPlus1s;
			var gde					= {c:[]};
			gde.c.push({v:gdeName});
			gde.c.push({v:activitiesLogged});
			gde.c.push({v:totalResharers});
			gde.c.push({v:totalPlus1s});
			activitiesByGde.rows.push(gde);
		};
//			console.log(activitiesByGde);
		
					
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
						'pieHole'			: 0.5,
						'reverseCategories'	: true,
						'pieStartAngle'		:30,
						'slices':
						[
							{'offset': 0.2},
							{'offset': 0.195},
							{'offset': 0.19},
							{'offset': 0.185},
							{'offset': 0.18},
							{'offset': 0.175},
							{'offset': 0.17},
							{'offset': 0.165},
							{'offset': 0.16},
							{'offset': 0.155},
							{'offset': 0.15},
							{'offset': 0.145},
							{'offset': 0.14},
							{'offset': 0.135},
							{'offset': 0.13},
							{'offset': 0.125},
							{'offset': 0.12},
							{'offset': 0.115},
							{'offset': 0.11},
							{'offset': 0.105},
							{'offset': 0.1},
							{'offset': 0.095},
							{'offset': 0.09},
							{'offset': 0.085},
							{'offset': 0.08},
							{'offset': 0.075},
							{'offset': 0.07},
							{'offset': 0.065},
							{'offset': 0.06},
							{'offset': 0.055},
							{'offset': 0.05},
							{'offset': 0.045},
							{'offset': 0.04},
							{'offset': 0.035},
							{'offset': 0.03},
							{'offset': 0.025},
							{'offset': 0.02},
							{'offset': 0.015},
							{'offset': 0.01}
						],
						'legend':
						{
							'position'	:'top',
							'alignment'	:'center',
							'maxLines'	:4
						}
					});
		new google.visualization.Dashboard(document.getElementById('generalStatisticsByGDE'))// Draw Charts
		.bind([activitiesSlider,resharesSlider,plus1sSlider], [gdeTableChart,gdeColumnChart])
		.draw(activitiesByGde_data);
	}
				
	var getPostsEndPointURL = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?limit=100';
	$scope.loadVisualizationLibraries = google.load('visualization', '1.1', null);
	$scope.getPostsFromGAE = function (getPostsEndPointURL)
	{
		$http({method: 'GET', url: getPostsEndPointURL})
		.success(function(response, status, config)
		{
			for (var i=0;i<response.items.length;i++)
			{
				$scope.data.items.push(response.items[i]);
			};
			if (response.nextPageToken)													// If there is still more data
			{
				var nextUrl = 'https://omega-keep-406.appspot.com/_ah/api/gdetracking/v1.0b1/activityRecord/activityRecord?limit=100&pageToken='+response.nextPageToken; // Adjust the end point URL
				$scope.getPostsFromGAE(nextUrl);										// Add the next page
			} else
			{																			// Done
//				console.log($scope.data.items);
				if ($('.userName').text())												// Check if the user it's a valid GDE.
				{
//					console.log('User was logged in');
					for (var i=0;i<$scope.data.items.length;i++)						// Posts by GDE Name
					{
						$scope.name = $scope.data.items[i].gde_name;
						var loggedGdeName = $('.userName').text();
						var loggetGdePlusID = $rootScope.usrId;
						//if ($scope.data.items[i].gde_name == loggedGdeName)           //Username filter might filter out some result as the GDE Name associate to the Activity was the Name in Google Plus and now is the one from the GDE Master List
						if ($scope.data.items[i].gplus_id == loggetGdePlusID)           //Use the user Google Plus ID to filter the activity records
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
