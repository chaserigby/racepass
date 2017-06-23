angular.module('landing').component('rpLogin', {
  templateUrl: 'app/templates/login.html',
  controller: LoginController,
  controllerAs: 'login',
  bindings: {
    hero: '='
  }
});