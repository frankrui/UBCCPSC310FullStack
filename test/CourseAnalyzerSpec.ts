import {expect} from 'chai';
import CourseAnalyzer from "../src/CourseAnalyzer";
import InsightFacade from "../src/controller/InsightFacade"
import FileManager from "../src/FileManager"

describe("Unit tests for CourseAnalyzer", function() {
    var insightFacade: InsightFacade = new InsightFacade();
    var courseAnalyzer: CourseAnalyzer = new CourseAnalyzer();
    var PATHTOZIP:string = "./dataset/courses.zip";


    before(function(done) {
        var file:any = FileManager.convertZipToBase64Sync(PATHTOZIP);
        insightFacade.addDataset("courses", file).then(function(resp){
            done();
        }).catch(function(resp){
            expect.fail();
            done();
        });


    });

    after(function() {
        insightFacade = null;
        courseAnalyzer = null;
        //FileManager.deleteFile("./cache/201test.txt");
        if (FileManager.fileExists("./cache/courses.txt")){
            FileManager.deleteFile("./cache/courses.txt");
        }
        if (FileManager.fileExists("./cache/rooms.txt")) {
            FileManager.deleteFile("./cache/rooms.txt");
        }
        FileManager.removeDirectory("./cache");
    });

    it("perform PassRate", function() {
        var query:any ={
            "yAxis": "average",
            "xAxis": {
                "column": "courses_dept",
                "value": "psyc"
            }
        }
       return courseAnalyzer.analyze(query).then(function(resp){
           console.log(resp);
       }).catch(function(resp){
           expect.fail();
           console.log(resp);
       });
    });

});