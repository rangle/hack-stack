'use strict';

var $timeout;
var hs;
var $q;
var $http;
var $httpBackend;
var mockObject1 = {
  id: 1,
  title: 'My Mock Task',
  description: 'The description'
};
var mockObject2 = {
  id: 7,
  title: 'my own task',
  description: 'this is the test'
};

describe('Hack Stack Mock tests', function () {
  beforeEach(function () {
    module('hackstack.service');
  });
  beforeEach(inject(function (_hackStack_, _$timeout_, _$q_, _$httpBackend_,
                              _$http_) {
    hs = _hackStack_;
    $timeout = _$timeout_;
    $q = _$q_;
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    $httpBackend.whenGET('mock.json').respond(
      [mockObject1]
    );
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('GET tests', function () {
    it('Should throw an error if created with no data', function () {
      expect(function () {
        hs();
      }).to.throw();
    });

    it('should throw an error when created with an object', function () {
      expect(function () {
        hs({
          id: 1
        });
      }).to.throw();
    });

    it('should return an object with a getAll function when ' +
      'created with an array',
      function () {
        expect(hs([{
          id: 1
        }]).getAll).to.be.an.instanceOf(Function);
      });

    it('should return an object with a getAll function when ' +
      'created with a json path',
      function () {
        expect(hs('mock.json').getAll).to.be.an.instanceOf(Function);
        $httpBackend.flush();
      });

    it('should return the mock data it is created with', function () {
      var expectedResults = {
        status: 200,
        statusText: 'OK',
        data: [{
          id: 1,
          title: 'mock',
          description: 'description'
        }]
      };
      var hack = hs(expectedResults.data);
      hack.disableErrors(true);

      expect(hack.getAll())
        .to.eventually.be.deep.equal(expectedResults);
      $timeout.flush();
    });

    it('should call $http.get when you pass a json filename', function () {
      var expectedResults = {
        status: 200,
        statusText: 'OK',
        data: [mockObject1]
      };
      $httpBackend.expectGET('mock.json');
      var hack = hs('mock.json');
      hack.disableErrors(true);
      $httpBackend.flush();
      var result = hack.getAll();
      result.then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.deep.equal(expectedResults.data);
      });
      $timeout.flush();
    });

    it('Should return an error when forceErrors is set', function () {
      var expectedResults = {
        status: 404,
        statusText: 'Not found',
        data: 'Forced error by hackStack'
      };
      var hack = hs('mock.json');
      hack.forceError(404);
      $httpBackend.flush();
      var result = hack.getAll();
      result.then(null, function (response) {
        expect(response.status).to.equal(404);
        expect(response.data).to.equal(expectedResults.data);
      });
      $timeout.flush();
    });

    it('Should have independent results if multiple objects created',
      function () {
        var expectedData1 = [mockObject1];
        var expectedData2 = [mockObject2];
        var hack1 = hs([mockObject1]);
        var hack2 = hs([mockObject2]);
        var result1 = hack1.getAll();
        var result2 = hack2.getAll();
        $timeout.flush();

        expect(result1).to.eventually
          .have.property('data')
          .and.deep.equal(expectedData1);
        expect(result2).to.eventually
          .have.property('data')
          .and.deep.equal(expectedData2);
      });

    it('should return a single result when calling get(id)', function () {
      var expectedResults = [mockObject2, mockObject1];

      var hack = hs(expectedResults);
      hack.disableErrors(true);
      var result = hack.getAll();
      var singleResult = hack.get(1);

      expect(result).to.eventually.have.property('data').and.deep.equal(
        expectedResults);
      expect(singleResult).to.eventually.have.property('data').and.deep
        .equal(expectedResults[1]);
      $timeout.flush();
    });

    it('should return response{status: error, ...} if forceError(error) called',
      function () {
        var expectedResults = {
          status: 404,
          statusText: 'Not found',
          data: 'Forced error by hackStack'
        };
        var hack = hs('mock.json');
        $httpBackend.flush();
        hack.forceError(404);

        var result = hack.get(1);
        result.then(null, function (response) {
          expect(response.status).to.equal(404);
          expect(response.data).to.equal(expectedResults.data);
        });
        $timeout.flush();
      });
  });

  describe('CREATE tests', function () {
    it('should return a successful creation', function () {
      var hack = hs(
        [mockObject1]);
      var newTask = mockObject2;
      var expected = {
        status: 201,
        statusText: 'Created',
        data: ''
      };

      hack.disableErrors(true);
      var result = hack.create(newTask);
      expect(result).to.eventually.deep.equal(expected);
      expect(result).to.eventually.have.property('status').and.equal(
        201);
      $timeout.flush();

      //getAll should return the new item.
      var getResult = hack.getAll();
      getResult.then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.length).to.equal(2);
        expect(response.data[1]).to.deep.equal(newTask);
      });
      $timeout.flush();
    });

    it('should create an id when provided a function', function () {
      var hack = hs(
        [{
          id: 1,
          title: 'task',
          description: 'mock task'
        }]);
      var newTask = {
        title: 'add task',
        description: 'to be added'
      };
      var expected = {
        status: 201,
        statusText: 'Created',
        data: ''
      };

      hack.disableErrors(true);
      var result = hack.create(newTask, function () {
        return 2;
      });
      expect(result).to.eventually.deep.equal(expected);
      expect(result).to.eventually.have.property('status').and.equal(
        201);
      $timeout.flush();

      //getAll should return the new item.
      var getResult = hack.getAll();
      getResult.then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.length).to.equal(2);
        expect(response.data[1].id).to.equal(2);
      });
      $timeout.flush();
    });
  });

  describe('Update tests', function () {
    it('should return a 200 if the data is in the mock data array' +
      'and update the entry',
      function () {
        var hack = hs(
          [{
            id: 1,
            title: 'task',
            description: 'mock task'
          }]);
        var expected = {
          status: 200,
          statusText: 'OK',
          data: ''
        };
        hack.disableErrors(true);
        var result = hack.update(1, {
          id: 1,
          title: 'updated task',
          description: 'an update'
        });
        result.then(function (response) {
          expect(response.status).to.equal(200);
        });
        $timeout.flush();

        var getResult = hack.getAll();
        getResult.then(function (response) {
          expect(response.status).to.equal(200);
          expect(response.data.length).to.equal(1);
          expect(response.data[0].title).to.equal('updated task');
        });
        $timeout.flush();
      });

    it('should return a 404 if item is not found in mockData', function () {
      var hack = hs(
        [{
          id: 1,
          title: 'task',
          description: 'mock task'
        }]);
      var expected = {
        status: 404,
        statusText: 'Not Found',
        data: 'Forced error by hackStack'
      };
      hack.disableErrors(true);
      var result = hack.update(2, {
        id: 2,
        title: 'updated task',
        description: 'an update'
      });
      result.then(null, function (error) {
        expect(error.status).to.equal(404);
      });
      $timeout.flush();
    });
  });

});