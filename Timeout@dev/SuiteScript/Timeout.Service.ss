function service(request) {
    'use strict';

    var Application = require('Application');
    try {
        var method = request.getMethod();
        var js = '';
        switch (method) {
            case 'GET':
                var user = nlapiGetUser();
                Application.sendContent(js);
                break;
            default:
                Application.sendError(methodNotAllowedError);
        }
    } catch (e) {
        Application.sendError(e);
    }
}