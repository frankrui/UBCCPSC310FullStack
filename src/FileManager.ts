/**
 * Collection of methods for file I/O. Useful for reading and writing files.
 *
 */
/* tslint:disable:no-console */
var jszip = require("jszip");
var fileSystem = require("fs");

var DEFAULTDIRECTORY = "./cache/"

export default class FileManager {

    public static convertZipToBase64(path: string): Promise<string> {
        return new Promise(function(fulfill, reject){
            try {
                var data:any = fileSystem.readFileSync(path);
                var base64Encoded: string = new Buffer(data).toString('base64');
                fulfill(base64Encoded);
            } catch (err) {
                reject(err);
            };
        });
    }

    public static convertZipToBase64Sync(path: string): string {
        try {
            var data:any = fileSystem.readFileSync(path);
            var base64Encoded: string = new Buffer(data).toString('base64');
            return base64Encoded;
        } catch (err) {
            throw err;
        }
    }

    public static readTextFile(path: string): Promise<string> {
        return new Promise(function(fulfill, reject){
            try {
                var data:any = fileSystem.readFileSync(path);
                var stringData: string = new Buffer(data).toString('utf8');
                fulfill(stringData);
            }catch (err){
                reject(err);
            };
        });
    }

    public static readTextFileSync(path: string): string {
        try {
            var data:any = fileSystem.readFileSync(path);
            var stringData: string = new Buffer(data).toString('utf8');
            return stringData;
        } catch (err){
            throw err;
        };
    }

    public static readFileSync(path: string): any {
        try {
            var data:any = fileSystem.readFileSync(path, "utf8");
            return data;
        } catch (err){
            throw err;
        }
    }

    public static writeTextFile(path: string, content: string): Promise<string> {
        var that = this;
        return new Promise(function(fulfill, reject) {
            try {
                if (!that.dirExists("./cache")) {
                    that.createDirectory("./cache");
                }
                if (path && content) {
                    fileSystem.writeFile(path, content, function(err: any) {
                        if (err) {
                            reject(err);
                        } else {
                            fulfill(path);
                        }
                    });
                } else {
                    reject("Error: No file name provided");
                }
            } catch (err) {
                reject(err);
            };
        });
    }

    public static writeTextFileSync(path: string, content: string) {
        try {
            if (!this.dirExists("./cache")) {
                this.createDirectory("./cache");
            }
            if (path && content) {
                fileSystem.writeFileSync(path, content);
            }
        } catch (err) {
            throw err;
        };
    }

    public static createDirectory(path: string) {
        fileSystem.mkdirSync(path);
    }

    public static fileExists(path: string): boolean {
        return fileSystem.existsSync(path);
    }

    public static dirExists(path: string): boolean {
        try {
            return fileSystem.statSync(path).isDirectory();
        } catch (err) {
            if (err.code === "ENOENT") {
                return false;
            } else {
                throw err;
            }
        }
    }

    public static deleteFile(path: string): void {
        fileSystem.unlinkSync(path);
    }

    public static removeDirectory(path: string) {
        fileSystem.rmdirSync(path);
    }

    public static toBase64(data: string): string {
        try {
            var base64Encoded: string = new Buffer(data).toString('base64');
            return base64Encoded;
        } catch (err) {
            throw err;
        }
    }

};