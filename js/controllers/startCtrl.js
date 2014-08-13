// *****************************************************************************************************
//    								Google Maps Controller
// *****************************************************************************************************
GdeTrackingApp.controller("startCtrl",							function($rootScope, $scope,	$http,	mapOptions,	mapCenters,	mapMarkers)
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

	$scope.gdeTrackingAPI = null;
  if ($rootScope.is_backend_ready){
    $scope.gdeTrackingAPI = gapi.client.gdetracking;
  }

	$scope.getGdeList			= function (nextPageToken)
	{
		//console.log($scope.gdeList.length);
		//console.log(userURL);
		//Create request data object
		var requestData = {};
		requestData.limit=100;
		requestData.type = 'active';
		requestData.pageToken=nextPageToken;

		$scope.gdeTrackingAPI.account.list(requestData).execute(
		function(response)
		{
			//Check if the backend returned and error
			if (response.code){
			  window.alert('There was a problem connecting with Google App Engine. Try again in a few minutes. Error: '+response.code + ' - '+ response.message);
			}else{
			  //response is ok
			  for	(var i=0;	i<response.items.length;	i++)
			  {
				  //MSO - 20140605 - exclude the deleted
				  if (response.items[i].deleted==false)
				  {
					//console.log(response.items[i]);
					$scope.gdeList.push(response.items[i]);
				  }
			  };
			  //console.log(response);
			  if	(response.nextPageToken)	// If there is still more data
			  {
				$scope.getGdeList(response.nextPageToken);	// Get the next page
			  } else
			  {
					$scope.gdeNumber	= $scope.gdeList.length;
					for (var i=0;i<$scope.gdeNumber;i++)
					{
						$scope.gdeList[i].pic_url		= ($scope.gdeList[i].pic_url).replace("=50", "=100");
					  
						var coords						= JSON.parse($scope.gdeList[i].geocode);
						var badge						= $scope.gdeList[i].pg_filename;
						var icon						= 'img/badges/'+badge+'.png';
					  
						var gdeName						= $scope.gdeList[i].display_name;
						var gdePic						= $scope.gdeList[i].pic_url;
						var gdeBadge					= badge;
						var gdeProducts					= $scope.gdeList[i].product_group;
						var gdeCountry					= $scope.gdeList[i].country;
						var ctry_filename				= $scope.gdeList[i].ctry_filename;
					  
						mapMarkers[i]					= {};
					  
						mapMarkers[i]["latitude"]		= coords.lat;
						mapMarkers[i]["longitude"]		= coords.lng;
						mapMarkers[i]["icon"]			= icon;
					  
						mapMarkers[i]["id"]				= "gde" + i;;
						mapMarkers[i]["name"]			= gdeName;
						mapMarkers[i]["badge"]			= gdeBadge;
						mapMarkers[i]["pic"]			= gdePic;
						mapMarkers[i]["products"]		= gdeProducts;
						mapMarkers[i]["country"]		= gdeCountry;
						mapMarkers[i]["ctry_filename"]	= ctry_filename;
					};
					$scope.markers		= mapMarkers;
					$scope.markerClick	= function(id)
					{
	//					window.alert(name+' - ' + badge + ' GDE');
						var gdeId	= '#'+id;
						$('window').attr("show",true);
						console.log(gdeId);
					};
					//	Trigger CSS3 animation after map loads
					$('paper-fab')	.css('-webkit-animation'	, 'fabAppears	2s	linear	1	both');	//	-webkit- CSS
					$('paper-fab')	.css('animation'			, 'fabAppears	2s	linear	1	both');	//	W3C	CSS
					$('.mapArea')	.css('-webkit-animation'	, 'mapAppears	2s	linear	1	both');	//	-webkit- CSS
					$('.mapArea')	.css('animation'			, 'mapAppears	2s	linear	1	both');	//	W3C	CSS
					$scope.$apply();
				}
			}
		});
	};
	
	if ($rootScope.is_backend_ready){
	  $scope.getGdeList();
	}

	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('startCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//run the function to get data from the backend
		$scope.getGdeList();
	});

});