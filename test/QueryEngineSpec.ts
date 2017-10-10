import {expect} from 'chai';
import QueryEngine from "../src/QueryEngine";
import DatasetConstants from "../src/DatasetConstants";

describe("Unit tests for Query Engine", function() {

    var queryEngine: QueryEngine;
    var MOCKDATASET = {
        "31381": {
            "courses_dept": "aanb",
            "courses_id": "551",
            "courses_avg": 87.83,
            "courses_instructor": "john, alibaba",
            "courses_title": "anml welf rsrch",
            "courses_pass": 6,
            "courses_fail": 0,
            "courses_audit": 0,
            "courses_uuid": "31381"
        },
        "19177": {
            "courses_dept": "adhe",
            "courses_id": "327",
            "courses_avg": 75.71,
            "courses_instructor": "palacios, carolina",
            "courses_title": "teach adult",
            "courses_pass": 34,
            "courses_fail": 1,
            "courses_audit": 0,
            "courses_uuid": "19177"
        },
        "15154": {
            "courses_dept": "anat",
            "courses_id": "392",
            "courses_avg": 83.34,
            "courses_instructor": "alimohammadi, majid",
            "courses_title": "gross anat limbs",
            "courses_pass": 79,
            "courses_fail": 0,
            "courses_audit": 0,
            "courses_uuid": "15154"
        },
        "26483": {
            "courses_dept": "asia",
            "courses_id": "315",
            "courses_avg": 71.04,
            "courses_instructor": "testali",
            "courses_title": "japn fdl to mod",
            "courses_pass": 51,
            "courses_fail": 1,
            "courses_audit": 0,
            "courses_uuid": "26483"
        }
    };

    before(function(done) {
        queryEngine = new QueryEngine();
        queryEngine.setDataset(MOCKDATASET);
        queryEngine.datasetId = "courses";
        queryEngine.setConstants(DatasetConstants.getConstants("courses"));
        done();
    });

    after(function() {
        queryEngine = null;
    });

    it("Should be able to return the right rows of data", function() {
        var queryObj: any = {
            "operator": "GT",
            "column": "courses_avg",
            "value": 80
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(Object.keys(result).length).to.equal(2);
        expect(Object.keys(result)[0]).to.equal("15154");
        expect(Object.keys(result)[1]).to.equal("31381");
    });

    it("Should be able to return the right rows of data", function() {
        var queryObj: any = {
            "operator" : "IS",
            "column":"courses_instructor",
            "value": "palacios, carolina"
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(Object.keys(result).length).to.equal(1);
        expect(Object.keys(result)[0]).to.equal("19177");
    });

    it("Should return no results if indeed no results", function() {
        var queryObj: any = {
            "operator": "LT",
            "column": "courses_avg",
            "value": 1
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(0);
    });

    xit("should be able to handle simple query with AND", function() {
        var query = {
            "WHERE": {
                "AND":[
                    {
                        "GT": {
                            "courses_avg": 85
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "aanb"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept"],
                "FORM":"TABLE"
            }
        };
        var result = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
    });

    xit("Should be able to handle simple query with OR", function() {
        var query = {
            "WHERE": {
                "OR":[
                    {
                        "GT": {
                            "courses_avg": 80
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "asia"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept"],
                "FORM":"TABLE"
            }
        };
        var result = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(3);
    });

    xit("Should be able to handle simple query with NOT", function() {
        var query = {
            "WHERE": {
                "NOT":{
                    "GT": {
                        "courses_avg": 80.34
                    }
                }
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg"],
                "FORM":"TABLE"
            }
        };
        var result: any = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(2);
        expect(result["19177"].courses_avg < 80.34).to.be.true;
        expect(result["26483"].courses_avg < 80.34).to.be.true;
    });

    xit("Should be able to handle query with AND and OR", function() {
        var query = {
            "WHERE": {
                "OR":[{
                    "AND": [{
                        "GT": {
                            "courses_avg": 80.34
                        }
                    }, {
                        "IS": {
                            "courses_dept": "aanb"
                        }
                    }]
                },{
                    "LT": {
                        "courses_fail": 1
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept", "courses_fail"],
                "FORM":"TABLE"
            }
        };
        var result = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(2);
    });

    it("Should be able to do partial string matches at end", function() {
        var queryObj: any = {
            "operator" : "IS",
            "column":"courses_instructor",
            "value": "*lina"
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
        expect(result[Object.keys(result)[0]].courses_instructor).to.equal("palacios, carolina");
    });

    it("Should be able to do partial string matches at beginning", function() {
        var queryObj: any = {
            "operator" : "IS",
            "column":"courses_instructor",
            "value": "ali*"
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
        expect(result[Object.keys(result)[0]].courses_instructor).to.equal("alimohammadi, majid");
    });

    it ("Should be able to handle string matches at beginning and end", function() {
        var queryObj: any = {
            "operator" : "IS",
            "column":"courses_instructor",
            "value": "*ali*"
        };
        var result: any = queryEngine.retrieveRows(queryObj);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(3);
        expect(result[Object.keys(result)[0]].courses_instructor).to.equal("alimohammadi, majid");
        expect(result[Object.keys(result)[1]].courses_instructor).to.equal("testali");
        expect(result[Object.keys(result)[2]].courses_instructor).to.equal("john, alibaba");
    });

    it("Should be able to handle ORDER", function() {
        var options = {
            "COLUMNS":["courses_avg", "courses_dept", "courses_instructor"],
            "ORDER": "courses_avg",
            "FORM":"TABLE"
        };
        var resultSet = [{
                "courses_dept": "aanb",
                "courses_id": "551",
                "courses_avg": 87.83,
                "courses_instructor": "john, alibaba",
                "courses_title": "anml welf rsrch",
                "courses_pass": 6,
                "courses_fail": 0,
                "courses_audit": 0,
                "courses_uuid": "31381"
            }, {
                "courses_dept": "adhe",
                "courses_id": "327",
                "courses_avg": 75.71,
                "courses_instructor": "palacios, carolina",
                "courses_title": "teach adult",
                "courses_pass": 34,
                "courses_fail": 1,
                "courses_audit": 0,
                "courses_uuid": "19177"
            },{
                "courses_dept": "anat",
                "courses_id": "392",
                "courses_avg": 83.34,
                "courses_instructor": "alimohammadi, majid",
                "courses_title": "gross anat limbs",
                "courses_pass": 79,
                "courses_fail": 0,
                "courses_audit": 0,
                "courses_uuid": "15154"
            },{
                "courses_dept": "asia",
                "courses_id": "315",
                "courses_avg": 71.04,
                "courses_instructor": "testali",
                "courses_title": "japn fdl to mod",
                "courses_pass": 51,
                "courses_fail": 1,
                "courses_audit": 0,
                "courses_uuid": "26483"
            }
        ];
        var result: any[] = queryEngine.orderBy(resultSet, options);
        expect(result).not.to.be.undefined;
        expect(result.length).to.equal(4);
        expect(result[0].courses_avg).to.equal(71.04);
        expect(result[1].courses_avg).to.equal(75.71);
        expect(result[2].courses_avg).to.equal(83.34);
        expect(result[3].courses_avg).to.equal(87.83);
    });

    xit("Should be able to handle nested AND", function() {
        var query = {
            "WHERE": {
                "AND":[{
                    "AND": [{
                        "GT": {
                            "courses_avg": 80.34
                        }
                    }, {
                        "IS": {
                            "courses_dept": "aanb"
                        }
                    }]
                },{
                    "LT": {
                        "courses_fail": 1
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept", "courses_fail"],
                "FORM":"TABLE"
            }
        };
        var result = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
    });

    xit("Should be able to handle AND with more than 2 terms", function() {
        var query = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "LT": {
                        "courses_fail": 1
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept", "courses_fail"],
                "FORM":"TABLE"
            }
        };
        var result = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(1);
    });

    xit("Should be able to handle OR with more than 2 terms", function() {
        var query = {
            "WHERE": {
                "OR": [{
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "LT": {
                        "courses_fail": 1
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept", "courses_fail"],
                "ORDER": "courses_avg",
                "FORM":"TABLE"
            }
        };
        var result: any = queryEngine.retrieveRows(query);
        expect(result).not.to.be.undefined;
        expect(Object.keys(result).length).to.equal(2);
        expect(result[Object.keys(result)[0]].courses_dept).to.equal("anat");
        expect(result[Object.keys(result)[1]].courses_dept).to.equal("aanb");
    });

    it ("Should return valid when logic comparator has more than 2 elements", function() {
        var query = {
            "WHERE": {
                "AND": [{
                    "GT": {
                        "courses_avg": 80
                    }
                }, {
                    "IS": {
                        "courses_dept": "aanb"
                    }
                }, {
                    "LT": {
                        "courses_fail": 1
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS":["courses_avg", "courses_dept", "courses_fail"],
                "FORM":"TABLE"
            }
        };
        try {
            var result = queryEngine.isValid(query);
            expect(result).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it("Should return true when giving valid query", function() {
        var query = {
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }
        var yes : boolean = queryEngine.isValid(query);
        expect(yes).to.equal(true);
    });

    it("Should return throw error if OPTIONS is wrong", function() {
        var query = {
            "WHERE":{
                "EQ":{
                    "courses_avg":95
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_test",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try {
            var result = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it("Should return throw error if OPTIONS ORDER is wrong", function() {
        var query = {
            "WHERE":{
                "EQ":{
                    "courses_avg":95
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_test",
                "FORM":"TABLE"
            }
        };
        try {
            var result = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it("Should return throw error if OPTIONS FORM is wrong", function() {
        var query = {
            "WHERE":{
                "EQ":{
                    "courses_avg":95
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLES"
            }
        };
        try {
            var result = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it("Should return true when giving valid query(with NOT)", function() {
        var query = {
            "WHERE": {
                "NOT": {
                    "OR": [
                        {
                            "AND": [
                                {
                                    "GT": {
                                        "courses_avg": 90
                                    }
                                },
                                {
                                    "IS": {
                                        "courses_dept": "adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ": {
                                "courses_avg": 95
                            }
                        }
                    ]
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }
        var yes : boolean = queryEngine.isValid(query);
        expect(yes).to.equal(true);
    });

    it("Should throw an error when query is null", function() {
        var query;
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch(err){
            expect(err.message).to.equal("Error: query does not have correct format(should contain WHERE and OPTIONS)");
        }
    });
    it("Should throw an error when query.WHERE is not implement", function() {
        var query = {
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch(err){
            expect(err.message).to.equal("Error: query does not have correct format(should contain WHERE and OPTIONS)");
        }
    });

    it("Should throw an error when query.OPTIONS is not implement", function() {
        var query = {
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
            }
        }
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch(err){
            expect(err.message).to.equal("Error: query does not have correct format(should contain WHERE and OPTIONS)");
        }
    });


    it("Should return 'Error: Malformed Query' when giving query.WHERE an empty set", function() {
        var query = {
            "WHERE":{}
            ,
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }
        try{
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        }
        catch(err){
            expect.fail();
        }
    });

    it("Should return 'Error: Malformed Query' when giving 2 comparators at first layer", function() {
        var query = {
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
                ],
                "AND" : [
                    {
                        "LT": {
                            "test_pass": 50
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });
    it("Should return 'Error: Malformed Query' when giving AND comparator has no object", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {}
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });

    it("Should return error when passing NOT with an array", function(){
        var query ={
            "WHERE": {
                "NOT": [
                    {
                        "OR": [
                            {
                                "AND": [
                                    {
                                        "GT": {
                                            "courses_avg": 90
                                        }
                                    },
                                    {
                                        "IS": {
                                            "courses_dept": "adhe"
                                        }
                                    }
                                ]
                            },
                            {
                                "EQ": {
                                    "courses_avg": 95
                                }
                            }
                        ]
                    },
                    {}
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });

    it("Should return 'Error: Malformed Query' when GT comparator has no object", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {}
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });
    it("Should return 'Error: Malformed Query' when giving invalid operator", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "NOT VALID":{
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });

    it("Should return 'Error: Malformed Query' when GT has 2 objects", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90,
                                    "courses_pass": 30
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });

    it("Should return 'Error: Malformed Query' when passing wrong Id object to math comparison", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "WRONGId_avg":90
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Dataset missing");
        }
    });
    it("Should return 'Error: Malformed Query' when dataset column passing with wrong type(ex.giving avg as string)", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg": "90"
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });
    it("Should return 'Error: Malformed Query' when dataset column passing with wrong type(ex.giving dept as number)", function() {
        var query = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":10
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
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        };
        try{
            queryEngine.isValid(query);
            expect.fail();
        }
        catch (err) {
            expect(err.message).to.equal("Error: Malformed Query");
        }
    });

    it ("Should be able to validate new aggregation syntax", function() {
        var query = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "courses_instructor": "*Tables*"
                    }
                }, {
                    "GT": {
                        "courses_pass": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "courses_pass"
                    }
                }]
            }
        };
        var valid = queryEngine.isValid(query);
        expect(valid).to.be.true;
    });

    it ("Should allow empty array for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": []
            }
        };
        var valid = queryEngine.isValid(query);
        expect(valid).to.be.true;
    });

    it ("Should not allow empty array for group", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": [],
                "APPLY": []
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Group Object");
        }
    });

    it ("Should not allow invalid keys for group", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid", "courses_seats"],
                "APPLY": []
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Group Object");
        }
    });

    it ("Should not allow underscore for apply keys", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "courses_pass": {
                        "MAX": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should not allow duplicate keys for apply keys", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "MAX": "courses_pass"
                    }
                },{
                    "passRate": {
                        "AVG": "courses_fail"
                    }
                },{
                    "failRate": {
                        "MIN": "courses_fail"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should not allow unsupported aggregation for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "TEST": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should not allow unsupported key for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "MAX": "courses_test"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should allow numeric aggregation on number type for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "MAX": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should not allow numeric aggregation on string type for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "MAX": "courses_uuid"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should allow count for string key for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_uuid"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should allow count for numeric key for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should not allow keys not in group/apply for columns", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_pass"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it ("Should allow keys defined in apply for columns", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": "courses_uuid",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should allow keys defined in apply for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": "passRate",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should not allow keys not found in columns for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": "courses_pass",
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it ("Should allow multiple keys for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_uuid", "passRate"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should not allow invalid direction for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "TEST",
                    "keys": ["courses_uuid", "passRate"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS")
        }
    });

    it ("Should not allow empty keys for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": []
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS")
        }
    });

    it ("Should not allow multiple keys that are not in columns for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_uuid", "passRate", "courses_pass"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS")
        }
    });

    it ("Should allow keys that are in columns for sort", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["passRate"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect(valid).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it ("Should not allow two datasets for group", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["passRate"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_uuid", "courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Group Object");
        }
    });

    it ("Should not allow two datasets for apply", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                    "passRate"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["passRate"]
                },
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass", "courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "rooms_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Apply Object");
        }
    });

    it ("Should not allow empty columns D1 D2", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [],
                "FORM": "TABLE"
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it ("Should not allow empty columns", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [],
                "FORM": "TABLE"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["courses_pass", "courses_uuid"],
                "APPLY": [{
                    "passRate": {
                        "COUNT": "courses_pass"
                    }
                }]
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it ("Should not allow two datasets for columns", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_uuid",
                ],
                "FORM": "TABLE"
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });

    it ("Should not allow two datasets for order", function() {
        var query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "courses_uuid",
                ],
                "ORDER": "rooms_uuid",
                "FORM": "TABLE"
            }
        };
        try {
            var valid = queryEngine.isValid(query);
            expect.fail();
        } catch (err) {
            expect(err.message).to.equal("Error: Malformed Query - OPTIONS");
        }
    });
});