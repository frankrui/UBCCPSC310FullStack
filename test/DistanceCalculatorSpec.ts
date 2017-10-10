/**
 * Created by frankrui on 2017-03-29.
 */

import DistanceCalculator from "../src/DistanceCalculator";
import {expect} from 'chai';
import {InsightResponse} from "../src/controller/IInsightFacade";
import FileManager from "../src/FileManager";
import InsightFacade from "../src/controller/InsightFacade";

describe("Unit test for distance calculator", function() {

    var distanceCalc = new DistanceCalculator();
    var PATHTOROOM:string = "./dataset/rooms.zip";

    before(function(done) {
        var rooms = FileManager.convertZipToBase64Sync(PATHTOROOM);
        var insightFacade = new InsightFacade();
        insightFacade.addDataset("rooms", rooms).then(function(resp: InsightResponse) {
            done();
        }).catch(function(err: InsightResponse) {
            expect.fail();
        });
    });

    after(function() {
        if (FileManager.fileExists("./cache/rooms.txt")) {
            FileManager.deleteFile("./cache/rooms.txt");
        }
        FileManager.removeDirectory("./cache");
    });

    it("Should be able to handle within distance", function() {
        var distQuery = {
            "WHERE": {
                "IS": {
                    "rooms_shortname": "DMP"
                }
            },
            "OPTIONS": {
                "COLUMNS": ["rooms_name", "rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_furniture", "rooms_type"],
                "FORM": "TABLE"
            },
            "WITHIN": {
                "logic": "AND",
                "checked": true,
                "building": "ESB",
                "meters": "200"
            }
        };
        return distanceCalc.handleDistanceWithin(distQuery).then(function(result: InsightResponse) {
            expect(result.code).to.equal(200);
        }).catch(function(err: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to handle within distance", function() {
        var distQuery = {
            "WHERE": {
                "IS": {
                    "rooms_shortname": "DMP"
                }
            },
            "OPTIONS": {
                "COLUMNS": ["rooms_name", "rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_furniture", "rooms_type"],
                "FORM": "TABLE"
            },
            "WITHIN": {
                "logic": "OR",
                "checked": true,
                "building": "ESB",
                "meters": "200"
            }
        };
        return distanceCalc.handleDistanceWithin(distQuery).then(function(result: InsightResponse) {
            expect(result.code).to.equal(200);
        }).catch(function(err: InsightResponse) {
            expect.fail();
        });
    });
});
