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