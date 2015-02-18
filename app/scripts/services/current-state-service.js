'use strict';

(function() {
  angular.module('ncsaas')
    .service('currentStateService', ['RawUser', 'RawCustomer', currentStateService]);

  function currentStateService(RawUser, RawCustomer) {
    /*jshint validthis: true */
    var vm = this;
    vm.getCustomer = getCustomer;
    vm.getUser = getUser;
    vm.setCustomer = setCustomer;
    vm.getActiveItem = getActiveItem;
    vm.getBodyClass = getBodyClass;

    // private variables:
    var user, customer;

    function getUser() {
      if (!user) {
        user = RawUser.getCurrent();
      }
      return user;
    }

    function getCustomer() {
      if (!customer) {
        customer = RawCustomer.getFirst();
      }
      return customer;
    }

    function setCustomer(newCustomer) {
      customer = newCustomer;
    }

    // Active menuItem
    var urlList = {
      'dashboard': ['dashboard'],
      'resources': ['resources'],
      'projects': ['projects', 'project', 'project-edit', 'projects-add'],
      'services': ['services'],
      'users': ['users', 'user']
    }

    function getActiveItem(stateName) {
      var activeState;
      for (var prop in urlList) {
        if (urlList.hasOwnProperty(prop)) {
          if (urlList[prop].indexOf(stateName) !== -1) {
            activeState = prop;
          }
        }
      }
      return activeState;
    }

    // Body class
    var stateWithProfile = [
      'profile',
      'profile-edit',
      'project',
      'project-edit',
      'customer',
      'customer-edit',
      'customer-plans',
      'user',
      'home',
      'login',
    ];

    function getBodyClass(name) {
      var bodyClass;

      if (stateWithProfile.indexOf(name) > -1 ) {
        if (name === 'login' || name === 'home') {
          bodyClass = 'app-body site-body';
          return bodyClass;
        } else {
          bodyClass = 'app-body obj-view';
          return bodyClass;
        }
      } else {
        bodyClass = 'app-body'
        return bodyClass;
      }
    }

  }

})();
