/**
 * Created by frankrui on 2017-03-26.
 */

import Scheduler from "../src/Scheduler";
import InsightFacade from "../src/controller/InsightFacade";
import FileManager from "../src/FileManager";
import {expect} from 'chai';

describe("Integration tests for Scheduler", function() {

    var insightFacade = new InsightFacade();
    var scheduler = new Scheduler();

    var PATHTOZIP:string = "./dataset/courses.zip";
    var PATHTOROOMS: string = "./dataset/rooms.zip";

    before(function(done) {
        var courses = FileManager.convertZipToBase64Sync(PATHTOZIP);
        var rooms = FileManager.convertZipToBase64Sync(PATHTOROOMS);
        insightFacade.addDataset("courses", courses).then(function(resp: any) {
            return insightFacade.addDataset("rooms", rooms);
        }).then(function(resp: any) {
            done();
        }).catch(function(resp: any) {
            expect.fail();
            done();
        });
    });

    after(function() {
        insightFacade = null;
        scheduler = null;
        if (FileManager.fileExists("./cache/courses.txt")){
            FileManager.deleteFile("./cache/courses.txt");
        }
        if (FileManager.fileExists("./cache/rooms.txt")) {
            FileManager.deleteFile("./cache/rooms.txt");
        }
        FileManager.removeDirectory("./cache");
    });

    it("Should be able to schedule courses in rooms", function() {
        var courseQuery: any = {
            WHERE: {
                "IS": {
                    "courses_dept": "cpsc"
                }
            },
            OPTIONS: {
                COLUMNS: ["courses_dept", "courses_id", "courses_size", "courses_year"],
                FORM: "TABLE"
            }
        };
        var roomsQuery: any = {
            WHERE: {
                "GT": {
                    "rooms_seats": 200
                }
            },
            OPTIONS: {
                COLUMNS: ["rooms_shortname", "rooms_number", "rooms_name", "rooms_seats"],
                FORM: "TABLE"
            }
        };
        return insightFacade.performQuery(courseQuery).then(function(resp: any) {
            insightFacade.performQuery(roomsQuery).then(function(resp2: any) {
                return scheduler.createSchedule(resp.body.result, resp2.body.result);
            }).then(function(result: any) {
                expect(result).not.to.be.undefined;
                console.log(result);
            }).catch(function(err: any) {
                console.log(err);
            });
        });
    });

    it("Should be able to schedule courses outside of hours", function() {
        var courseQuery: any = {
            WHERE: {
                "IS": {
                    "courses_dept": "engl"
                }
            },
            OPTIONS: {
                COLUMNS: ["courses_dept", "courses_id", "courses_size", "courses_year"],
                FORM: "TABLE"
            }
        };
        var roomsQuery: any = {
            WHERE: {
                "GT": {
                    "rooms_seats": 200
                }
            },
            OPTIONS: {
                COLUMNS: ["rooms_shortname", "rooms_number", "rooms_name", "rooms_seats"],
                FORM: "TABLE"
            }
        };
        return insightFacade.performQuery(courseQuery).then(function(resp: any) {
            insightFacade.performQuery(roomsQuery).then(function(resp2: any) {
                return scheduler.createSchedule(resp.body.result, resp2.body.result);
            }).then(function(result: any) {
                expect(result).not.to.be.undefined;
                console.log(result);
            }).catch(function(err: any) {
                console.log(err);
            });
        });
    });
});