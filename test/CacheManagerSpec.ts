import CacheManager from "../src/CacheManager";
import FileManager from "../src/FileManager";
import {expect} from 'chai';

describe("Unit tests for Cache Manager", function() {

    var PATHTOZIP:string = "./dataset/courses.zip";
    var PATHTOCACHEFILE:string = "./cache/testReadTextFile.txt";
    var TESTWRITE:string = "testWriteAndCreate";
    var CACHEPATH:string = "./cache/datasetIdCache.txt"

    before(function() {
    });

    after(function() {
        //FileManager.deleteFile(CACHEPATH);
    });

    /*xit("Should be able to return empty array if file not created yet", function() {
        var datasetIds = CacheManager.getDatasetIds();
        expect(datasetIds).to.not.be.null;
        expect(datasetIds.length).to.equal(0);
        expect(FileManager.fileExists(CACHEPATH)).to.be.true;
    });

    xit("Should be able to check if a datasetId exists", function() {
        var bExists = CacheManager.checkDatasetIdExists("test");
        expect(bExists).to.be.false;
    });

    xit("Should be able to add a datasetId to existing datasetIds", function() {
        CacheManager.storeDatasetId("testId");
        var bExists = CacheManager.checkDatasetIdExists("testId");
        expect(bExists).to.be.true;
    });*/

});