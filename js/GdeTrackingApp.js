"use strict";

// =====================================================================================================
//											AngularJS
// =====================================================================================================
var GdeTrackingApp	= angular.module('GdeTrackingApp'	, [ 'ngRoute' , 'google-maps' , 'googlePlusSignin' , 'ng-polymer-elements']);

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
      gapi.client.load('gdetracking', 'v1.0b2', function() {
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


// =====================================================================================================
//											Bagde Creator
// =====================================================================================================

document.querySelector('#avatarForm').addEventListener('submit',function(evt){
	document.querySelector('gde-badge').setAttribute('userid', document.querySelector('#userid').value);
    evt.preventDefault();
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

GdeTrackingApp.factory("activityTypes",		[function()
{
	var activityTypes		= [];
	activityTypes.push({tag:'#bugreport',description:'Bug reports: Report a bug on Google APIs'});
  activityTypes.push({tag:'#article',description:'Article: Write a technical article about use cases, tips & tricks, or particular use and experience using an API'});
  activityTypes.push({tag:'#blogpost',description:'Blog post: Write something less technical or less formal but still informative and helpful informations for developers'});
  activityTypes.push({tag:'#book',description:'Book: Publish a complete book about a technology, best practices, examples, guides, etc... must appear in print or digital format'});
  activityTypes.push({tag:'#techdocs',description:'Technical documentation: Help improve the documentation on Google open source projects'});
  activityTypes.push({tag:'#translation',description:'Translation: Translate documentation or useful articles from English into the native language of developers all around the world'});
  activityTypes.push({tag:'#techtalk',description:'Tech talks: Talk at conventions, GDGs and MeetUps and present technologies to developers in person'});
  activityTypes.push({tag:'#opensourcecode',description:'Open source code: Open source your cool library/application for the benefit of other developers'});
  activityTypes.push({tag:'#forumpost',description:'Forum posts: Help answer questions directly in Stack Overflow or other forums'});
  activityTypes.push({tag:'#community',description:'Community: Engage with the community in other meaningful ways (organize conferences, offer code labs, etc.)'});
  activityTypes.push({tag:'#video',description:'Videos: Engage other developers with presentations and demos via video'});
  activityTypes.push({tag:'#tutorial',description:'Tutorials: Lead developers step by step through a particular concept or technology'});
  activityTypes.push({tag:'#gdeprogram',description:'GDE program: Participate in activities that help the GDE Program internally (such as referrals, interviews, and development of tools/apps)'});


	return activityTypes;
}]);

GdeTrackingApp.factory("productGroups",		[function()
{
	var productGroups		= [];
	productGroups.push({tag:'#android',url:'https://developers.google.com/android/',description:'Android'});
  productGroups.push({tag:'#admob',url:'http://www.google.com/ads/admob/',description:'AdMob'});
  productGroups.push({tag:'#adwords',url:'https://developers.google.com/adwords/api/',description:'Google AdWords'});
  productGroups.push({tag:'#angularjs',url:'https://angularjs.org/',description:'Angular JS'});
  productGroups.push({tag:'#chrome',url:'https://developers.google.com/chrome/',description:'Google Chrome'});
  productGroups.push({tag:'#html5',url:'http://www.html5rocks.com/',description:'Chrome: HTML5'});
  productGroups.push({tag:'#dartlang',url:'http://www.dartlang.org/',description:'Chrome: Dart Language'});
  productGroups.push({tag:'#cloudplatform',url:'https://developers.google.com/cloud/',description:'Google Cloud Platform'});
  productGroups.push({tag:'#googleanalytics',url:'https://developers.google.com/analytics/',description:'Google Analytics'});
  productGroups.push({tag:'#googleappsapi',url:'https://developers.google.com/google-apps/',description:'Google Apps APIs'});
  productGroups.push({tag:'#googleappscript',url:'https://developers.google.com/apps-script/',description:'Google Apps Script'});
  productGroups.push({tag:'#googledrive',url:'https://developers.google.com/drive/',description:'Google Drive SDK'});
  productGroups.push({tag:'#glass',url:'https://developers.google.com/glass/',description:'Google Glass'});
  productGroups.push({tag:'#googlemapsapi',url:'https://developers.google.com/maps/',description:'Google Maps APIs'});
  productGroups.push({tag:'#googleplus',url:'https://developers.google.com/+/',description:'Google+ Platform'});
  productGroups.push({tag:'#youtube',url:'https://developers.google.com/youtube/',description:'YouTube APIs'});
  productGroups.push({tag:'#uxdesign',url:'https://plus.google.com/communities/103651070366324568638',description:'UX &amp; Design'});

	return productGroups;
}]);

GdeTrackingApp.factory("activityGroups",		[function()
{
	var activityGroups		= [];
	activityGroups.push({
	  id:'#content',
	  types:['#article','#book', '#blogpost','#translation','#techdocs'],
	  usedInMetadata:{
	    impact:true,
      location:false,
      google_expensed:false,
      us_approx_amount:false
	  },
	  labels:[
	    ["title","Title"],
      ["description","Description"],
      ["link","Main Link"],
      ["impact","N° of views"],
      ["other_link1","Other links (Additional resources)"],
      ["other_link2","Other links (Other Additional Resources)"]
	  ]

	});
  activityGroups.push({
    id:'#community',
    types:['#meetup','#codelab','#hackaton','#other'],
	  usedInMetadata:{
	    impact:true,
      location:true,
      google_expensed:true,
      us_approx_amount:true
	  },
	  labels:[
	    ["title","Name of the Event"],
      ["description","Description"],
      ["link","Link to Event Page"],
      ["impact","N° of attendees"],
      ["other_link1","Other links (Link to Event Pictures/Videos)"],
      ["other_link2","Other links (Other Additional Content)"],
      ["location","Location"],
      ["google_expensed","Google Covered Expenses?"],
      ["us_approx_amount","Approx Google Covered Expenses (USD)"]
	  ]
  });
  activityGroups.push({
    id:'#techtalk',
    types:['#conference','#symposium','#seminar','#workshop'],
	  usedInMetadata:{
	    impact:true,
      location:true,
      google_expensed:true,
      us_approx_amount:true
	  },
	  labels:[
	    ["title","Name of the Event"],
      ["description","Title of your Talk"],
      ["link","Link to Event Page"],
      ["impact","N° of attendees"],
      ["other_link1","Other links (slides,video, documents,etc...)"],
      ["other_link2","Other links (Other Additional Content)"],
      ["location","Location"],
      ["google_expensed","Google Covered Expenses?"],
      ["us_approx_amount","Approx Google Covered Expenses (USD)"]
	  ]
  });
  activityGroups.push({
    id:'#bugreport',
    types:['#crash','#security','#enhancement','#documentation'],
	  usedInMetadata:{
	    impact:true,
      location:false,
      google_expensed:false,
      us_approx_amount:false
	  },
	  labels:[
	    ["title","Title"],
      ["description","Description"],
      ["link","Main Link"],
      ["impact","N° of users affected"],
      ["other_link1","Other links (Additional Content)"],
      ["other_link2","Other links (Other Additional Content)"]
	  ]
  });
  activityGroups.push({
    id:'#forumpost',
    types:['#stack','#gcommunity','#googlegroups','#others'],
	  usedInMetadata:{
	    impact:true,
      location:false,
      google_expensed:false,
      us_approx_amount:false
	  },
	  labels:[
	    ["title","Title"],
      ["description","Description"],
      ["link","Main Link"],
      ["impact","N° Of Views"],
      ["other_link1","Other links (Additional Content)"],
      ["other_link2","Other links (Other Additional Content)"]
	  ]
  });
  activityGroups.push({
    id:'#opensourcecode',
    types:['#google','#samples','#project'],
	  usedInMetadata:{
	    impact:true,
      location:false,
      google_expensed:false,
      us_approx_amount:false
	  },
	  labels:[
	    ["title","Title"],
      ["description","Description"],
      ["link","Main Link"],
      ["impact","N° Star/Downloads"],
      ["other_link1","Other links (Additional Content)"],
      ["other_link2","Other links (Other Additional Content)"]
	  ]
  });
  activityGroups.push({
    id:'#gdeprogram',
    types:['#interview','#referral','#development'],
	  usedInMetadata:{
	    impact:false,
      location:false,
      google_expensed:false,
      us_approx_amount:false
	  },
	  labels:[
	    ["title","Title (#development)/Candidate Name"],
      ["description","Description(#development)/Candidate Email"],
      ["link","Main Link (#development ONLY)"],
      ["other_link1","Other links (Additional Content)"],
      ["other_link2","Other links (Other Additional Content)"]
	  ]
  });

	return activityGroups;
}]);
// *****************************************************************************************************
//						Utility functions for accumulating and displaying stats
// *****************************************************************************************************
GdeTrackingApp.run(function ($rootScope,activityTypes,productGroups,activityGroups)
{
  $rootScope.is_backend_ready=false;

	$rootScope.utils =
	{
		'activityFromApi': function (apiData)
		{
			var activity = {};
			activity.gde_name		= apiData.gde_name;
			activity.title			= apiData.activity_title;
			activity.url			= apiData.activity_link;
			activity.gplus_id		= apiData.gplus_id;
			activity.resharers		= parseInt(apiData.resharers	|| 0, 10);
			activity.comments		= parseInt(apiData.comments		|| 0, 10);
			activity.activity_id		= apiData.id;
			activity.plus_oners		= parseInt(apiData.plus_oners	|| 0, 10);
			activity.date			= $rootScope.utils.dateToCommonString(new Date(apiData.post_date));
			activity.id				= apiData.id;
			activity.product_group	= apiData.product_groups;
			activity.activity_type	= apiData.activity_types;
			return activity;
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

			var activitiesLogged	= activityRecord.activities.length;
			var totalResharers		= activityRecord.totalResharers;
			var totalPlus1s			= activityRecord.totalPlus1s;
			var totalComments		= activityRecord.totalComments;

			row.c.push({v:label});
			row.c.push({v:activitiesLogged});
			row.c.push({v:totalResharers});
			row.c.push({v:totalPlus1s});
			row.c.push({v:totalComments});

			return row;
		},
		'dateToCommonString'	: function (origDate)
		{
			var yyyy = origDate.getFullYear().toString();
      var mm = (origDate.getMonth()+1).toString(); // getMonth() is zero-based
      var dd  = origDate.getDate().toString();
      return '' + yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding

		},
		'verifyDateStringFormat'	: function (origStringDate)
		{
			var dateParts = origStringDate.split('-');
			if (dateParts.length!=3){
			  return 'Invalid Date';
			}else{
			  return origStringDate;
			}

		}


	};

	$rootScope.activityTypes = activityTypes;
	$rootScope.productGroups = productGroups;
	$rootScope.activityGroups = activityGroups;
});

