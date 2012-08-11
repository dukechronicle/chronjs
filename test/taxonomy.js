var api = require('../thechronicle_modules/api');

var should = require('chai').should();
var util = require('util');


describe('api.taxonomy', function () {

    before(init);

    describe('#getTaxonomy', function () {
        it('should be undefined if taxonomy is not valid', function () {
            should.not.exist(api.taxonomy.getTaxonomy(['sports', 'fakesport']));
        });

        it('should be a root node if empty', function () {
            api.taxonomy.getTaxonomy([]).should.deep.equal({
                taxonomy: [],
                path: '',
            });
        });

        it('should return taxonomy node if valid', function () {
            api.taxonomy.getTaxonomy(['news', 'health & science', 'duhs'])
                .should.deep.equal({
                    name: 'DUHS',
                    taxonomy: ['News', 'Health & Science', 'DUHS'],
                    path: 'news/health & science/duhs',
                });
        });
    });

    describe('#children()', function () {
        it('should return an array of child nodes', function () {
            api.taxonomy.children(['sports', 'basketball'])
                .should.deep.equal([
                    {
                        name: 'Men',
                        taxonomy: ['Sports', 'Basketball', 'Men'],
                        path: 'sports/basketball/men',
                    },
                    {
                        name: 'Women',
                        taxonomy: ['Sports', 'Basketball', 'Women'],
                        path: 'sports/basketball/women',
                    },
                ]);
        });
    });

    describe('#parents()', function () {
        it('should return an array of parent nodes', function () {
            api.taxonomy.parents(['sports', 'basketball', 'men'])
                .should.deep.equal([
                    {
                        name: 'Sports',
                        taxonomy: ['Sports'],
                        path: 'sports',
                    },
                    {
                        name: 'Basketball',
                        taxonomy: ['Sports', 'Basketball'],
                        path: 'sports/basketball',
                    },
                    {
                        name: 'Men',
                        taxonomy: ['Sports', 'Basketball', 'Men'],
                        path: 'sports/basketball/men',
                    },
                ]);
        });
    });

    describe('#isValid()', function () {
        it('should be true if taxonomy exists', function () {
            api.taxonomy.isValid(['sports', 'basketball']).should.be.true;
        });

        it('should be undefined if taxonomy does not exist', function () {
            api.taxonomy.isValid(['sports', 'fakesport']).should.be.false;
        });
    });

    describe('#mainSections()', function () {
        it('should return names of top level sections', function () {
            var sections = ['News', 'Sports', 'Opinion', 'Recess', 'Towerview'];
            api.taxonomy.mainSections().should.deep.equal(sections);
        });
    });
});