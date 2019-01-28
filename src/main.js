import Vue from 'vue'
import App from './App'
import router from './router'
import Axios from 'axios'
import { abilitiesPlugin } from '@casl/vue'
import { ability } from './abilities'

Vue.prototype.$http = Axios;
Vue.config.productionTip = false;
Vue.use(abilitiesPlugin, ability);

new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>'
})