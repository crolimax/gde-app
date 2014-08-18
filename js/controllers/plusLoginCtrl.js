// *****************************************************************************************************
//    								plusLoginCtrl Controller
//					Library source: http://jeradbitner.com/angular-directive.g-signin/
// *****************************************************************************************************
GdeTrackingApp.controller('plusLoginCtrl',						function($scope,	$location,	$http,	$rootScope)
{
	$location.path('/');		// Forces the App to always load in the Welcome Screen
	$scope.gdeTrackingAPI = null;

	$scope.getUserAccount = function(userId){
	  //Create request data object
    var requestData = {};
    requestData.id = userId;

    $scope.gdeTrackingAPI.account.get(requestData).execute(
      function(response)
  		{
  		  //Check if the backend returned and error
        if (response.code){
          console.log('gdeTrackingAPI.account.get responded with Response Code: '+response.code + ' - '+ response.message);
        }else{
          //Response is ok, keep going
          $scope.type	= response.type;
          console.log('Welcome '+$scope.userName+'.');

          $('#generalStatisticsForGooglers')			.css('display','none');	//Hide the previously shown menu
          //Show the right menu by user type
          switch (response.type){
            case 'administrator':
              console.log('You are an administrator of this app!');
              $('#generalStatisticsForGooglers')	.css('display','block');
              $rootScope.usrId		= userId; //User authorized, save the Id in the rootScope
              break;
            case 'manager':
              console.log('You are a manager of this app!');
              $('#generalStatisticsForGooglers')	.css('display','block');
              $rootScope.usrId		= userId; //User authorized, save the Id in the rootScope
              break;
            case 'active':
              console.log('You are a GDE!');
              $('#gdeStatistics')					.css('display','block');
              $('#gdeAvatarBuilder')				.css('display','block');
              $rootScope.usrId		= userId; //User authorized, save the Id in the rootScope
              break;
            default:
              break;	//disabled users
          }

          $rootScope.userLoaded = true;
        }
      }
    );
	};

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

        $('gde-badge').get(0).updateImage(resp.image.url.replace(/\?.*$/,""));

				$rootScope.$broadcast('gde:logged',resp.displayName);
				$scope.userName			= resp.displayName;
				$scope.userImageUrl		= (resp.image.url).replace("=50", "=90");
				$scope.userEmails		= resp.emails;
				$scope.id				= resp.id;
//				console.log('User Id:' + resp.id);

			  for (var i=0;i<$scope.userEmails.length;i++)
				{
					var emailDomain = $scope.userEmails[i].value.substring($scope.userEmails[i].value.indexOf('@'));
					if (emailDomain == '@google.com')	//	Detect if domain matches an official Google domain (Googlers only).
					{
						console	.log('You are a Googler!');
						console	.log('Hope you like the detailed GDE program statistics.');
						$('#generalStatisticsForGooglers')	.css('display','block');
						$rootScope.usrId		= resp.id; //User authorized, save the Id in the rootScope
					}

				}

				$('.userName')	.text($scope.userName);	// Binds the user name into the DOM using a class via jQuery so it can be repeated throughout the document.
				var userImage			= document.createElement('img');
				userImage.src			= $scope.userImageUrl;
				userImage.alt			= 'g+ image';
				$('#userImg')	.html(userImage);

				if($rootScope.is_backend_ready){
				  $scope.getUserAccount(resp.id);

				}

			});
		});
	});
	$scope.$on('event:google-plus-signin-failure', function (event, authResult)
	{																					// User has not authorized the G+ App!
		$('.signinButton')	.css('display','block');
//		$('.signout')		.css('display','none');
		$('#userImg')		.html = '';
		$('.userName')		.text= '';
		$rootScope.usrId = null;//UnAuthorize the user
		console.log('Error in sign in flow.');
		console.log(authResult);
	});
	$scope.$on('event:gde-app-back-end-ready', function (event, gdeTrackingAPI)
	{
		console.log('plusLoginCtrl: gde-app-back-end-ready received');

		//Save the API object in the scope
		$scope.gdeTrackingAPI = gdeTrackingAPI;
		//Get data from the backend only if the user is already logged in and the user is not already loaded
		if($rootScope.usrId && !$rootScope.userLoaded){
		  //run the function to get data from the backend
		  $scope.getUserAccount($rootScope.usrId);
		}

	});
});