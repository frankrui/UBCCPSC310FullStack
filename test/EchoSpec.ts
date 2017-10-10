/**
 * Created by rtholmes on 2016-10-31.
 */

import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
import {queryParser} from "restify";
import restify = require('restify');

describe("EchoSpec", function () {
    var server : Server;

    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }

    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
        server = new Server(65500);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    it("Should be able to echo", function () {
        let out = Server.performEcho('echo');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: 'echo...echo'});
    });

    it("Should be able to echo silence", function () {
        let out = Server.performEcho('');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: '...'});
    });

    it("Should be able to handle a missing echo message sensibly", function () {
        let out = Server.performEcho(undefined);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to handle a null echo message sensibly", function () {
        let out = Server.performEcho(null);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.have.property('error');
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to Start the server", function () {
        return server.start().then(function(boolean) {
            expect(boolean).to.equal(true);
        }).catch(function(err) {
            console.log(err);
            expect.fail();
        });
    });

    it("Should be able to catch error", function () {
        var serverError: Server = new Server(1);
        return serverError.start().then(function (boolean) {
            expect.fail()
        }).catch(function (err) {
            console.log(err);
            expect(err).not.to.be.undefined;
            expect(err).not.to.be.null;
        });
    });

    it("Should be able to echo", function() {
        var req : any = {};
        req.params = {
            msg : "hi there!"
        };

        var res : any = {
            json: function(code: any, body: any) {
                // Do nothing
            }
        };
        var next: any = function() {
            return true;
        };

        try {
            var result = Server.echo(req, res, next);
            expect(result).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it("Should throw error if can't echo", function() {
        var req : any = {};

        var res : any = {
            json: function(code: any, body: any) {
                //Do nothing
            }
        };
        var next: any = function() {
            return true;
        };

        try {
            var result = Server.echo(req, res, next);
            expect(result).to.be.true;
        } catch (err) {
            expect.fail();
        }
    });

    it("Should be able to end the server", function () {
        return server.stop().then(function(boolean) {
            expect(boolean).to.equal(true);
        });
    });

});
