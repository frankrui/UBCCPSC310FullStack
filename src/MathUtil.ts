var queryString = require("querystring");

export default class MathUtil {

    public static calculateMaxMin(data: number[], max: boolean): number {
        if (max) {
            return Math.max.apply(null, data);
        } else {
            return Math.min.apply(null, data);
        }
    }

    // Special behavior for average according to Spec
    public static calculateAvg(data: number[]): number {
        var multipliedValues: number[] = data.map(function(item: number) {
            var multiplied = item * 10;
            return Number(multiplied.toFixed(0));
        });
        var sum = this.calculateSum(multipliedValues);
        var untrimmedAvg = sum/data.length;
        untrimmedAvg = untrimmedAvg/10;
        return Number(untrimmedAvg.toFixed(2));
    }

    public static calculateSum(data: number[]): number {
        return data.reduce(function(pv, cv) {
            return pv + cv;
        });
    }

    // Count unique occurences in data
    public static calculateCount(data: any[]): number {
        var hash: any = {};
        data.forEach(function(item: any) {
            var escapedKey = queryString.escape(item.toString());
            hash[escapedKey] = escapedKey;
        });
        return Object.keys(hash).length;
    }

    public static getDistanceFromLatLonInKm(lat1: number,lon1: number,lat2: number,lon2: number) {
        var R = 6371; // Radius of the earth in km
        var dLat = MathUtil.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = MathUtil.deg2rad(lon2-lon1); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(MathUtil.deg2rad(lat1)) * Math.cos(MathUtil.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
            ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
    }

    public static deg2rad(deg: number) {
      return deg * (Math.PI/180)
    }
}