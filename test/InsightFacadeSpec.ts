
import InsightFacade from "../src/controller/InsightFacade";
import FileManager from "../src/FileManager";
import {expect} from 'chai';
import Util from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";

describe("Unit tests for Insight Facade", function() {

    var insightFacade: InsightFacade;
    var PATHTOZIP:string = "./dataset/courses.zip";
    var PATHTOROOMS: string = "./dataset/rooms.zip";
    var EMPTYZIP:string = "./dataset/empty.zip";
    var NOTAZIP: string = "./dataset/notazip.txt";
    var WRONGPATH:string = "./wrongDirectory";

    var testAssets = require("./testAssets/multiApplySortTestAsset.json");

    before(function() {
        insightFacade = new InsightFacade();
    });

    after(function() {
        insightFacade = null;
        //FileManager.deleteFile("./cache/201test.txt");
        if (FileManager.fileExists("./cache/courses.txt")){
            FileManager.deleteFile("./cache/courses.txt");
        }
        if (FileManager.fileExists("./cache/rooms.txt")) {
            FileManager.deleteFile("./cache/rooms.txt");
        }
        FileManager.removeDirectory("./cache");
    });

    it("Should be able to add a dataset", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("courses", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to add rooms dataset", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOROOMS);
        return insightFacade.addDataset("rooms", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
        }).catch(function (resp: InsightResponse) {
            console.log(resp);
            expect.fail();
        });
    });

    it("Should be able to remove rooms dataset", function() {
        return insightFacade.removeDataset("rooms").then(function(resp1: InsightResponse){
            expect(FileManager.fileExists("./cache/rooms.txt")).to.be.false;
            expect(resp1.code).to.equal(204);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should return 201 when dataset added twice", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOROOMS);
        return insightFacade.addDataset("rooms", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
            insightFacade.addDataset("rooms", zip).then(function(resp2:InsightResponse) {
                expect(resp.code).to.equal(201);
            });
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to return 201", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("courses", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(201);
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    xit("Should return 201 when file already exist", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("201test", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
            insightFacade.addDataset("201test", zip).then(function (response: InsightResponse) {
                expect(response.code).to.equal(201);
            });
        });
    });


    it("Should return 400 when addDataset fail", function() {
        return insightFacade.addDataset("noDataset", "").then(function(resp: InsightResponse) {
            expect.fail("Should have thrown error");
        }).catch(function(resp: InsightResponse) {
            console.log(resp.body);
            expect(resp.code).to.equal(400);
            expect(resp.body.error).not.to.be.undefined;
        });
    });

    it("Should not be able to add dataset with no data", function() {
        return FileManager.convertZipToBase64(EMPTYZIP).then(function(data: string) {
            insightFacade.addDataset("empty", data).then(function(resp: InsightResponse) {
                expect.fail("Should not have allowed this");
            }).catch(function(resp: InsightResponse) {
                Util.info(JSON.stringify(resp));
                expect(resp.code).to.equal(400);
                expect(resp.body.error).not.to.be.undefined;
            });
        });
    });

    it ("Should not be able to add dataset with no id", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("", zip).then(function(resp: InsightResponse) {
            expect.fail("Should not allow empty id");
        }).catch(function(resp: InsightResponse) {
            Util.warn(JSON.stringify(resp));
            expect(resp.code).to.equal(400);
        });
    });

    it ("Should not allow adding of dataset with wrong id", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOROOMS);
        return insightFacade.addDataset("room", zip).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(err) {
            expect(err.code).to.equal(400);
        });
    });

    it("Should not allow adding rooms dataset with courses id and vice versa", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOROOMS);
        return insightFacade.addDataset("courses", zip).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(err) {
            expect(err.code).to.equal(400);
        });
    });

    it("Should not allow adding courses dataset with rooms id", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("rooms", zip).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(err) {
            expect(err.code).to.equal(400);
        });
    });

    it("Should not be able to add something that is not a zip", function() {
        return insightFacade.addDataset("notazip", "notbase64").then(function(resp: InsightResponse) {
            expect.fail("Should not allow non base64 strings");
        }).catch(function(resp: InsightResponse) {
            Util.warn(JSON.stringify(resp));
            expect(resp.code).to.equal(400);
        });
    });

    it("Should be able to remove a dataset", function() {
        return insightFacade.removeDataset("courses").then(function(resp1: InsightResponse){
            expect(FileManager.fileExists("./cache/courses.txt")).to.be.false;
            expect(resp1.code).to.equal(204);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should throw error if given null as id", function() {
        return insightFacade.removeDataset(null).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(err: InsightResponse) {
            expect(err.code).to.equal(404);
        });
    });

    it("Should be able to add back datasets", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("courses", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
            insightFacade.addDataset("courses", zip).then(function(resp2:InsightResponse) {
                expect(resp.code).to.equal(201);
            });
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to return 404 when remove dataset fail", function() {
        return insightFacade.removeDataset("noDataset").then(function(resp1: InsightResponse){
            expect.fail("Should have thrown error");
        }).catch(function(resp1: InsightResponse){
            Util.error(JSON.stringify(resp1));
            expect(resp1.code).to.equal(404);
            expect(resp1.body.error).not.to.be.undefined;
        });
    });

    it ("Should be able to find all sections for a dept", function() {
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
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(4);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it("Should remove courses dataset", function() {
        return insightFacade.removeDataset("courses").then(function(resp1: InsightResponse){
            expect(FileManager.fileExists("./cache/courses.txt")).to.be.false;
            expect(resp1.code).to.equal(204);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    // BEGIN ROOMS TESTS

    it("Should return all the results", function() {
        var queryObj: any = {
            "WHERE":{},
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_name", "rooms_seats"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(364);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to perform rooms query", function() {
        var queryObj: any = {
            "WHERE":{
                "GT" : {
                    "rooms_seats": 50
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(126);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should return error 400 if empty columns", function() {
        var queryObj: any = {
            "WHERE":{
                "GT" : {
                    "rooms_seats": 50
                }
            },
            "OPTIONS": {
                "COLUMNS":[],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            console.log(err);
            expect(err.code).to.equal(400);
        });
    });

    it("Should not allow multiple datasets", function() {
        var queryObj: any = {
            "WHERE":{
                "GT" : {
                    "rooms_seats": 50
                }
            },
            "OPTIONS": {
                "COLUMNS":["courses_seats"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            console.log(err);
            expect(err.code).to.equal(424);
        });
    });

    it("Should not allow multiple datasets", function() {
        var queryObj: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "room_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            console.log(err);
            expect(err.code).to.equal(424);
        });
    });

    it("Should be able to perform complex AND for seats", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [
                    {"GT" :
                        {
                        "rooms_seats": 30
                        }
                    },
                    {
                        "LT": {
                            "rooms_seats": 80
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(142);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to return the rooms for given number of seats", function() {
        var queryObj: any = {
            "WHERE":{
                "EQ" : {
                    "rooms_seats": 68
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(4);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to return the rooms for given full name of the building", function() {
        var queryObj: any = {
            "WHERE":{
                "IS" : {
                    "rooms_fullname": "West Mall Swing Space"
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(22);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });


    it("Should be able to find rooms with certain furniture", function() {
        var queryObj: any = {
            "WHERE":{
                "IS" : {
                    "rooms_furniture": "Classroom-Movable Tables & Chairs"
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_furniture", "rooms_number", "rooms_name"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(165);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to return 0 for building without room", function() {
        var queryObj: any = {
            "WHERE":{
                "IS" : {
                    "rooms_shortname": "AAC"
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_furniture", "rooms_number", "rooms_name"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(0);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get rooms in DMP", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(5);
            expect(resp.body.result[0].rooms_name).to.equal("DMP_101");
            expect(resp.body.result[4].rooms_name).to.equal("DMP_310");
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get rooms from given href", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_href": "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/BUCH-A101"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(1);
            expect(resp.body.result[0].rooms_name).to.equal("BUCH_A101");
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get rooms with partial address", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(26);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get rooms with partial href", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_href": "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/BUCH*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(61);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get rooms with partial furniture", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_furniture": "Classroom*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(364);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get the one empty string room type", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_type": ""
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(1);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to perform complex rooms", function() {
        var queryObj: any = {
            "WHERE":{
                "OR": [
                    {"AND": [
                        {"IS" :
                            {
                                "rooms_fullname": "Buchanan"
                            }
                        },
                        {"IS":
                            {
                                "rooms_furniture": "Classroom-Fixed Tablets"
                            }
                        }
                    ]},
                    {"NOT":
                        {"IS":
                            {
                                "rooms_type": "Small Group"
                            }
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(206);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to perform another complex rooms", function() {
        var queryObj: any = {
            "WHERE":{
                "OR": [
                    {"AND": [
                        {"IS" :
                            {
                                "rooms_shortname": "DMP"
                            }
                        },
                        {"GT":
                            {
                                "rooms_seats": 40
                            }
                        }
                    ]},
                    {"NOT":
                        {"IS":
                            {
                                "rooms_fullname": "Buchanan"
                            }
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(303);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should return empty results on AND with empty set at beginning", function() {
        var queryObj: any = {
            "WHERE": {
                "AND":[{
                    "IS": {
                        "rooms_shortname": "swng"
                    }
                },{
                    "EQ": {
                        "rooms_lon": -123.25431
                    }
                },{
                    "IS": {
                        "rooms_fullname": "*Mall*"
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_fullname", "rooms_shortname", "rooms_lon"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(0);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Complex rooms query should work", function() {
        var queryObj: any = {
            "WHERE": {
                "AND": [
                    {"OR": [
                        {"AND" : [
                            {"IS": {"rooms_fullname": "*an*"}}
                        ]},
                        {"IS": {"rooms_shortname": "*B*"}},
                        {"IS": {"rooms_shortname": "*C*"}},
                        {"AND": [
                            {"GT": {"rooms_seats": 20}}
                        ]}
                    ]},
                    {"AND": [
                        {"LT": {"rooms_lat": 49.27}},
                        {"LT": {"rooms_seats": 51}},
                        {"NOT": {"IS": {"rooms_name" : "*C*"}}},
                        {"OR": [
                            {"IS": {"rooms_furniture": "*Movable*"}},
                            {"AND": [
                                {"IS": {"rooms_number": "*3*"}},
                                {"IS": {"rooms_href": "*4"}},
                                {"IS": {"rooms_type": "Case*"}}
                            ]}
                        ]},
                        {"AND": [
                            {"IS": {"rooms_name": "*2*"}},
                            {"LT": {"rooms_seats" : 20}}
                        ]}
                    ]}
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_address",
                    "rooms_shortname",
                    "rooms_lon",
                    "rooms_number",
                    "rooms_href",
                    "rooms_seats"
                ],
                "ORDER": "rooms_address",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(3);
            expect(resp.body.result[0].rooms_name).to.equal("FNH_20");
            expect(resp.body.result[1].rooms_name).to.equal("SPPH_B112");
            expect(resp.body.result[2].rooms_name).to.equal("BIOL_2519");
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to handle bounding box", function() {
        var queryObj: any = {
            "WHERE": {
                "OR": [
                    {
                        "LT": {
                            "rooms_lat": 49.2
                        }
                    }, {
                        "GT": {
                            "rooms_lat": 49.8
                        }
                    }, {
                        "LT": {
                            "rooms_lon":-123.2599
                        }
                    }, {
                        "GT": {
                            "rooms_lon":-123.2442
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_fullname",
                    "rooms_shortname",
                    "rooms_number",
                    "rooms_name",
                    "rooms_address",
                    "rooms_type",
                    "rooms_furniture",
                    "rooms_href",
                    "rooms_lat",
                    "rooms_lon",
                    "rooms_seats"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(11);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to get lat lon given address of a building", function() {
        var queryObj: any = {
            "WHERE":{
                "IS" : {
                    "rooms_address": "6333 Memorial Road"
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_lat", "rooms_lon"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(6);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to add back courses dataset", function() {
        var zip = FileManager.convertZipToBase64Sync(PATHTOZIP);
        return insightFacade.addDataset("courses", zip).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(204);
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should fail when performing query on keys from diff datasets", function() {
        var queryObj: any = {
            "WHERE":{
                "GT" : {
                    "rooms_seats": 50
                }
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_dept", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            expect(err.code).to.equal(400);
        });
    });

    it("Should fail when performing query on keys from different datasets", function() {
        var queryObj: any = {
            "WHERE":{
                "AND":[{
                    "GT" : {
                        "rooms_seats": 50
                    }
                },{
                    "LT": {
                        "courses_avg": 90
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["rooms_fullname", "rooms_number", "rooms_seats"],
                "ORDER": "rooms_seats",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            expect(err.code).to.equal(400);
        });
    });

    it("Should be able to aggregate", function() {
        var queryObj: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(3);
            expect(resp.body.result[0].maxSeats).to.equal(442);
            expect(resp.body.result[1].maxSeats).to.equal(375);
            expect(resp.body.result[2].maxSeats).to.equal(350);
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Should be able to display all unique furnitures", function() {
        var queryObj: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture"
                ],
                "ORDER": "rooms_furniture",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": []
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(10);
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Should be able to display all unique furnitures", function() {
        var queryObj: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture",
                    "countFurniture"
                ],
                "ORDER": "rooms_furniture",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": [{
                    "countFurniture": {
                        "COUNT": "rooms_furniture"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(10);
            expect(resp.body.result[0].countFurniture).to.equal(1);
            expect(resp.body.result[1].countFurniture).to.equal(1);
            expect(resp.body.result[4].countFurniture).to.equal(1);
            expect(resp.body.result[8].countFurniture).to.equal(1);
            expect(resp.body.result[9].countFurniture).to.equal(1);
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Should be able to sort on complex queries", function() {
        var queryObj: any = {
            "WHERE": {
                "GT": {
                    "rooms_seats": 200
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "rooms_furniture",
                    "rooms_seats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["rooms_shortname", "rooms_furniture", "rooms_seats"]
                },
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result[18].rooms_seats).to.equal(265);
            expect(resp.body.result[19].rooms_seats).to.equal(240);
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Should be able to sort on rooms number correctly", function() {
        var queryObj: any = {
            "WHERE": {
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_number",
                    "rooms_shortname",
                    "rooms_seats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["rooms_number", "rooms_shortname", "rooms_seats"]
                },
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result[0].rooms_number).to.equal("G66");
            expect(resp.body.result[363].rooms_number).to.equal("037");
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Group by rooms_shortname, apply MAX. Result that's not from ANGU or BUCH", function() {
        var queryObj: any = {
            "WHERE": {
                "NOT": {
                    "OR": [
                        {"IS":
                            {
                                "rooms_shortname": "ANGU"
                            }
                        },
                        {"IS":
                            {
                                "rooms_shortname": "BUCH"
                            }
                        }
                    ]
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(42);
        }).catch(function(err){
            expect.fail();
        });
    });

    it("Group by rooms_shortname, apply MIN. Result that's not from ANGU or BUCH", function() {
        var queryObj: any = {
            "WHERE": {
                "NOT": {
                    "OR": [
                        {"IS":
                            {
                                "rooms_shortname": "ANGU"
                            }
                        },
                        {"IS":
                            {
                                "rooms_shortname": "BUCH"
                            }
                        }
                    ]
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "minSeats"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(42);

        }).catch(function(err){
            expect.fail();
        });
    });

    it("Group by rooms_shortname, apply SUM. Result that's not from ANGU or BUCH", function() {
        var queryObj: any = {
            "WHERE": {
                "NOT": {
                    "OR": [
                        {"IS":
                            {
                                "rooms_shortname": "ANGU"
                            }
                        },
                        {"IS":
                            {
                                "rooms_shortname": "BUCH"
                            }
                        }
                    ]
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "sumSeats"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "sumSeats": {
                        "SUM": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(42);

        }).catch(function(err){
            expect.fail();
        });
    });

    it("Group by rooms_shortname, apply AVG. Result that's not from ANGU or BUCH", function() {
        var queryObj: any = {
            "WHERE": {
                "NOT": {
                    "OR": [
                        {"IS":
                            {
                                "rooms_shortname": "ANGU"
                            }
                        },
                        {"IS":
                            {
                                "rooms_shortname": "BUCH"
                            }
                        }
                    ]
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "avgSeats"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(42);

        }).catch(function(err){
            expect.fail();
        });
    });

    it("Multiple groups and multiple apply test ", function() {
        var queryObj: any = {
            "WHERE": {
                "AND": [
                    {
                        "GT":
                            {
                                "rooms_seats" : 100
                            }
                    },
                    {
                        "LT":
                            {
                                "rooms_seats": 150
                            }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "sumSeats",
                    "countRoomName"
                ],
                "ORDER": "rooms_shortname",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname", "rooms_seats"],
                "APPLY": [
                    {"sumSeats":
                        {
                            "SUM": "rooms_seats"
                        }
                    },
                    {"countRoomName":
                        {
                            "COUNT": "rooms_name"
                        }

                    }
                ]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(12);

        }).catch(function(err){
            expect.fail();
        });
    });

    // END OF ROOMS TESTS
    it("Should work for decimal values", function() {
        var queryObj: any = {
            "WHERE":{
                "EQ": {
                    "courses_avg": 94.44
                }
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(7);
            expect(resp.body.result[0].courses_avg).to.equal(94.44);
            expect(resp.body.result[6].courses_avg).to.equal(94.44);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to continue even if we delete rooms dataset", function() {
        return insightFacade.removeDataset("rooms").then(function(resp1: InsightResponse){
            expect(FileManager.fileExists("./cache/rooms.txt")).to.be.false;
            expect(resp1.code).to.equal(204);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to handle course size", function() {
        var queryObj: any = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_size": 100
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_instructor",
                    "courses_size",
                    "courses_title"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });

    it("Should return 200 when correct format of query inputted", function() {
        var queryObj: any = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
        }).catch(function(err){
            console.log(err);
            expect.fail();
        });
    });



    it ("Should be able to find sections in a dept with average between 70 and 80", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [{
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "LT": {
                        "courses_avg": 90
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "ORDER": "courses_dept",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(2);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it ("Should be able to find sections in year 2010 with average between 70 and 80", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [{
                "EQ": {
                        "courses_year": 2010
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "LT": {
                        "courses_avg": 90
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "ORDER": "courses_dept",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(1319);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it ("Should return 400 when courses_year is given as string", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [{
                    "EQ": {
                        "courses_year": "2010"
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "LT": {
                        "courses_avg": 90
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "ORDER": "courses_dept",
                "FORM": "TABLE"
            }
        };


        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(resp: InsightResponse) {
            console.log(resp);
            expect(resp.code).to.equal(400);
        });
    });

    it ("Should return 400 when courses_year is using incorrect logical comparison", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [{
                    "IS": {
                        "courses_year": 2010
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "LT": {
                        "courses_avg": 90
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "ORDER": "courses_dept",
                "FORM": "TABLE"
            }
        };


        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(resp: InsightResponse) {
            console.log(resp);
            expect(resp.code).to.equal(400);
        });
    });

    it("Should be able to find sections with an OR query on different keys", function() {
        var queryObj: any = {
            "WHERE":{
                "OR": [{
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id", "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
        }).catch(function(resp: InsightResponse) {
            console.log(resp);
            expect.fail();
        });
    });

    it("Should be able to find sections with an AND query on different keys", function() {
        var queryObj: any = {
            "WHERE":{
                "AND": [{
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "GT": {
                        "courses_avg": 80
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id", "courses_avg", "courses_title"],
                "ORDER": "courses_title",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(4);
            expect(resp.body.result[0].courses_title).to.equal("anml welf rsrch");
            expect(resp.body.result[3].courses_title).to.equal("rsrch methdlgy");
        }).catch(function(resp: InsightResponse) {
            console.log(resp);
            expect.fail();
        });
    });

    it("Should return 424 when error occur for 2 object in GT", function() {
        var queryObj: any = {
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
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(resp: InsightResponse){
            console.log(resp);
            expect(resp.code).to.equal(424);
        });

    });
    it("Should return 200 when 1 object in AND", function() {
        var queryObj: any ={
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90
                                }
                            }
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": ["courses_avg"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect(resp.code).to.equal(200);
        }).catch(function(resp: InsightResponse){
            console.log(resp);
            expect.fail();
        });
    });

    it ("Should return 400 if invalid query", function() {
        var queryObj: any ={
            "WHERE":{
                "OR":[
                ]
            },
            "OPTIONS": {
                "COLUMNS": ["courses_avg"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(resp: InsightResponse){
            console.log(resp);
            expect(resp.code).to.equal(400);
        });
    });

    it ("Should be able to find all sections in a dept not taught by a specific person.", function() {
        var queryObj: any = {
            "WHERE": {
                "AND":[{
                    "IS": {
                        "courses_dept" : "adhe"
                    }
                }, {
                    "NOT": {
                        "IS": {
                            "courses_instructor": "smulders, dave"
                        }
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(193);
        }).catch(function(resp: InsightResponse) {
            console.log(resp);
            expect.fail();
        });
    });

    it ("Should return 424", function() {
        var queryObj: any = {
            "WHERE": {
                "AND":[{
                    "IS": {
                        "cour_dept" : "adhe"
                    }
                }, {
                    "NOT": {
                        "IS": {
                            "courses_instructor": "smulders, dave"
                        }
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect.fail();
        }).catch(function(resp: InsightResponse) {
            expect(resp.code).to.equal(424);
            expect(resp.body.missing).not.to.be.undefined;
            expect(resp.body.missing.length).to.equal(1);
            expect(resp.body.missing[0]).to.equal("cour");
        });
    });

    it ("Should handle complex OR query", function() {
        var queryObj: any = {
            "WHERE": {
                "OR":[{
                    "IS": {
                        "courses_dept" : "adhe"
                    }
                }, {
                    "OR": [{
                        "IS": {
                            "courses_instructor": "koizumi, keiko"
                        }
                    },{
                        "LT": {
                            "courses_fail": 0
                        }
                    }]
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(299);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it ("Should handle nested OR query", function() {
        var queryObj: any = {
            "WHERE": {
                "AND":[{
                    "IS": {
                        "courses_dept" : "aanb"
                    }
                }, {
                    "OR": [{
                        "IS": {
                            "courses_instructor": "koizumi, keiko"
                        }
                    },{
                        "EQ": {
                            "courses_pass": 6
                        }
                    }]
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id"],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(2);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    // it ("Should handle nested OR inside NOT query", function() {
    //     var queryObj: any = {
    //         "WHERE": {
    //             "NOT": {
    //                 "OR":[{
    //                     "GT": {
    //                         "courses_avg": 50
    //                     }
    //                 },{
    //                     "EQ": {
    //                         "courses_avg": 0
    //                     }
    //                 }, {
    //                     "IS": {
    //                         "courses_dept": "busi"
    //                     }
    //                 }]
    //             }
    //         },
    //         "OPTIONS": {
    //             "COLUMNS":["courses_dept", "courses_id", "courses_avg"],
    //             "ORDER": "courses_avg",
    //             "FORM": "TABLE"
    //         }
    //     };
    //     return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
    //         expect(resp.code).to.equal(200);
    //         expect(resp.body.result.length).to.equal(29);
    //     }).catch(function(resp: InsightResponse) {
    //         expect.fail();
    //     });
    // });

    it ("Should handle multiple things inside OR", function() {
        var queryObj: any = {
            "WHERE": {
                "OR":[{
                    "NOT": {
                        "LT": {
                            "courses_avg": 95
                        }
                    }
                }, {
                    "IS": {
                        "courses_instructor": "koizumi, keiko"
                    }
                },{
                    "AND":[{
                        "IS": {
                            "courses_dept": "aanb"
                        }
                    },{
                        "EQ": {
                            "courses_pass": 9
                        }
                    }]
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id", "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            expect(resp.body.result.length).to.equal(341);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it ("Can handle nested OR's", function() {
        var queryObj: any = {
            "WHERE": {
                "OR":[{
                    "OR":[{
                        "OR":[{
                            "GT": {
                                "courses_avg": 96
                            }
                        }]
                    }, {
                        "EQ": {
                            "courses_avg": 95
                        }

                    }]
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_dept", "courses_id", "courses_avg"],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    xit ("Should work with multisort on courses_uuid", function() {
        var queryObj: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_pass",
                    "temp",
                    "temp2",
                    "temp3",
                    "temp4",
                    "temp5"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["temp","temp2", "temp3", "temp4", "temp5", "courses_pass"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_dept", "courses_pass"],
                "APPLY": [{
                    "temp": {
                        "MAX": "courses_pass"
                    }
                },{
                    "temp2": {
                        "MIN": "courses_avg"
                    }
                },{
                    "temp3": {
                        "MIN": "courses_fail"
                    }
                },{
                    "temp4": {
                        "AVG": "courses_avg"
                    }
                },{
                    "temp5": {
                        "SUM": "courses_avg"
                    }
                }]
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
            expect(resp.code).to.equal(200);
            FileManager.writeTextFileSync("./cache/testing.txt", JSON.stringify(resp.body));
            expect(resp.body.result.length).to.equal(testAssets.result.length);
            expect(resp.body).to.deep.equal(testAssets);
        }).catch(function(resp: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to perform a rooms query when rooms dataset is removed", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.performQuery(queryObj).then(function(resp: InsightResponse){
            expect.fail();
        }).catch(function(err){
            expect(err.code).to.equal(424);
        });
    });

    it("Should not be able to perform query when all datasets removed", function() {
        var queryObj: any = {
            "WHERE": {
                "IS": {
                    "courses_dept": "aanb"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept", "courses_avg"
                ],
                "FORM": "TABLE"
            }
        };
        return insightFacade.removeDataset("courses").then(function(resp1: InsightResponse){
            insightFacade.performQuery(queryObj).then(function(resp: InsightResponse) {
                expect.fail();
            }).catch(function(resp: InsightResponse) {
                expect(resp.code).to.equal(424);
            });
        }).catch(function(resp1: InsightResponse){
            expect.fail();
        });
    })
});

