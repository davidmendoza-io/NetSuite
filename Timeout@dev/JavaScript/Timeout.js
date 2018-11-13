define(
    'Timeout', [
        'Application', 'jQuery'
    ],
    function(
        application, jQuery
    ) {
        'use strict';
        return {
            mountToApp: function(application) {
                //get touchpoints
                var currentTouchpoint = application.Configuration.currentTouchpoint;
                var touchpoints = application.Configuration.siteSettings.touchpoints;
                var customercenter = touchpoints.customercenter;
                var login = touchpoints.login;
                //initailize time stamps               
                var initialTimestamp = new Date().getTime();
                var tempTimestamp = new Date().getTime();
                var commitTimestamp = new Date().getTime();
                var count = 0;
                var obj = {};
                var seconds = 1000;
                //set interval
                var intervalId = setInterval(function() {
                    tempTimestamp = new Date().getTime();
                    //get minute difference between intial timestamp and current timestamp
                    var preMinDiff = Math.floor((tempTimestamp - initialTimestamp) / 1000 / 60);
                    var secDiff = Math.floor((tempTimestamp - initialTimestamp) / 1000);
                    //if minute is mod 5 = 0, than send hearbeart to NS
                    if (preMinDiff % 5 == 0 && preMinDiff >= 1) {
                        if (!obj[preMinDiff]) {
                            commitTimestamp = new Date().getTime();
                            var url = customercenter.replace('my_account.ssp', 'services/Timeout.Service.ss');
                            jQuery('body').append(jQuery('<script src="' + url + '"></script>'));
                            jQuery.get('/api/items?limit=0&ssdebug=T');
                            count++;

                            obj[preMinDiff] = true;
                        }
                    }
                    //if we are in checkout, reload page on 12 minute since reloading in checkout keeps user logged in
                    if (preMinDiff % 12 == 0 && preMinDiff >= 1 && (currentTouchpoint == 'checkout' || currentTouchpoint == 'customercenter')) {
                        if (!obj[preMinDiff]) {
                            window.location.reload(true);
                            obj[preMinDiff] = true;
                        }
                    }
                    //if get time of last timestamp and now, for scenario if computer goes to sleep
                    var commitDifference = Math.floor((tempTimestamp - commitTimestamp) / 1000 / 60);
                    //if user system does not ping in 20 minutes then redirect to login
                    if (commitDifference > 21) {
                        if (!obj.committed) {
                            var url = customercenter.replace('my_account.ssp', 'services/Timeout.Service.ss?count=' + count + '&preMinDiff=' + preMinDiff + '&commitDifference=' + commitDifference);
                            jQuery('body').append(jQuery('<script src="' + url + '"></script>'));
                            jQuery.get('/api/items?limit=0&ssdebug=T');
                            window.location.href = login;
                            obj.committed = true;
                        }
                    }
                }, 1 * seconds);
            }
        }
    });