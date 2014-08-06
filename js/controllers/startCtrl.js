// *****************************************************************************************************
//    								Google Maps Controller
// *****************************************************************************************************
GdeTrackingApp.controller("startCtrl",							function($scope,	$http,	mapOptions,	mapCenters,	mapMarkers)
{
	var loadingToast	= document.querySelector('paper-toast[id="loading"]');	// Show loading sign
	loadingToast.show();
	
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