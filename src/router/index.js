import Vue from 'vue'
import Router from 'vue-router'
import Main from '../components/Main'
import Login from '../components/Login'
import Admin from '../components/Admin'
import EmptyPage from '../components/EmptyPage'
import { ability, defineAbilityFor } from '../abilities'
import { HTTP_PREFIX } from '../providers/common'

Vue.use(Router);

const router = new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'Main',
            component: Main,
            meta: { 
                requiresAuth: true
            }
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { 
                guest: true
            }
        },
        {
            path: '/admin',
            name: 'admin',
            component: Admin,
            meta: { 
                requiresAuth: true,
                is_admin: true
            }
        },
        {
            path: '/empty',
            name: 'empty',
            component: EmptyPage,
            meta: { 
                requiresAuth: true
            }
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {

        if (localStorage.getItem('jwt') === 'null') { 
            next({
                path: '/login',
                params: { nextUrl: to.fullPath }
            });
        } else {
            if (!ability.can('load', 'all')) {
                try {
                    const session = await router.app.$http.get(HTTP_PREFIX + 'ability/', {
                        headers: {
                            auth: localStorage.getItem('jwt'),
                        }
                    });

                    ability.update(
                        defineAbilityFor(session.data).rules
                    );

                } catch (err) { 
                    if (err.response.status === 401) {
                        
                        localStorage.setItem('jwt', 'null');

                        next({
                            path: '/login',
                        });
                    }
                    if (err.response.status === 403) {
                        next({
                            path: '/empty'
                        });
                    }
                    return;
                }
            }

            if (to.matched.some(record => record.meta.is_admin)) {
                if (ability.can('role', 'SuperAdmin')) { 
                    next();
                } else {
                    next({
                        path: '/empty'
                    });
                }
            } else {
               next();
            }
        }
    } else if (to.matched.some(record => record.meta.guest)) {
        if (localStorage.getItem('jwt') === 'null') {
            next();
        } else {
            next({ name: 'Main'});
        }
    } else {
        next();
    }
})

export default router