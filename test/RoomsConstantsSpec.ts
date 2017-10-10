import {expect} from 'chai';
import Constants from "../src/RoomsConstants";
import CoursesConstants from "../src/RoomsConstants";

describe("Unit tests for Constants", function() {

    var constants: Constants;

    before(function() {
        constants = new CoursesConstants();
    });

    after(function() {
        constants = null;
    });

    it("Should return the right field type for string", function() {
        var type = constants.getFieldType("fullname");
        expect(type).to.equal("string");
    });

    it("Should return the right field type for number", function() {
        var type = constants.getFieldType("seats");
        expect(type).to.equal("number");
    });

    it("Should return the right field type for lat", function() {
        var type = constants.getFieldType("lat");
        expect(type).to.equal("number");
    });

    it("Should return null if field type not found", function() {
        var type = constants.getFieldType("uuid");
        expect(type).to.be.null;
    });

    it("Should return valid fields", function() {
        var fields = constants.getValidFields();
        expect(fields).not.to.be.undefined;
        expect(fields.length).to.equal(11);
    });
});