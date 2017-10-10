/**
 * Collection of methods to manage cached datasets. Useful for keeping track of datasets and finding duplicates.
 *
 */
/* tslint:disable:no-console */
import FileManager from "./FileManager";
var CACHENAME:string = "datasetIdCache";
var CACHEPATH: string = "./cache/" + CACHENAME + ".txt";

export default class CacheManager{

    /*public static checkDatasetIdExists(datasetId: string): boolean {
        if (datasetId) {
            var datasetIds = this.getDatasetIds();
            if (datasetIds == null) {
                return false;
            }
            for (var i = 0; i < datasetIds.length; i++) {
                if (datasetId == datasetIds[i]) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }*/

    public static checkDatasetAdded(datasetId: string): boolean {
        return FileManager.fileExists("./cache/" + datasetId + ".txt");
    }

    /*public static getDatasetIds(): any[] {
        if (FileManager.fileExists(CACHEPATH)) {
            var data = FileManager.readTextFileSync(CACHEPATH);
            var datasetIds = JSON.parse(data);
            if (Array.isArray(datasetIds)) {
                return datasetIds;
            } else {
                return null;
            }
        } else {
            var stringContent = JSON.stringify([]);
            FileManager.writeTextFileSync(CACHEPATH, stringContent);
            return [];
        }
    }

    public static storeDatasetId(datasetId: string): void {
        var bExists = this.checkDatasetIdExists(datasetId);
        if(!bExists) {
            var datasetIds = this.getDatasetIds();
            datasetIds.push(datasetId);
            FileManager.writeTextFileSync(CACHEPATH, JSON.stringify(datasetIds));
        }
    }

    public static removeDatasetId(datasetId: string): void {
        var bExists = this.checkDatasetIdExists(datasetId);
        if(bExists) {
            var datasetIds = this.getDatasetIds();
            datasetIds.splice(datasetIds.indexOf(datasetId), 1);
            FileManager.writeTextFileSync(CACHEPATH, JSON.stringify(datasetIds));
        }
    }*/
};