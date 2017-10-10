
import FileManager from "../src/FileManager";
import {expect} from 'chai';

describe("Unit tests for File Manager", function() {

    var PATHTOZIP:string = "./dataset/courses.zip";
    var WRONGPATH:string = "./wrongDirectory";
    var TESTWRITE:string = "./cache/testWriteAndCreate.txt";
    var TESTREADDELETE:string = "./cache/testReadAndDelete.txt";

    before(function() {
    });

    after(function() {
        FileManager.removeDirectory("./cache");
    });

    it("Should be able to create a dir and remove it", function() {
        FileManager.createDirectory("./testDir");
        expect(FileManager.dirExists("./testDir")).to.be.true;
        FileManager.removeDirectory("./testDir");
        expect(FileManager.dirExists("./testDir")).to.be.false;
    });

    it("Should be able to read a zip to base 64 encoding", function() {
        return FileManager.convertZipToBase64(PATHTOZIP).then(function(data:string) {
            expect(data).to.not.be.null;
            expect(data).not.to.be.undefined;
        }).catch(function(err: any) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to read a zip to base 64 encoding sync", function() {
        try{
            var result = FileManager.convertZipToBase64Sync(PATHTOZIP);
            expect(result).not.to.be.undefined;
            expect(result).not.to.be.null;
        } catch (err) {
            expect.fail();
        }
    });

    it("Should throw error when read wrong path to base 64 encoding sync", function() {
        try{
            var result = FileManager.convertZipToBase64Sync("./noDir/nothing.zip");
            expect.fail();
        } catch (err) {
            expect(err).not.to.be.undefined;
            expect(err.code).to.equal("ENOENT");
        }
    });

    it("Test for incorrect zip file to convert", function() {
        return FileManager.convertZipToBase64(TESTREADDELETE).then(function(data:string) {
            expect.fail();
        }).catch(function(err: any) {
            expect(err).not.to.be.undefined;
            expect(err).not.to.be.null;
            expect(err.code).to.equal("ENOENT");
        });
    });

    it("Should be able to create and write to new file", function() {
        var stringContent = JSON.stringify({
            "datasetId": "MATH",
            "data": []
        });
        return FileManager.writeTextFile(TESTWRITE, stringContent).then(function(filePath: string) {
            expect(filePath).to.equal(TESTWRITE);
            expect(FileManager.fileExists(TESTWRITE)).to.be.true;
            FileManager.deleteFile(TESTWRITE);
            expect(FileManager.fileExists(TESTWRITE)).to.be.false;
            FileManager.removeDirectory("./cache");
        }).catch(function(err:any) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should throw error if wrong file path provided to write", function() {
        var stringContent = JSON.stringify({
            "datasetId": "MATH",
            "data": []
        });
        return FileManager.writeTextFile("./noDir/hi.txt", stringContent).then(function(filePath: string) {
            expect.fail();
        }).catch(function(err:any) {
            console.log(err);
            expect(err).not.to.be.undefined;
            expect(err.code).to.equal("ENOENT");
            FileManager.removeDirectory("./cache");
        });
    });

    it("Should be able to create and write to new file sync", function() {
        var stringContent = JSON.stringify({
            "datasetId": "MATH",
            "data": []
        });
        expect(FileManager.dirExists("./cache")).to.be.false;
        FileManager.writeTextFileSync(TESTWRITE, stringContent);
        expect(FileManager.dirExists("./cache")).to.be.true;
        expect(FileManager.fileExists(TESTWRITE)).to.be.true;
        FileManager.deleteFile(TESTWRITE);
    });

    it("Should return error if wrong file path provided sync", function() {
        var stringContent = JSON.stringify({
            "datasetId": "MATH",
            "data": []
        });
        expect(FileManager.dirExists("./cache")).to.be.true;
        try {
            FileManager.writeTextFileSync("./noDir/err.txt", stringContent);
            expect.fail();
        } catch (err) {
            expect(err).not.to.be.null;
            expect(err.code).to.equal("ENOENT");
        }
    });

    it("Should reject if no file name was provided", function() {
        return FileManager.writeTextFile("", "").then(function(filePath: string) {
            expect.fail();
        }).catch(function(err) {
            console.log(err);
            expect(err).to.equal("Error: No file name provided");
        });
    });

    it("Should be able to read text file", function() {
        return FileManager.writeTextFile(TESTREADDELETE, "some String").then(function(filePath: string){
            expect(FileManager.fileExists(TESTREADDELETE)).to.be.true;
            FileManager.readTextFile(TESTREADDELETE).then(function(data:string) {
                expect(data).to.equal("some String");
            }).catch(function(err: any){
                expect.fail();
            });
        }).catch(function(err: any) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to read text file sync", function() {
        try {
            var writeResult = FileManager.writeTextFileSync(TESTREADDELETE, "sync read");
//            expect(writeResult).to.be.null;
            var result = FileManager.readTextFileSync(TESTREADDELETE);
            expect(result).to.equal("sync read");
        } catch (err) {
            console.log(err)
            expect.fail();
        }
    });

    it("Should throw error if directory is incorrect when reading file", function(){
        return FileManager.readTextFile("./incorrect/err.txt").then(function(data:string){
            expect.fail();
            console.log(data);
        }).catch(function(err){
            expect(err).not.to.be.undefined;
            expect(err).not.to.be.null;
            expect(err.code).to.equal("ENOENT");
        });
    });

    it("Should throw error if directory is incorrect when reading file sync", function(){
        try{
            var result = FileManager.readTextFileSync("./incorrect/err.txt");
            expect.fail();
        } catch (err) {
            expect(err).not.to.be.undefined;
            expect(err.code).to.equal("ENOENT");
        }
    });

    it("Should be able to remove a file", function() {
        expect(FileManager.fileExists(TESTREADDELETE)).to.be.true;
        FileManager.deleteFile(TESTREADDELETE);
        expect(FileManager.fileExists(TESTREADDELETE)).to.be.false;
    });


    it("Should throw error on remove if doesn't exist", function() {
        var path = "./cache/testRemove.txt";
        FileManager.writeTextFileSync(path, "Hello World!");
        expect(FileManager.fileExists(path)).to.be.true;
        try{
            FileManager.deleteFile("./noDir/err.txt");
            expect.fail();
        } catch (err){
            expect(err.code).to.equal("ENOENT");
            expect(FileManager.fileExists(path)).to.be.true;
        }
        FileManager.deleteFile(path);
    });
});