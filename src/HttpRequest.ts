import Constants from "./CoursesConstants";
var queryString = require("querystring");
var http = require('http');

export default class HttpRequest {

    constructor(){

    }

    public sendGet(address: string): Promise<any> {
        return new Promise(function(fulfill, reject){
            var constants = new Constants();
            var teamNumber = constants.getTeamNumber();
            var escapedAddress = queryString.escape(address);

            var options = {
                host: 'skaha.cs.ubc.ca',
                port: 11316,
                path: '/api/v1/team' + teamNumber + '/' + escapedAddress,
                method: 'GET'
            };

            var req = http.request(options, function(response: any) {
                var stringResult = "";
                response.on('data', function(chunk: any){
                    stringResult += chunk;
                });

                response.on('end', function() {
                    var result = JSON.parse(stringResult);
                    if (result.error) {
                        reject(result.error);
                    } else {
                        fulfill(result);
                    }
                });
            });

            req.end();
        });
    }
}