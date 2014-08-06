"use strict";

// =====================================================================================================
//											AngularJS
// =====================================================================================================
var GdeTrackingApp	= angular.module('GdeTrackingApp'	, [ 'ngRoute' , 'google-maps' , 'googlePlusSignin' ]);

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

function onGapiClientLoad(){
  //Get the RootScope
  var rootScope = angular.element(document.body).scope();
  var ROOT = 'https://omega-keep-406.appspot.com/_ah/api';
      gapi.client.load('gdetracking', 'v1.0b1', function() {
        rootScope.is_backend_ready=true;
        console.log('GdeApp Backend API LOADED!');

        //Broadcast that the API is ready
        rootScope.$broadcast('event:gde-app-back-end-ready',gapi.client.gdetracking);
        console.log('event emitted');

      }, ROOT);
}

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
	var mapMarkers	= [];

	return mapMarkers;
}]);
GdeTrackingApp.factory("years",			[function()
{
	var years		= [];
	years			.push({"value":"2013"});
	years			.push({"value":"2014"});

	return years;
}]);
GdeTrackingApp.factory("months",		[function()
{
	var months		= [];
	months			.push({"value":"January"});
	months			.push({"value":"February"});
	months			.push({"value":"March"});
	months			.push({"value":"April"});
	months			.push({"value":"May"});
	months			.push({"value":"June"});
	months			.push({"value":"July"});
	months			.push({"value":"August"});
	months			.push({"value":"September"});
	months			.push({"value":"October"});
	months			.push({"value":"November"});
	months			.push({"value":"December"});

	return months;
}]);

// *****************************************************************************************************
//						Utility functions for accumulating and displaying stats
// *****************************************************************************************************
GdeTrackingApp.run(function ($rootScope)
{
  $rootScope.is_backend_ready=false;

	$rootScope.utils =
	{
		'postFromApi': function (apiData)
		{
			var post = {};
			post.gde_name		= apiData.gde_name;
			post.title			= apiData.activity_title;
			post.url			= apiData.activity_link;
			post.gplus_id		= apiData.gplus_id;
			post.resharers		= parseInt(apiData.resharers	|| 0, 10);
			post.comments		= parseInt(apiData.comments		|| 0, 10);
			post.post_id		= apiData.id;
			post.plus_oners		= parseInt(apiData.plus_oners	|| 0, 10);
			post.date			= apiData.post_date;
			post.id				= apiData.id;
			post.product_group	= apiData.product_groups;
			post.activity_type	= apiData.activity_types;
			return post;
		},
		'updateStats': function (dataset, apiData)
		{
			dataset.totalPlus1s		= (dataset.totalPlus1s		|| 0) + parseInt(apiData.plus_oners	|| 0, 10);
			dataset.totalResharers	= (dataset.totalResharers	|| 0) + parseInt(apiData.resharers	|| 0, 10);
			dataset.totalComments	= (dataset.totalComments	|| 0) + parseInt(apiData.comments	|| 0, 10);
		},
		'addMetricColumns': function (chartData)
		{
			chartData.cols.push(
			{
				id		: 'activitiesLogged',
				label	: 'Activities Logged',
				type	: 'number'
			});
			chartData.cols.push(
			{
				id		: 'totalResharers',
				label	: 'Total Resharers',
				type	: 'number'
			});
			chartData.cols.push(
			{
				id		: 'totalPlus1s',
				label	: 'Total +1s',
				type	: 'number'
			});
			chartData.cols.push({
				id		: 'totalComments',
				label	: 'Total Comments',
				type	: 'number'
			});
		},
		'chartDataRow'	: function (label, activityRecord)
		{
			var row					= {c:[]};

			var activitiesLogged	= activityRecord.posts.length;
			var totalResharers		= activityRecord.totalResharers;
			var totalPlus1s			= activityRecord.totalPlus1s;
			var totalComments		= activityRecord.totalComments;

			row.c.push({v:label});
			row.c.push({v:activitiesLogged});
			row.c.push({v:totalResharers});
			row.c.push({v:totalPlus1s});
			row.c.push({v:totalComments});

			return row;
		}
	};
});

