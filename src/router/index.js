import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from '@/components/Dashboard'
import Orders from '@/components/sections/Orders.vue'
import Balance from '@/components/sections/Balance.vue'
import Books from '@/components/sections/Books.vue'
import Web3Message from '@/components/sections/Web3Message.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      mode: 'history',
      path: '/',
      name: 'Root',
      component: Dashboard,
      meta: { view: Web3Message }
    },
    {
      mode: 'history',
      path: '/home',
      name: 'Home',
      component: Dashboard,
      meta: { view: Web3Message }
    },
    {
      mode: 'history',
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { view: Web3Message }
    },
    {
      mode: 'history',
      path: '/balance',
      name: 'Balance',
      component: Dashboard,
      meta: { view: Balance }
    },
    {
      mode: 'history',
      path: '/books',
      name: 'Books',
      component: Dashboard,
      meta: { view: Books }
    },
    {
      mode: 'history',
      path: '/orders/:address',
      name: 'Orders',
      component: Dashboard,
      meta: { view: Orders }
    }
  ]
})
