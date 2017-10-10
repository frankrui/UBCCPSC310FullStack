import {expect} from 'chai';
import Constants from "../src/CoursesConstants";
import CoursesConstants from "../src/CoursesConstants";

describe("Unit tests for Constants", function() {

    var constants: Constants;

    before(function() {
        constants = new CoursesConstants();
    });

    after(function() {
        constants = null;
    });

    it("Should return the right field type for string", function() {
        var type = constants.getFieldType("uuid");
        expect(type).to.equal("string");
    });

    it("Should return the right field type for number", function() {
        var type = constants.getFieldType("audit");
        expect(type).to.equal("number");
    });

    it("Should return null if field type not found", function() {
        var type = constants.getFieldType("hello");
        expect(type).to.be.null;
    });

    it("Should return valid fields", function() {
        var fields = constants.getValidFields();
        expect(fields).not.to.be.undefined;
        expect(fields.length).to.equal(11);
    });
});