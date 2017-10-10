/**
 * Created by frankrui on 2017-03-29.
 */
import MathUtil from "../src/MathUtil";
import {expect} from 'chai';

describe("Unit tests for math util", function() {

    it("Should be able to give the distance between two lat lons in km", function() {
        var dist = MathUtil.getDistanceFromLatLonInKm(49.3, -123.9, 49.4, -123.8);
        expect(dist).not.to.be.undefined;
    });
});