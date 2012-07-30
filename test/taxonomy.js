var api = require('../thechronicle_modules/api');


describe('api.taxonomy', function () {
    describe('#isValid()', function () {
        it('should be false if taxonomy is not valid', function () {
            api.taxonomy.isValid(['sports', 'fakesport'])
                .should.not.be.ok;
        });

        it('should return canonical taxonomy if valid', function () {
            api.taxonomy.isValid(['news', 'local & national'])
                .should.equal(['News', 'Local & National']);
        });
    });

    //describe('#getTaxonomyPath()', );
    //describe('#getParents()', );
    //describe('#getChildren()', );
});