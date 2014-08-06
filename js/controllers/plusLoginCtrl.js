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
//				console.log('User Id:' + resp.id);
				
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
					console.log('Welcome '+$scope.userName+'.');
					
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