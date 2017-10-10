/**
 * Created by Louis on 3/3/17.
 */

import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import restify = require('restify');
import FileManager from "../src/FileManager";

var chai = require('chai');
var fs = require('fs');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var PATHTOZIP:string = "./dataset/courses.zip";
var PATHTOROOMS: string = "./dataset/rooms.zip";
var PATHTOEMPTYZIP: string = "./dataset/empty.zip";
var URL = 'http://localhost:65500';
var queryObj: any = {
    "WHERE":{
        "IS": {
            "courses_dept": "aanb"
        }
    },
    "OPTIONS": {
        "COLUMNS":["courses_dept", "courses_id"],
        "FORM": "TABLE"
    }
};

var missingQueryObejct: any = {
    "WHERE":{
        "GT":{
            "testId_avg": 80,
            "courses_avg":97
        }
    },
    "OPTIONS": {
        "COLUMNS":["testId_avg"]
    }
};

var malformedQueryObject: any ={
    "WHERE":{
        "OR":[
        ]
    },
    "OPTIONS": {
        "COLUMNS": ["courses_avg"],
        "FORM": "TABLE"
    }
};

var roomsQuery: any = {
    "WHERE": {
        "IS": {
            "rooms_shortname": "DMP"
        }
    },
    "OPTIONS": {
        "COLUMNS": ["rooms_name", "rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_furniture", "rooms_type"],
        "FORM": "TABLE"
    }
};

describe("Tests for Rest", function () {
    var server: Server;

    before(function (done) {
        Log.test('Before: ' + (<any>this).test.parent.title);
        server = new Server(65500);
        server.start().then(function(){
            done();
        });
    });

    after(function(done) {
        if (FileManager.fileExists("./cache/courses.txt")){
            FileManager.deleteFile("./cache/courses.txt");
        }
        if (FileManager.fileExists("./cache/rooms.txt")) {
            FileManager.deleteFile("./cache/rooms.txt");
        }
        FileManager.removeDirectory("./cache");
        server.stop().then(function() {
            done();
        });
    });

    it("PUT return 204", function () {
        var zip = fs.readFileSync(PATHTOZIP);
        return chai.request(URL)
            .put('/dataset/courses')
            .attach("body",zip, "courses.zip")
            .then(function (res: restify.Response) {
                Log.trace('then:');
                expect(res.statusCode).to.equal(204);
            })
            .catch(function (Err: restify.Response) {
                Log.trace('catch:');
                expect.fail();
            });
    });

    it("PUT return 201", function () {
        return chai.request(URL)
            .put('/dataset/courses')
            .attach("body",fs.readFileSync(PATHTOZIP), "courses.zip")
            .then(function (res: restify.Response) {
                Log.trace('then:');
                expect(res.statusCode).to.equal(201);
            })
            .catch(function (Err: restify.Response) {
                Log.trace('catch:');
                expect.fail();
            });
    });

    it("PUT return 400", function () {
        return chai.request(URL)
            .put('/dataset/NoDataSet')
            .attach("body",fs.readFileSync(PATHTOEMPTYZIP), 'empty.zip')
            .then(function (res: restify.Response) {
                Log.trace('then:');
                expect.fail();
            })
            .catch(function (Err: any) {
                Log.trace('catch:');
                expect(Err.status).to.equal(400);
            });
    });


    it("POST description", function () {
        return chai.request(URL)
            .post('/query')
            .send(queryObj)
            .then(function (res: any) {
                Log.trace('then:');
                expect(res.statusCode).to.equal(200);
                expect(res.body.result.length).to.equal(4);
            })
            .catch(function (err: any) {
                Log.trace('catch:');
                expect.fail();
            });
    });

    it("POST return 424", function () {
        return chai.request(URL)
            .post('/query')
            .send(missingQueryObejct)
            .then(function (res: any) {
                Log.trace('then:');
                expect.fail();
            })
            .catch(function (err: any) {
                Log.trace('catch:');
                expect(err.status).to.equal(424);
            });
    });
    it("POST return 400", function () {
        return chai.request(URL)
            .post('/query')
            .send(malformedQueryObject)
            .then(function (res: any) {
                Log.trace('then:');
                expect.fail();
            })
            .catch(function (err: any) {
                Log.trace('catch:');
                expect(err.status).to.equal(400);
            });
    });

    it("Should be able to perform DEL", function () {
        return chai.request('http://localhost:65500').del('/dataset/courses').then(function(res: restify.Response) {
            expect(res.statusCode).to.equal(204);
        }).catch(function (Err: restify.Response) {
            expect.fail();

        })
    });

    it("Should be able to perform DEL return 404", function () {
        return chai.request('http://localhost:65500').del('/dataset/courses').then(function(res: restify.Response) {
            expect.fail();
        }).catch(function (Err: any) {
            expect(Err.response.statusCode).to.equal(404);
        })
    });

    it("Should be able to add back dataset", function() {
        var zip = fs.readFileSync(PATHTOZIP);
        return chai.request(URL)
            .put('/dataset/courses')
            .attach("body",zip, "courses.zip")
            .then(function (res: restify.Response) {
                Log.trace('then:');
                expect(res.statusCode).to.equal(204);
                var rooms = fs.readFileSync(PATHTOROOMS);
                chai.request(URL)
                    .put('/dataset/rooms')
                    .attach("body",rooms, "courses.zip")
                    .then(function (res: restify.Response) {
                        Log.trace('then:');
                        expect(res.statusCode).to.equal(204);
                    }).catch(function (Err: restify.Response) {
                        Log.trace('catch:');
                        expect.fail();
                    });
            })
            .catch(function (Err: restify.Response) {
                Log.trace('catch:');
                expect.fail();
            });
    });

    xit("Should be able to perform add Dataset", function() {
        return chai.request(URL).put("/addDatasets").then(function(res: restify.Response) {
            expect(res.statusCode).to.equal(200);
        }).catch(function(err: any) {
            expect.fail();
        });
    });

    xit("Should be able to hit rooms query endpoint", function() {
        return chai.request(URL).post("/roomsQuery").send(roomsQuery).then(function(res: restify.Response) {
            expect(res).not.to.be.undefined;
        }).catch(function(err: any) {
            expect.fail();
        });
    });

    it("Should be able to hit scheduling endpoint", function() {
        var schedulingQuery: any = {
            courses: [{
                courses_id: "310",
                courses_dept: "cpsc",
                courses_uuid: "46744",
                courses_size: 180,
                courses_year: 2014
            }],
            rooms: [{
                "rooms_name": "DMP_310",
                "rooms_number": "310",
                "rooms_shortname": "DMP",
                "rooms_seats": 200
            }]
        };
        return chai.request(URL).post("/schedulingQuery").send(schedulingQuery).then(function(res: restify.Response) {
            expect(res).not.to.be.undefined;
        }).catch(function(err: any) {
            expect.fail();
        });
    });

    it("Should be able to hit course analyzer endpoint", function() {
        var analyzerRequest: any = {
            yAxis: "failRate",
            xAxis: {
                column: "courses_id",
                value: "310"
            }
        };
        return chai.request(URL).post("/analyze").send(analyzerRequest).then(function(res: restify.Response) {
            expect(res).not.to.be.undefined;
        }).catch(function(err: any) {
            expect.fail();
        });
    });

    xit("Should be able to get homepage", function() {
        return chai.request(URL).get("/").then(function(res: restify.Response) {
            expect(res).not.to.be.undefined;
        }).catch(function(err: any) {
            expect.fail();
        });
    })
});