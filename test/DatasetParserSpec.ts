import {expect} from 'chai';
import DatasetParser from "../src/DatasetParser";

describe("Unit tests for DatasetParser", function() {

    var parser = new DatasetParser();

    var MOCKDATASET: any = {
        "result": [
            {
                "tier_eighty_five": 1,
                "tier_ninety": 8,
                "Title": "rsrch methdlgy",
                "Section": "002",
                "Detail": "",
                "tier_seventy_two": 0,
                "Other": 1,
                "Low": 89,
                "tier_sixty_four": 0,
                "id": 31379,
                "tier_sixty_eight": 0,
                "tier_zero": 0,
                "tier_seventy_six": 0,
                "tier_thirty": 0,
                "tier_fifty": 0,
                "Professor": "",
                "Audit": 9,
                "tier_g_fifty": 0,
                "tier_forty": 0,
                "Withdrew": 1,
                "Year": "2015",
                "tier_twenty": 0,
                "Stddev": 2.65,
                "Enrolled": 20,
                "tier_fifty_five": 0,
                "tier_eighty": 0,
                "tier_sixty": 0,
                "tier_ten": 0,
                "High": 98,
                "Course": "504",
                "Session": "w",
                "Pass": 9,
                "Fail": 0,
                "Avg": 94.44,
                "Campus": "ubc",
                "Subject": "aanb"
            }
        ],
        "rank": 0
    };

    var NORESULTS: any = {
        "result":[],
        "rank":0
    };

    var ERRORRESULTS: any = {
    };

    var MANYRESULTS: any = {
        "result": [
            {
                "Title": "rsrch methdlgy",
                "id": 31379,
                "Professor": "",
                "Audit": 9,
                "Course": "504",
                "Pass": 9,
                "Fail": 0,
                "Avg": 94.44,
                "Subject": "aanb"
            },
            {
                "Title": "rsrch methdlgy",
                "id": 31380,
                "Professor": "",
                "Audit": 9,
                "Course": "504",
                "Pass": 9,
                "Fail": 0,
                "Avg": 94.44,
                "Subject": "aanb"
            }
        ],
        "rank": 0
    };

    before(function() {
    });

    after(function() {
    });

    it("Should be able to parse a correct dataset", function() {
        var result: any[] = parser.parseColumns("courses", MOCKDATASET);
        expect(Array.isArray(result)).to.be.true;
        expect(result[0]).not.to.be.undefined;
        expect(result[0].courses_dept).to.equal("aanb");
        expect(result[0].courses_id).to.equal("504");
        expect(result[0].courses_avg).to.equal(94.44);
        expect(result[0].courses_instructor).to.equal("");
        expect(result[0].courses_title).to.equal("rsrch methdlgy");
        expect(result[0].courses_pass).to.equal(9);
        expect(result[0].courses_fail).to.equal(0);
        expect(result[0].courses_audit).to.equal(9);
        expect(result[0].courses_uuid).to.equal("31379");
        expect(result[0].courses_year).to.equal(2015);
    });

    it("Should return base object when no results", function() {
        var result: any[] = parser.parseColumns("courses", NORESULTS);
        expect(result).not.to.be.undefined;
        expect(Array.isArray(result)).to.be.true;
        expect(result.length).to.equal(0);
    });

    it("Should be able to parse multiple results", function() {
        var result: any[] = parser.parseColumns("manycourses", MANYRESULTS);
        expect(result).not.to.be.undefined;
        expect(Array.isArray(result)).to.be.true;
        expect(result.length).to.equal(2);
        expect(result[0].manycourses_uuid).to.equal("31379");
        expect(result[1].manycourses_uuid).to.equal("31380");
    });

    it("Should throw error when given empty results and rank", function() {
        try {
            var result = parser.parseColumns("courses", ERRORRESULTS);
            expect.fail();
        } catch (err) {
            console.log(err);
            expect(err.message).to.equal("Error: Empty dataset");
        }
    });
});