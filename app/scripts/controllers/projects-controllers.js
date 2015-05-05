'use strict';

(function() {
  angular.module('ncsaas')
    .controller('ProjectListController',
      ['$rootScope', 'projectsService', 'projectPermissionsService', 'resourcesService', ProjectListController]);

  function ProjectListController($rootScope, projectsService, projectPermissionsService, resourcesService) {
    var vm = this;

    vm.list = {};
    vm.deleteProject = deleteProject;
    vm.service = projectsService;

    // search
    vm.searchInput = '';
    vm.search = search;

    vm.showMore = showMore;

    $rootScope.$on('currentCustomerUpdated', function() {
      projectsService.page = 1;
      activate();
    });

    function showMore(project) {
      if (!project.users) {
        projectPermissionsService.filterByCustomer = false;
        projectPermissionsService.getList({project:project.uuid}).then(function(reponse) {
          project.users = reponse;
        });
      }
      if (!project.resources) {
        resourcesService.filterByCustomer = false;
        resourcesService.getList({project:project.uuid}).then(function(reponse) {
          project.resources = reponse;
        });
      }
    }

    function deleteProject(project) {
      var index = vm.list.indexOf(project);
      var confirmDelete = confirm('Confirm project deletion?');
      if (confirmDelete) {
        projectsService.$delete(project.uuid).then(
          function(response) {
            vm.list.splice(index, 1);
          },
          handleProjectDeletionException
        );
      } else {
        alert('Project was not deleted.');
      }
    }

    function handleProjectDeletionException(response) {
      var message = response.data.status || response.data.detail;
      alert(message);
    }

    function search() {
      projectsService.getList({name: vm.searchInput}).then(function(response) {
        vm.list = response;
      });
    }

    function activate() {
      initList();
    }

    function initList() {
      projectsService.getList().then(function(response) {
        vm.pages = projectsService.pages;
        vm.list = response;
      });
    }

    $rootScope.$on('currentCustomerUpdated', function () {
      initList();
    });

    activate();

  }

  angular.module('ncsaas')
    .controller('ProjectAddController', ['$state', 'projectsService',
      'customersService', 'servicesService', 'projectCloudMembershipsService', ProjectAddController]);

  function ProjectAddController(
    $state, projectsService, customersService, servicesService, projectCloudMembershipsService) {
    var vm = this;

    vm.project = projectsService.$create();
    vm.customersList = customersService.getCustomersList();
    vm.save = save;

    function save() {
      // TODO: refactor this function to use named urls and uuid field instead - SAAS-108
      vm.project.$save(function() {
        var url = vm.project.url,
          array = url.split ('/').filter(function(el) {
            return el.length !== 0;
          }),
          uuidNew = array[4];
        servicesService.filterByCustomer = false;
        servicesService.getList().then(function(response) {
          for (var i = 0; response.length > i; i++) {
            projectCloudMembershipsService.addRow(vm.project.url, response[i].url);
          }
        });
        $state.go('projects.detail', {uuid:uuidNew});
      });
    }

  }

  angular.module('ncsaas')
    .controller('ProjectDetailUpdateController', [
      '$stateParams',
      '$rootScope',
      'projectsService',
      ProjectDetailUpdateController
    ]);

  function ProjectDetailUpdateController($stateParams, $rootScope, projectsService) {
    var vm = this;

    vm.activeTab = 'eventlog';
    vm.project = null;
    projectsService.$get($stateParams.uuid).then(function(response) {
      vm.project = response;
    });
    vm.update = update;

    function update() {
      vm.project.$update();
    }

  }

})();

(function() {

  angular.module('ncsaas')
    .controller('UserAddToProjectController', ['usersService', '$stateParams',
      'projectsService', 'projectPermissionsService', 'USERPROJECTROLE', '$scope', UserAddToProjectController]);

  function UserAddToProjectController(
    usersService, $stateParams, projectsService, projectPermissionsService, USERPROJECTROLE, $scope) {
    var vm = this;

    vm.users = [];
    vm.project = null;
    vm.usersInvited = [];
    vm.userInviteEmail = null;
    vm.addUser = addUser;
    vm.addUsersToProject = addUsersToProject;
    vm.userInvitedRemove = userInvitedRemove;
    vm.usersList = [];
    vm.userSearchInputChanged = userSearchInputChanged;
    vm.selectedUsersCallback = selectedUsersCallback;

    getUserList();
    getProjectUsers();

    function getUserList(filter) {
      usersService.getList(filter).then(function(response) {
        vm.usersList = response;
      });
    }

    function userSearchInputChanged(searchText) {
      getUserList({email: searchText});
      vm.userInviteEmail = searchText;
    }

    function selectedUsersCallback(selected) {
      if (selected) {
        vm.userInviteEmail = selected.title;
        addUser();
      }
    }

    projectsService.$get($stateParams.uuid).then(function(response) {
      vm.project = response;
    });

    function getProjectUsers() {
      projectPermissionsService.getList({project: $stateParams.uuid}).then(function(response) {
        vm.users = response;
      });
    }

    function addUser() {
      var userEmail = vm.userInviteEmail;
      var userForInvite = {
        email: userEmail,
        user: null,
        errors: []
      };
      for (var i = 0; i < vm.usersInvited.length; i++) {
        if (vm.usersInvited[i].email === userEmail) {
          alert(userEmail + ' was already added to list');
          userEmail = null;
        }
      }
      if (userEmail) {
        usersService.getList({email: userEmail}).then(function(response) {
          var user = (response.length > 0) ? response[0] : null;
          userForInvite.user = user;
          if (user) {
            var projectPermissionsFilters = {
              username: user.username,
              project: vm.project.uuid
            };
            projectPermissionsService.getList(projectPermissionsFilters).then(function(response) {
              if (response.length > 0) {
                userForInvite.user = null;
                userForInvite.errors.push(userEmail + ' was already added to project ' + vm.project.name);
              }
            });
          } else {
            userForInvite.errors.push(userEmail + ' does not exist');
          }
          vm.usersInvited.push(userForInvite);
        });
      }
      vm.userInviteEmail = '';
      $scope.$broadcast('angucomplete-alt:clearInput');
    }

    function addUsersToProject() {
      for (var i = 0; vm.usersInvited.length > i; i++) {
        var user = vm.usersInvited[i].user;
        if (user) {
          var instance = projectPermissionsService.$create();
          instance.project = vm.project.url;
          instance.role = USERPROJECTROLE.admin;
          instance.user = user.url;
          var success = function() {
            getProjectUsers();
          };
          var error = function(errors) {
            alert(errors.data.detail);
          };
          instance.$save(success, error);
        }
      }
      vm.usersInvited = [];
    }

    function userInvitedRemove(user) {
      var index = vm.usersInvited.indexOf(user);

      vm.usersInvited.splice(index, 1);
    }

  }
})();
