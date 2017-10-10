/**
 * Created by Louis on 2/18/17.
 */
import HttpRequest from "../src/HttpRequest";
import {expect} from 'chai';

describe("Unit tests for Http Request", function() {

    var httpRequest = new HttpRequest();

    before(function() {
    });

    it("Should be able to return a valid response", function() {
        var address = "6245 Agronomy Road V6T 1Z4";
        return httpRequest.sendGet(address).then(function(res) {
            expect(res).not.to.be.undefined;
            expect(res.lat).not.to.be.undefined;
            expect(res.lon).not.to.be.undefined;
            expect(res.lat).to.equal(49.26125);
            expect(res.lon).to.equal(-123.24807);
        }).catch(function(err){
            expect.fail();
        })
    });
});