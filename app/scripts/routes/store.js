(function() {
  angular.module('ncsaas').config(function($stateProvider) {
    $stateProvider
      .state('appstore', {
        url: '/appstore/',
        abstract: true,
        templateUrl: 'views/project/base.html',
        data: {
          auth: true,
          pageTitle: 'Service store'
        }
      })

      .state('appstore.index', {
        url: '',
        templateUrl: 'views/appstore/index.html',
        controller: 'AppStoreIndexController',
        controllerAs: 'IndexController'
      })

      .state('appstore.store', {
        url: ':category/',
        templateUrl: 'views/appstore/store.html',
        controller: 'AppStoreController',
        controllerAs: 'AppStore'
      })

      .state('appstore.offering', {
        url: 'offering/:category/',
        templateUrl: 'views/appstore/offering.html',
        controller: 'AppStoreOfferingController',
        controllerAs: 'OfferingController'
      })

      .state('compare', {
        url: '/compare/',
        templateUrl: 'views/project/base.html',
        abstract: true,
        data: {
          auth: true,
          pageTitle: 'Compare flavors',
        }
      })

      .state('compare.compare', {
        url: '',
        templateUrl: 'views/compare/table.html',
      })
  });
})();
